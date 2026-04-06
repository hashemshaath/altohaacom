/**
 * Single source of truth for ALL URL paths in the AlToha project.
 * Every component must import from here — no hardcoded path strings anywhere else.
 *
 * Based on actual route definitions in src/routes/publicRoutes.tsx
 */

export const ROUTES = {
  // ── Core ──────────────────────────────────────────
  home: '/',
  search: '/search',
  offline: '/offline',

  // ── Auth ──────────────────────────────────────────
  login: '/login',
  register: '/register',
  signup: '/signup',
  resetPassword: '/reset-password',
  companyLogin: '/company-login',
  verify: '/verify',
  verifyCertificate: '/verify/certificate',
  acceptInvite: '/accept-invite',
  unsubscribe: '/unsubscribe',

  // ── Competitions ──────────────────────────────────
  competitions: '/competitions',
  competition: (slug: string) => `/competitions/${slug}`,
  competitionResults: (slug: string) => `/competitions/${slug}/results`,
  competitionDiscovery: '/discover',
  rankings: '/rankings',

  // ── Exhibitions ───────────────────────────────────
  exhibitions: '/exhibitions',
  exhibition: (slug: string) => `/exhibitions/${slug}`,
  compareExhibitions: '/exhibitions/compare',

  // ── Blog (canonical) ───────────────────────────────
  blog: '/blog',
  article: (slug: string) => `/blog/${slug}`,

  // ── Chefs & Profiles ──────────────────────────────
  profile: (username: string) => `/${username}`,
  publicProfile: (username: string) => `/${username}`,
  portfolio: (userId: string) => `/portfolio/${userId}`,
  bio: (username: string) => `/bio/${username}`,

  // ── Entities (Academies + Associations) ───────────
  entities: '/entities',
  entity: (slug: string) => `/entities/${slug}`,

  // ── Organizers ────────────────────────────────────
  organizers: '/organizers',
  organizer: (name: string) => `/organizers/${name}`,

  // ── Masterclasses ─────────────────────────────────
  masterclasses: '/masterclasses',
  masterclass: (id: string) => `/masterclasses/${id}`,

  // ── Recipes ───────────────────────────────────────
  recipes: '/recipes',
  recipe: (slug: string) => `/recipes/${slug}`,

  // ── Establishments ────────────────────────────────
  establishments: '/establishments',
  establishment: (id: string) => `/establishments/${id}`,

  // ── Mentorship ────────────────────────────────────
  mentorship: '/mentorship',
  mentorshipDetail: (id: string) => `/mentorship/${id}`,

  // ── Jobs ──────────────────────────────────────────
  jobs: '/jobs',
  jobSearch: '/jobs/search',
  job: (id: string) => `/jobs/${id}`,

  // ── Pro Suppliers ─────────────────────────────────
  proSuppliers: '/pro-suppliers',
  proSuppliersCompare: '/pro-suppliers/compare',
  proSuppliersLeaderboard: '/pro-suppliers/leaderboard',
  proSupplier: (id: string) => `/pro-suppliers/${id}`,

  // ── Companies ─────────────────────────────────────
  company: (id: string) => `/companies/${id}`,

  // ── Shop ──────────────────────────────────────────
  shop: '/shop',
  shopProduct: (id: string) => `/shop/${id}`,

  // ── Chefs Table ───────────────────────────────────
  chefsTable: '/chefs-table',
  chefsTableDetail: (id: string) => `/chefs-table/${id}`,

  // ── Events ────────────────────────────────────────
  eventsCalendar: '/events-calendar',

  // ── Membership ────────────────────────────────────
  membership: '/membership',
  membershipRedeem: '/membership/redeem',

  // ── Landing Pages ─────────────────────────────────
  forChefs: '/for-chefs',
  forOrganizers: '/for-organizers',
  forCompanies: '/for-companies',
  forSponsors: '/sponsors',

  // ── Legal & Info ──────────────────────────────────
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  help: '/help',
  install: '/install',

  // ── Admin ─────────────────────────────────────────
  admin: '/admin',
  adminSeo: '/admin/seo',
  adminArticles: '/admin/articles',
  adminCompetitions: '/admin/competitions',
  adminExhibitions: '/admin/exhibitions',
  adminExhibitionStats: '/admin/exhibition-stats',
  adminSettings: '/admin/settings',
  adminAnalytics: '/admin/analytics',

  // ── Misc ──────────────────────────────────────────
  evaluationReport: (token: string) => `/evaluation-report/${token}`,
  socialLinks: (username: string) => `/bio/${username}`,
} as const;

/** Base URL for canonical/SEO purposes */
export const SITE_URL = 'https://altoha.com';

/** Build a full canonical URL */
export const canonical = (path: string) => `${SITE_URL}${path}`;
