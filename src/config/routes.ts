/**
 * Single source of truth for ALL URL paths in the AlToha project.
 * Every component must import from here — no hardcoded path strings anywhere else.
 */

export const ROUTES = {
  // ── Core ──────────────────────────────────────────
  home: '/',
  search: '/search',
  offline: '/offline',

  // ── Auth ──────────────────────────────────────────
  login: '/login',
  register: '/register',
  registerCompany: '/register-company',
  signup: '/signup',
  resetPassword: '/reset-password',
  companyLogin: '/company-login',
  verify: '/verify',
  verifyCertificate: '/verify/certificate',
  acceptInvite: '/accept-invite',
  unsubscribe: '/unsubscribe',
  onboarding: '/onboarding',

  // ── Competitions ──────────────────────────────────
  competitions: '/competitions',
  competition: (slug: string) => `/competitions/${slug}`,
  competitionResults: (slug: string) => `/competitions/${slug}/results`,
  competitionCreate: '/competitions/create',
  competitionEdit: (id: string) => `/competitions/${id}/edit`,
  competitionDiscovery: '/discover',
  rankings: '/rankings',

  // ── Exhibitions ───────────────────────────────────
  exhibitions: '/exhibitions',
  exhibition: (slug: string) => `/exhibitions/${slug}`,
  exhibitionCreate: '/exhibitions/create',
  exhibitionEdit: (slug: string) => `/exhibitions/${slug}/edit`,

  // ── Blog (canonical) ───────────────────────────────
  blog: '/blog',
  article: (slug: string) => `/blog/${slug}`,

  // ── News ──────────────────────────────────────────
  news: '/news',
  newsArticle: (slug: string) => `/news/${slug}`,

  // ── Knowledge ─────────────────────────────────────
  knowledge: '/knowledge',

  // ── Chefs & Profiles ──────────────────────────────
  profile: (username: string) => `/${username}`,
  publicProfile: (username: string) => `/${username}`,
  portfolio: (userId: string) => `/portfolio/${userId}`,
  bio: (username: string) => `/bio/${username}`,
  profileDashboard: '/profile',
  profileAnalytics: '/profile/analytics',

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
  recipeCreate: '/recipes/create',

  // ── Establishments ────────────────────────────────
  establishments: '/establishments',
  establishment: (id: string) => `/establishments/${id}`,

  // ── Mentorship ────────────────────────────────────
  mentorship: '/mentorship',
  mentorshipDetail: (id: string) => `/mentorship/${id}`,
  mentorshipApply: '/mentorship/apply',
  mentorshipMatch: (id: string) => `/mentorship/match/${id}`,

  // ── Jobs ──────────────────────────────────────────
  jobs: '/jobs',
  jobSearch: '/jobs/search',
  job: (id: string) => `/jobs/${id}`,
  jobApplications: '/jobs/my-applications',

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
  shopOrders: '/shop/orders',
  shopMyProducts: '/shop/my-products',

  // ── Chefs Table ───────────────────────────────────
  chefsTable: '/chefs-table',
  chefsTableDetail: (id: string) => `/chefs-table/${id}`,
  chefsTableRequest: '/chefs-table/request',

  // ── Tastings ──────────────────────────────────────
  tastings: '/tastings',
  tasting: (id: string) => `/tastings/${id}`,
  tastingCreate: '/tastings/create',

  // ── Events ────────────────────────────────────────
  eventsCalendar: '/events-calendar',

  // ── Membership ────────────────────────────────────
  membership: '/membership',
  membershipRedeem: '/membership/redeem',
  membershipCheckout: '/membership/checkout',
  membershipGift: '/membership/gift',
  membershipGifts: '/membership/gifts',
  membershipReferral: '/membership/referral',

  // ── Community & Social ────────────────────────────
  community: '/community',
  forYou: '/for-you',
  socialLinks: '/social-links',
  socialLinksAnalytics: '/social-links/analytics',

  // ── Engagement ────────────────────────────────────
  rewards: '/rewards',
  referrals: '/referrals',
  notifications: '/notifications',
  notificationPreferences: '/notification-preferences',
  messages: '/messages',

  // ── Dashboard ─────────────────────────────────────
  dashboard: '/dashboard',
  judging: '/judging',
  myEvaluations: '/my-evaluations',
  verification: '/verification',
  checkout: '/checkout',
  support: '/support',

  // ── Advertising ───────────────────────────────────
  advertise: '/advertise',

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
  adminOrganizers: '/admin/organizers',
  adminSettings: '/admin/settings',
  adminAnalytics: '/admin/analytics',

  // ── Misc ──────────────────────────────────────────
  evaluationReport: (token: string) => `/evaluation-report/${token}`,
  socialLinksProfile: (username: string) => `/bio/${username}`,
} as const;

/** Base URL for canonical/SEO purposes */
const SITE_URL = 'https://altoha.com';

/** Build a full canonical URL */
const canonical = (path: string) => `${SITE_URL}${path}`;
