import { useListTestRuns, useRunTestSuite, getListTestRunsQueryKey, useGetCurrentUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TestSuiteType } from "@workspace/api-client-react";

export default function Tests() {
  const { data: currentUser } = useGetCurrentUser();
  const { data: testRuns, isLoading } = useListTestRuns();
  const runTestSuite = useRunTestSuite();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = currentUser?.role === "admin";
  const [runningSuites, setRunningSuites] = useState<Record<string, boolean>>({});

  const suites: TestSuiteType[] = ["unit", "ddt", "bdd", "regression", "e2e"];

  const handleRunSuite = (suiteType: TestSuiteType) => {
    setRunningSuites(prev => ({ ...prev, [suiteType]: true }));
    runTestSuite.mutate(
      { data: { suiteType } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTestRunsQueryKey() });
          toast({
            title: "Test suite started",
            description: `Running ${suiteType} tests...`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.message || "Failed to start tests",
            variant: "destructive",
          });
        },
        onSettled: () => {
          setRunningSuites(prev => ({ ...prev, [suiteType]: false }));
        }
      }
    );
  };

  const getRunsForSuite = (suiteType: string) => {
    return testRuns?.filter(run => run.suiteType === suiteType).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) || [];
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system health and inspect test execution results.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {suites.map((suiteType) => {
          const runs = getRunsForSuite(suiteType);
          const latestRun = runs[0];
          const isRunning = runningSuites[suiteType] || latestRun?.status === "running";
          
          let passRate = 0;
          if (latestRun && latestRun.total > 0) {
            passRate = Math.round((latestRun.passed / latestRun.total) * 100);
          }

          return (
            <Card key={suiteType} className="border-border/50 hover:border-border transition-colors flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-bold uppercase tracking-wider">{suiteType}</CardTitle>
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRunSuite(suiteType)}
                    disabled={isRunning}
                    className="h-8 gap-2"
                  >
                    {isRunning ? (
                      <Clock className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    {isRunning ? "Running..." : "Run"}
                  </Button>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  {latestRun ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="text-3xl font-bold">
                          {latestRun.status === "completed" ? `${passRate}%` : "-"}
                        </div>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="h-3 w-3" /> {latestRun.passed}
                          </span>
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3 w-3" /> {latestRun.failed}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {latestRun.total} total
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={latestRun.status === "completed" ? passRate : undefined} 
                        className={`h-2 ${latestRun.failed > 0 ? '[&>div]:bg-destructive' : '[&>div]:bg-green-500'}`} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{latestRun.durationMs ? `${(latestRun.durationMs / 1000).toFixed(1)}s` : "-"}</span>
                        <span>{format(new Date(latestRun.createdAt), "MMM d, HH:mm")}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-sm border border-dashed rounded-md bg-muted/20">
                      No runs recorded
                    </div>
                  )}
                </div>

                {runs.length > 0 && (
                  <div className="mt-auto">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="history" className="border-none">
                        <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground hover:no-underline">
                          View History ({runs.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 mt-2">
                            {runs.map((run) => (
                              <div key={run.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
                                <div className="flex justify-between items-center">
                                  <Badge variant={
                                    run.status === "completed" ? (run.failed > 0 ? "destructive" : "default") :
                                    run.status === "failed" ? "destructive" : "secondary"
                                  } className={run.status === "completed" && run.failed === 0 ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}>
                                    {run.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(run.createdAt), "MMM d, HH:mm")}
                                  </span>
                                </div>
                                
                                {run.status === "completed" && (
                                  <div className="flex gap-4 text-xs font-mono">
                                    <span className="text-green-500">P:{run.passed}</span>
                                    <span className="text-destructive">F:{run.failed}</span>
                                    <span>T:{run.total}</span>
                                    <span>{run.durationMs ? `${run.durationMs}ms` : ""}</span>
                                  </div>
                                )}
                                
                                {run.output && (
                                  <div className="mt-2 text-xs font-mono bg-background border rounded p-2 overflow-x-auto whitespace-pre">
                                    {run.output}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
