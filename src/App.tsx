import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";

import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectPage from "./pages/ProjectPage";
import ModulesPage from "./pages/ModulesPage";
import ModuleBuilderPage from "./pages/ModuleBuilderPage";
import StacksPage from "./pages/StacksPage";
import StackCanvasPage from "./pages/StackCanvasPage";
import TemplatesPage from "./pages/TemplatesPage";
import LabPage from "./pages/LabPage";
import SlicerLabPage from "./pages/SlicerLabPage";
import RunsPage from "./pages/RunsPage";
import AdminPage from "./pages/AdminPage";
import AccountPage from "./pages/AccountPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes — no sidebar */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* App routes — with sidebar layout */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectPage />} />
              <Route path="/modules" element={<ModulesPage />} />
              <Route path="/modules/:id" element={<ModuleBuilderPage />} />
              <Route path="/stacks" element={<StacksPage />} />
              <Route path="/stacks/:id" element={<StackCanvasPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/runs" element={<RunsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
