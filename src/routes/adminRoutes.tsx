import { lazy } from "react";
import { Route } from "react-router-dom";
import { AdminRoute } from "@/components/AdminRoute";

const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const RoleManagement = lazy(() => import("@/pages/admin/RoleManagement"));
const MembershipManagement = lazy(() => import("@/pages/admin/MembershipManagement"));
const ContentModeration = lazy(() => import("@/pages/admin/ContentModeration"));
const AuditLog = lazy(() => import("@/pages/admin/AuditLog"));
const LeadManagement = lazy(() => import("@/pages/admin/LeadManagement"));
const CompetitionsAdmin = lazy(() => import("@/pages/admin/CompetitionsAdmin"));
const SystemSettings = lazy(() => import("@/pages/admin/SystemSettings"));
const IntegrationsAdmin = lazy(() => import("@/pages/admin/IntegrationsAdmin"));
const AIConfigAdmin = lazy(() => import("@/pages/admin/AIConfigAdmin"));
const ArticlesAdmin = lazy(() => import("@/pages/admin/ArticlesAdmin"));
const MediaAdmin = lazy(() => import("@/pages/admin/MediaAdmin"));
const NotificationsAdmin = lazy(() => import("@/pages/admin/NotificationsAdmin"));
const LocalizationAdmin = lazy(() => import("@/pages/admin/LocalizationAdmin"));
const DatabaseAdmin = lazy(() => import("@/pages/admin/DatabaseAdmin"));
const CertificatesAdmin = lazy(() => import("@/pages/admin/CertificatesAdmin"));
const CompaniesAdmin = lazy(() => import("@/pages/admin/CompaniesAdmin"));
const CommunicationsAdmin = lazy(() => import("@/pages/admin/CommunicationsAdmin"));
const OrdersAdmin = lazy(() => import("@/pages/admin/OrdersAdmin"));
const InvoicesAdmin = lazy(() => import("@/pages/admin/InvoicesAdmin"));
const KnowledgeAdmin = lazy(() => import("@/pages/admin/KnowledgeAdmin"));
const QRCodesAdmin = lazy(() => import("@/pages/admin/QRCodesAdmin"));
const MasterclassesAdmin = lazy(() => import("@/pages/admin/MasterclassesAdmin"));
const AnalyticsDashboard = lazy(() => import("@/pages/admin/AnalyticsDashboard"));
const ExhibitionsAdmin = lazy(() => import("@/pages/admin/ExhibitionsAdmin"));
const EvaluationCenter = lazy(() => import("@/pages/admin/EvaluationCenter"));
const CountriesAdmin = lazy(() => import("@/pages/admin/CountriesAdmin"));
const ChefsTableAdmin = lazy(() => import("@/pages/admin/ChefsTableAdmin"));
const CommunicationTemplatesAdmin = lazy(() => import("@/pages/admin/CommunicationTemplatesAdmin"));
const MentorshipAdmin = lazy(() => import("@/pages/admin/MentorshipAdmin"));
const EstablishmentsAdmin = lazy(() => import("@/pages/admin/EstablishmentsAdmin"));
const VerificationAdmin = lazy(() => import("@/pages/admin/VerificationAdmin"));
const SupportTicketsAdmin = lazy(() => import("@/pages/admin/SupportTicketsAdmin"));
const AudienceSegments = lazy(() => import("@/pages/admin/AudienceSegments"));
const LiveChatAdmin = lazy(() => import("@/pages/admin/LiveChatAdmin"));
const CRMDashboard = lazy(() => import("@/pages/admin/CRMDashboard"));
const CRMCustomerDetail = lazy(() => import("@/pages/admin/CRMCustomerDetail"));
const AdvertisingAdmin = lazy(() => import("@/pages/admin/AdvertisingAdmin"));
const MarketingAutomationAdmin = lazy(() => import("@/pages/admin/MarketingAutomationAdmin"));
const CostCenterAdmin = lazy(() => import("@/pages/admin/CostCenterAdmin"));
const ChefScheduleAdmin = lazy(() => import("@/pages/admin/ChefScheduleAdmin"));
const GlobalEventsAdmin = lazy(() => import("@/pages/admin/GlobalEventsAdmin"));
const SmartImportAdmin = lazy(() => import("@/pages/admin/SmartImportAdmin"));
const LoyaltyAdmin = lazy(() => import("@/pages/admin/LoyaltyAdmin"));
const SecurityAdmin = lazy(() => import("@/pages/admin/SecurityAdmin"));
const OrganizersAdmin = lazy(() => import("@/pages/admin/OrganizersAdmin"));
const DesignIdentityAdmin = lazy(() => import("@/pages/admin/DesignIdentityAdmin"));
const HeroSlidesAdmin = lazy(() => import("@/pages/admin/HeroSlidesAdmin"));
const DeduplicationAdmin = lazy(() => import("@/pages/admin/DeduplicationAdmin"));

