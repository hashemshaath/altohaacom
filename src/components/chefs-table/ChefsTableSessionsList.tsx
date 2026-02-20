import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChefHat, Calendar, MapPin, Package } from "lucide-react";
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

const statusColors: Record<string, string> = {
  scheduled: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
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

export function ChefsTableSessionsList({ isAr, sessions, isLoading, search, onSearchChange, statusFilter, onStatusFilterChange, onSessionClick }: Props) {
  return (
    <main className="container py-8 pb-16">
      <div className="mx-auto max-w-2xl text-center mb-10">
        <h2 className={`text-2xl font-black md:text-3xl ${!isAr ? "font-serif" : ""}`}>
          {isAr ? "جلسات التقييم" : "Evaluation Sessions"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{isAr ? "استعرض جلسات التقييم المنشورة" : "Browse published evaluation sessions"}</p>
      </div>

      {/* Search & Filter */}
      <div className="sticky top-12 z-40 -mx-4 mb-10 bg-background/80 px-4 py-4 backdrop-blur-md border-y border-border/40 md:rounded-2xl md:border md:mx-0 md:px-6 shadow-sm">
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
            <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-40">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : sessions?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <ChefHat className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium">{isAr ? "لا توجد جلسات بعد" : "No sessions yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr ? "اطلب تقييم منتجك من طهاة محترفين" : "Request a professional product evaluation from expert chefs"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions?.map(session => (
            <Card
              key={session.id}
              className="group cursor-pointer overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 hover:bg-card"
              onClick={() => onSessionClick(session.id)}
            >
              {session.cover_image_url && (
                <div className="aspect-video overflow-hidden">
                  <img src={session.cover_image_url} alt={session.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                </div>
              )}
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`${statusColors[session.status] || ""} font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5`}>
                    {session.status === "scheduled" ? (isAr ? "مجدول" : "Scheduled") :
                     session.status === "in_progress" ? (isAr ? "قيد التنفيذ" : "In Progress") :
                     session.status === "completed" ? (isAr ? "مكتمل" : "Completed") :
                     isAr ? "ملغي" : "Cancelled"}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider gap-1">
                    <Package className="h-3 w-3" />
                    {categoryLabels[session.product_category]?.[isAr ? "ar" : "en"] || session.product_category}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">
                    {experienceLabels[session.experience_type]?.[isAr ? "ar" : "en"] || session.experience_type}
                  </Badge>
                </div>

                <h3 className="text-lg font-black leading-tight group-hover:text-primary transition-colors duration-300">
                  {isAr && session.title_ar ? session.title_ar : session.title}
                </h3>

                <p className="mt-1 text-sm font-semibold text-primary/80">
                  {isAr && session.product_name_ar ? session.product_name_ar : session.product_name}
                </p>

                {session.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground font-medium leading-relaxed">
                    {isAr && session.description_ar ? session.description_ar : session.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-muted-foreground">
                  {session.session_date && (
                    <span className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-3 w-3 text-primary" />
                      </div>
                      {format(new Date(session.session_date), "MMM d, yyyy")}
                    </span>
                  )}
                  {session.venue && (
                    <span className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-chart-4/10">
                        <MapPin className="h-3 w-3 text-chart-4" />
                      </div>
                      {isAr && session.venue_ar ? session.venue_ar : session.venue}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
