import { useIsAr } from "@/hooks/useIsAr";
import { memo, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/** Maps path segments to display labels */
const segmentLabels: Record<string, { en: string; ar: string }> = {
  competitions: { en: "Competitions", ar: "المسابقات" },
  exhibitions: { en: "Exhibitions", ar: "المعارض" },
  blog: { en: "News", ar: "الأخبار" },
  recipes: { en: "Recipes", ar: "الوصفات" },
  jobs: { en: "Jobs", ar: "الوظائف" },
  shop: { en: "Shop", ar: "المتجر" },
  masterclasses: { en: "Masterclasses", ar: "الدروس المتقدمة" },
  entities: { en: "Entities", ar: "الجهات" },
  establishments: { en: "Establishments", ar: "المؤسسات" },
  mentorship: { en: "Mentorship", ar: "الإرشاد" },
  rankings: { en: "Rankings", ar: "التصنيفات" },
  community: { en: "Community", ar: "المجتمع" },
  organizers: { en: "Organizers", ar: "المنظمون" },
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  profile: { en: "Profile", ar: "الملف الشخصي" },
  notifications: { en: "Notifications", ar: "الإشعارات" },
  settings: { en: "Settings", ar: "الإعدادات" },
  membership: { en: "Membership", ar: "العضوية" },
  search: { en: "Search", ar: "البحث" },
  "events-calendar": { en: "Events", ar: "الفعاليات" },
  "pro-suppliers": { en: "Pro Suppliers", ar: "الموردون" },
  "chefs-table": { en: "Chef's Table", ar: "طاولة الشيف" },
  about: { en: "About", ar: "عن المنصة" },
  contact: { en: "Contact", ar: "اتصل بنا" },
  privacy: { en: "Privacy", ar: "الخصوصية" },
  terms: { en: "Terms", ar: "الشروط" },
  help: { en: "Help", ar: "المساعدة" },
  admin: { en: "Admin", ar: "الإدارة" },
  results: { en: "Results", ar: "النتائج" },
  orders: { en: "Orders", ar: "الطلبات" },
  "my-applications": { en: "My Applications", ar: "طلباتي" },
};

const hiddenRoutes = ["/", "/login", "/register", "/signup", "/auth"];

interface BreadcrumbsProps {
  /** Override the last segment label */
  currentLabel?: string;
  className?: string;
}

export const Breadcrumbs = memo(function Breadcrumbs({ currentLabel, className }: BreadcrumbsProps) {
  const isAr = useIsAr();
  const location = useLocation();

  const crumbs = useMemo(() => {
    const path = location.pathname;
    if (hiddenRoutes.includes(path)) return [];

    const segments = path.split("/").filter(Boolean);
    if (segments.length < 1) return [];

    // Skip admin sub-pages breadcrumbs (they have their own nav)
    if (segments[0] === "admin") return [];

    const items: { label: string; href?: string }[] = [];

    segments.forEach((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const isLast = idx === segments.length - 1;
      const labelMap = segmentLabels[seg];

      let label: string;
      if (isLast && currentLabel) {
        label = currentLabel;
      } else if (labelMap) {
        label = isAr ? labelMap.ar : labelMap.en;
      } else {
        // UUID or slug — show as "..." or skip
        label = seg.length > 20 ? "..." : decodeURIComponent(seg);
      }

      items.push({ label, href: isLast ? undefined : href });
    });

    return items;
  }, [location.pathname, isAr, currentLabel]);

  if (crumbs.length < 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-4 animate-fade-in", className)}
    >
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground/70 flex-wrap">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors rounded-md px-1.5 py-0.5 hover:bg-muted/50"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">{isAr ? "الرئيسية" : "Home"}</span>
          </Link>
        </li>
        {crumbs.map((crumb, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/30 rtl:rotate-180" />
            {crumb.href ? (
              <Link
                to={crumb.href}
                className="hover:text-foreground transition-colors rounded-md px-1.5 py-0.5 hover:bg-muted/50 truncate max-w-[140px]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium truncate max-w-[200px]">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
});
