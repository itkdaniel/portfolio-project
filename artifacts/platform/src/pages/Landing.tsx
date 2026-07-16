// Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.
import { Link } from "wouter";
import { 
  GitBranch, Network, Activity, Users, UserCircle, 
  Settings, Lock, Eye, Zap, Shield, ChevronRight, 
  Database, BrainCircuit, BarChart3, Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const features = [
  {
    icon: BarChart3,
    title: "Live Dashboard",
    description: "Real-time pipeline stats, scrape counts, training runs, and team activity at a glance.",
    guest: true,
  },
  {
    icon: GitBranch,
    title: "AI Agent Pipeline",
    description: "Scrape live data from HN, CoinGecko, CryptoPanic — then process and train trend models.",
    guest: false,
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description: "Force-directed live graph of the platform's own relational data — entities and relationships.",
    guest: true,
  },
  {
    icon: Users,
    title: "Team Directory",
    description: "Public and private resume pages for every team member with skills and project showcase.",
    guest: true,
  },
  {
    icon: Activity,
    title: "Test Suite Dashboard",
    description: "Color-coded progress bars across 5 pytest suites — unit, DDT, BDD, regression, E2E.",
    guest: false,
  },
  {
    icon: Settings,
    title: "Admin Panel",
    description: "User role management, RBAC enforcement, and platform-wide configuration for admins.",
    guest: false,
  },
];

const tiers = [
  {
    name: "Guest",
    icon: Eye,
    color: "text-muted-foreground",
    border: "border-border",
    badge: "bg-secondary text-secondary-foreground",
    description: "Browse without an account",
    features: [
      { label: "Dashboard overview (demo)", included: true },
      { label: "Knowledge Graph preview", included: true },
      { label: "Public team profiles", included: true },
      { label: "AI agent pipeline", included: false },
      { label: "Run scrape / train jobs", included: false },
      { label: "Test suite runner", included: false },
      { label: "Edit profile", included: false },
      { label: "Admin panel", included: false },
    ],
  },
  {
    name: "User",
    icon: Zap,
    color: "text-primary",
    border: "border-primary/40",
    badge: "bg-primary/20 text-primary",
    description: "Sign in to unlock the platform",
    features: [
      { label: "Dashboard overview (live)", included: true },
      { label: "Knowledge Graph (live)", included: true },
      { label: "Public + private team profiles", included: true },
      { label: "AI agent pipeline", included: true },
      { label: "Run scrape / train jobs", included: true },
      { label: "Test suite runner", included: true },
      { label: "Edit profile", included: true },
      { label: "Admin panel", included: false },
    ],
  },
  {
    name: "Admin",
    icon: Shield,
    color: "text-amber-400",
    border: "border-amber-400/40",
    badge: "bg-amber-400/20 text-amber-400",
    description: "Full platform control",
    features: [
      { label: "Dashboard overview (live)", included: true },
      { label: "Knowledge Graph (live)", included: true },
      { label: "Public + private team profiles", included: true },
      { label: "AI agent pipeline", included: true },
      { label: "Run scrape / train jobs", included: true },
      { label: "Test suite runner", included: true },
      { label: "Edit profile", included: true },
      { label: "Admin panel + role management", included: true },
    ],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden">

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="hsl(var(--card))"/>
              <path d="M12 28L20 12L28 28M14 24H26" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-base tracking-tight">Synaptiq</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/explore">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Explore
              </Button>
            </Link>
            <a href={`${basePath}/sign-in`}>
              <Button variant="ghost" size="sm">Sign In</Button>
            </a>
            <a href={`${basePath}/sign-up`}>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 flex flex-col items-center text-center">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.15),transparent)]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-6 text-xs px-3 py-1 gap-1.5 border border-primary/20 bg-primary/10 text-primary">
            <Database className="h-3 w-3" />
            v2.0.0 · Python 3 FastAPI Backend
          </Badge>
          <div className="mb-8 flex justify-center">
            <div className="p-4 rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm shadow-lg">
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="hsl(var(--card))"/>
                <path d="M12 28L20 12L28 28M14 24H26" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Synaptiq
          </h1>
          <p className="text-xl text-muted-foreground mb-3 max-w-2xl mx-auto leading-relaxed">
            The synaptic intelligence platform.
          </p>
          <p className="text-lg text-muted-foreground/70 mb-10 max-w-xl mx-auto leading-relaxed">
            Scrape live data, forge knowledge graphs, run AI agent pipelines, and inspect team health — all behind role-based access control.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/explore">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5">
                <Eye className="h-4 w-4" />
                Explore as Guest
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <a href={`${basePath}/sign-in`}>
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Zap className="h-4 w-4" />
                Sign In for Full Access
              </Button>
            </a>
            <a href={`${basePath}/sign-up`}>
              <Button size="lg" variant="ghost" className="w-full sm:w-auto text-muted-foreground hover:text-foreground">
                Create Account →
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-4">
            No account needed to explore · First registered user becomes admin
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Platform Capabilities</h2>
            <p className="text-muted-foreground">Six integrated modules, role-gated access</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className={`bg-card/50 border-border/60 hover:border-primary/30 transition-colors relative overflow-hidden`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 mb-3">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    {!f.guest && (
                      <Badge variant="secondary" className="text-xs gap-1 border border-border/60">
                        <Lock className="h-2.5 w-2.5" />
                        Auth required
                      </Badge>
                    )}
                    {f.guest && (
                      <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary/80">
                        <Eye className="h-2.5 w-2.5" />
                        Guest preview
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{f.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Access Tiers */}
      <section className="py-16 px-4 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Access Tiers</h2>
            <p className="text-muted-foreground">What you can do at each level</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card key={tier.name} className={`bg-card/60 border ${tier.border} relative`}>
                {tier.name === "User" && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3">Most Common</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1.5 rounded-md border ${tier.border} bg-background/50`}>
                      <tier.icon className={`h-4 w-4 ${tier.color}`} />
                    </div>
                    <span className={`font-bold text-lg ${tier.color}`}>{tier.name}</span>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tier.features.map((f) => (
                    <div key={f.label} className={`flex items-center gap-2 text-sm ${f.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                      {f.included ? (
                        <div className="h-4 w-4 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-border/40 flex items-center justify-center flex-shrink-0">
                          <Lock className="h-2 w-2 text-muted-foreground/40" />
                        </div>
                      )}
                      {f.label}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stack callout */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {["Python 3.12", "FastAPI", "SQLAlchemy 2.0", "React 18", "TypeScript", "Clerk Auth", "PostgreSQL", "85 Tests"].map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs border border-border/60 bg-card/60">
                {tag}
              </Badge>
            ))}
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Built to production standards</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Contract-first OpenAPI spec, 5 pytest suites with Factory Boy + Page Object Model, 
            separate dev/prod Docker environments, GitHub Actions CI/CD, Alembic migrations, 
            and Clerk JWKS JWT auth with RBAC.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/explore">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 border-primary/30">
                <Globe className="h-4 w-4" />
                Try it — no account needed
              </Button>
            </Link>
            <a href="https://github.com/Itkdaniel/portfolio-project" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-muted-foreground gap-2">
                <BrainCircuit className="h-4 w-4" />
                View on GitHub →
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="hsl(var(--card))"/>
              <path d="M12 28L20 12L28 28M14 24H26" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Synaptiq · Synaptic Applications</span>
          </div>
          <span>© 2026 Itkdaniel · MIT License</span>
        </div>
      </footer>
    </div>
  );
}
