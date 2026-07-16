import { useGetCurrentUser, useListScrapeJobs, useListFeatureSets, useListTrainingRuns, useListDataSources } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, BrainCircuit, Activity, Layers } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: user } = useGetCurrentUser();
  const { data: dataSources } = useListDataSources();
  const { data: scrapeJobs } = useListScrapeJobs();
  const { data: featureSets } = useListFeatureSets();
  const { data: trainingRuns } = useListTrainingRuns();

  const recentScrapes = scrapeJobs?.slice(0, 5) || [];
  const recentTrains = trainingRuns?.slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.firstName || "Operator"}. Here is the current state of the Synaptiq pipeline.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Sources</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataSources?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Configured streams</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scrapes</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scrapeJobs?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {scrapeJobs?.filter(j => j.status === "completed").length || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Feature Sets</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureSets?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Processed datasets</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Training Runs</CardTitle>
            <BrainCircuit className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingRuns?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Models trained</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Scrapes</CardTitle>
                <CardDescription>Latest data extraction jobs</CardDescription>
              </div>
              <Link href="/pipeline" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScrapes.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No recent scrapes</div>
              ) : (
                recentScrapes.map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{job.dataSourceName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</p>
                    </div>
                    <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Models</CardTitle>
                <CardDescription>Latest training runs</CardDescription>
              </div>
              <Link href="/pipeline" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrains.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No recent training runs</div>
              ) : (
                recentTrains.map((run) => (
                  <div key={run.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Run #{run.id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {run.predictedTopics && run.predictedTopics.length > 0 && (
                        <span className="text-xs text-muted-foreground">{run.predictedTopics.length} topics</span>
                      )}
                      <Badge variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}>
                        {run.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
