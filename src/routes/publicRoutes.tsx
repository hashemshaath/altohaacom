import { lazy } from "react";
import { Route, Navigate, useParams } from "react-router-dom";
const Index = lazy(() => import("@/pages/Index"));
const OfflinePage = lazy(() => import("@/pages/OfflinePage"));
const Auth = lazy(() => import("@/pages/Auth"));
const CompanyLogin = lazy(() => import("@/pages/CompanyLogin"));
const Competitions = lazy(() => import("@/pages/Competitions"));
const CompetitionDetail = lazy(() => import("@/pages/CompetitionDetail"));
const CompetitionResults = lazy(() => import("@/pages/CompetitionResults"));
const Rankings = lazy(() => import("@/pages/Rankings"));
const ChefPortfolio = lazy(() => import("@/pages/ChefPortfolio"));
const CompetitionDiscovery = lazy(() => import("@/pages/CompetitionDiscovery"));
const Search = lazy(() => import("@/pages/Search"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const News = lazy(() => import("@/pages/News"));
const ArticleDetail = lazy(() => import("@/pages/ArticleDetail"));
const SponsorsLanding = lazy(() => import("@/pages/landing/SponsorsLanding"));
const OrganizersLanding = lazy(() => import("@/pages/landing/OrganizersLanding"));
const CompaniesLanding = lazy(() => import("@/pages/landing/CompaniesLanding"));
const ChefsLanding = lazy(() => import("@/pages/landing/ChefsLanding"));
const Install = lazy(() => import("@/pages/Install"));
const Verify = lazy(() => import("@/pages/Verify"));
const CertificateVerify = lazy(() => import("@/pages/CertificateVerify"));
const Masterclasses = lazy(() => import("@/pages/Masterclasses"));
const MasterclassDetail = lazy(() => import("@/pages/MasterclassDetail"));
const Exhibitions = lazy(() => import("@/pages/Exhibitions"));
const ExhibitionDetail = lazy(() => import("@/pages/ExhibitionDetail"));
const OrganizerDetail = lazy(() => import("@/pages/OrganizerDetail"));
const Entities = lazy(() => import("@/pages/Entities"));
const EntityDetail = lazy(() => import("@/pages/EntityDetail"));
const Shop = lazy(() => import("@/pages/Shop"));
const ShopProduct = lazy(() => import("@/pages/ShopProduct"));
const ChefsTable = lazy(() => import("@/pages/ChefsTable"));
const ChefsTableDetail = lazy(() => import("@/pages/ChefsTableDetail"));
const EvaluationReport = lazy(() => import("@/pages/EvaluationReport"));
const Mentorship = lazy(() => import("@/pages/Mentorship"));
const MentorshipDetail = lazy(() => import("@/pages/MentorshipDetail"));
const Recipes = lazy(() => import("@/pages/Recipes"));
const RecipeDetail = lazy(() => import("@/pages/RecipeDetail"));
const Establishments = lazy(() => import("@/pages/Establishments"));
const EstablishmentDetail = lazy(() => import("@/pages/EstablishmentDetail"));
const CompanyPublicProfile = lazy(() => import("@/pages/CompanyPublicProfile"));
const ProSuppliers = lazy(() => import("@/pages/ProSuppliers"));
const ProSupplierDetail = lazy(() => import("@/pages/ProSupplierDetail"));
const SupplierCompare = lazy(() => import("@/pages/SupplierCompare"));
const SupplierLeaderboard = lazy(() => import("@/pages/SupplierLeaderboard"));
const AcceptInvite = lazy(() => import("@/pages/AcceptInvite"));
const ContactUs = lazy(() => import("@/pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("@/pages/TermsConditions"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const EventsCalendar = lazy(() => import("@/pages/EventsCalendar"));
const SocialLinks = lazy(() => import("@/pages/SocialLinks"));
const MembershipPlans = lazy(() => import("@/pages/MembershipPlans"));
const MembershipRedeem = lazy(() => import("@/pages/MembershipRedeem"));

function LegacyLinksRedirect() {
  const { username } = useParams<{ username: string }>();
  return <Navigate to={`/bio/${username ?? ""}`} replace />;
}

export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/events-calendar" element={<EventsCalendar />} />
    <Route path="/auth" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Auth />} />
    <Route path="/register" element={<Auth />} />
    <Route path="/company-login" element={<CompanyLogin />} />
    <Route path="/reset-password" element={<Auth />} />
    <Route path="/competitions" element={<Competitions />} />
    <Route path="/discover" element={<CompetitionDiscovery />} />
    <Route path="/competitions/:id" element={<CompetitionDetail />} />
    <Route path="/competitions/:id/results" element={<CompetitionResults />} />
    <Route path="/rankings" element={<Rankings />} />
    <Route path="/portfolio/:userId" element={<ChefPortfolio />} />
    <Route path="/search" element={<Search />} />
    <Route path="/help" element={<HelpCenter />} />
    <Route path="/news" element={<News />} />
    <Route path="/news/:slug" element={<ArticleDetail />} />
    <Route path="/sponsors" element={<SponsorsLanding />} />
    <Route path="/for-organizers" element={<OrganizersLanding />} />
    <Route path="/for-companies" element={<CompaniesLanding />} />
    <Route path="/for-chefs" element={<ChefsLanding />} />
    <Route path="/verify" element={<Verify />} />
    <Route path="/verify/certificate" element={<CertificateVerify />} />
    <Route path="/masterclasses" element={<Masterclasses />} />
    <Route path="/masterclasses/:id" element={<MasterclassDetail />} />
    <Route path="/install" element={<Install />} />
    <Route path="/exhibitions" element={<Exhibitions />} />
    <Route path="/exhibitions/:slug" element={<ExhibitionDetail />} />
    <Route path="/organizers/:name" element={<OrganizerDetail />} />
    <Route path="/entities" element={<Entities />} />
    <Route path="/entities/:slug" element={<EntityDetail />} />
    <Route path="/shop" element={<Shop />} />
    <Route path="/shop/:id" element={<ShopProduct />} />
    <Route path="/chefs-table" element={<ChefsTable />} />
    <Route path="/chefs-table/:id" element={<ChefsTableDetail />} />
    <Route path="/evaluation-report/:token" element={<EvaluationReport />} />
    <Route path="/mentorship" element={<Mentorship />} />
    <Route path="/mentorship/:id" element={<MentorshipDetail />} />
    <Route path="/recipes" element={<Recipes />} />
    <Route path="/recipes/:slug" element={<RecipeDetail />} />
    <Route path="/establishments" element={<Establishments />} />
    <Route path="/establishments/:id" element={<EstablishmentDetail />} />
    <Route path="/companies/:id" element={<CompanyPublicProfile />} />
    <Route path="/pro-suppliers" element={<ProSuppliers />} />
    <Route path="/pro-suppliers/compare" element={<SupplierCompare />} />
    <Route path="/pro-suppliers/leaderboard" element={<SupplierLeaderboard />} />
    <Route path="/pro-suppliers/:id" element={<ProSupplierDetail />} />
    <Route path="/accept-invite" element={<AcceptInvite />} />
    <Route path="/contact" element={<ContactUs />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsConditions />} />
    <Route path="/about" element={<AboutUs />} />
    <Route path="/cookies" element={<CookiePolicy />} />
    <Route path="/membership" element={<MembershipPlans />} />
    <Route path="/membership/redeem" element={<MembershipRedeem />} />
    <Route path="/profile/:username" element={<PublicProfile />} />
    <Route path="/offline" element={<OfflinePage />} />
    <Route path="/:username/links" element={<LegacyLinksRedirect />} />
    <Route path="/bio/:username" element={<SocialLinks />} />
    <Route path="/:username" element={<PublicProfile />} />
  </>
);
