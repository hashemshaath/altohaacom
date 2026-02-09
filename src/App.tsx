import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import Competitions from "./pages/Competitions";
import CompetitionDetail from "./pages/CompetitionDetail";
import CreateCompetition from "./pages/CreateCompetition";
import EditCompetition from "./pages/EditCompetition";
import CompetitionResults from "./pages/CompetitionResults";
import Judging from "./pages/Judging";
import NotificationPreferences from "./pages/NotificationPreferences";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";
import HelpCenter from "./pages/HelpCenter";
import News from "./pages/News";
import ArticleDetail from "./pages/ArticleDetail";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Onboarding from "./pages/Onboarding";
import SponsorsLanding from "./pages/landing/SponsorsLanding";
import OrganizersLanding from "./pages/landing/OrganizersLanding";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import MembershipManagement from "./pages/admin/MembershipManagement";
import ContentModeration from "./pages/admin/ContentModeration";
import AuditLog from "./pages/admin/AuditLog";
import LeadManagement from "./pages/admin/LeadManagement";
import CompetitionsAdmin from "./pages/admin/CompetitionsAdmin";
import SystemSettings from "./pages/admin/SystemSettings";
import IntegrationsAdmin from "./pages/admin/IntegrationsAdmin";
import AIConfigAdmin from "./pages/admin/AIConfigAdmin";
import ArticlesAdmin from "./pages/admin/ArticlesAdmin";
import ThemeAdmin from "./pages/admin/ThemeAdmin";
import ComponentsAdmin from "./pages/admin/ComponentsAdmin";
import MediaAdmin from "./pages/admin/MediaAdmin";
import NotificationsAdmin from "./pages/admin/NotificationsAdmin";
import LocalizationAdmin from "./pages/admin/LocalizationAdmin";
import DatabaseAdmin from "./pages/admin/DatabaseAdmin";
import CertificatesAdmin from "./pages/admin/CertificatesAdmin";
import CertificateVerify from "./pages/CertificateVerify";
import CompaniesAdmin from "./pages/admin/CompaniesAdmin";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import KnowledgeAdmin from "./pages/admin/KnowledgeAdmin";
import KnowledgePortal from "./pages/KnowledgePortal";

// Company Portal Pages
import CompanyPortalLayout from "./pages/CompanyPortal";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyProfile from "./pages/company/CompanyProfile";
import CompanyTeam from "./pages/company/CompanyTeam";
import CompanyOrders from "./pages/company/CompanyOrders";
import CompanyInvitations from "./pages/company/CompanyInvitations";
import CompanyTransactions from "./pages/company/CompanyTransactions";
import CompanyEvaluations from "./pages/company/CompanyEvaluations";
import CompanyStatements from "./pages/company/CompanyStatements";
import CompanyMedia from "./pages/company/CompanyMedia";
import CompanyCommunications from "./pages/company/CompanyCommunications";
import CompanyBranches from "./pages/company/CompanyBranches";
import CompanyDrivers from "./pages/company/CompanyDrivers";
import CompanyWorkingHours from "./pages/company/CompanyWorkingHours";
import CompanySettings from "./pages/company/CompanySettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                <Route path="/competitions" element={<Competitions />} />
                <Route path="/competitions/create" element={<ProtectedRoute><CreateCompetition /></ProtectedRoute>} />
                <Route path="/competitions/:id" element={<CompetitionDetail />} />
                <Route path="/competitions/:id/edit" element={<ProtectedRoute><EditCompetition /></ProtectedRoute>} />
                <Route path="/competitions/:id/results" element={<CompetitionResults />} />
                <Route path="/judging" element={<ProtectedRoute><Judging /></ProtectedRoute>} />
                <Route path="/knowledge" element={<ProtectedRoute><KnowledgePortal /></ProtectedRoute>} />
                <Route path="/notification-preferences" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
                <Route path="/search" element={<Search />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:slug" element={<ArticleDetail />} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/sponsors" element={<SponsorsLanding />} />
                <Route path="/for-organizers" element={<OrganizersLanding />} />
                <Route path="/verify" element={<CertificateVerify />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="leads" element={<LeadManagement />} />
                  <Route path="roles" element={<RoleManagement />} />
                  <Route path="memberships" element={<MembershipManagement />} />
                  <Route path="articles" element={<ArticlesAdmin />} />
                  <Route path="competitions" element={<CompetitionsAdmin />} />
                  <Route path="media" element={<MediaAdmin />} />
                  <Route path="moderation" element={<ContentModeration />} />
                  <Route path="integrations" element={<IntegrationsAdmin />} />
                  <Route path="ai" element={<AIConfigAdmin />} />
                  <Route path="theme" element={<ThemeAdmin />} />
                  <Route path="components" element={<ComponentsAdmin />} />
                  <Route path="settings" element={<SystemSettings />} />
                  <Route path="notifications" element={<NotificationsAdmin />} />
                  <Route path="localization" element={<LocalizationAdmin />} />
                  <Route path="audit" element={<AuditLog />} />
                  <Route path="database" element={<DatabaseAdmin />} />
                  <Route path="certificates" element={<CertificatesAdmin />} />
                  <Route path="companies" element={<CompaniesAdmin />} />
                   <Route path="orders" element={<OrdersAdmin />} />
                  <Route path="knowledge" element={<KnowledgeAdmin />} />
                </Route>

                {/* Company Portal Routes */}
                <Route path="/company" element={<ProtectedRoute><CompanyPortalLayout /></ProtectedRoute>}>
                  <Route index element={<CompanyDashboard />} />
                  <Route path="profile" element={<CompanyProfile />} />
                  <Route path="team" element={<CompanyTeam />} />
                  <Route path="orders" element={<CompanyOrders />} />
                  <Route path="invitations" element={<CompanyInvitations />} />
                  <Route path="communications" element={<CompanyCommunications />} />
                  <Route path="statements" element={<CompanyStatements />} />
                  <Route path="transactions" element={<CompanyTransactions />} />
                  <Route path="evaluations" element={<CompanyEvaluations />} />
                  <Route path="media" element={<CompanyMedia />} />
                  <Route path="branches" element={<CompanyBranches />} />
                  <Route path="drivers" element={<CompanyDrivers />} />
                  <Route path="working-hours" element={<CompanyWorkingHours />} />
                  <Route path="settings" element={<CompanySettings />} />
                </Route>

                {/* Public profile URL: altohaa.com/username */}
                <Route path="/:username" element={<PublicProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
