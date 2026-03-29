/**
 * App.tsx — Adventure Quest Chore Chart
 * ======================================
 * Design Philosophy: Adventure Quest — ADHD-friendly, bold, gamified
 * Routes: / (home), /dean, /emma, /parent
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ChildView from "./pages/ChildView";
import ParentDashboard from "./pages/ParentDashboard";
import { AppProvider } from "./contexts/AppContext";
import { useEffect } from "react";
import { initFirebase, ensureChildData, ensureSettings } from "./lib/firebase";

function AppInit() {
  useEffect(() => {
    const { isDemo } = initFirebase();
    ensureSettings();
    ensureChildData("dean");
    ensureChildData("emma");
  }, []);
  return null;
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dean" component={() => <ChildView childId="dean" />} />
      <Route path="/emma" component={() => <ChildView childId="emma" />} />
      <Route path="/parent" component={ParentDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppProvider>
            <AppInit />
            <Toaster position="top-center" richColors />
            <Router />
          </AppProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
