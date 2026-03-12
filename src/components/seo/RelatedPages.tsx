import { forwardRef, useRef, useState, useEffect, type MutableRefObject } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import {
  Trophy, UtensilsCrossed, BookOpen, Users, Building2, Briefcase,
  GraduationCap, Star, CalendarDays, Store, ShieldCheck, Globe,
  Handshake, Award, ChefHat, Compass
} from "lucide-react";

export interface RelatedPage {
  href: string;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  /** Short description for richer link context */
  desc?: string;
  descAr?: string;
}

/** Master registry of all linkable pages for SEO cross-linking */
export const PAGE_REGISTRY: Record<string, RelatedPage> = {
  competitions: { href: "/competitions", label: "Competitions", labelAr: "المسابقات", icon: Trophy, desc: "Browse culinary competitions", descAr: "تصفح مسابقات الطهي" },
  discover: { href: "/discover", label: "Discover", labelAr: "استكشاف", icon: Compass, desc: "Discover upcoming events", descAr: "اكتشف الفعاليات القادمة" },
  recipes: { href: "/recipes", label: "Recipes", labelAr: "الوصفات", icon: UtensilsCrossed, desc: "Professional chef recipes", descAr: "وصفات الطهاة المحترفين" },
  news: { href: "/news", label: "News", labelAr: "الأخبار", icon: BookOpen, desc: "Culinary news & articles", descAr: "أخبار ومقالات الطهي" },
  community: { href: "/community", label: "Community", labelAr: "المجتمع", icon: Users, desc: "Connect with chefs", descAr: "تواصل مع الطهاة" },
  exhibitions: { href: "/exhibitions", label: "Exhibitions", labelAr: "المعارض", icon: Globe, desc: "Food exhibitions worldwide", descAr: "معارض الأغذية حول العالم" },
  masterclasses: { href: "/masterclasses", label: "Masterclasses", labelAr: "الدروس المتقدمة", icon: GraduationCap, desc: "Learn from top chefs", descAr: "تعلم من أمهر الطهاة" },
  rankings: { href: "/rankings", label: "Rankings", labelAr: "التصنيف", icon: Award, desc: "Global chef rankings", descAr: "التصنيف العالمي للطهاة" },
  establishments: { href: "/establishments", label: "Establishments", labelAr: "المنشآت", icon: Building2, desc: "Restaurants & hotels", descAr: "المطاعم والفنادق" },
  jobs: { href: "/jobs", label: "Jobs", labelAr: "الوظائف", icon: Briefcase, desc: "Culinary career opportunities", descAr: "فرص عمل في الطهي" },
  suppliers: { href: "/pro-suppliers", label: "Suppliers", labelAr: "الموردين", icon: Store, desc: "Professional suppliers", descAr: "الموردين المحترفين" },
  shop: { href: "/shop", label: "Shop", labelAr: "المتجر", icon: Store, desc: "Culinary tools & books", descAr: "أدوات وكتب الطهي" },
  mentorship: { href: "/mentorship", label: "Mentorship", labelAr: "الإرشاد", icon: Handshake, desc: "Chef mentorship program", descAr: "برنامج إرشاد الطهاة" },
  chefsTable: { href: "/chefs-table", label: "Chef's Table", labelAr: "طاولة الشيف", icon: ChefHat, desc: "Product evaluation", descAr: "تقييم المنتجات" },
  calendar: { href: "/events-calendar", label: "Events Calendar", labelAr: "تقويم الفعاليات", icon: CalendarDays, desc: "All upcoming events", descAr: "جميع الفعاليات القادمة" },
  organizers: { href: "/organizers", label: "Organizers", labelAr: "المنظمون", icon: ShieldCheck, desc: "Event organizers", descAr: "منظمو الفعاليات" },
  membership: { href: "/membership", label: "Membership", labelAr: "العضوية", icon: Star, desc: "Exclusive member benefits", descAr: "مزايا حصرية للأعضاء" },
};

