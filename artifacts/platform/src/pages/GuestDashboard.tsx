// Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.
import { Link } from "wouter";
import {
  BarChart3, GitBranch, Network, Users, Activity,
  Settings, Lock, Eye, Zap, Database, BrainCircuit,
  Layers, ChevronRight, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/FeatureGate";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Demo stats — displayed to guests as a platform preview
const demoStats = [
  { label: "Data Sources", value: "3", sub: "HN · CoinGecko · CryptoPanic", icon: Database },
  { label: "Scrape Jobs", value: "—", sub: "Sign in to run jobs", icon: Layers },
  { label: "Training Runs", value: "—", sub: "Sign in to train models", icon: BrainCircuit },
  { label: "Test Suites", value: "5", sub: "85 tests total", icon: Activity },
];

const sections = [
  {
    title: "Knowledge Graph",
    description: "Force-directed live graph of platform entities and their relationships.",
    icon: Network,
    href: "/explore/graph",
    guestOk: true,
    cta: "Preview Graph",
  },
  {
    title: "Team Directory",
    description: "Browse public profiles, skills, and projects from every team member.",
    icon: Users,
    href: "/explore/team",
    guestOk: true,
    cta: "Browse Team",
  },
  {
    title: "AI Agent Pipeline",
    description: "Scrape → Process → Train. Trigger live scrapes and train trend models.",
    icon: GitBranch,
    href: "/pipeline",
    guestOk: false,
    cta: "Requires sign-in",
  },
  {
    title: "Test Dashboard",
    description: "Color-coded progress bars across 5 pytest suites and historical runs.",
    icon: Activity,
    href: "/tests",
    guestOk: false,
    cta: "Requires sign-in",
  },
  {
    title: "My Profile",
    description: "Manage your resume, skills, and project showcase visible to the team.",
    icon: Zap,
    href: "/profile",
    guestOk: false,
    cta: "Requires sign-in",
  },
  {
    title: "Admin Panel",
    description: "User role management and platform-wide administration tools.",
    icon: Settings,
    href: "/admin/users",
    guestOk: false,
    cta: "Requires admin",
  },
];

export default function GuestDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Guest Preview</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          You're browsing as a guest. Explore the Knowledge Graph and Team Directory without an account.{" "}
          <a href={`${basePath}/sign-in`} className="text-primary hover:underline">Sign in</a>{" "}
          or{" "}
          <a href={`${basePath}/sign-up`} className="text-primary hover:underline">create an account</a>{" "}
          to unlock all features.
        </p>
      </div>

      {/* Demo stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {demoStats.map((s) => (
          <Card key={s.label} className="bg-card/50 backdrop-blur-sm border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Explore sections */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Explore the Platform</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((sec) => (
            <Card key={sec.title} className={`bg-card/50 border-border/60 transition-all ${sec.guestOk ? "hover:border-primary/40 cursor-pointer" : "opacity-75"}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg mb-2 ${sec.guestOk ? "bg-primary/10 border border-primary/20" : "bg-border/30 border border-border/40"}`}>
                    <sec.icon className={`h-4 w-4 ${sec.guestOk ? "text-primary" : "text-muted-foreground/50"}`} />
                  </div>
                  {sec.guestOk ? (
                    <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary/80">
                      <Eye className="h-2.5 w-2.5" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] gap-1 text-muted-foreground/60">
                      <Lock className="h-2.5 w-2.5" />
                      {sec.href === "/admin/users" ? "Admin" : "Sign in"}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base">{sec.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{sec.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {sec.guestOk ? (
                  <Link href={sec.href}>
                    <Button size="sm" variant="outline" className="gap-1.5 w-full border-primary/30 hover:border-primary/60 text-xs">
                      {sec.cta}
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                ) : (
                  <a href={`${basePath}/sign-in`}>
                    <Button size="sm" variant="ghost" className="gap-1.5 w-full text-muted-foreground/60 text-xs" disabled={false}>
                      <Lock className="h-3 w-3" />
                      {sec.cta}
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pipeline feature gate example */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">AI Agent Pipeline</h2>
          <Badge variant="secondary" className="text-xs gap-1">
            <Lock className="h-2.5 w-2.5" />
            Requires account
          </Badge>
        </div>
        <FeatureGate featureName="The AI Agent Pipeline" userRole={null}>
          {/* This content is shown blurred/locked to guests */}
          <Card className="bg-card/50 border-primary/10">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                Scrape → Process → Train
              </CardTitle>
              <CardDescription>
                Trigger live data scrapes, process feature sets, and train trend models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {["1. Scrape Data", "2. Process Features", "3. Train Model"].map((step, i) => (
                  <div key={step} className="p-3 rounded-lg border border-border/60 bg-background/50">
                    <div className="text-xs font-medium text-primary mb-1">Step {i + 1}</div>
                    <div className="text-sm font-medium">{step.replace(/^\d+\. /, "")}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FeatureGate>
      </div>

      {/* CTA bar */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-semibold">Ready to unlock the full platform?</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Create an account — the first user to sign up automatically becomes an admin.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a href={`${basePath}/sign-in`}>
            <Button variant="outline" size="sm" className="border-primary/30">Sign In</Button>
          </a>
          <a href={`${basePath}/sign-up`}>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create Account →
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
