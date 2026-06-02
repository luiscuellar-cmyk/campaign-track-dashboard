import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import DashboardLayout from "@/components/DashboardLayout";
import OverviewPage from "@/pages/OverviewPage";
import DataEntryPage from "@/pages/DataEntryPage";
import ChartsPage from "@/pages/ChartsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router hook={useHashLocation}>
          <DashboardLayout>
            <Switch>
              <Route path="/" component={OverviewPage} />
              <Route path="/data" component={DataEntryPage} />
              <Route path="/charts" component={ChartsPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
