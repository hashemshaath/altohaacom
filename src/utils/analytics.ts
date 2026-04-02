/* ─── GTM DataLayer helpers ─── */

type GTMEvent = { event: string; [key: string]: unknown };

declare global {
  interface Window {
    dataLayer?: GTMEvent[];
  }
}

export function pushDataLayer(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  const payload: GTMEvent = { event, ...params };
  window.dataLayer.push(payload);
  if (import.meta.env.DEV) console.debug("[GTM]", payload);
}

/* ─── Typed event helpers ─── */

// Auth
export const trackSignUp = (method: string, userType: string) =>
  pushDataLayer("sign_up", { method, user_type: userType });

export const trackLogin = (method: string) =>
  pushDataLayer("login", { method });

// Chefs
export const trackViewChefProfile = (chefId: string, country: string) =>
  pushDataLayer("view_chef_profile", { chef_id: chefId, chef_country: country });

export const trackFollowChef = (chefId: string) =>
  pushDataLayer("follow_chef", { chef_id: chefId });

// Competitions
export const trackViewCompetition = (id: string, name: string, location: string) =>
  pushDataLayer("view_competition", { competition_id: id, competition_name: name, location });

export const trackCompetitionRegisterClick = (id: string) =>
  pushDataLayer("competition_register_click", { competition_id: id });

export const trackCompetitionRegistered = (id: string) =>
  pushDataLayer("competition_registered", { competition_id: id });

// Exhibitions
export const trackViewExhibition = (id: string, name: string, city: string) =>
  pushDataLayer("view_exhibition", { exhibition_id: id, exhibition_name: name, city });

// Search
export const trackSearch = (term: string, category: string, resultsCount: number) =>
  pushDataLayer("search", { search_term: term, category, results_count: resultsCount });

// Membership
export const trackMembershipView = (plan: string) =>
  pushDataLayer("view_item", { item_id: plan, item_name: `AlToha ${plan}`, item_category: "membership" });

export const trackMembershipPurchase = (plan: string, value: number, currency: string) =>
  pushDataLayer("purchase", { item_id: plan, value, currency, transaction_id: crypto.randomUUID() });
