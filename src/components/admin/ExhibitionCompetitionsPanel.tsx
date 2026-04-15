import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Trophy, Search, X, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

interface Props {
  exhibitionId: string;
  editionYear: number | null;
  isAr: boolean;
}

export const ExhibitionCompetitionsPanel = memo(function ExhibitionCompetitionsPanel({ exhibitionId, editionYear, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTitleAr, setNewTitleAr] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: linked } = useQuery({
    queryKey: ["exhibition-competitions-admin", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_competitions")
        .select("*, competitions:competition_id(id, title, title_ar, status, slug)")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      if (error) throw handleSupabaseError(error);
      return data ?? [];
    },
    enabled: !!exhibitionId,
  });

  const { data: searchResults } = useQuery({
    queryKey: ["competitions-search", search],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, slug")
        .ilike("title", `%${search}%`)
        .limit(10);
      return data || [];
    },
    enabled: search.length >= 2,
  });

  const linkMutation = useMutation({
    mutationFn: async (competitionId: string) => {
      // Check duplicate
      if (linked?.some(l => l.competitions?.id === competitionId)) {
        throw new Error(t("Competition already linked", "المسابقة مرتبطة بالفعل"));
      }
      const { error } = await supabase.from("exhibition_competitions").insert({
        exhibition_id: exhibitionId,
        competition_id: competitionId,
        edition_year: editionYear,
        created_by: user?.id,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-competitions-admin", exhibitionId] });
      toast({ title: t("Competition linked", "تم ربط المسابقة") });
      setSearch("");
      setShowForm(false);
    },
    onError: (err: Error) => toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_competitions").delete().eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-competitions-admin", exhibitionId] });
      toast({ title: t("Competition unlinked", "تم إلغاء الربط") });
      setDeleteConfirmId(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = newTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
      const { data, error } = await supabase.from("competitions").insert({
        title: newTitle,
        title_ar: newTitleAr || null,
        slug,
        status: "draft",
        exhibition_id: exhibitionId,
        created_by: user?.id,
      } as any).select("id").single();
      if (error) throw handleSupabaseError(error);
      return data.id;
    },
    onSuccess: async (competitionId: string) => {
      await linkMutation.mutateAsync(competitionId);
      toast({ title: t("Competition created & linked", "تم إنشاء وربط المسابقة") });
      setShowCreateForm(false);
      setNewTitle("");
      setNewTitleAr("");
    },
    onError: (err: Error) => toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" }),
  });

  const alreadyLinkedIds = new Set(linked?.map(l => l.competitions?.id) || []);
  const filteredResults = searchResults?.filter(c => !alreadyLinkedIds.has(c.id)) || [];

  if (!exhibitionId) return <p className="text-sm text-muted-foreground">{t("Save the exhibition first", "احفظ المعرض أولاً")}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{linked?.length || 0} {t("linked competitions", "مسابقة مرتبطة")}</p>
        {!showForm && (
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-xl" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />{t("Link Competition", "ربط مسابقة")}
          </Button>
        )}
      </div>

      {/* ── Inline Link/Create Form ── */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Search className="h-3 w-3" />
              {t("Search & Link Competition", "بحث وربط مسابقة")}
            </p>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setShowForm(false); setShowCreateForm(false); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="h-8 ps-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Type competition name...", "اكتب اسم المسابقة...")} />
          </div>

          {search.length >= 2 && filteredResults.length > 0 && (
            <div className="rounded-lg border bg-popover max-h-36 overflow-y-auto">
              {filteredResults.map(c => (
                <button key={c.id} className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent text-start" onClick={() => linkMutation.mutate(c.id)}>
                  <div>
                    <p className="font-medium">{isAr && c.title_ar ? c.title_ar : c.title}</p>
                    <Badge variant="secondary" className="text-xs mt-0.5">{c.status}</Badge>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                </button>
              ))}
            </div>
          )}

          {search.length >= 2 && filteredResults.length === 0 && !showCreateForm && (
            <div className="text-center py-3 space-y-2 rounded-lg border border-dashed">
              <p className="text-xs text-muted-foreground">{t("No competition found", "لم يتم العثور على مسابقة")}</p>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl gap-1" onClick={() => { setShowCreateForm(true); setNewTitle(search); }}>
                <Plus className="h-3 w-3" />{t("Create New Competition", "إنشاء مسابقة جديدة")}
              </Button>
            </div>
          )}

          {showCreateForm && (
            <div className="rounded-lg border border-chart-2/20 bg-chart-2/5 p-3 space-y-3">
              <p className="text-xs font-semibold">{t("Create New Competition", "إنشاء مسابقة جديدة")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label className="text-xs">{t("Title (EN)", "العنوان (EN)")}</Label><Input className="h-8 text-xs" value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
                <div><Label className="text-xs">{t("Title (AR)", "العنوان (AR)")}</Label><Input className="h-8 text-xs" value={newTitleAr} onChange={e => setNewTitleAr(e.target.value)} dir="rtl" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs rounded-xl gap-1" onClick={() => createMutation.mutate()} disabled={!newTitle || createMutation.isPending}>
                  <Check className="h-3 w-3" />
                  {createMutation.isPending ? "..." : t("Create & Link", "إنشاء وربط")}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs rounded-xl" onClick={() => setShowCreateForm(false)}>{t("Cancel", "إلغاء")}</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Linked Competitions List ── */}
      {linked && linked.length > 0 ? (
        <div className="grid gap-2">
          {linked.map(l => {
            const comp = l.competitions;
            const isDeleting = deleteConfirmId === l.id;
            return (
              <div key={l.id} className={cn(
                "group flex items-center gap-3 rounded-xl border p-3 transition-all duration-200",
                isDeleting ? "border-destructive/30 bg-destructive/5" : "border-border/50 hover:border-border hover:shadow-sm"
              )}>
                <div className="h-9 w-9 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4 text-chart-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{comp ? (isAr && comp.title_ar ? comp.title_ar : comp.title) : "-"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {l.edition_year && <Badge variant="secondary" className="text-xs h-4">{l.edition_year}</Badge>}
                    <Badge variant={comp?.status === "registration_open" ? "default" : "secondary"} className="text-xs h-4">{comp?.status || "-"}</Badge>
                  </div>
                </div>

                {isDeleting ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in-0 duration-200">
                    <span className="text-xs text-destructive font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {t("Unlink?", "إلغاء الربط؟")}
                    </span>
                    <Button size="icon" variant="destructive" className="h-7 w-7 rounded-lg" onClick={() => unlinkMutation.mutate(l.id)} disabled={unlinkMutation.isPending}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setDeleteConfirmId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {comp?.slug && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" asChild>
                        <a href={`/competitions/${comp.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(l.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : !showForm && (
        <div className="py-10 text-center rounded-xl border border-dashed border-border/60">
          <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground">{t("No linked competitions yet", "لا توجد مسابقات مرتبطة")}</p>
          <Button size="sm" variant="link" className="mt-1 text-xs h-7" onClick={() => setShowForm(true)}>
            {t("Link the first competition", "اربط أول مسابقة")}
          </Button>
        </div>
      )}
    </div>
  );
});
