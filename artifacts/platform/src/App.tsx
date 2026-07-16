// Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { useEffect, useRef } from "react";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import { GuestLayout } from "@/components/GuestLayout";

// Page imports — authenticated
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Team from "@/pages/Team";
import TeamMember from "@/pages/TeamMember";
import Pipeline from "@/pages/Pipeline";
import KnowledgeGraph from "@/pages/KnowledgeGraph";
import Tests from "@/pages/Tests";
import AdminUsers from "@/pages/AdminUsers";

// Page imports — public / guest
import Landing from "@/pages/Landing";
import GuestDashboard from "@/pages/GuestDashboard";
import GuestGraph from "@/pages/GuestGraph";
import GuestTeam from "@/pages/GuestTeam";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(189, 94%, 43%)",
    colorForeground: "hsl(210, 40%, 98%)",
    colorMutedForeground: "hsl(215, 20%, 65%)",
    colorDanger: "hsl(0, 62%, 30%)",
    colorBackground: "hsl(222, 47%, 11%)",
    colorInput: "hsl(217, 33%, 17%)",
    colorInputForeground: "hsl(210, 40%, 98%)",
    colorNeutral: "hsl(217, 33%, 17%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-background border border-border rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-sm font-medium text-foreground",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-xs",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formFieldSuccessText: "text-primary",
    alertText: "text-foreground",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

/** Root: signed-in → /dashboard, signed-out → Landing page */
function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

/** Authenticated app — all routes that require sign-in */
function AuthenticatedApp() {
  return (
    <Layout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/pipeline" component={Pipeline} />
        <Route path="/knowledge-graph" component={KnowledgeGraph} />
        <Route path="/tests" component={Tests} />
        <Route path="/team" component={Team} />
        <Route path="/team/:userId" component={TeamMember} />
        <Route path="/profile" component={Profile} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

/** Guest explore routes — publicly accessible, no auth required */
function GuestApp() {
  return (
    <GuestLayout>
      <Switch>
        <Route path="/explore" component={GuestDashboard} />
        <Route path="/explore/graph" component={GuestGraph} />
        <Route path="/explore/team" component={GuestTeam} />
        <Route component={NotFound} />
      </Switch>
    </GuestLayout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Sign in to Synaptiq",
            subtitle: "Welcome back! Please sign in to continue",
          },
        },
        signUp: {
          start: {
            title: "Create your Synaptiq account",
            subtitle: "Get started today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          {/* Public routes */}
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />

          {/* Guest explore routes — no auth needed */}
          <Route path="/explore">
            <GuestApp />
          </Route>
          <Route path="/explore/:rest*">
            <GuestApp />
          </Route>

          {/* Authenticated routes */}
          <Route>
            <Show when="signed-in">
              <AuthenticatedApp />
            </Show>
            <Show when="signed-out">
              <Redirect to="/" />
            </Show>
          </Route>
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
