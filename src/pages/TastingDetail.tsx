import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTastingSession, useTastingCriteria, useTastingEntries, useTastingScores,
  useAddTastingEntry, useDeleteTastingEntry, useAddTastingCriteria, useDeleteTastingCriterion,
  useUpdateTastingSession, useCriteriaPresets,
} from "@/hooks/useTasting";
import { TastingEvaluationPanel } from "@/components/tasting/TastingEvaluationPanel";
import { TastingResultsPanel } from "@/components/tasting/TastingResultsPanel";
import { ScoringAnalytics } from "@/components/judging/ScoringAnalytics";
import { EntryComparison } from "@/components/judging/EntryComparison";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Calendar, MapPin, Eye, Plus, UtensilsCrossed, ClipboardList,
  BarChart3, Settings2, Trash2, CheckCircle2, XCircle, RefreshCw, FileEdit,
  Trophy, ArrowLeftRight, Coffee, Wine, Palette, Globe, ChefHat
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusConfig: Record<string, { en: string; ar: string; color: string }> = {
  draft: { en: "Draft", ar: "مسودة", color: "bg-muted text-muted-foreground" },
  open: { en: "Open", ar: "مفتوح", color: "bg-chart-4/10 text-chart-4 border-chart-4/30" },
  in_progress: { en: "In Progress", ar: "قيد التقييم", color: "bg-primary/10 text-primary border-primary/30" },
  completed: { en: "Completed", ar: "مكتمل", color: "bg-chart-5/10 text-chart-5 border-chart-5/30" },
  cancelled: { en: "Cancelled", ar: "ملغى", color: "bg-destructive/10 text-destructive border-destructive/30" },
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
  const { data: presets = [] } = useCriteriaPresets();
  const addEntry = useAddTastingEntry();
  const deleteEntry = useDeleteTastingEntry();
  const addCriteria = useAddTastingCriteria();
  const deleteCriterion = useDeleteTastingCriterion();
  const updateSession = useUpdateTastingSession();

  // Fetch linked competition info
  const { data: linkedCompetition } = useQuery({
    queryKey: ["linked-competition", session?.competition_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status")
        .eq("id", session!.competition_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.competition_id,
  });

  const [newEntry, setNewEntry] = useState({ dish_name: "", dish_name_ar: "", chef_name: "", chef_name_ar: "", category: "", description: "" });
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [newCriterion, setNewCriterion] = useState({ name: "", name_ar: "", description: "", max_score: 10, weight: 1 });
  const [criterionDialogOpen, setCriterionDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "entry" | "criterion"; id: string } | null>(null);

  const isOrganizer = session?.organizer_id === user?.id;

  const handleAddEntry = async () => {
    if (!newEntry.dish_name.trim() || !id) return;
    try {
      await addEntry.mutateAsync({
        session_id: id,
        dish_name: newEntry.dish_name,
        dish_name_ar: newEntry.dish_name_ar || null,
        chef_name: newEntry.chef_name || null,
        chef_name_ar: newEntry.chef_name_ar || null,
        category: newEntry.category || null,
        description: newEntry.description || null,
        entry_number: entries.length + 1,
        sort_order: entries.length,
      } as any);
      setNewEntry({ dish_name: "", dish_name_ar: "", chef_name: "", chef_name_ar: "", category: "", description: "" });
      setEntryDialogOpen(false);
      toast.success(isAr ? "تمت إضافة الطبق" : "Entry added");
    } catch {
      toast.error(isAr ? "خطأ في الإضافة" : "Failed to add entry");
    }
  };

  const handleAddCriterion = async () => {
    if (!newCriterion.name.trim() || !id) return;
    try {
      await addCriteria.mutateAsync([{
        session_id: id,
        name: newCriterion.name,
        name_ar: newCriterion.name_ar || null,
        description: newCriterion.description || null,
        max_score: newCriterion.max_score,
        weight: newCriterion.weight,
        sort_order: criteria.length,
        is_required: true,
      }]);
      setNewCriterion({ name: "", name_ar: "", description: "", max_score: 10, weight: 1 });
      setCriterionDialogOpen(false);
      toast.success(isAr ? "تمت إضافة المعيار" : "Criterion added");
    } catch {
      toast.error(isAr ? "خطأ" : "Failed to add criterion");
    }
  };

  const handleLoadPreset = async (presetId: string) => {
    if (!id) return;
    const preset = presets.find(p => p.id === presetId);
    if (!preset?.criteria) return;
    try {
      const items = preset.criteria.map((c, i) => ({
        session_id: id,
        name: c.name,
        name_ar: c.name_ar,
        description: c.description || null,
        max_score: c.max_score,
        weight: c.weight,
        sort_order: criteria.length + i,
      }));
      await addCriteria.mutateAsync(items);
      toast.success(isAr ? "تم تحميل القالب" : "Preset loaded");
    } catch {
      toast.error(isAr ? "خطأ" : "Failed to load preset");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !id) return;
    try {
      if (deleteTarget.type === "entry") {
        await deleteEntry.mutateAsync({ id: deleteTarget.id, sessionId: id });
      } else {
        await deleteCriterion.mutateAsync({ id: deleteTarget.id, sessionId: id });
      }
      toast.success(isAr ? "تم الحذف" : "Deleted successfully");
    } catch {
      toast.error(isAr ? "خطأ في الحذف" : "Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="grid gap-3 grid-cols-3 mb-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-medium">{isAr ? "الجلسة غير موجودة" : "Session not found"}</p>
          <Button variant="ghost" onClick={() => navigate("/tastings")} className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "العودة" : "Go Back"}
          </Button>
        </main>
      </div>
    );
  }

  const sc = statusConfig[session.status] || statusConfig.draft;

  // Unique judges count
  const judgeIds = new Set(scores.map(s => s.judge_id));

  return (
    <>
      <SEOHead title={session.title} />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Button variant="ghost" onClick={() => navigate("/tastings")} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "جلسات التذوق" : "Tasting Sessions"}
          </Button>

          {/* Hero Header */}
          <div className="mb-6 rounded-xl border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className={`${sc.color} gap-1`}>
                    {isAr ? sc.ar : sc.en}
                  </Badge>
                  <Badge variant="secondary">
                    {session.eval_method === "numeric" ? (isAr ? "تقييم رقمي" : "Numeric") :
                     session.eval_method === "stars" ? (isAr ? "نجوم" : "Stars") :
                     isAr ? "نجاح/رسوب" : "Pass/Fail"}
                  </Badge>
                  {session.is_blind_tasting && (
                    <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" />{isAr ? "تذوق أعمى" : "Blind Tasting"}</Badge>
                  )}
                  {linkedCompetition ? (
                    <Badge variant="default" className="gap-1">
                      <Trophy className="h-3 w-3" />
                      {isAr ? "مسابقة" : "Competition"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">{isAr ? "تذوق مستقل" : "Standalone"}</Badge>
                  )}
                  {session.evaluation_category && session.evaluation_category !== "culinary" && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      {session.evaluation_category === "coffee" && <><Coffee className="h-3 w-3" />{isAr ? "قهوة" : "Coffee"}</>}
                      {session.evaluation_category === "barista" && <><ChefHat className="h-3 w-3" />{isAr ? "باريستا" : "Barista"}</>}
                      {session.evaluation_category === "beverage" && <><Wine className="h-3 w-3" />{isAr ? "مشروبات" : "Beverage"}</>}
                      {session.evaluation_category === "decoration" && <><Palette className="h-3 w-3" />{isAr ? "تزيين" : "Decoration"}</>}
                      {session.evaluation_category === "local_dishes" && <><UtensilsCrossed className="h-3 w-3" />{isAr ? "أطباق محلية" : "Local Dishes"}</>}
                      {session.evaluation_category === "international" && <><Globe className="h-3 w-3" />{isAr ? "معايير دولية" : "International"}</>}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold sm:text-3xl">{isAr && session.title_ar ? session.title_ar : session.title}</h1>
                {session.description && (
                  <p className="mt-2 text-muted-foreground max-w-2xl">{isAr && session.description_ar ? session.description_ar : session.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {linkedCompetition && (
                    <Link to={`/competitions/${linkedCompetition.id}`} className="flex items-center gap-1.5 text-primary hover:underline">
                      <Trophy className="h-4 w-4" />
                      {isAr && linkedCompetition.title_ar ? linkedCompetition.title_ar : linkedCompetition.title}
                    </Link>
                  )}
                  {session.session_date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(session.session_date), "PPp")}
                      {session.session_end && ` — ${format(new Date(session.session_end), "p")}`}
                    </span>
                  )}
                  {session.venue && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {isAr && session.venue_ar ? session.venue_ar : session.venue}
                      {session.city ? `, ${session.city}` : ""}
                      {session.country ? ` · ${session.country}` : ""}
                    </span>
                  )}
                </div>
              </div>
              {isOrganizer && (
                <Select value={session.status} onValueChange={v => updateSession.mutateAsync({ id: session.id, status: v } as any)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: UtensilsCrossed, label: isAr ? "أطباق" : "Entries", value: entries.length, accent: "text-primary bg-primary/10" },
              { icon: ClipboardList, label: isAr ? "معايير" : "Criteria", value: criteria.length, accent: "text-chart-4 bg-chart-4/10" },
              { icon: BarChart3, label: isAr ? "تقييمات" : "Scores", value: scores.length, accent: "text-chart-5 bg-chart-5/10" },
              { icon: Eye, label: isAr ? "محكمين" : "Judges", value: judgeIds.size, accent: "text-chart-3 bg-chart-3/10" },
            ].map((s, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
                    <s.icon className="h-5 w-5" />
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
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="evaluate" className="gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                {isAr ? "التقييم" : "Evaluate"}
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                {isAr ? "النتائج" : "Results"}
              </TabsTrigger>
              {session.competition_id && (
                <>
                  <TabsTrigger value="analytics" className="gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    {isAr ? "تحليلات التقييم" : "Scoring Analytics"}
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="gap-1.5">
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    {isAr ? "المقارنة" : "Compare"}
                  </TabsTrigger>
                </>
              )}
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
                  <CardContent className="flex flex-col items-center py-16">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                      <UtensilsCrossed className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="font-medium">{isAr ? "لا توجد أطباق للتقييم" : "No entries to evaluate"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{isAr ? "أضف أطباق من قسم الإدارة" : "Add entries from the Manage tab"}</p>
                  </CardContent>
                </Card>
              ) : criteria.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-16">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                      <ClipboardList className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="font-medium">{isAr ? "لا توجد معايير تقييم" : "No evaluation criteria defined"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{isAr ? "حدد معايير التقييم من قسم الإدارة" : "Define criteria from the Manage tab"}</p>
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

            {session.competition_id && (
              <>
                <TabsContent value="analytics">
                  <ScoringAnalytics competitionId={session.competition_id} />
                </TabsContent>
                <TabsContent value="comparison">
                  <EntryComparison competitionId={session.competition_id} />
                </TabsContent>
              </>
            )}

            {isOrganizer && (
              <TabsContent value="manage">
                <div className="space-y-6">
                  {/* ── Entries Management ── */}
                  <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{isAr ? "الأطباق / العينات" : "Entries / Samples"}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
                      </div>
                      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />{isAr ? "إضافة طبق" : "Add Entry"}</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>{isAr ? "إضافة طبق جديد" : "Add New Entry"}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>{isAr ? "اسم الطبق (إنجليزي)" : "Dish Name (English)"} *</Label>
                                <Input value={newEntry.dish_name} onChange={e => setNewEntry(n => ({ ...n, dish_name: e.target.value }))} />
                              </div>
                              <div className="space-y-2">
                                <Label>{isAr ? "اسم الطبق (عربي)" : "Dish Name (Arabic)"}</Label>
                                <Input value={newEntry.dish_name_ar} onChange={e => setNewEntry(n => ({ ...n, dish_name_ar: e.target.value }))} dir="rtl" />
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>{isAr ? "اسم الشيف (إنجليزي)" : "Chef / Producer"}</Label>
                                <Input value={newEntry.chef_name} onChange={e => setNewEntry(n => ({ ...n, chef_name: e.target.value }))} />
                              </div>
                              <div className="space-y-2">
                                <Label>{isAr ? "اسم الشيف (عربي)" : "Chef (Arabic)"}</Label>
                                <Input value={newEntry.chef_name_ar} onChange={e => setNewEntry(n => ({ ...n, chef_name_ar: e.target.value }))} dir="rtl" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>{isAr ? "الفئة" : "Category"}</Label>
                              <Input value={newEntry.category} onChange={e => setNewEntry(n => ({ ...n, category: e.target.value }))} placeholder={isAr ? "مثال: حلويات، مقبلات" : "e.g., Desserts, Appetizers"} />
                            </div>
                            <div className="space-y-2">
                              <Label>{isAr ? "وصف" : "Description"}</Label>
                              <Textarea value={newEntry.description} onChange={e => setNewEntry(n => ({ ...n, description: e.target.value }))} rows={2} />
                            </div>
                            <Button onClick={handleAddEntry} disabled={addEntry.isPending || !newEntry.dish_name.trim()} className="w-full">
                              {addEntry.isPending ? <RefreshCw className="me-2 h-4 w-4 animate-spin" /> : null}
                              {isAr ? "إضافة" : "Add Entry"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {entries.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                          <UtensilsCrossed className="mb-2 h-8 w-8 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد أطباق بعد" : "No entries yet"}</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {entries.map((e, i) => {
                            const entryScores = scores.filter(s => s.entry_id === e.id);
                            return (
                              <div key={e.id} className="flex items-center gap-3 py-3 group">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                  {e.entry_number || i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">{isAr && e.dish_name_ar ? e.dish_name_ar : e.dish_name}</p>
                                    {e.category && <Badge variant="outline" className="text-[10px] shrink-0">{e.category}</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {e.chef_name && <p className="text-xs text-muted-foreground">{isAr && e.chef_name_ar ? e.chef_name_ar : e.chef_name}</p>}
                                    {entryScores.length > 0 && (
                                      <Badge variant="secondary" className="text-[10px] h-4">{entryScores.length} {isAr ? "تقييم" : "scores"}</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: "entry", id: e.id })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ── Criteria Management ── */}
                  <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{isAr ? "معايير التقييم" : "Evaluation Criteria"}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{criteria.length}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {presets.length > 0 && (
                          <Select onValueChange={handleLoadPreset}>
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue placeholder={isAr ? "قالب..." : "Preset..."} />
                            </SelectTrigger>
                            <SelectContent>
                              {presets.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {isAr && p.preset_name_ar ? p.preset_name_ar : p.preset_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Dialog open={criterionDialogOpen} onOpenChange={setCriterionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" />{isAr ? "معيار" : "Add"}</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>{isAr ? "إضافة معيار تقييم" : "Add Evaluation Criterion"}</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>{isAr ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                                  <Input value={newCriterion.name} onChange={e => setNewCriterion(c => ({ ...c, name: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                  <Label>{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                                  <Input value={newCriterion.name_ar} onChange={e => setNewCriterion(c => ({ ...c, name_ar: e.target.value }))} dir="rtl" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>{isAr ? "الوصف" : "Description"}</Label>
                                <Textarea value={newCriterion.description} onChange={e => setNewCriterion(c => ({ ...c, description: e.target.value }))} rows={2} />
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>{isAr ? "الحد الأقصى" : "Max Score"}</Label>
                                  <Input type="number" value={newCriterion.max_score} onChange={e => setNewCriterion(c => ({ ...c, max_score: Number(e.target.value) }))} min={1} />
                                </div>
                                <div className="space-y-2">
                                  <Label>{isAr ? "الوزن" : "Weight"}</Label>
                                  <Input type="number" value={newCriterion.weight} onChange={e => setNewCriterion(c => ({ ...c, weight: Number(e.target.value) }))} min={0.1} step={0.1} />
                                </div>
                              </div>
                              <Button onClick={handleAddCriterion} disabled={addCriteria.isPending || !newCriterion.name.trim()} className="w-full">
                                {addCriteria.isPending ? <RefreshCw className="me-2 h-4 w-4 animate-spin" /> : null}
                                {isAr ? "إضافة المعيار" : "Add Criterion"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {criteria.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                          <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد معايير" : "No criteria defined"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{isAr ? "استخدم قالب جاهز أو أضف معايير يدوياً" : "Load a preset or add criteria manually"}</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {criteria.map(c => (
                            <div key={c.id} className="flex items-center gap-3 py-3 group">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{isAr && c.name_ar ? c.name_ar : c.name}</p>
                                {c.description && <p className="text-xs text-muted-foreground mt-0.5">{isAr && c.description_ar ? c.description_ar : c.description}</p>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="text-xs">{isAr ? "الحد" : "Max"}: {c.max_score}</Badge>
                                {c.weight !== 1 && <Badge variant="secondary" className="text-xs">×{c.weight}</Badge>}
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: "criterion", id: c.id })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Session Notes */}
                  {session.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileEdit className="h-4 w-4 text-primary" />
                          {isAr ? "ملاحظات الجلسة" : "Session Notes"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{session.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </main>
        <Footer />
      </div>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget?.type === "entry"
              ? (isAr ? "هل أنت متأكد من حذف هذا الطبق؟ ستُحذف جميع التقييمات المرتبطة." : "Are you sure? All associated scores will be removed.")
              : (isAr ? "هل أنت متأكد من حذف هذا المعيار؟" : "Are you sure you want to delete this criterion?")}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {isAr ? "حذف" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
