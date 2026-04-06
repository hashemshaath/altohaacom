import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Trophy, Search, ExternalLink } from "lucide-react";

interface Props {
  exhibitionId: string;
  editionYear: number | null;
  isAr: boolean;
}

export const ExhibitionCompetitionsPanel = memo(function ExhibitionCompetitionsPanel({ exhibitionId, editionYear, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTitleAr, setNewTitleAr] = useState("");

  const { data: linked } = useQuery({
    queryKey: ["exhibition-competitions-admin", exhibitionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("exhibition_competitions")
        .select("*, competitions:competition_id(id, title, title_ar, status)")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!exhibitionId,
  });

  const { data: searchResults } = useQuery({
    queryKey: ["competitions-search", search],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status")
        .ilike("title", `%${search}%`)
        .limit(10);
      return data || [];
    },
    enabled: search.length >= 2,
  });

  const linkMutation = useMutation({
    mutationFn: async (competitionId: string) => {
      const { error } = await (supabase as any).from("exhibition_competitions").insert({
        exhibition_id: exhibitionId,
        competition_id: competitionId,
        edition_year: editionYear,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-competitions-admin", exhibitionId] });
      toast({ title: isAr ? "تم ربط المسابقة" : "Competition linked" });
      setSelectedCompetition(null);
      setSearch("");
      setShowForm(false);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("exhibition_competitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-competitions-admin", exhibitionId] });
      toast({ title: isAr ? "تم إلغاء الربط" : "Competition unlinked" });
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
      if (error) throw error;
      return data.id;
    },
    onSuccess: async (competitionId: string) => {
      await linkMutation.mutateAsync(competitionId);
      toast({ title: isAr ? "تم إنشاء وربط المسابقة" : "Competition created & linked" });
      setShowCreateForm(false);
      setNewTitle("");
      setNewTitleAr("");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const alreadyLinkedIds = new Set(linked?.map(l => l.competitions?.id) || []);
  const filteredResults = searchResults?.filter(c => !alreadyLinkedIds.has(c.id)) || [];

  if (!exhibitionId) return <p className="text-sm text-muted-foreground">{isAr ? "احفظ المعرض أولاً" : "Save the exhibition first"}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{linked?.length || 0} {isAr ? "مسابقة مرتبطة" : "linked competitions"}</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "ربط مسابقة" : "Link Competition"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3 bg-muted/30">
          <div>
            <Label className="text-xs">{isAr ? "بحث عن مسابقة" : "Search Competitions"}</Label>
            <div className="relative">
              <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-9 ps-8" value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "اكتب اسم المسابقة..." : "Type competition name..."} />
            </div>
          </div>

          {search.length >= 2 && filteredResults.length > 0 && (
            <div className="border rounded-lg bg-popover max-h-40 overflow-y-auto">
              {filteredResults.map(c => (
                <button key={c.id} className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent text-start" onClick={() => linkMutation.mutate(c.id)}>
                  <div>
                    <p className="font-medium">{isAr && c.title_ar ? c.title_ar : c.title}</p>
                    <Badge variant="secondary" className="text-[9px] mt-0.5">{c.status}</Badge>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </button>
              ))}
            </div>
          )}

          {search.length >= 2 && filteredResults.length === 0 && !showCreateForm && (
            <div className="text-center py-3 space-y-2">
              <p className="text-xs text-muted-foreground">{isAr ? "لم يتم العثور على مسابقة" : "No competition found"}</p>
              <Button size="sm" variant="outline" onClick={() => { setShowCreateForm(true); setNewTitle(search); }}>
                <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "إنشاء مسابقة جديدة" : "Create New Competition"}
              </Button>
            </div>
          )}

          {showCreateForm && (
            <Card className="p-3 space-y-3 border-primary/20 bg-primary/5">
              <p className="text-xs font-semibold">{isAr ? "إنشاء مسابقة جديدة" : "Create New Competition"}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label className="text-xs">{isAr ? "العنوان (EN)" : "Title (EN)"}</Label><Input className="h-9" value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
                <div><Label className="text-xs">{isAr ? "العنوان (AR)" : "Title (AR)"}</Label><Input className="h-9" value={newTitleAr} onChange={e => setNewTitleAr(e.target.value)} dir="rtl" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => createMutation.mutate()} disabled={!newTitle || createMutation.isPending}>
                  {createMutation.isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء وربط" : "Create & Link")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreateForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              </div>
            </Card>
          )}

          <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setShowCreateForm(false); }}>{isAr ? "إغلاق" : "Close"}</Button>
        </Card>
      )}

      {linked && linked.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "المسابقة" : "Competition"}</TableHead>
                <TableHead>{isAr ? "السنة" : "Year"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {linked.map(l => {
                const comp = l.competitions;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{comp ? (isAr && comp.title_ar ? comp.title_ar : comp.title) : "-"}</TableCell>
                    <TableCell>{l.edition_year || "-"}</TableCell>
                    <TableCell><Badge variant={comp?.status === "active" ? "default" : "secondary"}>{comp?.status || "-"}</Badge></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => unlinkMutation.mutate(l.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : !showForm && (
        <div className="py-8 text-center">
          <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مسابقات مرتبطة" : "No linked competitions yet"}</p>
        </div>
      )}
    </div>
  );
});
