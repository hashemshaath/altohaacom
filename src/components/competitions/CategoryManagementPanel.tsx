import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  Plus, Trash2, Pencil, Users, Image, Filter,
  Eye, ArrowLeft, Trophy, Pause, Play, FileText,
  Save, X, Loader2,
} from "lucide-react";
import { GENDER_OPTIONS, PARTICIPANT_LEVELS, genderDisplay, levelDisplay, categoryBadgeText } from "@/lib/categoryUtils";

interface CategoryManagementPanelProps {
  competitionId: string;
  isOrganizer?: boolean;
  competitionStatus?: string;
}

interface CategoryFormData {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  max_participants: number | null;
  gender: string;
  participant_level: string;
  status: string;
  cover_image_url: string;
}

const emptyForm: CategoryFormData = {
  name: "", name_ar: "", description: "", description_ar: "",
  max_participants: null, gender: "open", participant_level: "open", status: "active", cover_image_url: "",
};

export function CategoryManagementPanel({ competitionId, isOrganizer, competitionStatus }: CategoryManagementPanelProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [view, setView] = useState<"list" | "detail" | "form">("list");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [filterGender, setFilterGender] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["competition-categories-full", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_categories")
        .select("*")
        .eq("competition_id", competitionId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["category-registrations", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_registrations")
        .select("*, profiles:participant_id(full_name, username, avatar_url)")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
  });

  const { data: scores = [] } = useQuery({
    queryKey: ["category-scores", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_scores")
        .select("*, registration:registration_id(category_id, participant_id)")
        .order("score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: competitionStatus === "completed" || competitionStatus === "judging",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("competition_categories").update({
          name: form.name, name_ar: form.name_ar || null,
          description: form.description || null, description_ar: form.description_ar || null,
          max_participants: form.max_participants,
          gender: form.gender, status: form.status,
          participant_level: form.participant_level,
          cover_image_url: form.cover_image_url || null,
        } as any).eq("id", editingId);
        if (error) throw error;
      } else {
        const sortOrder = (categories.length || 0) + 1;
        const { error } = await supabase.from("competition_categories").insert({
          competition_id: competitionId,
          name: form.name, name_ar: form.name_ar || null,
          description: form.description || null, description_ar: form.description_ar || null,
          max_participants: form.max_participants,
          gender: form.gender, status: form.status,
          participant_level: form.participant_level,
          cover_image_url: form.cover_image_url || null,
          sort_order: sortOrder,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-categories-full", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["competition-categories", competitionId] });
      toast({ title: isAr ? "تم الحفظ بنجاح" : "Saved successfully" });
      setView("list");
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competition_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-categories-full", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["competition-categories", competitionId] });
      toast({ title: isAr ? "تم الحذف" : "Category deleted" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("competition_categories").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-categories-full", competitionId] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const filtered = categories.filter((cat: any) => {
    if (filterGender !== "all" && cat.gender !== filterGender) return false;
    if (filterStatus !== "all" && cat.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return cat.name.toLowerCase().includes(q) || (cat.name_ar || "").includes(q);
    }
    return true;
  });

  const getCategoryRegistrations = (catId: string) =>
    registrations.filter((r: any) => r.category_id === catId);

  const genderLabel = (g: string) => {
    const d = genderDisplay(g, isAr);
    return `${d.symbol} ${d.label}`;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-chart-5/10 text-chart-5",
      draft: "bg-muted text-muted-foreground",
      suspended: "bg-chart-4/10 text-chart-4",
    };
    return <Badge className={map[s] || ""} variant="outline">{isAr ? (s === "active" ? "نشط" : s === "draft" ? "مسودة" : "معلق") : s}</Badge>;
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name, name_ar: cat.name_ar || "", description: cat.description || "",
      description_ar: cat.description_ar || "", max_participants: cat.max_participants,
      gender: cat.gender === "mixed" ? "open" : (cat.gender || "open"),
      participant_level: cat.participant_level || "open",
      status: cat.status || "active",
      cover_image_url: cat.cover_image_url || "",
    });
    setView("form");
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setView("form");
  };

  const openDetail = (catId: string) => {
    setSelectedCategoryId(catId);
    setView("detail");
  };

  // ---- DETAIL VIEW ----
  if (view === "detail" && selectedCategoryId) {
    const cat = categories.find((c: any) => c.id === selectedCategoryId);
    if (!cat) return null;
    const catRegs = getCategoryRegistrations(cat.id);
    const approved = catRegs.filter((r: any) => r.status === "approved");
    const pending = catRegs.filter((r: any) => r.status === "pending");
    const fill = cat.max_participants ? (approved.length / cat.max_participants) * 100 : 0;

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setView("list")} className="-ms-2">
          <ArrowLeft className="me-1.5 h-4 w-4" />
          {isAr ? "العودة للفئات" : "Back to Categories"}
        </Button>

        <Card className="overflow-hidden">
          {cat.cover_image_url && (
            <img src={cat.cover_image_url} alt={cat.name} className="h-40 w-full object-cover" />
          )}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{isAr && cat.name_ar ? cat.name_ar : cat.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr && cat.description_ar ? cat.description_ar : cat.description}
                </p>
              </div>
              <div className="flex gap-2">
                {statusBadge(cat.status || "active")}
                <Badge variant="outline">{categoryBadgeText(cat.gender, cat.participant_level, isAr)}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {cat.max_participants && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{isAr ? "المشاركين" : "Participants"}</span>
                  <span className="font-medium">{approved.length}/{cat.max_participants}</span>
                </div>
                <Progress value={fill} className="h-2" />
              </div>
            )}

            {/* Approved Participants */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {isAr ? `المشاركين المؤهلين (${approved.length})` : `Qualified Participants (${approved.length})`}
              </h4>
              {approved.length > 0 ? (
                <div className="space-y-2">
                  {approved.map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {(reg.profiles?.full_name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{reg.profiles?.full_name || reg.profiles?.username || "—"}</p>
                          {reg.dish_name && <p className="text-xs text-muted-foreground">{reg.dish_name}</p>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{reg.registration_number || "—"}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {isAr ? "لا يوجد مشاركين مؤهلين بعد" : "No qualified participants yet"}
                </p>
              )}
            </div>

            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">{isAr ? `طلبات معلقة (${pending.length})` : `Pending Requests (${pending.length})`}</h4>
                <div className="space-y-2">
                  {pending.map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between rounded-lg border border-dashed p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {(reg.profiles?.full_name || "?")[0].toUpperCase()}
                        </div>
                        <p className="text-sm">{reg.profiles?.full_name || "—"}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{isAr ? "معلق" : "Pending"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results (if completed) */}
            {(competitionStatus === "completed" || competitionStatus === "judging") && (
              <div>
                <Separator className="my-2" />
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  {isAr ? "النتائج" : "Results"}
                </h4>
                {approved.length > 0 ? (
                  <div className="space-y-2">
                    {approved.map((reg: any, idx: number) => {
                      const regScores = scores.filter((s: any) => s.registration?.registration_id === reg.id || s.registration_id === reg.id);
                      const totalScore = regScores.reduce((sum: number, s: any) => sum + (s.score || 0), 0);
                      return (
                        <div key={reg.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-muted-foreground w-6">#{idx + 1}</span>
                            <p className="text-sm font-medium">{reg.profiles?.full_name || "—"}</p>
                          </div>
                          <span className="text-sm font-semibold">{totalScore > 0 ? toEnglishDigits(totalScore.toFixed(1)) : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "لا توجد نتائج بعد" : "No results yet"}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- FORM VIEW ----
  if (view === "form") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setView("list"); setEditingId(null); }} className="-ms-2">
          <ArrowLeft className="me-1.5 h-4 w-4" />
          {isAr ? "العودة" : "Back"}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? (isAr ? "تعديل الفئة" : "Edit Category") : (isAr ? "إضافة فئة جديدة" : "Add New Category")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={3} dir="rtl" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>{isAr ? "الحد الأقصى للمشاركين" : "Max Participants"}</Label>
                <Input type="number" value={form.max_participants || ""} onChange={(e) => setForm({ ...form, max_participants: e.target.value ? parseInt(e.target.value) : null })} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الجنس" : "Gender"}</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.symbol} {isAr ? opt.ar : opt.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "مستوى المشاركين" : "Participant Level"}</Label>
                <Select value={form.participant_level} onValueChange={(v) => setForm({ ...form, participant_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTICIPANT_LEVELS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {isAr ? opt.ar : opt.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الحالة" : "Status"}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                    <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
                    <SelectItem value="suspended">{isAr ? "معلق" : "Suspended"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "رابط صورة الغلاف" : "Cover Image URL"}</Label>
              <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." />
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt="Preview" className="mt-2 h-32 w-full rounded-lg object-cover" />
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : <Save className="me-1.5 h-4 w-4" />}
                {isAr ? "حفظ" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => { setView("list"); setEditingId(null); }}>
                <X className="me-1.5 h-4 w-4" />
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- LIST VIEW ----
  return (
    <div className="space-y-4">
      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "الفئات" : "Categories"}
          <Badge variant="secondary" className="ms-1">{categories.length}</Badge>
        </h3>
        {isOrganizer && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="me-1.5 h-4 w-4" />
            {isAr ? "إضافة فئة" : "Add Category"}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-4 pb-3">
          <div className="relative flex-1 min-w-[150px]">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث..." : "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-9 text-sm"
            />
          </div>
          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder={isAr ? "الجنس" : "Gender"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              {GENDER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.symbol} {isAr ? opt.ar : opt.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder={isAr ? "الحالة" : "Status"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
              <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
              <SelectItem value="suspended">{isAr ? "معلق" : "Suspended"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Category Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
            <Trophy className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فئات" : "No categories found"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((cat: any) => {
            const catRegs = getCategoryRegistrations(cat.id);
            const approvedCount = catRegs.filter((r: any) => r.status === "approved").length;
            const pendingCount = catRegs.filter((r: any) => r.status === "pending").length;
            const fill = cat.max_participants ? (approvedCount / cat.max_participants) * 100 : 0;

            return (
              <Card key={cat.id} className="overflow-hidden group hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(cat.id)}>
                {cat.cover_image_url ? (
                  <img src={cat.cover_image_url} alt={cat.name} className="h-28 w-full object-cover" />
                ) : (
                  <div className="h-28 w-full bg-gradient-to-br from-primary/10 via-accent/5 to-muted flex items-center justify-center">
                    <Trophy className="h-10 w-10 text-primary/20" />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm leading-tight">
                      {isAr && cat.name_ar ? cat.name_ar : cat.name}
                    </h4>
                    <div className="flex gap-1.5 shrink-0">
                      {statusBadge(cat.status || "active")}
                    </div>
                  </div>
                  {(cat.description || cat.description_ar) && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {isAr && cat.description_ar ? cat.description_ar : cat.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {approvedCount}{cat.max_participants ? `/${cat.max_participants}` : ""}
                      {pendingCount > 0 && <span className="text-primary">(+{pendingCount})</span>}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5">{categoryBadgeText(cat.gender, cat.participant_level, isAr)}</Badge>
                  </div>
                  {cat.max_participants && (
                    <Progress value={fill} className="h-1.5" />
                  )}

                  {/* Action buttons for organizer */}
                  {isOrganizer && (
                    <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(cat)}>
                        <Pencil className="me-1 h-3 w-3" />
                        {isAr ? "تعديل" : "Edit"}
                      </Button>
                      {cat.status === "active" ? (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-chart-4" onClick={() => updateStatusMutation.mutate({ id: cat.id, status: "suspended" })}>
                          <Pause className="me-1 h-3 w-3" />
                          {isAr ? "تعليق" : "Suspend"}
                        </Button>
                      ) : cat.status === "suspended" ? (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-chart-5" onClick={() => updateStatusMutation.mutate({ id: cat.id, status: "active" })}>
                          <Play className="me-1 h-3 w-3" />
                          {isAr ? "تفعيل" : "Activate"}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateStatusMutation.mutate({ id: cat.id, status: "active" })}>
                          <Play className="me-1 h-3 w-3" />
                          {isAr ? "نشر" : "Publish"}
                        </Button>
                      )}
                      {catRegs.length === 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => {
                          if (confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Delete this category?")) {
                            deleteMutation.mutate(cat.id);
                          }
                        }}>
                          <Trash2 className="me-1 h-3 w-3" />
                          {isAr ? "حذف" : "Delete"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
