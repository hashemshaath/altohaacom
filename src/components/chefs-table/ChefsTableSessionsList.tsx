import { forwardRef, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChefHat, Calendar, MapPin, Package, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import type { ChefsTableSession } from "@/hooks/useChefsTable";

interface Props {
  isAr: boolean;
  sessions: ChefsTableSession[] | undefined;
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onSessionClick: (id: string) => void;
}

const statusConfig: Record<string, { color: string; en: string; ar: string }> = {
  scheduled: { color: "bg-chart-4/10 text-chart-4 border-chart-4/30", en: "Scheduled", ar: "مجدول" },
  in_progress: { color: "bg-primary/10 text-primary border-primary/30", en: "In Progress", ar: "قيد التنفيذ" },
  completed: { color: "bg-chart-5/10 text-chart-5 border-chart-5/30", en: "Completed", ar: "مكتمل" },
  cancelled: { color: "bg-destructive/10 text-destructive border-destructive/30", en: "Cancelled", ar: "ملغي" },
};

const experienceLabels: Record<string, { en: string; ar: string }> = {
  venue: { en: "On-Site", ar: "في الموقع" },
  chef_kitchen: { en: "Chef's Kitchen", ar: "مطبخ الشيف" },
  sample_delivery: { en: "Sample Delivery", ar: "توصيل عينات" },
};

const categoryLabels: Record<string, { en: string; ar: string }> = {
  meat: { en: "Meat", ar: "لحوم" },
  rice: { en: "Rice & Grains", ar: "أرز وحبوب" },
  spices: { en: "Spices", ar: "بهارات" },
  pasta: { en: "Pasta", ar: "معكرونة" },
  dairy: { en: "Dairy", ar: "ألبان" },
  oils: { en: "Oils", ar: "زيوت" },
  sauces: { en: "Sauces", ar: "صلصات" },
  general: { en: "General", ar: "عام" },
  other: { en: "Other", ar: "أخرى" },
};

export const ChefsTableSessionsList = memo(forwardRef<HTMLElement, Props>(function ChefsTableSessionsList({ isAr, sessions, isLoading, search, onSearchChange, statusFilter, onStatusFilterChange, onSessionClick }: Props, ref) {
  return (
    <section ref={ref} className="bg-muted/20">
      <div className="container py-16 md:py-24 pb-20">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4">
            {isAr ? "الجلسات" : "Sessions"}
          </span>
          <h2 className="text-2xl font-black md:text-3xl text-foreground">
            {isAr ? "جلسات التقييم" : "Evaluation Sessions"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{isAr ? "استعرض جلسات التقييم المنشورة" : "Browse published evaluation sessions"}</p>
        </div>

        {/* Search & Filter */}
        <div className="sticky top-12 z-40 -mx-4 mb-10 bg-background/80 px-4 py-4 backdrop-blur-xl border-y border-border/40 md:rounded-2xl md:border md:mx-0 md:px-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder={isAr ? "ابحث عن منتج أو جلسة..." : "Search products or sessions..."}
                value={search} onChange={e => onSearchChange(e.target.value)}
                className="h-11 border-border/40 bg-muted/20 ps-11 rounded-xl"
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40">
                <SelectItem value="all" className="rounded-lg">{isAr ? "كل الحالات" : "All Statuses"}</SelectItem>
                <SelectItem value="scheduled" className="rounded-lg">{isAr ? "مجدول" : "Scheduled"}</SelectItem>
                <SelectItem value="in_progress" className="rounded-lg">{isAr ? "قيد التنفيذ" : "In Progress"}</SelectItem>
                <SelectItem value="completed" className="rounded-lg">{isAr ? "مكتمل" : "Completed"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card p-1">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions?.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-card">
            <div className="flex flex-col items-center py-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <ChefHat className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-bold text-foreground">{isAr ? "لا توجد جلسات بعد" : "No sessions yet"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAr ? "اطلب تقييم منتجك من طهاة محترفين" : "Request a professional product evaluation from expert chefs"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sessions?.map(session => {
              const sc = statusConfig[session.status];
              return (
                <Card
                  key={session.id}
                  className="group cursor-pointer overflow-hidden border-border/40 bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.98]"
                  onClick={() => onSessionClick(session.id)}
                >
                  {/* Image */}
                  {session.cover_image_url && (
                    <div className="relative aspect-video overflow-hidden">
                      <img src={session.cover_image_url} alt={session.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {sc && (
                        <Badge variant="outline" className={`absolute top-3 start-3 ${sc.color} font-bold text-xs border backdrop-blur-sm`}>
                          {isAr ? sc.ar : sc.en}
                        </Badge>
                      )}
                      <div className="absolute top-3 end-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}

                  <CardContent className="p-5">
                    {/* Tags */}
                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                      {!session.cover_image_url && sc && (
                        <Badge variant="outline" className={`${sc.color} font-bold text-xs`}>
                          {isAr ? sc.ar : sc.en}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs font-semibold gap-1">
                        <Package className="h-3 w-3" />
                        {categoryLabels[session.product_category]?.[isAr ? "ar" : "en"] || session.product_category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {experienceLabels[session.experience_type]?.[isAr ? "ar" : "en"] || session.experience_type}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold leading-snug text-foreground group-hover:text-primary transition-colors duration-300">
                      {isAr && session.title_ar ? session.title_ar : session.title}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-primary/70">
                      {isAr && session.product_name_ar ? session.product_name_ar : session.product_name}
                    </p>

                    {session.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                        {isAr && session.description_ar ? session.description_ar : session.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
                      {session.session_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary/60" />
                          {format(new Date(session.session_date), "MMM d, yyyy")}
                        </span>
                      )}
                      {session.venue && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-chart-4/70" />
                          {isAr && session.venue_ar ? session.venue_ar : session.venue}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}));
