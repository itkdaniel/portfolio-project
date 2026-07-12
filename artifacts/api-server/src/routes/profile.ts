import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable, usersTable } from "@workspace/db";
import {
  UpdateMyProfileBody,
  GetMyProfileResponse,
  UpdateMyProfileResponse,
  ListPublicProfilesResponse,
  GetPublicProfileResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/rbac";
import { encryptField, decryptField } from "../lib/encryption";

const router: IRouter = Router();

router.get("/profile/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.localUser!.id;
  let [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));

  if (!profile) {
    [profile] = await db
      .insert(profilesTable)
      .values({ userId, skills: [], isPublic: true })
      .returning();
  }

  res.json(
    GetMyProfileResponse.parse({
      ...profile,
      phone: decryptField(profile.phoneEncrypted),
    }),
  );
});

router.put("/profile/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = req.localUser!.id;
  const { phone, ...rest } = parsed.data;

  const [existing] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));

  const values = {
    ...rest,
    phoneEncrypted: phone !== undefined ? encryptField(phone) : existing?.phoneEncrypted,
    updatedAt: new Date(),
  };

  let profile;
  if (existing) {
    [profile] = await db
      .update(profilesTable)
      .set(values)
      .where(eq(profilesTable.userId, userId))
      .returning();
  } else {
    [profile] = await db
      .insert(profilesTable)
      .values({ userId, skills: [], isPublic: true, ...values })
      .returning();
  }

  res.json(
    UpdateMyProfileResponse.parse({
      ...profile,
      phone: decryptField(profile.phoneEncrypted),
    }),
  );
});

router.get("/profile/directory", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      userId: profilesTable.userId,
      headline: profilesTable.headline,
      summary: profilesTable.summary,
      skills: profilesTable.skills,
      githubUrl: profilesTable.githubUrl,
      linkedinUrl: profilesTable.linkedinUrl,
      websiteUrl: profilesTable.websiteUrl,
      resumeObjectPath: profilesTable.resumeObjectPath,
      avatarObjectPath: profilesTable.avatarObjectPath,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
    })
    .from(profilesTable)
    .innerJoin(usersTable, eq(profilesTable.userId, usersTable.id))
    .where(eq(profilesTable.isPublic, true));

  const result = rows.map((row) => ({
    ...row,
    name: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.email,
  }));

  res.json(ListPublicProfilesResponse.parse(result));
});

router.get("/profile/:userId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawId, 10);
  if (Number.isNaN(userId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const [row] = await db
    .select({
      profile: profilesTable,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
    })
    .from(profilesTable)
    .innerJoin(usersTable, eq(profilesTable.userId, usersTable.id))
    .where(eq(profilesTable.userId, userId));

  if (!row || !row.profile.isPublic) {
    res.status(404).json({ error: "Profile not found or not public" });
    return;
  }

  res.json(
    GetPublicProfileResponse.parse({
      userId,
      name: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.email,
      headline: row.profile.headline,
      summary: row.profile.summary,
      skills: row.profile.skills,
      githubUrl: row.profile.githubUrl,
      linkedinUrl: row.profile.linkedinUrl,
      websiteUrl: row.profile.websiteUrl,
      resumeObjectPath: row.profile.resumeObjectPath,
      avatarObjectPath: row.profile.avatarObjectPath,
    }),
  );
});

export default router;
