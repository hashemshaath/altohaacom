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
import { Plus, Search, UtensilsCrossed, Calendar, MapPin, Eye, Trophy } from "lucide-react";
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
      <SEOHead title={isAr ? "التقييم والتذوق" : "Evaluation & Tasting"} description={isAr ? "جلسات تقييم المسابقات وتذوق المنتجات" : "Competition evaluation and product tasting sessions"} />
      <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
        <Header />
        
        {/* Premium Hero */}
        <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-chart-4/5">
          <div className="absolute -top-32 start-1/4 h-80 w-80 rounded-full bg-primary/10 blur-[120px] animate-pulse pointer-events-none" />
          <div className="absolute -bottom-20 end-1/3 h-64 w-64 rounded-full bg-chart-4/15 blur-[100px] animate-pulse [animation-delay:2s] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="container relative py-12 md:py-16">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary/10 ring-4 ring-primary/5 shadow-inner">
                  <UtensilsCrossed className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-3xl font-black md:text-4xl lg:text-5xl tracking-tight">{isAr ? "التقييم والتذوق" : "Evaluation & Tasting"}</h1>
                  <p className="mt-2 text-base text-muted-foreground font-medium">{isAr ? "تقييم المسابقات وجلسات تذوق المنتجات" : "Competition evaluations and product tasting sessions"}</p>
                </div>
              </div>
              {user && (
                <Button onClick={() => navigate("/tastings/create")} size="lg" className="gap-2 shadow-2xl shadow-primary/30 rounded-2xl py-7 px-8 text-lg font-bold transition-all hover:scale-105 active:scale-95">
                  <Plus className="h-5 w-5" />
                  {isAr ? "جلسة جديدة" : "New Session"}
                </Button>
              )}
            </div>
          </div>
        </section>

        <main className="container py-8">
          {/* Sticky Glass Search */}
          <div className="sticky top-[64px] z-30 -mx-4 mb-10 bg-background/80 px-4 py-4 backdrop-blur-md border-y border-border/40 md:rounded-2xl md:border md:mx-0 md:px-6 shadow-sm">
            <div className="relative max-w-md">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={isAr ? "بحث..." : "Search sessions..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-10 bg-card/50 border-border/40" />
            </div>
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
                <Card key={session.id} className="group cursor-pointer overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 hover:bg-card" onClick={() => navigate(`/tastings/${session.id}`)}>
                  {session.cover_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img src={session.cover_image_url} alt={session.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`${statusColors[session.status] || ""} font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5`}>
                        {session.status}
                      </Badge>
                      {session.competition_id ? (
                        <Badge variant="default" className="text-[9px] gap-1.5 font-bold uppercase tracking-wider">
                          <Trophy className="h-3 w-3" />
                          {isAr ? "مسابقة" : "Competition"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">
                          {isAr ? "تذوق مستقل" : "Standalone"}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">
                        {session.eval_method === "numeric" ? (isAr ? "رقمي" : "Numeric") :
                         session.eval_method === "stars" ? (isAr ? "نجوم" : "Stars") :
                         isAr ? "نجاح/رسوب" : "Pass/Fail"}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-black leading-tight group-hover:text-primary transition-colors duration-300">{isAr && session.title_ar ? session.title_ar : session.title}</h3>
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
                    {session.is_blind_tasting && (
                      <div className="mt-3">
                        <Badge variant="outline" className="text-[9px] gap-1.5 font-bold uppercase tracking-wider border-primary/20 bg-primary/5 text-primary">
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
