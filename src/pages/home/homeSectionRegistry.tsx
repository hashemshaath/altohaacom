import { type ComponentType, type LazyExoticComponent } from "react";
import { safeLazy } from "@/lib/safeLazy";

const HomeSearch = safeLazy(() => import("@/components/home/HomeSearch").then((m) => ({ default: m.HomeSearch as ComponentType<any> })));
const StatsBar = safeLazy(() => import("@/components/home/sections/StatsBar"));
const CompetitionsSection = safeLazy(() => import("@/components/home/sections/CompetitionsSection"));
const RegionalEvents = safeLazy(() => import("@/components/home/RegionalEvents").then((m) => ({ default: m.RegionalEvents as ComponentType<any> })));
const HomeEventsCalendarPreview = safeLazy(() => import("@/components/home/HomeEventsCalendarPreview").then((m) => ({ default: m.HomeEventsCalendarPreview as ComponentType<any> })));
const FeaturedChefsSection = safeLazy(() => import("@/components/home/sections/FeaturedChefsSection"));
const NewlyJoinedUsers = safeLazy(() => import("@/components/home/NewlyJoinedUsers").then((m) => ({ default: m.NewlyJoinedUsers as ComponentType<any> })));
const StatsPartnersSection = safeLazy(() => import("@/components/home/sections/StatsPartnersSection"));
const HomeProSuppliers = safeLazy(() => import("@/components/home/HomeProSuppliers").then((m) => ({ default: m.HomeProSuppliers as ComponentType<any> })));
const HomeMasterclasses = safeLazy(() => import("@/components/home/HomeMasterclasses").then((m) => ({ default: m.HomeMasterclasses as ComponentType<any> })));
const ArticlesSection = safeLazy(() => import("@/components/home/sections/ArticlesSection"));
const HomeTrendingContent = safeLazy(() => import("@/components/home/HomeTrendingContent").then((m) => ({ default: m.HomeTrendingContent as ComponentType<any> })));
const SponsorshipOpportunities = safeLazy(() => import("@/components/home/SponsorshipOpportunities").then((m) => ({ default: m.SponsorshipOpportunities as ComponentType<any> })));
const HomeTestimonials = safeLazy(() => import("@/components/home/HomeTestimonials").then((m) => ({ default: m.HomeTestimonials as ComponentType<any> })));
const PlatformFeatures = safeLazy(() => import("@/components/home/PlatformFeatures").then((m) => ({ default: m.PlatformFeatures as ComponentType<any> })));
const NewsletterSignup = safeLazy(() => import("@/components/home/NewsletterSignup").then((m) => ({ default: m.NewsletterSignup as ComponentType<any> })));
const HomeQuickActions = safeLazy(() => import("@/components/home/HomeQuickActions").then((m) => ({ default: m.HomeQuickActions as ComponentType<any> })));
const HomepageAdBanner = safeLazy(() => import("@/components/home/sections/HomepageAdBanner"));

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
