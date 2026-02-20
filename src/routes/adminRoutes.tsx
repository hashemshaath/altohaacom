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

const ComponentsAdmin = lazy(() => import("@/pages/admin/ComponentsAdmin"));
const MediaAdmin = lazy(() => import("@/pages/admin/MediaAdmin"));
const NotificationsAdmin = lazy(() => import("@/pages/admin/NotificationsAdmin"));
const LocalizationAdmin = lazy(() => import("@/pages/admin/LocalizationAdmin"));
const DatabaseAdmin = lazy(() => import("@/pages/admin/DatabaseAdmin"));
const CertificatesAdmin = lazy(() => import("@/pages/admin/CertificatesAdmin"));
const CompaniesAdmin = lazy(() => import("@/pages/admin/CompaniesAdmin"));
const SponsorsAdmin = lazy(() => import("@/pages/admin/SponsorsAdmin"));
const CompanyRolesAdmin = lazy(() => import("@/pages/admin/CompanyRolesAdmin"));
const CommunicationsAdmin = lazy(() => import("@/pages/admin/CommunicationsAdmin"));
const OrdersAdmin = lazy(() => import("@/pages/admin/OrdersAdmin"));
const InvoicesAdmin = lazy(() => import("@/pages/admin/InvoicesAdmin"));
const InvoiceCustomization = lazy(() => import("@/pages/admin/InvoiceCustomization"));
const KnowledgeAdmin = lazy(() => import("@/pages/admin/KnowledgeAdmin"));
const QRCodesAdmin = lazy(() => import("@/pages/admin/QRCodesAdmin"));
const MasterclassesAdmin = lazy(() => import("@/pages/admin/MasterclassesAdmin"));
const AnalyticsDashboard = lazy(() => import("@/pages/admin/AnalyticsDashboard"));
const ExhibitionsAdmin = lazy(() => import("@/pages/admin/ExhibitionsAdmin"));
const EntitiesAdmin = lazy(() => import("@/pages/admin/EntitiesAdmin"));
const JudgesAdmin = lazy(() => import("@/pages/admin/JudgesAdmin"));
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
const TranslationSEOAdmin = lazy(() => import("@/pages/admin/TranslationSEOAdmin"));
const OrderCenterAdmin = lazy(() => import("@/pages/admin/OrderCenterAdmin"));
const ModerationCenter = lazy(() => import("@/pages/admin/ModerationCenter"));
const MarketingAutomationAdmin = lazy(() => import("@/pages/admin/MarketingAutomationAdmin"));
const CostCenterAdmin = lazy(() => import("@/pages/admin/CostCenterAdmin"));
const ChefScheduleAdmin = lazy(() => import("@/pages/admin/ChefScheduleAdmin"));
const GlobalEventsAdmin = lazy(() => import("@/pages/admin/GlobalEventsAdmin"));
const HeroSlidesAdmin = lazy(() => import("@/pages/admin/HeroSlidesAdmin"));
const HomepageSectionsAdmin = lazy(() => import("@/pages/admin/HomepageSectionsAdmin"));

export const adminRoutes = (
  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
    <Route index element={<AdminDashboard />} />
    <Route path="users/:userId" element={<CRMCustomerDetail />} />
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
    
    <Route path="components" element={<ComponentsAdmin />} />
    <Route path="settings" element={<SystemSettings />} />
    <Route path="notifications" element={<NotificationsAdmin />} />
    <Route path="localization" element={<LocalizationAdmin />} />
    <Route path="audit" element={<AuditLog />} />
    <Route path="database" element={<DatabaseAdmin />} />
    <Route path="certificates" element={<CertificatesAdmin />} />
    <Route path="companies" element={<CompaniesAdmin />} />
    <Route path="sponsors" element={<SponsorsAdmin />} />
    <Route path="company-roles" element={<CompanyRolesAdmin />} />
    <Route path="orders" element={<OrdersAdmin />} />
    <Route path="invoices" element={<InvoicesAdmin />} />
    <Route path="invoice-customization" element={<InvoiceCustomization />} />
    <Route path="knowledge" element={<KnowledgeAdmin />} />
    <Route path="masterclasses" element={<MasterclassesAdmin />} />
    <Route path="analytics" element={<AnalyticsDashboard />} />
    <Route path="exhibitions" element={<ExhibitionsAdmin />} />
    <Route path="qr-codes" element={<QRCodesAdmin />} />
    <Route path="entities" element={<EntitiesAdmin />} />
    <Route path="judges" element={<JudgesAdmin />} />
    <Route path="evaluation" element={<EvaluationCenter />} />
    <Route path="chefs-table" element={<ChefsTableAdmin />} />
    <Route path="communications" element={<CommunicationsAdmin />} />
    <Route path="countries" element={<CountriesAdmin />} />
    <Route path="templates" element={<CommunicationTemplatesAdmin />} />
    <Route path="mentorship" element={<MentorshipAdmin />} />
    <Route path="establishments" element={<EstablishmentsAdmin />} />
    <Route path="verification" element={<VerificationAdmin />} />
    <Route path="support-tickets" element={<SupportTicketsAdmin />} />
    <Route path="audience-segments" element={<AudienceSegments />} />
    <Route path="live-chat" element={<LiveChatAdmin />} />
    <Route path="crm" element={<CRMDashboard />} />
    <Route path="advertising" element={<AdvertisingAdmin />} />
    <Route path="translation-seo" element={<TranslationSEOAdmin />} />
    <Route path="order-center" element={<OrderCenterAdmin />} />
    <Route path="moderation-center" element={<ModerationCenter />} />
    <Route path="marketing-automation" element={<MarketingAutomationAdmin />} />
    <Route path="cost-center" element={<CostCenterAdmin />} />
    <Route path="chef-schedule" element={<ChefScheduleAdmin />} />
    <Route path="global-events" element={<GlobalEventsAdmin />} />
    <Route path="hero-slides" element={<HeroSlidesAdmin />} />
    <Route path="homepage-sections" element={<HomepageSectionsAdmin />} />
  </Route>
);
