// Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.
import { Network, Lock, Eye, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureGate } from "@/components/FeatureGate";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Static demo graph nodes for the guest preview
const demoNodes = [
  { id: "user:1", label: "admin@synaptiq.dev", type: "user", color: "hsl(var(--primary))", x: 50, y: 50 },
  { id: "user:2", label: "dev@synaptiq.dev", type: "user", color: "hsl(var(--primary))", x: 75, y: 25 },
  { id: "ds:1", label: "hacker-news", type: "data_source", color: "hsl(280 65% 60%)", x: 20, y: 70 },
  { id: "ds:2", label: "coin-gecko", type: "data_source", color: "hsl(280 65% 60%)", x: 80, y: 70 },
  { id: "sj:1", label: "scrape-job #1", type: "scrape_job", color: "hsl(45 90% 55%)", x: 35, y: 35 },
  { id: "fs:1", label: "feature-set #1", type: "feature_set", color: "hsl(160 60% 45%)", x: 60, y: 80 },
  { id: "tr:1", label: "training-run #1", type: "training_run", color: "hsl(0 65% 55%)", x: 80, y: 45 },
];

const entityTypes = [
  { type: "user", color: "hsl(var(--primary))", label: "User" },
  { type: "data_source", color: "hsl(280 65% 60%)", label: "Data Source" },
  { type: "scrape_job", color: "hsl(45 90% 55%)", label: "Scrape Job" },
  { type: "feature_set", color: "hsl(160 60% 45%)", label: "Feature Set" },
  { type: "training_run", color: "hsl(0 65% 55%)", label: "Training Run" },
];

export default function GuestGraph() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Guest Preview</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          Knowledge Graph
        </h1>
        <p className="text-muted-foreground mt-2">
          A force-directed visualization of the platform's live relational data. Sign in to view the live graph with your data.
        </p>
      </div>

      {/* Static demo graph */}
      <Card className="bg-card/50 border-primary/10 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                Entity Relationship Graph
                <Badge variant="secondary" className="text-[10px] ml-1">Demo</Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-1">Static preview — sign in to see your live data</CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              {demoNodes.length} nodes
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* SVG demo graph */}
          <div className="relative bg-background/50 border-t border-border/40" style={{ height: 380 }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0">
              {/* Static edges */}
              <line x1="50" y1="50" x2="35" y2="35" stroke="hsl(var(--border))" strokeWidth="0.5" />
              <line x1="50" y1="50" x2="75" y2="25" stroke="hsl(var(--border))" strokeWidth="0.5" />
              <line x1="35" y1="35" x2="20" y2="70" stroke="hsl(var(--border))" strokeWidth="0.5" />
              <line x1="35" y1="35" x2="60" y2="80" stroke="hsl(var(--border))" strokeWidth="0.5" />
              <line x1="60" y1="80" x2="80" y2="45" stroke="hsl(var(--border))" strokeWidth="0.5" />
              <line x1="80" y1="70" x2="80" y2="45" stroke="hsl(var(--border))" strokeWidth="0.5" />
              {/* Nodes */}
              {demoNodes.map((n) => (
                <g key={n.id}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r="4.5"
                    fill={n.color}
                    fillOpacity="0.2"
                    stroke={n.color}
                    strokeWidth="0.8"
                  />
                  <circle cx={n.x} cy={n.y} r="2" fill={n.color} />
                  <text
                    x={n.x}
                    y={n.y + 7.5}
                    textAnchor="middle"
                    fontSize="2.5"
                    fill="hsl(var(--muted-foreground))"
                    className="select-none"
                  >
                    {n.label.length > 14 ? n.label.slice(0, 12) + "…" : n.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Overlay CTA */}
            <div className="absolute bottom-4 right-4">
              <a href={`${basePath}/sign-in`}>
                <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg text-xs">
                  <Network className="h-3 w-3" />
                  View Live Graph →
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-card/50 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Entity Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {entityTypes.map((e) => (
              <div key={e.type} className="flex items-center gap-1.5 text-sm">
                <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: e.color, borderColor: e.color }} />
                <span className="text-muted-foreground">{e.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature gate: live graph */}
      <FeatureGate featureName="The live Knowledge Graph" userRole={null}>
        <Card className="bg-card/50 border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Live Graph Controls</CardTitle>
            <CardDescription>Interact with your data in real time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              {["Filter by entity type", "Click nodes for detail", "Zoom & pan"].map((f) => (
                <div key={f} className="p-2 rounded border border-border/60 text-muted-foreground">{f}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FeatureGate>
    </div>
  );
}
