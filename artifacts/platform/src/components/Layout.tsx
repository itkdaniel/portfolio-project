import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { 
  Activity, 
  Users, 
  UserCircle, 
  GitBranch, 
  Network, 
  Settings, 
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: user, isLoading } = useGetCurrentUser();
  
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pipeline", label: "Pipeline", icon: GitBranch },
    { href: "/knowledge-graph", label: "Knowledge Graph", icon: Network },
    { href: "/tests", label: "Tests", icon: Activity },
    { href: "/team", label: "Team Directory", icon: Users },
    { href: "/profile", label: "My Profile", icon: UserCircle },
  ];

  if (user?.role === "admin") {
    navItems.push({ href: "/admin/users", label: "Manage Users", icon: Settings });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="hsl(var(--background))"/>
            <path d="M12 28L20 12L28 28M14 24H26" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold text-lg tracking-tight">Nexus</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${isActive ? "bg-secondary/50 font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={clerkUser?.imageUrl} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {clerkUser?.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {isLoading ? "Loading..." : (clerkUser?.firstName || clerkUser?.primaryEmailAddress?.emailAddress)}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {user?.role || "User"}
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground gap-3"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-background/50">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
