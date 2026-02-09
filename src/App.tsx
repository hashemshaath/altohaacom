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
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";
import HelpCenter from "./pages/HelpCenter";
import News from "./pages/News";
import Notifications from "./pages/Notifications";
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
                <Route path="/notification-preferences" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/news" element={<News />} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/sponsors" element={<SponsorsLanding />} />
                <Route path="/for-organizers" element={<OrganizersLanding />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="leads" element={<LeadManagement />} />
                  <Route path="roles" element={<RoleManagement />} />
                  <Route path="memberships" element={<MembershipManagement />} />
                  <Route path="moderation" element={<ContentModeration />} />
                  <Route path="audit" element={<AuditLog />} />
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
