import { 
  useListDataSources, 
  useListScrapeJobs, 
  useListFeatureSets, 
  useListTrainingRuns,
  useRunScrape,
  useRunProcess,
  useRunTrain,
  getListScrapeJobsQueryKey,
  getListFeatureSetsQueryKey,
  getListTrainingRunsQueryKey,
  useGetCurrentUser
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, Filter, BrainCircuit, Play, ArrowRight, CheckCircle2, Clock, XCircle, LayoutList } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Pipeline() {
  const { data: currentUser } = useGetCurrentUser();
  const { data: dataSources, isLoading: dsLoading } = useListDataSources();
  const { data: scrapeJobs, isLoading: sjLoading } = useListScrapeJobs();
  const { data: featureSets, isLoading: fsLoading } = useListFeatureSets();
  const { data: trainingRuns, isLoading: trLoading } = useListTrainingRuns();
  
  const runScrape = useRunScrape();
  const runProcess = useRunProcess();
  const runTrain = useRunTrain();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === "admin";

  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedScrapeJob, setSelectedScrapeJob] = useState<number | null>(null);
  const [featureInput, setFeatureInput] = useState("");

  const handleScrape = (dataSourceId: number) => {
    runScrape.mutate(
      { data: { dataSourceId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListScrapeJobsQueryKey() });
          toast({ title: "Scrape started", description: "The extraction job has been queued." });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
      }
    );
  };

  const handleProcess = () => {
    if (!selectedScrapeJob || !featureInput) return;
    const features = featureInput.split(",").map(s => s.trim()).filter(Boolean);
    
    runProcess.mutate(
      { data: { scrapeJobId: selectedScrapeJob, features } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFeatureSetsQueryKey() });
          setProcessDialogOpen(false);
          setFeatureInput("");
          toast({ title: "Processing started", description: "Feature set creation queued." });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
      }
    );
  };

  const handleTrain = (featureSetId: number) => {
    runTrain.mutate(
      { data: { featureSetId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTrainingRunsQueryKey() });
          toast({ title: "Training started", description: "Model training has been queued." });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
      }
    );
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-destructive" />;
    if (status === "running" || status === "pending") return <Clock className="h-4 w-4 text-primary animate-pulse" />;
    return null;
  };

  if (dsLoading || sjLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Intelligence Pipeline</h1>
        <p className="text-muted-foreground mt-2">
          Orchestrate data extraction, processing, and model training.
        </p>
      </div>

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-4 bg-muted/50">
          <TabsTrigger value="sources" className="gap-2"><Database className="h-4 w-4" /> Sources</TabsTrigger>
          <TabsTrigger value="scrapes" className="gap-2"><Filter className="h-4 w-4" /> Scrapes</TabsTrigger>
          <TabsTrigger value="features" className="gap-2"><LayoutList className="h-4 w-4" /> Features</TabsTrigger>
          <TabsTrigger value="models" className="gap-2"><BrainCircuit className="h-4 w-4" /> Models</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dataSources?.map(ds => (
              <Card key={ds.id} className="flex flex-col border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{ds.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2 font-normal capitalize bg-secondary/50">
                        {ds.category}
                      </Badge>
                    </div>
                    <Database className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{ds.description}</p>
                  
                  {isAdmin && (
                    <Button 
                      onClick={() => handleScrape(ds.id)} 
                      disabled={runScrape.isPending}
                      className="w-full gap-2 mt-auto"
                    >
                      <Play className="h-4 w-4" /> Trigger Scrape
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scrapes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scrape Jobs</CardTitle>
              <CardDescription>Raw data extraction history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scrapeJobs?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(job => (
                  <div key={job.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                    <div className="space-y-1 mb-4 md:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{job.dataSourceName}</span>
                        <Badge variant="outline" className="font-mono text-xs">Job #{job.id}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <StatusIcon status={job.status} /> {job.status}
                        </span>
                        <span>{format(new Date(job.createdAt), "MMM d, HH:mm")}</span>
                        {job.status === "completed" && <span>{job.recordsScraped} records</span>}
                      </div>
                      {job.errorMessage && (
                        <p className="text-xs text-destructive mt-1">{job.errorMessage}</p>
                      )}
                    </div>
                    
                    {isAdmin && job.status === "completed" && (
                      <Dialog open={processDialogOpen && selectedScrapeJob === job.id} onOpenChange={(open) => {
                        setProcessDialogOpen(open);
                        if (open) setSelectedScrapeJob(job.id);
                        else setSelectedScrapeJob(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" className="gap-2">
                            Process Features <ArrowRight className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Process Feature Set</DialogTitle>
                            <DialogDescription>
                              Extract specific features from Job #{job.id} ({job.dataSourceName})
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Features (comma separated)</label>
                              <Input 
                                placeholder="title, content, author, date..." 
                                value={featureInput}
                                onChange={(e) => setFeatureInput(e.target.value)}
                              />
                            </div>
                            <Button 
                              onClick={handleProcess} 
                              className="w-full"
                              disabled={!featureInput || runProcess.isPending}
                            >
                              Start Processing
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ))}
                {scrapeJobs?.length === 0 && <div className="text-center py-8 text-muted-foreground">No scrape jobs found.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Sets</CardTitle>
              <CardDescription>Processed data ready for training</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureSets?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(fs => (
                  <div key={fs.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                    <div className="space-y-2 mb-4 md:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">Feature Set #{fs.id}</span>
                        <Badge variant="outline" className="font-mono text-xs">Source Job #{fs.scrapeJobId}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {fs.featureNames?.map(f => (
                          <Badge key={f} variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary hover:bg-primary/20">{f}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <StatusIcon status={fs.status} /> {fs.status}
                        </span>
                        <span>{format(new Date(fs.createdAt), "MMM d, HH:mm")}</span>
                        {fs.status === "completed" && <span>{fs.rowCount} rows</span>}
                      </div>
                      {fs.errorMessage && <p className="text-xs text-destructive">{fs.errorMessage}</p>}
                    </div>
                    
                    {isAdmin && fs.status === "completed" && (
                      <Button onClick={() => handleTrain(fs.id)} disabled={runTrain.isPending} className="gap-2">
                        <BrainCircuit className="h-4 w-4" /> Train Model
                      </Button>
                    )}
                  </div>
                ))}
                {featureSets?.length === 0 && <div className="text-center py-8 text-muted-foreground">No feature sets found.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <div className="grid gap-6">
            {trainingRuns?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(run => (
              <Card key={run.id} className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <BrainCircuit className={`h-6 w-6 ${run.status === 'completed' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <CardTitle className="text-lg">Model #{run.id}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <StatusIcon status={run.status} /> {run.status} • Feature Set #{run.featureSetId} • {format(new Date(run.createdAt), "MMM d, HH:mm")}
                        </CardDescription>
                      </div>
                    </div>
                    {run.status === "completed" && (
                      <Badge className="bg-primary text-primary-foreground">Active Model</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {run.errorMessage && <p className="text-sm text-destructive mb-4">{run.errorMessage}</p>}
                  
                  {run.status === "completed" && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Predicted Trending Topics</h4>
                        <div className="space-y-3">
                          {run.predictedTopics?.map((topic, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="font-medium text-sm">{topic.topic}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${Math.min(100, Math.max(0, topic.score * 100))}%` }} 
                                  />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                                  {topic.score.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                          {(!run.predictedTopics || run.predictedTopics.length === 0) && (
                            <p className="text-sm text-muted-foreground italic">No topics predicted.</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Metrics</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {run.metrics && Object.entries(run.metrics).map(([k, v]) => (
                            <div key={k} className="bg-muted/30 p-3 rounded-md border border-border/50">
                              <p className="text-xs text-muted-foreground mb-1 font-mono">{k}</p>
                              <p className="text-lg font-semibold">{String(v)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {trainingRuns?.length === 0 && <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">No models trained yet.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
