// Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.
import { Lock, LogIn, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Role = "user" | "admin";

interface FeatureGateProps {
  /** Minimum role required. "user" = any authenticated user, "admin" = admin only. */
  requiredRole?: Role;
  /** The actual user role from the API. If undefined, user is a guest. */
  userRole?: string | null;
  /** Content to show when access is granted. */
  children: React.ReactNode;
  /** Label shown on the locked overlay. */
  featureName?: string;
  /** Show a compact inline lock badge instead of a full overlay. */
  inline?: boolean;
}

export function FeatureGate({
  requiredRole = "user",
  userRole,
  children,
  featureName = "This feature",
  inline = false,
}: FeatureGateProps) {
  const { isSignedIn } = useUser();

  const hasAccess = (() => {
    if (!isSignedIn) return false;
    if (requiredRole === "user") return true;
    if (requiredRole === "admin") return userRole === "admin";
    return false;
  })();

  if (hasAccess) return <>{children}</>;

  const isAdminGated = requiredRole === "admin" && isSignedIn;

  if (inline) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 border border-border/40 rounded px-2 py-1">
        {isAdminGated ? <Shield className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        {isAdminGated ? "Admin only" : "Sign in required"}
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/40">
      {/* Blurred children preview */}
      <div className="pointer-events-none select-none opacity-30 blur-[2px] saturate-50">
        {children}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm p-6 text-center">
        <div className={`p-3 rounded-full mb-4 ${isAdminGated ? "bg-amber-400/10 border border-amber-400/30" : "bg-primary/10 border border-primary/20"}`}>
          {isAdminGated ? (
            <Shield className="h-6 w-6 text-amber-400" />
          ) : (
            <Lock className="h-6 w-6 text-primary" />
          )}
        </div>
        <p className="font-semibold text-foreground mb-1">
          {isAdminGated ? "Admin access required" : "Sign in to access"}
        </p>
        <p className="text-sm text-muted-foreground mb-5 max-w-xs">
          {isAdminGated
            ? `${featureName} is only available to administrators.`
            : `${featureName} requires an account. Sign in or create one to continue.`}
        </p>
        {!isSignedIn && (
          <div className="flex gap-2">
            <a href={`${basePath}/sign-in`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Button>
            </a>
            <a href={`${basePath}/sign-up`}>
              <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <UserPlus className="h-3.5 w-3.5" />
                Sign Up Free
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
