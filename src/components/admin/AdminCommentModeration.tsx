import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MessageCircle, Flag, EyeOff, Trash2, Search, Eye, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function AdminCommentModeration() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | "hidden">("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; content: string } | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin-comments-moderation", filter],
    queryFn: async () => {
      let query = supabase
        .from("event_comments")
        .select("id, content, created_at, event_id, event_type, user_id, is_flagged, is_hidden, flag_reason, flagged_at, hidden_at, hidden_by, likes_count, parent_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter === "flagged") query = query.eq("is_flagged", true);
      if (filter === "hidden") query = query.eq("is_hidden", true);

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch profiles
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, username").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(c => ({ ...c, author: profileMap.get(c.user_id) }));
    },
  });

  const toggleHideMutation = useMutation({
    mutationFn: async ({ id, hide }: { id: string; hide: boolean }) => {
      const { error } = await supabase.from("event_comments").update({
        is_hidden: hide,
        hidden_by: hide ? (await supabase.auth.getUser()).data.user?.id : null,
        hidden_at: hide ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments-moderation"] });
      toast({ title: isAr ? "تم التحديث" : "Comment updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments-moderation"] });
      setDeleteTarget(null);
      toast({ title: isAr ? "تم الحذف" : "Comment deleted" });
    },
  });

  const filtered = search
    ? comments.filter((c: any) => c.content.toLowerCase().includes(search.toLowerCase()) || c.author?.full_name?.toLowerCase().includes(search.toLowerCase()))
    : comments;

  const flaggedCount = comments.filter((c: any) => c.is_flagged).length;
  const hiddenCount = comments.filter((c: any) => c.is_hidden).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث..." : "Search comments..."} value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-sm" />
        </div>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"} ({comments.length})</SelectItem>
            <SelectItem value="flagged">{isAr ? "مبلّغ عنها" : "Flagged"} ({flaggedCount})</SelectItem>
            <SelectItem value="hidden">{isAr ? "مخفية" : "Hidden"} ({hiddenCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <AnimatedCounter value={comments.length} className="text-xl" />
          <p className="text-[10px] text-muted-foreground">{isAr ? "إجمالي" : "Total"}</p>
        </Card>
        <Card className="p-3 text-center">
          <AnimatedCounter value={flaggedCount} className="text-xl text-amber-500" />
          <p className="text-[10px] text-muted-foreground">{isAr ? "مبلّغ عنها" : "Flagged"}</p>
        </Card>
        <Card className="p-3 text-center">
          <AnimatedCounter value={hiddenCount} className="text-xl text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">{isAr ? "مخفية" : "Hidden"}</p>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد تعليقات" : "No comments found"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "المستخدم" : "User"}</TableHead>
                <TableHead>{isAr ? "التعليق" : "Comment"}</TableHead>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => (
                <TableRow key={c.id} className={c.is_hidden ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.author?.avatar_url} />
                        <AvatarFallback className="text-[9px]">{(c.author?.full_name || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate max-w-[100px]">{c.author?.full_name || c.author?.username || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-xs truncate">{c.content}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px]">{c.event_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {c.is_flagged && <Badge variant="destructive" className="text-[9px]"><Flag className="h-2.5 w-2.5 me-0.5" />{isAr ? "مبلّغ" : "Flagged"}</Badge>}
                      {c.is_hidden && <Badge variant="secondary" className="text-[9px]"><EyeOff className="h-2.5 w-2.5 me-0.5" />{isAr ? "مخفي" : "Hidden"}</Badge>}
                      {!c.is_flagged && !c.is_hidden && <Badge variant="outline" className="text-[9px]">{isAr ? "عادي" : "Normal"}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => toggleHideMutation.mutate({ id: c.id, hide: !c.is_hidden })}
                        title={c.is_hidden ? "Show" : "Hide"}
                      >
                        {c.is_hidden ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: c.id, content: c.content.slice(0, 50) })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "حذف التعليق؟" : "Delete comment?"}</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.content}..." — {isAr ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
