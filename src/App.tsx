import { lazy, Suspense } from "react";
import ChunkErrorBoundary from "@/components/ChunkErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";

import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TierProtectedRoute } from "@/components/TierProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

// Eagerly load the landing page (critical path)
import LandingPage from "./pages/LandingPage";

// Lazy-load all other pages for code splitting
const PricingPage = lazy(() => import("./pages/PricingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectPage = lazy(() => import("./pages/ProjectPage"));
const ModulesPage = lazy(() => import("./pages/ModulesPage"));
const ModuleBuilderPage = lazy(() => import("./pages/ModuleBuilderPage"));
const StacksPage = lazy(() => import("./pages/StacksPage"));
const StackCanvasPage = lazy(() => import("./pages/StackCanvasPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const LabPage = lazy(() => import("./pages/LabPage"));
const SlicerLabPage = lazy(() => import("./pages/SlicerLabPage"));
const AIBuilderPage = lazy(() => import("./pages/AIBuilderPage"));
const RunsPage = lazy(() => import("./pages/RunsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const SolverLibraryPage = lazy(() => import("./pages/SolverLibraryPage"));
const GameEnginePage = lazy(() => import("./pages/GameEnginePage"));
const ModelZooPage = lazy(() => import("./pages/ModelZooPage"));
const DataPipelinesPage = lazy(() => import("./pages/DataPipelinesPage"));
const SignalLabPage = lazy(() => import("./pages/SignalLabPage"));
const RoboticsPage = lazy(() => import("./pages/RoboticsPage"));
const ForgeAIPage = lazy(() => import("./pages/ForgeAIPage"));
const EdgeTrainingPage = lazy(() => import("./pages/EdgeTrainingPage"));
const ExportStudioPage = lazy(() => import("./pages/ExportStudioPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
const SubscriptionSuccessPage = lazy(() => import("./pages/SubscriptionSuccessPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const SLMLabPage = lazy(() => import("./pages/SLMLabPage"));
const WhitePaperPage = lazy(() => import("./pages/WhitePaperPage"));
const CapturePage = lazy(() => import("./pages/CapturePage"));
const SwipeReviewPage = lazy(() => import("./pages/SwipeReviewPage"));
const OnDeviceTemplatesPage = lazy(() => import("./pages/OnDeviceTemplatesPage"));
const DeployPipelinePage = lazy(() => import("./pages/DeployPipelinePage"));
const PhoneDeployGuidePage = lazy(() => import("./pages/PhoneDeployGuidePage"));
const InferencePlaygroundPage = lazy(() => import("./pages/InferencePlaygroundPage"));
const DeviceConsolePage = lazy(() => import("./pages/DeviceConsolePage"));
const SelfHostPage = lazy(() => import("./pages/SelfHostPage"));
const TrainingProgressPage = lazy(() => import("./pages/TrainingProgressPage"));
const ImageForgePage = lazy(() => import("./pages/ImageForgePage"));
const DemoModuleBuilderPage = lazy(() => import("./pages/DemoModuleBuilderPage"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const HarvestInboxPage = lazy(() => import("./pages/HarvestInboxPage"));
const AIHubPage = lazy(() => import("./pages/AIHubPage"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagementPage"));
const SystemHealthPage = lazy(() => import("./pages/admin/SystemHealthPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            
            <ChunkErrorBoundary>
            <Suspense fallback={null}>
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
                <Route path="/demo/module-builder" element={<DemoModuleBuilderPage />} />
                <Route path="/unsubscribe" element={<UnsubscribePage />} />
                <Route path="/slm-lab" element={<AppLayout />}>
                  <Route index element={<SLMLabPage />} />
                </Route>

                {/* Protected app routes */}
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/ai-hub" element={<AIHubPage />} />
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
                  <Route path="/harvest" element={<HarvestInboxPage />} />
                  <Route path="/training" element={<TrainingProgressPage />} />
                  <Route path="/runs" element={<RunsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/users" element={<UserManagementPage />} />
                  <Route path="/admin/health" element={<SystemHealthPage />} />
                  <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                  <Route path="/account" element={<AccountPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </ChunkErrorBoundary>
          </AuthProvider>
          <CookieConsentBanner />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