const BrandIdentityPage = lazy(() => import("@/pages/admin/design/BrandIdentityPage"));

const HeaderFooterPage = lazy(() => import("@/pages/admin/design/HeaderFooterPage"));
const HomepageDesignPage = lazy(() => import("@/pages/admin/design/HomepageDesignPage"));
const CoversThemesPage = lazy(() => import("@/pages/admin/design/CoversThemesPage"));

const LayoutSpacingPage = lazy(() => import("@/pages/admin/design/LayoutSpacingPage"));
const CustomCSSPage = lazy(() => import("@/pages/admin/design/CustomCSSPage"));

export const adminRoutes = (
  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
    {/* Dashboard */}
    <Route index element={<AdminDashboard />} />
    <Route path="analytics" element={<AnalyticsDashboard />} />

    {/* Users & CRM */}
    <Route path="users" element={<UserManagement />} />
    <Route path="users/:userId" element={<CRMCustomerDetail />} />
    <Route path="roles" element={<RoleManagement />} />
    <Route path="verification" element={<VerificationAdmin />} />
    <Route path="memberships" element={<MembershipManagement />} />
    <Route path="loyalty" element={<LoyaltyAdmin />} />
    <Route path="companies" element={<CompaniesAdmin />} />
    <Route path="establishments" element={<EstablishmentsAdmin />} />
    <Route path="crm" element={<CRMDashboard />} />
    <Route path="leads" element={<LeadManagement />} />
    <Route path="audience-segments" element={<AudienceSegments />} />

    {/* Competitions & Events */}
    <Route path="organizers" element={<OrganizersAdmin />} />
    <Route path="competitions" element={<CompetitionsAdmin />} />
    <Route path="evaluation" element={<EvaluationCenter />} />
    <Route path="certificates" element={<CertificatesAdmin />} />
    <Route path="exhibitions" element={<ExhibitionsAdmin />} />
    <Route path="global-events" element={<GlobalEventsAdmin />} />
    <Route path="chefs-table" element={<ChefsTableAdmin />} />
    <Route path="chef-schedule" element={<ChefScheduleAdmin />} />

    {/* Content & Media */}
    <Route path="articles" element={<ArticlesAdmin />} />
    <Route path="knowledge" element={<KnowledgeAdmin />} />
    <Route path="masterclasses" element={<MasterclassesAdmin />} />
    <Route path="mentorship" element={<MentorshipAdmin />} />
    <Route path="media" element={<MediaAdmin />} />
    <Route path="qr-codes" element={<QRCodesAdmin />} />
    <Route path="moderation" element={<ContentModeration />} />
    <Route path="advertising" element={<AdvertisingAdmin />} />

    {/* Finance */}
    <Route path="orders" element={<OrdersAdmin />} />
    <Route path="invoices" element={<InvoicesAdmin />} />
    <Route path="cost-center" element={<CostCenterAdmin />} />

    {/* Communications */}
    <Route path="support-tickets" element={<SupportTicketsAdmin />} />
    <Route path="live-chat" element={<LiveChatAdmin />} />
    <Route path="communications" element={<CommunicationsAdmin />} />
    <Route path="templates" element={<CommunicationTemplatesAdmin />} />
    <Route path="notifications" element={<NotificationsAdmin />} />
    <Route path="marketing-automation" element={<MarketingAutomationAdmin />} />

    {/* Design & Identity */}
    <Route path="design" element={<DesignIdentityAdmin />} />
    <Route path="design/brand-identity" element={<BrandIdentityPage />} />
    <Route path="hero-slides" element={<HeroSlidesAdmin />} />
    
    
    <Route path="design/header-footer" element={<HeaderFooterPage />} />
    <Route path="design/homepage" element={<HomepageDesignPage />} />
    <Route path="design/covers" element={<CoversThemesPage />} />
    
    <Route path="design/layout" element={<LayoutSpacingPage />} />
    <Route path="design/custom-css" element={<CustomCSSPage />} />

    {/* System */}
    <Route path="settings" element={<SystemSettings />} />
    <Route path="security" element={<SecurityAdmin />} />
    <Route path="localization" element={<LocalizationAdmin />} />
    <Route path="countries" element={<CountriesAdmin />} />
    <Route path="integrations" element={<IntegrationsAdmin />} />
    <Route path="smart-import" element={<SmartImportAdmin />} />
    <Route path="ai" element={<AIConfigAdmin />} />
    <Route path="audit" element={<AuditLog />} />
    <Route path="database" element={<DatabaseAdmin />} />
    <Route path="deduplication" element={<DeduplicationAdmin />} />
  </Route>
);
