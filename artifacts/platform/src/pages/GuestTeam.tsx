// Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.
import { Users, Eye, User, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FeatureGate } from "@/components/FeatureGate";
import { useListPublicProfiles } from "@workspace/api-client-react";
import type { PublicProfile } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ProfileCard({ profile }: { profile: PublicProfile }) {
  const initials = (profile.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="bg-card/50 border-border/60 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="bg-primary/20 text-primary text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{profile.name || "Team Member"}</h3>
              <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary/80 shrink-0">
                <Globe className="h-2.5 w-2.5" />
                Public
              </Badge>
            </div>
            {profile.headline && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.headline}</p>
            )}
          </div>
        </div>
      </CardHeader>
      {(profile.summary || (profile.skills && profile.skills.length > 0)) && (
        <CardContent className="pt-0 space-y-3">
          {profile.summary && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{profile.summary}</p>
          )}
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.skills.slice(0, 5).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-[10px] border border-border/60 bg-card/60">
                  {skill}
                </Badge>
              ))}
              {profile.skills.length > 5 && (
                <Badge variant="secondary" className="text-[10px]">+{profile.skills.length - 5}</Badge>
              )}
            </div>
          )}
          {(profile.githubUrl || profile.linkedinUrl) && (
            <div className="flex gap-2">
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground">
                    GitHub ↗
                  </Button>
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground">
                    LinkedIn ↗
                  </Button>
                </a>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function GuestTeam() {
  const { data: profiles, isLoading } = useListPublicProfiles();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Public · No account needed</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Team Directory</h1>
        <p className="text-muted-foreground mt-2">
          Public profiles from the Synaptiq team. Sign in to see private profiles and add your own.
        </p>
      </div>

      {/* Public profiles */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50 border-border/60 animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-primary/10 rounded w-3/4" />
                    <div className="h-2 bg-border/40 rounded w-1/2" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : profiles && profiles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.userId} profile={profile} />
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">No public profiles yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign up to be the first — the first account automatically becomes admin.
            </p>
            <a href={`${basePath}/sign-up`}>
              <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                Create Account →
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Private profiles — gated */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">Private Profiles</h2>
          <Badge variant="secondary" className="text-xs gap-1">
            <Lock className="h-2.5 w-2.5" />
            Sign in required
          </Badge>
        </div>
        <FeatureGate featureName="Private team profiles" userRole={null}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => (
              <Card key={i} className="bg-card/50 border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary/40" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-primary/10 rounded w-3/4" />
                      <div className="h-2 bg-border/40 rounded w-1/2" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1.5">
                    <div className="h-2 bg-border/30 rounded" />
                    <div className="h-2 bg-border/30 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </FeatureGate>
      </div>
    </div>
  );
}
