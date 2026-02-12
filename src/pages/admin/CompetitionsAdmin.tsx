import { useState } from "react";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, MoreHorizontal, Eye, Edit, Trash2, Trophy, Users, Calendar, MapPin, Sparkles, Filter, Globe, Plus, Copy, Building2, Tag, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

const ALL_STATUSES: CompetitionStatus[] = [
  "draft", "upcoming", "registration_open", "registration_closed",
  "in_progress", "judging", "completed", "cancelled"
];

const statusConfig: Record<CompetitionStatus, { bg: string; dot: string; label: string; labelAr: string }> = {
  draft: { bg: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", label: "Draft", labelAr: "مسودة" },
  upcoming: { bg: "bg-accent/10 text-accent-foreground", dot: "bg-accent", label: "Upcoming", labelAr: "قادمة" },
  registration_open: { bg: "bg-primary/10 text-primary", dot: "bg-primary", label: "Reg. Open", labelAr: "مفتوح" },
  registration_closed: { bg: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", label: "Reg. Closed", labelAr: "مغلق" },
  in_progress: { bg: "bg-chart-3/10 text-chart-3", dot: "bg-chart-3", label: "In Progress", labelAr: "جارية" },
  judging: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Judging", labelAr: "التحكيم" },
  completed: { bg: "bg-chart-5/10 text-chart-5", dot: "bg-chart-5", label: "Completed", labelAr: "مكتملة" },
  cancelled: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive", label: "Cancelled", labelAr: "ملغاة" },
};

export default function CompetitionsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [organizerFilter, setOrganizerFilter] = useState<string>("all");
  const [exhibitionFilter, setExhibitionFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [showBulkImport, setShowBulkImport] = useState<"competition" | "participant" | "judge" | "winner" | null>(null);

  // Fetch competitions with organizer and exhibition info
  const { data: competitions, isLoading } = useQuery({
    queryKey: ["adminCompetitions", searchQuery, statusFilter, organizerFilter, exhibitionFilter, yearFilter],
    queryFn: async () => {
      let query = supabase
        .from("competitions")
        .select("*, exhibition:exhibitions!competitions_exhibition_id_fkey(id, title, title_ar)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,title_ar.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as CompetitionStatus);
      if (organizerFilter !== "all") query = query.eq("organizer_id", organizerFilter);
      if (exhibitionFilter !== "all") query = query.eq("exhibition_id", exhibitionFilter);
      if (yearFilter !== "all") query = query.gte("competition_start", `${yearFilter}-01-01`).lte("competition_start", `${yearFilter}-12-31`);

      const { data, error } = await query;
      if (error) throw error;

      // Fetch organizer profiles separately (no FK exists)
      const organizerIds = [...new Set((data || []).map(c => c.organizer_id).filter(Boolean))];
      let organizerMap: Record<string, any> = {};
      if (organizerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, full_name_ar, avatar_url")
          .in("user_id", organizerIds);
        profiles?.forEach(p => { organizerMap[p.user_id] = p; });
      }

      return (data || []).map(c => ({
        ...c,
        organizer: c.organizer_id ? organizerMap[c.organizer_id] || null : null,
      }));
    },
  });

  // Fetch categories for display
  const { data: allCategories } = useQuery({
    queryKey: ["adminCompetitionCategories"],
    queryFn: async () => {
      const { data } = await supabase.from("competition_categories").select("id, competition_id, name, name_ar");
      return data || [];
    },
  });

  // Fetch type assignments
  const { data: typeAssignments } = useQuery({
    queryKey: ["adminCompetitionTypes"],
    queryFn: async () => {
      const { data } = await supabase.from("competition_type_assignments").select("competition_id, type:competition_types(id, name, name_ar)");
      return data || [];
    },
  });

  const { data: participantCounts } = useQuery({
    queryKey: ["competitionParticipantCounts"],
    queryFn: async () => {
      const { data } = await supabase.from("competition_registrations").select("competition_id, status");
      const counts: Record<string, { approved: number; pending: number }> = {};
      data?.forEach(reg => {
        if (!counts[reg.competition_id]) counts[reg.competition_id] = { approved: 0, pending: 0 };
        if (reg.status === "approved") counts[reg.competition_id].approved++;
        else if (reg.status === "pending") counts[reg.competition_id].pending++;
      });
      return counts;
    },
  });

  // Unique organizers for filter
  const uniqueOrganizers = competitions?.reduce((acc, c) => {
    if (c.organizer && !acc.find((o: any) => o.user_id === c.organizer.user_id)) acc.push(c.organizer);
    return acc;
  }, [] as any[]) || [];

  // Unique exhibitions for filter
  const uniqueExhibitions = competitions?.reduce((acc, c) => {
    if (c.exhibition && !acc.find((e: any) => e.id === c.exhibition.id)) acc.push(c.exhibition);
    return acc;
  }, [] as any[]) || [];

  // Unique years
  const uniqueYears = [...new Set(competitions?.filter(c => c.competition_start).map(c => new Date(c.competition_start).getFullYear().toString()) || [])].sort().reverse();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompetitionStatus }) => {
      const { error } = await supabase.from("competitions").update({ status }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "update_competition_status", details: { competition_id: id, new_status: status } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" }); },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (comp: any) => {
      const { id, created_at, updated_at, organizer, exhibition, competition_number, slug, view_count, ...rest } = comp;
      const { error } = await supabase.from("competitions").insert({
        ...rest,
        title: `${rest.title} (Copy)`,
        title_ar: rest.title_ar ? `${rest.title_ar} (نسخة)` : null,
        status: "draft" as CompetitionStatus,
        view_count: 0,
        organizer_id: rest.organizer_id,
        exhibition_id: rest.exhibition_id,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); toast({ title: isAr ? "تم نسخ المسابقة" : "Competition duplicated" }); },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitions").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "delete_competition", details: { competition_id: id } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); toast({ title: isAr ? "تم حذف المسابقة" : "Competition deleted" }); },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const stats = {
    total: competitions?.length || 0,
    active: competitions?.filter(c => ["in_progress", "judging", "registration_open"].includes(c.status)).length || 0,
    completed: competitions?.filter(c => c.status === "completed").length || 0,
    draft: competitions?.filter(c => c.status === "draft").length || 0,
  };

  const getCategoriesForComp = (compId: string) => allCategories?.filter(c => c.competition_id === compId) || [];
  const getTypesForComp = (compId: string) => typeAssignments?.filter((t: any) => t.competition_id === compId) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold sm:text-2xl">{isAr ? "إدارة المسابقات" : "Competition Management"}</h1>
            <p className="text-xs text-muted-foreground">{isAr ? "إدارة ومراقبة جميع المسابقات" : "Manage and monitor all competitions"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["competition", "participant", "judge", "winner"] as const).map(type => (
            <Button
              key={type}
              variant={showBulkImport === type ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowBulkImport(showBulkImport === type ? null : type)}
            >
              <FileSpreadsheet className="me-2 h-4 w-4" />
              {isAr ? ({
                competition: "استيراد مسابقات",
                participant: "استيراد مشاركين",
                judge: "استيراد محكمين",
                winner: "استيراد فائزين",
              }[type]) : ({
                competition: "Import Competitions",
                participant: "Import Participants",
                judge: "Import Judges",
                winner: "Import Winners",
              }[type])}
            </Button>
          ))}
          <Button asChild className="gap-2 shadow-lg shadow-primary/20">
            <Link to="/competitions/create">
              <Plus className="h-4 w-4" />
              {isAr ? "إضافة مسابقة" : "Add Competition"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Bulk Import */}
      {showBulkImport && (
        <BulkImportPanel entityType={showBulkImport} onImportComplete={() => { setShowBulkImport(null); queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); }} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: <Trophy className="h-4 w-4 text-primary" /> },
          { label: isAr ? "نشطة" : "Active", value: stats.active, icon: <Sparkles className="h-4 w-4 text-chart-3" /> },
          { label: isAr ? "مكتملة" : "Completed", value: stats.completed, icon: <Calendar className="h-4 w-4 text-chart-5" /> },
          { label: isAr ? "مسودة" : "Draft", value: stats.draft, icon: <Edit className="h-4 w-4 text-muted-foreground" /> },
        ].map((stat, i) => (
          <Card key={i} className="border-border/60 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted shrink-0">{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="flex flex-wrap gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث بالعنوان أو المدينة..." : "Search by title or city..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder={isAr ? "الحالة" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الحالات" : "All Statuses"}</SelectItem>
              {ALL_STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {isAr ? statusConfig[status].labelAr : statusConfig[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {uniqueOrganizers.length > 0 && (
            <Select value={organizerFilter} onValueChange={setOrganizerFilter}>
              <SelectTrigger className="w-44">
                <Users className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={isAr ? "المنظم" : "Organizer"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع المنظمين" : "All Organizers"}</SelectItem>
                {uniqueOrganizers.map((org: any) => (
                  <SelectItem key={org.user_id} value={org.user_id}>
                    {isAr && org.full_name_ar ? org.full_name_ar : org.full_name || org.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {uniqueExhibitions.length > 0 && (
            <Select value={exhibitionFilter} onValueChange={setExhibitionFilter}>
              <SelectTrigger className="w-44">
                <Building2 className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={isAr ? "المعرض" : "Exhibition"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع المعارض" : "All Exhibitions"}</SelectItem>
                {uniqueExhibitions.map((ex: any) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {isAr && ex.title_ar ? ex.title_ar : ex.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {uniqueYears.length > 0 && (
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-28">
                <Calendar className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={isAr ? "السنة" : "Year"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                {uniqueYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : competitions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Trophy className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مسابقات" : "No competitions found"}</p>
              <Button asChild variant="outline" className="mt-4 gap-2">
                <Link to="/competitions/create">
                  <Plus className="h-4 w-4" />
                  {isAr ? "إنشاء أول مسابقة" : "Create First Competition"}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">{isAr ? "المسابقة" : "Competition"}</TableHead>
                  <TableHead className="font-semibold">{isAr ? "المنظم / المعرض" : "Organizer / Exhibition"}</TableHead>
                  <TableHead className="font-semibold">{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="font-semibold">{isAr ? "التاريخ" : "Date"}</TableHead>
                  <TableHead className="font-semibold">{isAr ? "الفئات" : "Categories"}</TableHead>
                  <TableHead className="font-semibold">{isAr ? "المشاركين" : "Participants"}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions?.map((comp) => {
                  const counts = participantCounts?.[comp.id] || { approved: 0, pending: 0 };
                  const fillPct = comp.max_participants ? Math.min(Math.round((counts.approved / comp.max_participants) * 100), 100) : 0;
                  const categories = getCategoriesForComp(comp.id);
                  const types = getTypesForComp(comp.id);
                  const year = comp.competition_start ? new Date(comp.competition_start).getFullYear() : null;

                  return (
                    <TableRow key={comp.id} className="group hover:bg-muted/20 transition-colors duration-150">
                      <TableCell>
                        <div className="max-w-[220px]">
                          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {isAr && comp.title_ar ? comp.title_ar : comp.title}
                            {year && <span className="ms-1.5 text-[10px] text-muted-foreground font-normal">{year}</span>}
                          </p>
                          {types.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {types.slice(0, 2).map((t: any) => (
                                <Badge key={t.type?.id} variant="outline" className="text-[9px] px-1.5 py-0">
                                  {isAr && t.type?.name_ar ? t.type.name_ar : t.type?.name}
                                </Badge>
                              ))}
                              {types.length > 2 && <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{types.length - 2}</Badge>}
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {comp.competition_number || (comp.is_virtual ? (isAr ? "افتراضية" : "Virtual") : "")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {comp.organizer && (
                            <div className="flex items-center gap-2">
                              {comp.organizer.avatar_url ? (
                                <img src={comp.organizer.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                              <span className="text-xs truncate max-w-[120px]">
                                {isAr && comp.organizer.full_name_ar ? comp.organizer.full_name_ar : comp.organizer.full_name || "—"}
                              </span>
                            </div>
                          )}
                          {comp.exhibition && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{isAr && comp.exhibition.title_ar ? comp.exhibition.title_ar : comp.exhibition.title}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] font-semibold border-0 ${statusConfig[comp.status as CompetitionStatus].bg}`}>
                          <span className={`me-1 inline-block h-1.5 w-1.5 rounded-full ${statusConfig[comp.status as CompetitionStatus].dot}`} />
                          {isAr ? statusConfig[comp.status as CompetitionStatus].labelAr : statusConfig[comp.status as CompetitionStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {comp.competition_start ? (
                          <>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(comp.competition_start), "MMM d, yyyy")}
                            </div>
                            {comp.city && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {comp.city}{comp.country ? `, ${comp.country}` : ""}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">{isAr ? "لم يحدد" : "Not set"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {categories.slice(0, 3).map(cat => (
                              <Badge key={cat.id} variant="secondary" className="text-[9px] px-1.5 py-0 gap-1">
                                <Tag className="h-2.5 w-2.5" />
                                {isAr && cat.name_ar ? cat.name_ar : cat.name}
                              </Badge>
                            ))}
                            {categories.length > 3 && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{categories.length - 3}</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 min-w-[90px]">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {counts.approved}
                              {counts.pending > 0 && <span className="text-muted-foreground font-normal"> (+{counts.pending})</span>}
                              {comp.max_participants && <span className="text-muted-foreground font-normal">/{comp.max_participants}</span>}
                            </span>
                          </div>
                          {comp.max_participants && (
                            <Progress value={fillPct} className="h-1" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/competitions/${comp.id}`}><Eye className="mr-2 h-4 w-4" />{isAr ? "عرض" : "View"}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/competitions/${comp.id}/edit`}><Edit className="mr-2 h-4 w-4" />{isAr ? "تعديل" : "Edit"}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateMutation.mutate(comp)}>
                              <Copy className="mr-2 h-4 w-4" />{isAr ? "نسخ" : "Duplicate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ALL_STATUSES.filter(s => s !== comp.status).slice(0, 4).map(status => (
                              <DropdownMenuItem key={status} onClick={() => updateStatusMutation.mutate({ id: comp.id, status })}>
                                <span className={`me-2 inline-block h-2 w-2 rounded-full ${statusConfig[status].dot}`} />
                                {isAr ? statusConfig[status].labelAr : statusConfig[status].label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            {comp.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
                                    deleteMutation.mutate(comp.id);
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />{isAr ? "حذف" : "Delete"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
