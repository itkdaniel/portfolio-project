import { useGetPublicProfile } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github, Linkedin, Globe, Briefcase } from "lucide-react";
import { getGetPublicProfileQueryKey } from "@workspace/api-client-react";

export default function TeamMember() {
  const { userId } = useParams<{ userId: string }>();
  const id = parseInt(userId || "0", 10);
  
  const { data: profile, isLoading, error } = useGetPublicProfile(id, { 
    query: { 
      enabled: !!id,
      queryKey: getGetPublicProfileQueryKey(id)
    } 
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-24" />
        <Card>
          <CardHeader className="flex flex-row items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <Link href="/team">
          <Button variant="ghost" className="gap-2 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Button>
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg border-dashed border-border/60 bg-card/20">
          <h3 className="text-lg font-medium text-destructive">Profile not found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">This user may not exist or their profile is private.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <Link href="/team">
        <Button variant="ghost" className="gap-2 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Button>
      </Link>

      <div className="relative">
        {/* Cover banner */}
        <div className="h-32 w-full bg-gradient-to-r from-primary/20 via-background to-background rounded-t-xl border border-b-0 border-border"></div>
        
        <Card className="rounded-t-none border-t-0 shadow-xl bg-card/60 backdrop-blur-sm">
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-12 mb-6">
              <Avatar className="h-24 w-24 border-4 border-card bg-card">
                <AvatarImage src={profile.avatarObjectPath || ""} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <p className="text-lg text-primary mt-1">{profile.headline || "Team Member"}</p>
              </div>
              <div className="flex gap-2 pb-2">
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="outline" className="rounded-full bg-background">
                      <Github className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="outline" className="rounded-full bg-background">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="outline" className="rounded-full bg-background">
                      <Globe className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                {profile.resumeObjectPath && (
                  <a href={profile.resumeObjectPath} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="outline" className="rounded-full bg-background">
                      <Briefcase className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 border-b border-border/50 pb-2">About</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {profile.summary || "No summary provided."}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b border-border/50 pb-2">Skills</h3>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-secondary/40 font-medium">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
