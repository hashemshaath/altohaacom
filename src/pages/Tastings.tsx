import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTastingSessions } from "@/hooks/useTasting";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, UtensilsCrossed, Calendar, MapPin, Eye } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function Tastings() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: sessions, isLoading } = useTastingSessions();
  const [search, setSearch] = useState("");

  const filtered = sessions?.filter(s => {
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
  });

  return (
    <>
      <SEOHead title={isAr ? "جلسات التذوق" : "Tasting Sessions"} description={isAr ? "استكشف وأنشئ جلسات تذوق الطعام" : "Explore and create food tasting sessions"} />
      <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{isAr ? "جلسات التذوق" : "Tasting Sessions"}</h1>
              <p className="mt-1 text-muted-foreground">{isAr ? "تقييم الأطباق بمعايير احترافية" : "Evaluate dishes with professional criteria"}</p>
            </div>
            {user && (
              <Button onClick={() => navigate("/tastings/create")} className="gap-2">
                <Plus className="h-4 w-4" />
                {isAr ? "جلسة جديدة" : "New Session"}
              </Button>
            )}
          </div>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-10" />
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : filtered?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-medium">{isAr ? "لا توجد جلسات بعد" : "No sessions yet"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{isAr ? "أنشئ أول جلسة تذوق" : "Create your first tasting session"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered?.map(session => (
                <Card key={session.id} className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5" onClick={() => navigate(`/tastings/${session.id}`)}>
                  {session.cover_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img src={session.cover_image_url} alt={session.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[session.status] || ""}>
                        {session.status}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {session.eval_method === "numeric" ? (isAr ? "رقمي" : "Numeric") :
                         session.eval_method === "stars" ? (isAr ? "نجوم" : "Stars") :
                         isAr ? "نجاح/رسوب" : "Pass/Fail"}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold leading-tight">{isAr && session.title_ar ? session.title_ar : session.title}</h3>
                    {session.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                        {isAr && session.description_ar ? session.description_ar : session.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {session.session_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(session.session_date), "MMM d, yyyy")}
                        </span>
                      )}
                      {session.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {isAr && session.venue_ar ? session.venue_ar : session.venue}
                        </span>
                      )}
                    </div>
                    {session.is_blind_tasting && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Eye className="h-3 w-3" />
                          {isAr ? "تذوق أعمى" : "Blind Tasting"}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
