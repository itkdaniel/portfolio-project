import type { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      localUser?: User;
    }
  }
}

/**
 * Resolves (and JIT-provisions) the local `users` row for the authenticated
 * Clerk user. The very first user ever provisioned becomes `admin` so the
 * platform is manageable without manual DB edits; everyone after that is a
 * regular `user` until an admin promotes them.
 */
async function resolveLocalUser(clerkUserId: string): Promise<User> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId));
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUserId}@unknown.local`;

  const [{ value: existingUserCount }] = await db
    .select({ value: count() })
    .from(usersTable);

  const [created] = await db
    .insert(usersTable)
    .values({
      clerkUserId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      role: existingUserCount === 0 ? "admin" : "user",
    })
    .onConflictDoNothing({ target: usersTable.clerkUserId })
    .returning();

  if (created) return created;

  const [fallback] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId));
  if (!fallback) {
    throw new Error("Failed to provision local user record");
  }
  return fallback;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    req.localUser = await resolveLocalUser(auth.userId);
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to resolve local user");
    res.status(500).json({ error: "Failed to resolve user" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.localUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.localUser.role !== "admin") {
    res.status(403).json({ error: "Forbidden — admin only" });
    return;
  }
  next();
}
