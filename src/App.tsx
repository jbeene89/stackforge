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
import AIBuilderPage from "./pages/AIBuilderPage";
import RunsPage from "./pages/RunsPage";
import AdminPage from "./pages/AdminPage";
import AccountPage from "./pages/AccountPage";
import SolverLibraryPage from "./pages/SolverLibraryPage";
import GameEnginePage from "./pages/GameEnginePage";
import ModelZooPage from "./pages/ModelZooPage";
import DataPipelinesPage from "./pages/DataPipelinesPage";
import SignalLabPage from "./pages/SignalLabPage";
import RoboticsPage from "./pages/RoboticsPage";
import ForgeAIPage from "./pages/ForgeAIPage";
import EdgeTrainingPage from "./pages/EdgeTrainingPage";
import ExportStudioPage from "./pages/ExportStudioPage";
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
              <Route path="/lab/slicer" element={<SlicerLabPage />} />
              <Route path="/build-ai" element={<AIBuilderPage />} />
              <Route path="/solvers" element={<SolverLibraryPage />} />
              <Route path="/engine" element={<GameEnginePage />} />
              <Route path="/models" element={<ModelZooPage />} />
              <Route path="/pipelines" element={<DataPipelinesPage />} />
              <Route path="/signals" element={<SignalLabPage />} />
              <Route path="/robotics" element={<RoboticsPage />} />
              <Route path="/forge-ai" element={<ForgeAIPage />} />
              <Route path="/edge-training" element={<EdgeTrainingPage />} />
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
