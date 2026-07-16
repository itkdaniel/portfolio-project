// Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.
import { Link, useLocation } from "wouter";
import { Eye, Network, Users, BarChart3, LogIn, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const guestNav = [
  { href: "/explore", label: "Overview", icon: BarChart3 },
  { href: "/explore/graph", label: "Knowledge Graph", icon: Network },
  { href: "/explore/team", label: "Team Directory", icon: Users },
];

export function GuestLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* Guest banner */}
      {!bannerDismissed && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between gap-3 text-sm z-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground truncate">
              <span className="text-foreground font-medium">Guest mode</span>
              {" "}· Read-only preview · Some features require an account
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={`${basePath}/sign-in`}>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 text-primary hover:text-primary">
                <LogIn className="h-3 w-3" />
                Sign In
              </Button>
            </a>
            <a href={`${basePath}/sign-up`}>
              <Button size="sm" className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <UserPlus className="h-3 w-3" />
                Sign Up
              </Button>
            </a>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setBannerDismissed(true)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-full md:w-56 bg-card border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center gap-2.5">
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="8" fill="hsl(var(--background))"/>
                  <path d="M12 28L20 12L28 28M14 24H26" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <span className="font-bold text-sm tracking-tight block">Synaptiq</span>
                  <span className="text-[10px] text-primary/70 font-medium">Guest Preview</span>
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-0.5">
            {guestNav.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 text-sm ${isActive ? "bg-secondary/50 font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Sign-in prompt at bottom */}
          <div className="p-4 border-t border-border space-y-2">
            <p className="text-xs text-muted-foreground px-1 mb-3">
              Sign in to unlock the full platform
            </p>
            <a href={`${basePath}/sign-in`} className="block">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </a>
            <a href={`${basePath}/sign-up`} className="block">
              <Button className="w-full justify-start gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90">
                <UserPlus className="h-4 w-4" />
                Create Account
              </Button>
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-background/50">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
