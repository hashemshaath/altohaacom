import { lazy, Suspense } from "react";
import { LiveChatWidget } from "@/components/crm/LiveChatWidget";
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
import NotFound from "./pages/NotFound";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Community = lazy(() => import("./pages/Community"));
const Competitions = lazy(() => import("./pages/Competitions"));
const CompetitionDetail = lazy(() => import("./pages/CompetitionDetail"));
const CreateCompetition = lazy(() => import("./pages/CreateCompetition"));
const EditCompetition = lazy(() => import("./pages/EditCompetition"));
const CompetitionResults = lazy(() => import("./pages/CompetitionResults"));
const EvaluationCenter = lazy(() => import("./pages/admin/EvaluationCenter"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const Search = lazy(() => import("./pages/Search"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const News = lazy(() => import("./pages/News"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Messages = lazy(() => import("./pages/Messages"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SponsorsLanding = lazy(() => import("./pages/landing/SponsorsLanding"));
const OrganizersLanding = lazy(() => import("./pages/landing/OrganizersLanding"));
const Install = lazy(() => import("./pages/Install"));
const Verify = lazy(() => import("./pages/Verify"));
const KnowledgePortal = lazy(() => import("./pages/KnowledgePortal"));
const Masterclasses = lazy(() => import("./pages/Masterclasses"));
const MasterclassDetail = lazy(() => import("./pages/MasterclassDetail"));
const Exhibitions = lazy(() => import("./pages/Exhibitions"));
const ExhibitionDetail = lazy(() => import("./pages/ExhibitionDetail"));
const CreateExhibition = lazy(() => import("./pages/CreateExhibition"));
const EditExhibition = lazy(() => import("./pages/EditExhibition"));
const Entities = lazy(() => import("./pages/Entities"));
const EntityDetail = lazy(() => import("./pages/EntityDetail"));
const Shop = lazy(() => import("./pages/Shop"));
const ShopProduct = lazy(() => import("./pages/ShopProduct"));
const ShopOrders = lazy(() => import("./pages/ShopOrders"));
const ShopMyProducts = lazy(() => import("./pages/ShopMyProducts"));
const Tastings = lazy(() => import("./pages/Tastings"));
const CreateTasting = lazy(() => import("./pages/CreateTasting"));
const TastingDetail = lazy(() => import("./pages/TastingDetail"));
const RegisterCompany = lazy(() => import("./pages/RegisterCompany"));
const Mentorship = lazy(() => import("./pages/Mentorship"));
const MentorshipDetail = lazy(() => import("./pages/MentorshipDetail"));
const MentorApply = lazy(() => import("./pages/MentorApply"));
const MentorshipMatchPage = lazy(() => import("./pages/MentorshipMatch"));
const Recipes = lazy(() => import("./pages/Recipes"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const Establishments = lazy(() => import("./pages/Establishments"));
const EstablishmentDetail = lazy(() => import("./pages/EstablishmentDetail"));

// Admin pages
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const RoleManagement = lazy(() => import("./pages/admin/RoleManagement"));
const MembershipManagement = lazy(() => import("./pages/admin/MembershipManagement"));
const ContentModeration = lazy(() => import("./pages/admin/ContentModeration"));
const AuditLog = lazy(() => import("./pages/admin/AuditLog"));
const LeadManagement = lazy(() => import("./pages/admin/LeadManagement"));
const CompetitionsAdmin = lazy(() => import("./pages/admin/CompetitionsAdmin"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const IntegrationsAdmin = lazy(() => import("./pages/admin/IntegrationsAdmin"));
const AIConfigAdmin = lazy(() => import("./pages/admin/AIConfigAdmin"));
const ArticlesAdmin = lazy(() => import("./pages/admin/ArticlesAdmin"));
const ThemeAdmin = lazy(() => import("./pages/admin/ThemeAdmin"));
const ComponentsAdmin = lazy(() => import("./pages/admin/ComponentsAdmin"));
const MediaAdmin = lazy(() => import("./pages/admin/MediaAdmin"));
const NotificationsAdmin = lazy(() => import("./pages/admin/NotificationsAdmin"));
const LocalizationAdmin = lazy(() => import("./pages/admin/LocalizationAdmin"));
const DatabaseAdmin = lazy(() => import("./pages/admin/DatabaseAdmin"));
const CertificatesAdmin = lazy(() => import("./pages/admin/CertificatesAdmin"));
const CompaniesAdmin = lazy(() => import("./pages/admin/CompaniesAdmin"));
const CommunicationsAdmin = lazy(() => import("./pages/admin/CommunicationsAdmin"));
const OrdersAdmin = lazy(() => import("./pages/admin/OrdersAdmin"));
const InvoicesAdmin = lazy(() => import("./pages/admin/InvoicesAdmin"));
const KnowledgeAdmin = lazy(() => import("./pages/admin/KnowledgeAdmin"));
const SponsorsAdmin = lazy(() => import("./pages/admin/CompaniesAdmin"));
const QRCodesAdmin = lazy(() => import("./pages/admin/QRCodesAdmin"));
const MasterclassesAdmin = lazy(() => import("./pages/admin/MasterclassesAdmin"));
const AnalyticsDashboard = lazy(() => import("./pages/admin/AnalyticsDashboard"));
const ExhibitionsAdmin = lazy(() => import("./pages/admin/ExhibitionsAdmin"));
const EntitiesAdmin = lazy(() => import("./pages/admin/EntitiesAdmin"));
const JudgesAdmin = lazy(() => import("./pages/admin/JudgesAdmin"));
const CompanyRolesAdmin = lazy(() => import("./pages/admin/CompaniesAdmin"));
const CountriesAdmin = lazy(() => import("./pages/admin/CountriesAdmin"));
const TastingsAdmin = lazy(() => import("./pages/admin/TastingsAdmin"));
const CommunicationTemplatesAdmin = lazy(() => import("./pages/admin/CommunicationTemplatesAdmin"));
const MentorshipAdmin = lazy(() => import("./pages/admin/MentorshipAdmin"));
const EstablishmentsAdmin = lazy(() => import("./pages/admin/EstablishmentsAdmin"));
const VerificationAdmin = lazy(() => import("./pages/admin/VerificationAdmin"));
const SupportTicketsAdmin = lazy(() => import("./pages/admin/SupportTicketsAdmin"));
const AudienceSegments = lazy(() => import("./pages/admin/AudienceSegments"));
const LiveChatAdmin = lazy(() => import("./pages/admin/LiveChatAdmin"));
const CRMDashboard = lazy(() => import("./pages/admin/CRMDashboard"));
const SupportTickets = lazy(() => import("./pages/SupportTickets"));

// Company Portal Pages
const CompanyPortalLayout = lazy(() => import("./pages/CompanyPortal"));
const CompanyDashboard = lazy(() => import("./pages/company/CompanyDashboard"));
const CompanyProfile = lazy(() => import("./pages/company/CompanyProfile"));
const CompanyTeam = lazy(() => import("./pages/company/CompanyTeam"));
const CompanyOrders = lazy(() => import("./pages/company/CompanyOrders"));
const CompanyInvitations = lazy(() => import("./pages/company/CompanyInvitations"));
const CompanyTransactions = lazy(() => import("./pages/company/CompanyTransactions"));
const CompanyEvaluations = lazy(() => import("./pages/company/CompanyEvaluations"));
const CompanyStatements = lazy(() => import("./pages/company/CompanyStatements"));
const CompanyMedia = lazy(() => import("./pages/company/CompanyMedia"));
const CompanyCommunications = lazy(() => import("./pages/company/CompanyCommunications"));
const CompanyBranches = lazy(() => import("./pages/company/CompanyBranches"));
const CompanyDrivers = lazy(() => import("./pages/company/CompanyDrivers"));
const CompanyWorkingHours = lazy(() => import("./pages/company/CompanyWorkingHours"));
const CompanySettings = lazy(() => import("./pages/company/CompanySettings"));
const CompanyInvoices = lazy(() => import("./pages/company/CompanyInvoices"));
const CompanyCatalog = lazy(() => import("./pages/company/CompanyCatalog"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes default stale time
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
            <LiveChatWidget />
            <BrowserRouter>
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <Routes>
                {/* LiveChatWidget renders globally for logged-in users */}
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
                {/* Judging merged into tasting sessions */}
                <Route path="/knowledge" element={<ProtectedRoute><KnowledgePortal /></ProtectedRoute>} />
                <Route path="/notification-preferences" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
                <Route path="/search" element={<Search />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:slug" element={<ArticleDetail />} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute><SupportTickets /></ProtectedRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/sponsors" element={<SponsorsLanding />} />
                <Route path="/for-organizers" element={<OrganizersLanding />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/masterclasses" element={<Masterclasses />} />
                <Route path="/masterclasses/:id" element={<MasterclassDetail />} />
                <Route path="/install" element={<Install />} />
                <Route path="/exhibitions" element={<Exhibitions />} />
                <Route path="/exhibitions/create" element={<ProtectedRoute><CreateExhibition /></ProtectedRoute>} />
                <Route path="/exhibitions/:slug" element={<ExhibitionDetail />} />
                <Route path="/exhibitions/:slug/edit" element={<ProtectedRoute><EditExhibition /></ProtectedRoute>} />
                <Route path="/entities" element={<Entities />} />
                <Route path="/entities/:slug" element={<EntityDetail />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:id" element={<ShopProduct />} />
                <Route path="/shop/orders" element={<ProtectedRoute><ShopOrders /></ProtectedRoute>} />
                <Route path="/shop/my-products" element={<ProtectedRoute><ShopMyProducts /></ProtectedRoute>} />
                <Route path="/tastings" element={<Tastings />} />
                <Route path="/tastings/create" element={<ProtectedRoute><CreateTasting /></ProtectedRoute>} />
                <Route path="/tastings/:id" element={<TastingDetail />} />
                <Route path="/register-company" element={<ProtectedRoute><RegisterCompany /></ProtectedRoute>} />
                <Route path="/mentorship" element={<Mentorship />} />
                <Route path="/mentorship/:id" element={<MentorshipDetail />} />
                <Route path="/mentorship/apply" element={<ProtectedRoute><MentorApply /></ProtectedRoute>} />
                <Route path="/mentorship/match/:id" element={<ProtectedRoute><MentorshipMatchPage /></ProtectedRoute>} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/recipes/:slug" element={<RecipeDetail />} />
                <Route path="/establishments" element={<Establishments />} />
                <Route path="/establishments/:id" element={<EstablishmentDetail />} />
                
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
                   <Route path="invoices" element={<InvoicesAdmin />} />
                  <Route path="knowledge" element={<KnowledgeAdmin />} />
                  <Route path="sponsors" element={<CompaniesAdmin />} />
                  <Route path="masterclasses" element={<MasterclassesAdmin />} />
                  <Route path="analytics" element={<AnalyticsDashboard />} />
                  <Route path="exhibitions" element={<ExhibitionsAdmin />} />
                  <Route path="qr-codes" element={<QRCodesAdmin />} />
                  <Route path="entities" element={<EntitiesAdmin />} />
                   <Route path="judges" element={<JudgesAdmin />} />
                   <Route path="evaluation" element={<EvaluationCenter />} />
                   <Route path="communications" element={<CommunicationsAdmin />} />
                   <Route path="company-roles" element={<CompaniesAdmin />} />
                   <Route path="countries" element={<CountriesAdmin />} />
                   <Route path="templates" element={<CommunicationTemplatesAdmin />} />
                   <Route path="mentorship" element={<MentorshipAdmin />} />
                   <Route path="establishments" element={<EstablishmentsAdmin />} />
                   <Route path="verification" element={<VerificationAdmin />} />
                   <Route path="support-tickets" element={<SupportTicketsAdmin />} />
                   <Route path="audience-segments" element={<AudienceSegments />} />
                   <Route path="live-chat" element={<LiveChatAdmin />} />
                   <Route path="crm" element={<CRMDashboard />} />
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
                  <Route path="invoices" element={<CompanyInvoices />} />
                  <Route path="catalog" element={<CompanyCatalog />} />
                </Route>

                {/* Public profile URL: altohaa.com/username or /profile/username */}
                <Route path="/profile/:username" element={<PublicProfile />} />
                <Route path="/:username" element={<PublicProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