/** Pre-defined contextual link groups per page */
const PAGE_LINKS: Record<string, string[]> = {
  "/": ["competitions", "recipes", "news", "exhibitions", "rankings", "jobs"],
  "/competitions": ["discover", "rankings", "calendar", "masterclasses", "organizers", "chefsTable"],
  "/discover": ["competitions", "calendar", "exhibitions", "rankings"],
  "/recipes": ["community", "masterclasses", "shop", "chefsTable", "competitions"],
  "/news": ["competitions", "exhibitions", "community", "recipes", "rankings"],
  "/community": ["recipes", "news", "mentorship", "rankings", "competitions"],
  "/exhibitions": ["competitions", "calendar", "organizers", "suppliers", "news"],
  "/masterclasses": ["recipes", "competitions", "mentorship", "community", "rankings"],
  "/rankings": ["competitions", "masterclasses", "community", "discover", "chefsTable"],
  "/establishments": ["jobs", "suppliers", "rankings", "competitions", "recipes"],
  "/jobs": ["establishments", "rankings", "community", "membership", "competitions"],
  "/pro-suppliers": ["establishments", "shop", "chefsTable", "exhibitions", "competitions"],
  "/shop": ["suppliers", "recipes", "masterclasses", "competitions"],
  "/mentorship": ["masterclasses", "community", "rankings", "competitions", "jobs"],
  "/chefs-table": ["competitions", "suppliers", "rankings", "recipes"],
  "/events-calendar": ["competitions", "exhibitions", "organizers", "discover"],
  "/organizers": ["competitions", "exhibitions", "calendar", "discover"],
  "/membership": ["competitions", "masterclasses", "community", "shop", "mentorship"],
  "/about": ["competitions", "membership", "news", "community"],
  "/contact": ["community", "news", "competitions"],
  "/help": ["community", "membership", "competitions"],
  "/for-chefs": ["competitions", "rankings", "masterclasses", "community", "membership"],
  "/for-companies": ["suppliers", "exhibitions", "shop", "competitions"],
  "/for-organizers": ["competitions", "calendar", "exhibitions", "organizers"],
  "/sponsors": ["competitions", "exhibitions", "suppliers"],
};

interface Props {
  /** Current page path to auto-select relevant links */
  currentPath?: string;
  /** Override with custom link keys from PAGE_REGISTRY */
  links?: string[];
  /** Max links to show (default: 6) */
  max?: number;
  /** Section title override */
  title?: string;
  titleAr?: string;
  className?: string;
}

export const RelatedPages = forwardRef<HTMLElement, Props>(function RelatedPages({
  currentPath,
  links,
  max = 6,
  title,
  titleAr,
  className,
}, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const setSectionRef = (node: HTMLElement | null) => {
    sectionRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as MutableRefObject<HTMLElement | null>).current = node;
  };

  // Defer rendering until near viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const linkKeys = links || (currentPath ? PAGE_LINKS[currentPath] : null) || [];
  const pages = linkKeys
    .map(k => PAGE_REGISTRY[k])
    .filter(Boolean)
    .slice(0, max);

  if (pages.length === 0) return <nav ref={setSectionRef} aria-hidden />;

  const sectionTitle = title || (isAr ? (titleAr || "استكشف المزيد") : "Explore More");

  return (
    <nav
      ref={setSectionRef}
      aria-label={isAr ? "صفحات ذات صلة" : "Related pages"}
      className={cn("border-t border-border/40 mt-12 pt-8 pb-4 cv-auto-sm", className)}
    >
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        {sectionTitle}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.href}
              to={page.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border/30 bg-muted/20 p-4 text-center transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
            >
              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                {isAr ? page.labelAr : page.label}
              </span>
              {(page.desc || page.descAr) && (
                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                  {isAr ? (page.descAr || page.desc) : page.desc}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

RelatedPages.displayName = "RelatedPages";
