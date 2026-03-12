import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const HomeSearch = lazy(() => import("@/components/home/HomeSearch").then((m) => ({ default: m.HomeSearch })));
const StatsBar = lazy(() => import("@/components/home/sections/StatsBar"));
const CompetitionsSection = lazy(() => import("@/components/home/sections/CompetitionsSection"));
const RegionalEvents = lazy(() => import("@/components/home/RegionalEvents").then((m) => ({ default: m.RegionalEvents })));
const HomeEventsCalendarPreview = lazy(() => import("@/components/home/HomeEventsCalendarPreview").then((m) => ({ default: m.HomeEventsCalendarPreview })));
const FeaturedChefsSection = lazy(() => import("@/components/home/sections/FeaturedChefsSection"));
const NewlyJoinedUsers = lazy(() => import("@/components/home/NewlyJoinedUsers").then((m) => ({ default: m.NewlyJoinedUsers })));
const StatsPartnersSection = lazy(() => import("@/components/home/sections/StatsPartnersSection"));
const HomeProSuppliers = lazy(() => import("@/components/home/HomeProSuppliers").then((m) => ({ default: m.HomeProSuppliers })));
const HomeMasterclasses = lazy(() => import("@/components/home/HomeMasterclasses").then((m) => ({ default: m.HomeMasterclasses })));
const ArticlesSection = lazy(() => import("@/components/home/sections/ArticlesSection"));
const HomeTrendingContent = lazy(() => import("@/components/home/HomeTrendingContent").then((m) => ({ default: m.HomeTrendingContent })));
const SponsorshipOpportunities = lazy(() => import("@/components/home/SponsorshipOpportunities").then((m) => ({ default: m.SponsorshipOpportunities })));
const HomeTestimonials = lazy(() => import("@/components/home/HomeTestimonials").then((m) => ({ default: m.HomeTestimonials })));
const PlatformFeatures = lazy(() => import("@/components/home/PlatformFeatures").then((m) => ({ default: m.PlatformFeatures })));
const NewsletterSignup = lazy(() => import("@/components/home/NewsletterSignup").then((m) => ({ default: m.NewsletterSignup })));
const HomeQuickActions = lazy(() => import("@/components/home/HomeQuickActions").then((m) => ({ default: m.HomeQuickActions })));
const HomepageAdBanner = lazy(() => import("@/components/home/sections/HomepageAdBanner"));

export type HomeSectionComponent = LazyExoticComponent<ComponentType<any>>;

export const HOME_SECTION_COMPONENTS: Record<string, HomeSectionComponent> = {
  search: HomeSearch,
  stats: StatsBar,
  events_by_category: CompetitionsSection,
  regional_events: RegionalEvents,
  events_calendar: HomeEventsCalendarPreview,
  featured_chefs: FeaturedChefsSection,
  newly_joined: NewlyJoinedUsers,
  sponsors: StatsPartnersSection,
  partners: StatsPartnersSection,
  pro_suppliers: HomeProSuppliers,
  masterclasses: HomeMasterclasses,
  articles: ArticlesSection,
  trending_content: HomeTrendingContent,
  sponsorships: SponsorshipOpportunities,
  testimonials: HomeTestimonials,
  features: PlatformFeatures,
  platform_features: PlatformFeatures,
  newsletter: NewsletterSignup,
  quick_actions: HomeQuickActions,
  ad_banner_top: HomepageAdBanner,
  ad_banner_mid: HomepageAdBanner,
  ad_banner_bottom: HomepageAdBanner,
};

export const DEFAULT_HOME_SECTION_KEYS = [
  "search",
  "stats",
  "events_by_category",
  "featured_chefs",
  "pro_suppliers",
  "masterclasses",
  "articles",
  "sponsors",
  "testimonials",
  "features",
  "newsletter",
];
