import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Star, Search, CheckCircle, XCircle, Eye, Flag } from "lucide-react";

export const AdminReviewsModeration = memo(function AdminReviewsModeration() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["adminReviews", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("supplier_reviews")
        .select("id, company_id, user_id, rating, title, comment, status, is_verified_purchase, review_number, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch company names and reviewer profiles
  const companyIds = [...new Set(reviews.map((r: any) => r.company_id))];
  const userIds = [...new Set(reviews.map((r: any) => r.user_id))];

  const { data: companies = {} } = useQuery({
    queryKey: ["adminReviewCompanies", companyIds],
    queryFn: async () => {
      if (companyIds.length === 0) return {};
      const { data } = await supabase.from("companies").select("id, name, name_ar").in("id", companyIds);
      const map: Record<string, any> = {};
      (data || []).forEach((c: any) => { map[c.id] = c; });
      return map;
    },
    enabled: companyIds.length > 0,
  });

  const { data: profiles = {} } = useQuery({
    queryKey: ["adminReviewProfiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", userIds);
      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p; });
      return map;
    },
    enabled: userIds.length > 0,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("supplier_reviews").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReviews"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const stats = {
    total: reviews.length,
    published: reviews.filter((r: any) => r.status === "published").length,
    flagged: reviews.filter((r: any) => r.status === "flagged").length,
    hidden: reviews.filter((r: any) => r.status === "hidden").length,
  };

  const filteredReviews = search
    ? reviews.filter((r: any) => {
        const companyName = companies[r.company_id]?.name?.toLowerCase() || "";
        const userName = profiles[r.user_id]?.full_name?.toLowerCase() || "";
        const s = search.toLowerCase();
        return companyName.includes(s) || userName.includes(s) || r.comment?.toLowerCase().includes(s);
      })
    : reviews;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          {isAr ? "إدارة التقييمات" : "Reviews Moderation"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr
            ? `${stats.total} تقييم · ${stats.published} منشور · ${stats.flagged} مبلّغ عنه`
            : `${stats.total} reviews · ${stats.published} published · ${stats.flagged} flagged`}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "بحث..." : "Search..."} className="ps-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            <SelectItem value="published">{isAr ? "منشور" : "Published"}</SelectItem>
            <SelectItem value="flagged">{isAr ? "مبلّغ عنه" : "Flagged"}</SelectItem>
            <SelectItem value="hidden">{isAr ? "مخفي" : "Hidden"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "المراجع" : "Reviewer"}</TableHead>
                <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                <TableHead className="text-center">{isAr ? "التقييم" : "Rating"}</TableHead>
                <TableHead>{isAr ? "التعليق" : "Comment"}</TableHead>
                <TableHead className="text-center">{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-center">{isAr ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((r: any) => {
                const company = companies[r.company_id];
                const profile = profiles[r.user_id];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {profile?.full_name || profile?.username || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {isAr && company?.name_ar ? company.name_ar : company?.name || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-chart-4 text-chart-4" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {r.title && <p className="text-xs font-medium truncate">{r.title}</p>}
                      <p className="text-xs text-muted-foreground truncate">{r.comment || "—"}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={r.status === "published" ? "secondary" : r.status === "flagged" ? "destructive" : "outline"}
                        className="text-[9px]"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {r.status !== "published" && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Approve"
                            onClick={() => updateStatus.mutate({ id: r.id, status: "published" })}>
                            <CheckCircle className="h-3.5 w-3.5 text-chart-5" />
                          </Button>
                        )}
                        {r.status !== "flagged" && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Flag"
                            onClick={() => updateStatus.mutate({ id: r.id, status: "flagged" })}>
                            <Flag className="h-3.5 w-3.5 text-chart-4" />
                          </Button>
                        )}
                        {r.status !== "hidden" && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Hide"
                            onClick={() => updateStatus.mutate({ id: r.id, status: "hidden" })}>
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredReviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (isAr ? "جاري التحميل..." : "Loading...") : (isAr ? "لا توجد تقييمات" : "No reviews found")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
