import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SpriteSettingsProvider } from "@/providers/SpriteSettingsProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TierProtectedRoute } from "@/components/TierProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { usePageTracking } from "@/hooks/usePageTracking";

function PageTracker() {
  usePageTracking();
  return null;
}

import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
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
import ExperimentalPage from "./pages/ExperimentalPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import MarketplacePage from "./pages/MarketplacePage";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccessPage";
import InstallPage from "./pages/InstallPage";
import SLMLabPage from "./pages/SLMLabPage";
import WhitePaperPage from "./pages/WhitePaperPage";
import CapturePage from "./pages/CapturePage";
import SwipeReviewPage from "./pages/SwipeReviewPage";
import OnDeviceTemplatesPage from "./pages/OnDeviceTemplatesPage";
import DeployPipelinePage from "./pages/DeployPipelinePage";
import PhoneDeployGuidePage from "./pages/PhoneDeployGuidePage";
import InferencePlaygroundPage from "./pages/InferencePlaygroundPage";
import DeviceConsolePage from "./pages/DeviceConsolePage";
import SelfHostPage from "./pages/SelfHostPage";
import TrainingProgressPage from "./pages/TrainingProgressPage";
import ImageForgePage from "./pages/ImageForgePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SpriteSettingsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/subscription-success" element={<SubscriptionSuccessPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/install" element={<InstallPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />

              {/* Protected app routes */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectPage />} />
                <Route path="/modules" element={<ModulesPage />} />
                <Route path="/modules/:id" element={<ModuleBuilderPage />} />
                <Route path="/stacks" element={<StacksPage />} />
                <Route path="/stacks/:id" element={<StackCanvasPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/lab" element={<LabPage />} />
                <Route path="/lab/slicer" element={<SlicerLabPage />} />
                <Route path="/build-ai" element={<AIBuilderPage />} />
                <Route path="/solvers" element={<SolverLibraryPage />} />
                <Route path="/engine" element={<GameEnginePage />} />
                <Route path="/models" element={<ModelZooPage />} />
                <Route path="/pipelines" element={<DataPipelinesPage />} />
                <Route path="/signals" element={<SignalLabPage />} />
                <Route path="/robotics" element={<TierProtectedRoute allowedTiers={["pro"]} requiredTier="Pro" featureName="Robotics Controllers"><RoboticsPage /></TierProtectedRoute>} />
                <Route path="/forge-ai" element={<ForgeAIPage />} />
                <Route path="/edge-training" element={<TierProtectedRoute allowedTiers={["pro"]} requiredTier="Pro" featureName="Edge Training"><EdgeTrainingPage /></TierProtectedRoute>} />
                <Route path="/export" element={<TierProtectedRoute allowedTiers={["builder", "pro"]} requiredTier="Builder" featureName="Export Studio"><ExportStudioPage /></TierProtectedRoute>} />
                <Route path="/experimental" element={<ExperimentalPage />} />
                <Route path="/slm-lab" element={<SLMLabPage />} />
                <Route path="/white-paper" element={<WhitePaperPage />} />
                <Route path="/capture" element={<CapturePage />} />
                <Route path="/review" element={<SwipeReviewPage />} />
                <Route path="/on-device" element={<OnDeviceTemplatesPage />} />
                <Route path="/deploy" element={<DeployPipelinePage />} />
                <Route path="/deploy/phone" element={<PhoneDeployGuidePage />} />
                <Route path="/inference" element={<InferencePlaygroundPage />} />
                <Route path="/console" element={<DeviceConsolePage />} />
                <Route path="/self-host" element={<SelfHostPage />} />
                <Route path="/image-forge" element={<ImageForgePage />} />
                <Route path="/training" element={<TrainingProgressPage />} />
                <Route path="/runs" element={<RunsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
          <CookieConsentBanner />
        </BrowserRouter>
      </TooltipProvider>
      </SpriteSettingsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
