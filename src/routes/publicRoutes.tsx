import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";

const Auth = lazy(() => import("@/pages/Auth"));
const CompanyLogin = lazy(() => import("@/pages/CompanyLogin"));
const Competitions = lazy(() => import("@/pages/Competitions"));
const CompetitionDetail = lazy(() => import("@/pages/CompetitionDetail"));
const CompetitionResults = lazy(() => import("@/pages/CompetitionResults"));
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
const Entities = lazy(() => import("@/pages/Entities"));
const EntityDetail = lazy(() => import("@/pages/EntityDetail"));
const Shop = lazy(() => import("@/pages/Shop"));
const ShopProduct = lazy(() => import("@/pages/ShopProduct"));
const Tastings = lazy(() => import("@/pages/Tastings"));
const TastingDetail = lazy(() => import("@/pages/TastingDetail"));
const Mentorship = lazy(() => import("@/pages/Mentorship"));
const MentorshipDetail = lazy(() => import("@/pages/MentorshipDetail"));
const Recipes = lazy(() => import("@/pages/Recipes"));
const RecipeDetail = lazy(() => import("@/pages/RecipeDetail"));
const Establishments = lazy(() => import("@/pages/Establishments"));
const EstablishmentDetail = lazy(() => import("@/pages/EstablishmentDetail"));
const CompanyPublicProfile = lazy(() => import("@/pages/CompanyPublicProfile"));
const AcceptInvite = lazy(() => import("@/pages/AcceptInvite"));

export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Auth />} />
    <Route path="/register" element={<Auth />} />
    <Route path="/company-login" element={<CompanyLogin />} />
    <Route path="/reset-password" element={<Auth />} />
    <Route path="/competitions" element={<Competitions />} />
    <Route path="/competitions/:id" element={<CompetitionDetail />} />
    <Route path="/competitions/:id/results" element={<CompetitionResults />} />
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
    <Route path="/entities" element={<Entities />} />
    <Route path="/entities/:slug" element={<EntityDetail />} />
    <Route path="/shop" element={<Shop />} />
    <Route path="/shop/:id" element={<ShopProduct />} />
    <Route path="/tastings" element={<Tastings />} />
    <Route path="/tastings/:id" element={<TastingDetail />} />
    <Route path="/mentorship" element={<Mentorship />} />
    <Route path="/mentorship/:id" element={<MentorshipDetail />} />
    <Route path="/recipes" element={<Recipes />} />
    <Route path="/recipes/:slug" element={<RecipeDetail />} />
    <Route path="/establishments" element={<Establishments />} />
    <Route path="/establishments/:id" element={<EstablishmentDetail />} />
    <Route path="/companies/:id" element={<CompanyPublicProfile />} />
    <Route path="/accept-invite" element={<AcceptInvite />} />
    <Route path="/profile/:username" element={<PublicProfile />} />
    <Route path="/:username" element={<PublicProfile />} />
  </>
);
