import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const Community = lazy(() => import("@/pages/Community"));
const CreateCompetition = lazy(() => import("@/pages/CreateCompetition"));
const EditCompetition = lazy(() => import("@/pages/EditCompetition"));
const KnowledgePortal = lazy(() => import("@/pages/KnowledgePortal"));
const NotificationPreferences = lazy(() => import("@/pages/NotificationPreferences"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Messages = lazy(() => import("@/pages/Messages"));
const SupportTickets = lazy(() => import("@/pages/SupportTickets"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const CreateExhibition = lazy(() => import("@/pages/CreateExhibition"));
const EditExhibition = lazy(() => import("@/pages/EditExhibition"));
const ShopOrders = lazy(() => import("@/pages/ShopOrders"));
const ShopMyProducts = lazy(() => import("@/pages/ShopMyProducts"));
const ChefsTableRequest = lazy(() => import("@/pages/ChefsTableRequest"));
const RegisterCompany = lazy(() => import("@/pages/RegisterCompany"));
const MentorApply = lazy(() => import("@/pages/MentorApply"));
const MentorshipMatchPage = lazy(() => import("@/pages/MentorshipMatch"));
const Judging = lazy(() => import("@/pages/Judging"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const Rewards = lazy(() => import("@/pages/Rewards"));
const CreateRecipe = lazy(() => import("@/pages/CreateRecipe"));
const MyEvaluations = lazy(() => import("@/pages/MyEvaluations"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const AdvertiseWithUs = lazy(() => import("@/pages/AdvertiseWithUs"));
const SocialLinksEditor = lazy(() => import("@/pages/SocialLinksEditor"));

export const protectedRoutes = (
  <>
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
    <Route path="/competitions/create" element={<ProtectedRoute><CreateCompetition /></ProtectedRoute>} />
    <Route path="/competitions/:id/edit" element={<ProtectedRoute><EditCompetition /></ProtectedRoute>} />
    <Route path="/knowledge" element={<ProtectedRoute><KnowledgePortal /></ProtectedRoute>} />
    <Route path="/notification-preferences" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
    <Route path="/support" element={<ProtectedRoute><SupportTickets /></ProtectedRoute>} />
    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
    <Route path="/exhibitions/create" element={<ProtectedRoute><CreateExhibition /></ProtectedRoute>} />
    <Route path="/exhibitions/:slug/edit" element={<ProtectedRoute><EditExhibition /></ProtectedRoute>} />
    <Route path="/shop/orders" element={<ProtectedRoute><ShopOrders /></ProtectedRoute>} />
    <Route path="/shop/my-products" element={<ProtectedRoute><ShopMyProducts /></ProtectedRoute>} />
    <Route path="/chefs-table/request" element={<ProtectedRoute><ChefsTableRequest /></ProtectedRoute>} />
    <Route path="/register-company" element={<ProtectedRoute><RegisterCompany /></ProtectedRoute>} />
    <Route path="/mentorship/apply" element={<ProtectedRoute><MentorApply /></ProtectedRoute>} />
    <Route path="/mentorship/match/:id" element={<ProtectedRoute><MentorshipMatchPage /></ProtectedRoute>} />
    <Route path="/judging" element={<ProtectedRoute><Judging /></ProtectedRoute>} />
    <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
    <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
    <Route path="/recipes/create" element={<ProtectedRoute><CreateRecipe /></ProtectedRoute>} />
    <Route path="/my-evaluations" element={<ProtectedRoute><MyEvaluations /></ProtectedRoute>} />
    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
    <Route path="/advertise" element={<ProtectedRoute><AdvertiseWithUs /></ProtectedRoute>} />
    <Route path="/social-links" element={<ProtectedRoute><SocialLinksEditor /></ProtectedRoute>} />
  </>
);
