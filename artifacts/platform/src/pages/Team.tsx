import { useListPublicProfiles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Team() {
  const { data: profiles, isLoading } = useListPublicProfiles();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Directory</h1>
        <p className="text-muted-foreground mt-2">
          Discover who's building the platform.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : profiles && profiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Link key={profile.userId} href={`/team/${profile.userId}`}>
              <Card className="hover-elevate overflow-hidden border-border/50 bg-card/40 cursor-pointer transition-colors hover:border-primary/50 h-full flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={profile.avatarObjectPath || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {profile.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h3 className="font-semibold">{profile.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{profile.headline || "Team Member"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {profile.summary || "No summary provided."}
                  </p>
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {profile.skills.slice(0, 3).map((skill) => (
                         <Badge key={skill} variant="secondary" className="bg-secondary/50 font-normal text-xs">{skill}</Badge>
                      ))}
                      {profile.skills.length > 3 && (
                        <Badge variant="secondary" className="bg-secondary/50 font-normal text-xs">+{profile.skills.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg border-dashed border-border/60 bg-card/20">
          <div className="rounded-full bg-muted p-4 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 className="text-lg font-medium">No public profiles</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">No team members have made their profiles public yet.</p>
        </div>
      )}
    </div>
  );
}
