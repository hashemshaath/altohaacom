import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const CompanyPortalLayout = lazy(() => import("@/pages/CompanyPortal"));
const CompanyDashboard = lazy(() => import("@/pages/company/CompanyDashboard"));
const CompanyProfile = lazy(() => import("@/pages/company/CompanyProfile"));
const CompanyTeam = lazy(() => import("@/pages/company/CompanyTeam"));
const CompanyOrders = lazy(() => import("@/pages/company/CompanyOrders"));
const CompanyInvitations = lazy(() => import("@/pages/company/CompanyInvitations"));
const CompanyTransactions = lazy(() => import("@/pages/company/CompanyTransactions"));
const CompanyEvaluations = lazy(() => import("@/pages/company/CompanyEvaluations"));
const CompanyStatements = lazy(() => import("@/pages/company/CompanyStatements"));
const CompanyMedia = lazy(() => import("@/pages/company/CompanyMedia"));
const CompanyCommunications = lazy(() => import("@/pages/company/CompanyCommunications"));
const CompanyBranches = lazy(() => import("@/pages/company/CompanyBranches"));
const CompanyDrivers = lazy(() => import("@/pages/company/CompanyDrivers"));
const CompanyWorkingHours = lazy(() => import("@/pages/company/CompanyWorkingHours"));
const CompanySettings = lazy(() => import("@/pages/company/CompanySettings"));
const CompanyInvoices = lazy(() => import("@/pages/company/CompanyInvoices"));
const CompanyCatalog = lazy(() => import("@/pages/company/CompanyCatalog"));
const CompanyAdvertising = lazy(() => import("@/pages/company/CompanyAdvertising"));
const CompanySponsorships = lazy(() => import("@/pages/company/CompanySponsorships"));
const CompanyNotifications = lazy(() => import("@/pages/company/CompanyNotifications"));
const CompanyAdminMessaging = lazy(() => import("@/pages/company/CompanyAdminMessaging"));
const CompanyCampaignDetail = lazy(() => import("@/pages/company/CompanyCampaignDetail"));
const CompanyReports = lazy(() => import("@/pages/company/CompanyReports"));

export const companyRoutes = (
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
    <Route path="advertising" element={<CompanyAdvertising />} />
    <Route path="advertising/:campaignId" element={<CompanyCampaignDetail />} />
    <Route path="sponsorships" element={<CompanySponsorships />} />
    <Route path="notifications" element={<CompanyNotifications />} />
    <Route path="support" element={<CompanyAdminMessaging />} />
    <Route path="reports" element={<CompanyReports />} />
  </Route>
);
