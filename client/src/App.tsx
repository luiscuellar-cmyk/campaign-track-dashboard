import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import OverviewPage from "@/pages/OverviewPage";
import DataEntryPage from "@/pages/DataEntryPage";
import ChartsPage from "@/pages/ChartsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";
import { canAccess } from "@/lib/auth";
import type { Role } from "@/lib/auth";

function Protected({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const { user } = useAuth();
  if (!user) return null;
  if (!canAccess(user.role as Role, path)) return <Redirect to="/" />;
  return <Component />;
}

function AppRoutes() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;

  return (
    <Router hook={useHashLocation}>
      <DashboardLayout>
        <Switch>
          <Route path="/" component={OverviewPage} />
          <Route path="/datos">        <Protected path="/datos" component={DataEntryPage} /> </Route>
          <Route path="/graficas" component={ChartsPage} />
          <Route path="/configuracion"><Protected path="/configuracion" component={SettingsPage} />  </Route>
          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}