import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import DashboardPage from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

function AuthRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AuthRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
