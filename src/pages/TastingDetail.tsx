import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTastingSession, useTastingCriteria, useTastingEntries, useTastingScores, useAddTastingEntry } from "@/hooks/useTasting";
import { TastingEvaluationPanel } from "@/components/tasting/TastingEvaluationPanel";
import { TastingResultsPanel } from "@/components/tasting/TastingResultsPanel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, MapPin, Eye, Plus, UtensilsCrossed, ClipboardList, BarChart3, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusLabels: Record<string, { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" },
  open: { en: "Open", ar: "مفتوح" },
  in_progress: { en: "In Progress", ar: "قيد التقييم" },
  completed: { en: "Completed", ar: "مكتمل" },
  cancelled: { en: "Cancelled", ar: "ملغى" },
};

export default function TastingDetail() {
  const { id } = useParams();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: session, isLoading } = useTastingSession(id);
  const { data: criteria = [] } = useTastingCriteria(id);
  const { data: entries = [] } = useTastingEntries(id);
  const { data: scores = [] } = useTastingScores(id);
  const addEntry = useAddTastingEntry();

  const [newEntry, setNewEntry] = useState({ dish_name: "", dish_name_ar: "", chef_name: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const isOrganizer = session?.organizer_id === user?.id;

  const handleAddEntry = async () => {
    if (!newEntry.dish_name.trim() || !id) return;
    try {
      await addEntry.mutateAsync({
        session_id: id,
        dish_name: newEntry.dish_name,
        dish_name_ar: newEntry.dish_name_ar || null,
        chef_name: newEntry.chef_name || null,
        entry_number: entries.length + 1,
        sort_order: entries.length,
      } as any);
      setNewEntry({ dish_name: "", dish_name_ar: "", chef_name: "" });
      setDialogOpen(false);
      toast.success(isAr ? "تمت إضافة الطبق" : "Entry added");
    } catch {
      toast.error(isAr ? "خطأ" : "Failed to add entry");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex flex-col items-center px-4 py-20">
          <p className="text-lg text-muted-foreground">{isAr ? "الجلسة غير موجودة" : "Session not found"}</p>
          <Button variant="ghost" onClick={() => navigate("/tastings")} className="mt-4">{isAr ? "العودة" : "Go Back"}</Button>
        </main>
      </div>
    );
  }

  const statusInfo = statusLabels[session.status] || { en: session.status, ar: session.status };

  return (
    <>
      <SEOHead title={session.title} />
      <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate("/tastings")} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "العودة" : "Back"}
          </Button>

          {/* Session Header */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Badge variant="outline">{isAr ? statusInfo.ar : statusInfo.en}</Badge>
              <Badge variant="secondary">
                {session.eval_method === "numeric" ? (isAr ? "رقمي" : "Numeric") :
                 session.eval_method === "stars" ? (isAr ? "نجوم" : "Stars") :
                 isAr ? "نجاح/رسوب" : "Pass/Fail"}
              </Badge>
              {session.is_blind_tasting && (
                <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" />{isAr ? "أعمى" : "Blind"}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{isAr && session.title_ar ? session.title_ar : session.title}</h1>
            {session.description && (
              <p className="mt-1 text-muted-foreground">{isAr && session.description_ar ? session.description_ar : session.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {session.session_date && (
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(new Date(session.session_date), "PPp")}</span>
              )}
              {session.venue && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{isAr && session.venue_ar ? session.venue_ar : session.venue}{session.city ? `, ${session.city}` : ""}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { icon: UtensilsCrossed, label: isAr ? "أطباق" : "Entries", value: entries.length },
              { icon: ClipboardList, label: isAr ? "معايير" : "Criteria", value: criteria.length },
              { icon: BarChart3, label: isAr ? "تقييمات" : "Scores", value: scores.length },
            ].map((s, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="evaluate">
            <TabsList className="mb-4">
              <TabsTrigger value="evaluate" className="gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                {isAr ? "التقييم" : "Evaluate"}
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                {isAr ? "النتائج" : "Results"}
              </TabsTrigger>
              {isOrganizer && (
                <TabsTrigger value="manage" className="gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" />
                  {isAr ? "إدارة" : "Manage"}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="evaluate">
              {entries.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12">
                    <UtensilsCrossed className="mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{isAr ? "لا توجد أطباق للتقييم" : "No entries to evaluate"}</p>
                  </CardContent>
                </Card>
              ) : criteria.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12">
                    <ClipboardList className="mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{isAr ? "لا توجد معايير" : "No criteria defined"}</p>
                  </CardContent>
                </Card>
              ) : (
                <TastingEvaluationPanel
                  sessionId={session.id}
                  entries={entries}
                  criteria={criteria}
                  scores={scores}
                  evalMethod={session.eval_method}
                  allowNotes={session.allow_notes ?? true}
                  isBlind={session.is_blind_tasting ?? false}
                />
              )}
            </TabsContent>

            <TabsContent value="results">
              <TastingResultsPanel entries={entries} criteria={criteria} scores={scores} evalMethod={session.eval_method} />
            </TabsContent>

            {isOrganizer && (
              <TabsContent value="manage">
                <div className="space-y-6">
                  {/* Entries Management */}
                  <Card>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle className="text-base">{isAr ? "الأطباق" : "Entries"}</CardTitle>
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />{isAr ? "إضافة" : "Add"}</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>{isAr ? "إضافة طبق" : "Add Entry"}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>{isAr ? "اسم الطبق" : "Dish Name"} *</Label>
                              <Input value={newEntry.dish_name} onChange={e => setNewEntry(n => ({ ...n, dish_name: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                              <Label>{isAr ? "اسم الطبق (عربي)" : "Dish Name (Arabic)"}</Label>
                              <Input value={newEntry.dish_name_ar} onChange={e => setNewEntry(n => ({ ...n, dish_name_ar: e.target.value }))} dir="rtl" />
                            </div>
                            <div className="space-y-2">
                              <Label>{isAr ? "اسم الشيف" : "Chef Name"}</Label>
                              <Input value={newEntry.chef_name} onChange={e => setNewEntry(n => ({ ...n, chef_name: e.target.value }))} />
                            </div>
                            <Button onClick={handleAddEntry} disabled={addEntry.isPending} className="w-full">
                              {addEntry.isPending ? (isAr ? "جارٍ الإضافة..." : "Adding...") : (isAr ? "إضافة" : "Add Entry")}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {entries.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "لا توجد أطباق" : "No entries yet"}</p>
                      ) : (
                        <div className="divide-y">
                          {entries.map((e, i) => (
                            <div key={e.id} className="flex items-center gap-3 py-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">{e.entry_number || i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{isAr && e.dish_name_ar ? e.dish_name_ar : e.dish_name}</p>
                                {e.chef_name && <p className="text-xs text-muted-foreground">{e.chef_name}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Criteria List */}
                  <Card>
                    <CardHeader><CardTitle className="text-base">{isAr ? "المعايير" : "Criteria"}</CardTitle></CardHeader>
                    <CardContent>
                      {criteria.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "لا توجد معايير" : "No criteria"}</p>
                      ) : (
                        <div className="divide-y">
                          {criteria.map(c => (
                            <div key={c.id} className="flex items-center justify-between py-2.5">
                              <div>
                                <p className="text-sm font-medium">{isAr && c.name_ar ? c.name_ar : c.name}</p>
                                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{isAr ? "الحد الأقصى" : "Max"}: {c.max_score}</Badge>
                                {c.weight > 1 && <Badge variant="secondary" className="text-xs">×{c.weight}</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </main>
        <Footer />
      </div>
    </>
  );
}
