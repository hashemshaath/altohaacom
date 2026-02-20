import {
  Sparkles, Search, BarChart3, CalendarDays, MapPin, ChefHat,
  UserPlus, Heart, Truck, GraduationCap, Megaphone, Newspaper,
  Puzzle, Mail, Handshake, Image, Star, Layout,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  hero: Sparkles,
  search: Search,
  stats: BarChart3,
  events_by_category: CalendarDays,
  ad_banner_top: Megaphone,
  regional_events: MapPin,
  events_calendar: CalendarDays,
  featured_chefs: Star,
  newly_joined: UserPlus,
  sponsors: Heart,
  pro_suppliers: Truck,
  masterclasses: GraduationCap,
  ad_banner_mid: Megaphone,
  sponsorships: Handshake,
  articles: Newspaper,
  features: Puzzle,
  newsletter: Mail,
  partners: Handshake,
};

export function SectionIcon({ sectionKey, className }: { sectionKey: string; className?: string }) {
  const Icon = ICON_MAP[sectionKey] || Layout;
  return <Icon className={className} />;
}
