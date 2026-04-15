import { useIsAr } from "@/hooks/useIsAr";
import { useState, useCallback, useMemo, lazy, Suspense, memo } from "react";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { CompetitionSmartImport } from "@/components/smart-import/CompetitionSmartImport";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, MoreHorizontal, Eye, Edit, Trash2, Trophy, Users, Calendar, MapPin,
  Sparkles, Plus, Copy, Building2, Tag, FileSpreadsheet, Gavel, Medal,
  BarChart3, CheckCircle, XCircle, Layers, Download, Activity, Clock,
  TrendingUp, Zap, ListChecks, PieChart, GitBranch,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { CACHE } from "@/lib/queryConfig";
import { QUERY_LIMIT_LARGE, QUERY_LIMIT_MEDIUM } from "@/lib/constants";

// Lazy widgets
const CompetitionPipelineTracker = lazy(() => import("@/components/admin/CompetitionPipelineTracker").then(m => ({ default: m.CompetitionPipelineTracker })));
const JudgingOverviewWidget = lazy(() => import("@/components/admin/JudgingOverviewWidget").then(m => ({ default: m.JudgingOverviewWidget })));
const RegistrationTimelineWidget = lazy(() => import("@/components/admin/RegistrationTimelineWidget").then(m => ({ default: m.RegistrationTimelineWidget })));
const CompetitionAnalyticsWidget = lazy(() => import("@/components/admin/CompetitionAnalyticsWidget").then(m => ({ default: m.CompetitionAnalyticsWidget })));
const CompetitionLiveStatsWidget = lazy(() => import("@/components/admin/CompetitionLiveStatsWidget").then(m => ({ default: m.CompetitionLiveStatsWidget })));
const CompetitionScoringOverview = lazy(() => import("@/components/admin/CompetitionScoringOverview").then(m => ({ default: m.CompetitionScoringOverview })));
const CompetitionJudgingTracker = lazy(() => import("@/components/admin/CompetitionJudgingTracker").then(m => ({ default: m.CompetitionJudgingTracker })));
const CompetitionLifecycleWidget = lazy(() => import("@/components/admin/CompetitionLifecycleWidget").then(m => ({ default: m.CompetitionLifecycleWidget })));

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

const ALL_STATUSES: CompetitionStatus[] = [
  "pending", "draft", "upcoming", "registration_open", "registration_closed",
  "in_progress", "judging", "completed", "cancelled"
];

const statusConfig: Record<CompetitionStatus, { bg: string; dot: string; label: string; labelAr: string }> = {
  pending: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Pending", labelAr: "بانتظار الموافقة" },
  draft: { bg: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", label: "Draft", labelAr: "مسودة" },
  upcoming: { bg: "bg-accent/10 text-accent-foreground", dot: "bg-accent", label: "Upcoming", labelAr: "قادمة" },
  registration_open: { bg: "bg-primary/10 text-primary", dot: "bg-primary", label: "Reg. Open", labelAr: "مفتوح" },
  registration_closed: { bg: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", label: "Reg. Closed", labelAr: "مغلق" },
  in_progress: { bg: "bg-chart-3/10 text-chart-3", dot: "bg-chart-3", label: "In Progress", labelAr: "جارية" },
  judging: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Judging", labelAr: "التحكيم" },
  completed: { bg: "bg-chart-5/10 text-chart-5", dot: "bg-chart-5", label: "Completed", labelAr: "مكتملة" },
  cancelled: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive", label: "Cancelled", labelAr: "ملغاة" },
};

/* ─── Grouped Tab Navigation ─── */
const TAB_GROUPS = [
  {
    labelEn: "Management",
    labelAr: "الإدارة",
    tabs: [
      { id: "list", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
      { id: "judging", icon: Gavel, labelEn: "Judging", labelAr: "التحكيم" },
      { id: "results", icon: Medal, labelEn: "Results", labelAr: "النتائج" },
    ],
  },
  {
    labelEn: "Analytics",
    labelAr: "التحليلات",
    tabs: [
      { id: "pipeline", icon: GitBranch, labelEn: "Pipeline", labelAr: "خط السير" },
      { id: "live", icon: Zap, labelEn: "Live Stats", labelAr: "مباشر" },
      { id: "scoring", icon: ListChecks, labelEn: "Scoring", labelAr: "التقييم" },
      { id: "insights", icon: PieChart, labelEn: "Insights", labelAr: "رؤى" },
    ],
  },
  {
    labelEn: "Import",
    labelAr: "الاستيراد",
    tabs: [
      { id: "import", icon: FileSpreadsheet, labelEn: "Import", labelAr: "استيراد" },
    ],
  },
];

function TabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-3">
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

export default function CompetitionsAdmin() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [organizerFilter, setOrganizerFilter] = useState<string>("all");
  const [exhibitionFilter, setExhibitionFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");

  const handleTabChange = useCallback((id: string) => setActiveTab(id), []);

  // Fetch event series
  const { data: seriesList } = useQuery({
    queryKey: ["event-series-comp-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_series").select("id, name, name_ar").eq("is_active", true).order("name").limit(QUERY_LIMIT_MEDIUM);
      if (error) throw error;
      return data as { id: string; name: string; name_ar: string | null }[];
    },
  });

  // Fetch competitions
  const { data: competitions, isLoading } = useQuery({
    queryKey: ["adminCompetitions", searchQuery, statusFilter, organizerFilter, exhibitionFilter, yearFilter],
    queryFn: async () => {
      let query = supabase
        .from("competitions")
        .select("*, exhibition:exhibitions!competitions_exhibition_id_fkey(id, title, title_ar, organizer_name, organizer_name_ar, organizer_logo_url, organizer_entity_id, organizer_company_id)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,title_ar.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as CompetitionStatus);
      if (organizerFilter !== "all") query = query.eq("organizer_id", organizerFilter);
      if (exhibitionFilter !== "all") query = query.eq("exhibition_id", exhibitionFilter);
      if (yearFilter !== "all") query = query.eq("edition_year", parseInt(yearFilter));

      const { data, error } = await query;
      if (error) throw error;

      const entityIds = [...new Set((data || []).map(c => (c.exhibition as any)?.organizer_entity_id).filter(Boolean))];
      const companyIds = [...new Set((data || []).map(c => (c.exhibition as any)?.organizer_company_id).filter(Boolean))];
      let entityMap: Record<string, any> = {};
      let companyMap: Record<string, any> = {};

      if (entityIds.length > 0) {
        const { data: entities } = await supabase.from("culinary_entities").select("id, name, name_ar, logo_url, abbreviation").in("id", entityIds);
        entities?.forEach(e => { entityMap[e.id] = e; });
      }
      if (companyIds.length > 0) {
        const { data: companies } = await supabase.from("companies").select("id, name, name_ar, logo_url").in("id", companyIds);
        companies?.forEach(c => { companyMap[c.id] = c; });
      }

      return (data || []).map(c => {
        const exh = c.exhibition as any;
        let derivedOrganizer: Record<string, unknown> | null = null;
        if (exh?.organizer_entity_id && entityMap[exh.organizer_entity_id]) {
          const ent = entityMap[exh.organizer_entity_id];
          derivedOrganizer = { name: ent.name, name_ar: ent.name_ar, logo_url: ent.logo_url, type: "entity" };
        } else if (exh?.organizer_company_id && companyMap[exh.organizer_company_id]) {
          const comp = companyMap[exh.organizer_company_id];
          derivedOrganizer = { name: comp.name, name_ar: comp.name_ar, logo_url: comp.logo_url, type: "company" };
        } else if (exh?.organizer_name) {
          derivedOrganizer = { name: exh.organizer_name, name_ar: exh.organizer_name_ar, logo_url: exh.organizer_logo_url, type: "exhibition" };
        }
        return { ...c, derivedOrganizer };
      });
    },
    staleTime: CACHE.short.staleTime,
  });

  const { data: allCategories } = useQuery({
    queryKey: ["adminCompetitionCategories"],
    queryFn: async () => { const { data } = await supabase.from("competition_categories").select("id, competition_id, name, name_ar").limit(QUERY_LIMIT_LARGE); return data || []; },
    staleTime: CACHE.medium.staleTime,
  });

  const { data: typeAssignments } = useQuery({
    queryKey: ["adminCompetitionTypes"],
    queryFn: async () => { const { data } = await supabase.from("competition_type_assignments").select("competition_id, type:competition_types(id, name, name_ar)").limit(QUERY_LIMIT_LARGE); return data || []; },
    staleTime: CACHE.medium.staleTime,
  });

  const { data: participantCounts } = useQuery({
    queryKey: ["competitionParticipantCounts"],
    queryFn: async () => {
      const { data } = await supabase.from("competition_registrations").select("competition_id, status").limit(QUERY_LIMIT_LARGE);
      const counts: Record<string, { approved: number; pending: number }> = {};
      data?.forEach(reg => {
        if (!counts[reg.competition_id]) counts[reg.competition_id] = { approved: 0, pending: 0 };
        if (reg.status === "approved") counts[reg.competition_id].approved++;
        else if (reg.status === "pending") counts[reg.competition_id].pending++;
      });
      return counts;
    },
  });

  const uniqueExhibitions = competitions?.reduce((acc, c) => {
    if (c.exhibition && !acc.find((e) => e.id === c.exhibition.id)) acc.push(c.exhibition);
    return acc;
  }, [] as any[]) || [];

  const uniqueYears = [...new Set(competitions?.map(c => c.edition_year?.toString() || (c.competition_start ? new Date(c.competition_start).getFullYear().toString() : null)).filter(Boolean) as string[] || [])].sort().reverse();

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompetitionStatus }) => {
      const { error } = await supabase.from("competitions").update({ status }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "update_competition_status", details: { competition_id: id, new_status: status } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" }); },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const approveCompetition = useMutation({
    mutationFn: async (comp: Record<string, unknown>) => {
      const { error } = await supabase.from("competitions").update({ status: "draft" as CompetitionStatus }).eq("id", comp.id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "approve_competition", details: { competition_id: comp.id } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] }); toast({ title: isAr ? "تمت الموافقة" : "Approved" }); },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const rejectCompetition = useMutation({
    mutationFn: async (comp: Record<string, unknown>) => {
      const { error } = await supabase.from("competitions").update({ status: "cancelled" as CompetitionStatus }).eq("id", comp.id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "reject_competition", details: { competition_id: comp.id } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] }); toast({ title: isAr ? "تم الرفض" : "Rejected" }); },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (comp: Record<string, unknown>) => {
      const { id, created_at, updated_at, organizer, exhibition, competition_number, slug, view_count, ...rest } = comp;
      const { error } = await supabase.from("competitions").insert({ ...rest, title: `${rest.title} (Copy)`, title_ar: rest.title_ar ? `${rest.title_ar} (نسخة)` : null, status: "draft" as CompetitionStatus, view_count: 0 } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); toast({ title: isAr ? "تم النسخ" : "Duplicated" }); },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitions").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "delete_competition", details: { competition_id: id } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); toast({ title: isAr ? "تم الحذف" : "Deleted" }); },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count: bulkCount, selectedItems, isSelected } =
    useAdminBulkActions(competitions || []);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "العنوان" : "Title", accessor: (r) => isAr && r.title_ar ? r.title_ar : r.title },
      { header: isAr ? "الحالة" : "Status", accessor: (r) => r.status },
      { header: isAr ? "التاريخ" : "Start Date", accessor: (r) => r.competition_start || "" },
      { header: isAr ? "المدينة" : "City", accessor: (r) => r.city || "" },
      { header: isAr ? "رقم المسابقة" : "Competition #", accessor: (r) => r.competition_number || "" },
    ],
    filename: "competitions",
  });

  const bulkStatusChange = async (status: string) => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("competitions").update({ status: status as CompetitionStatus }).in("id", ids);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
    clearSelection();
    toast({ title: isAr ? `تم تحديث ${ids.length} مسابقة` : `${ids.length} updated` });
  };

  const bulkDelete = async () => {
    if (!confirm(isAr ? "هل أنت متأكد؟" : "Delete selected?")) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("competitions").delete().in("id", ids);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
    clearSelection();
  };

  const stats = useMemo(() => ({
    total: competitions?.length || 0,
    pending: competitions?.filter(c => c.status === "pending").length || 0,
    active: competitions?.filter(c => ["in_progress", "judging", "registration_open"].includes(c.status)).length || 0,
    completed: competitions?.filter(c => c.status === "completed").length || 0,
    draft: competitions?.filter(c => c.status === "draft").length || 0,
    judging: competitions?.filter(c => c.status === "judging").length || 0,
  }), [competitions]);

  const { sorted: sortedCompetitions, sortColumn, sortDirection, toggleSort: toggleCompSort } = useTableSort(competitions || []);
  const compPagination = usePagination(sortedCompetitions || []);

  // Smart Import handler
  const handleSmartImport = useCallback(async (data: ImportedData, mode: "create" | "update", existingId?: string) => {
    try {
      const nameEn = data.name_en?.trim();
      const nameAr = data.name_ar?.trim();
      const now = new Date().toISOString();
      const competitionPayload: Record<string, any> = {
        title: nameEn || nameAr || "Untitled", title_ar: nameAr || null,
        description: data.description_en || null, description_ar: data.description_ar || null,
        city: data.city_en || null, country_code: data.country_code || null, country: data.country_en || null,
        venue: data.venue_en || null, venue_ar: data.venue_ar || null,
        competition_start: data.start_date || now, competition_end: data.end_date || now,
        registration_start: data.start_date || null, registration_end: data.registration_deadline || null,
        edition_year: data.edition_year || new Date().getFullYear(),
        registration_fee: data.registration_fee || null, registration_currency: data.currency || "SAR",
        rules_summary: data.rules_summary_en || null, rules_summary_ar: data.rules_summary_ar || null,
        scoring_notes: data.scoring_method_en || null, scoring_notes_ar: data.scoring_method_ar || null,
        cover_image_url: data.cover_url || null, max_participants: data.max_attendees || null,
        max_team_size: data.max_team_size || null, min_team_size: data.min_team_size || null,
        allowed_entry_types: data.allowed_entry_types || null,
        blind_judging_enabled: data.blind_judging || false, is_virtual: data.is_virtual || false,
        import_source: "smart_import",
        terms_conditions: data.terms_conditions_en || null, terms_conditions_ar: data.terms_conditions_ar || null,
        eligibility: data.eligibility_en || null, eligibility_ar: data.eligibility_ar || null,
        participation_requirements: data.participation_requirements_en?.length ? data.participation_requirements_en : null,
        participation_requirements_ar: data.participation_requirements_ar?.length ? data.participation_requirements_ar : null,
        dress_code: data.dress_code || null, dress_code_ar: data.dress_code_ar || null,
        age_restrictions: data.age_restrictions || null,
        equipment_provided: data.equipment_provided?.length ? data.equipment_provided : null,
        equipment_required: data.equipment_required?.length ? data.equipment_required : null,
        organizer_name: data.organizer_name_en || null, organizer_name_ar: data.organizer_name_ar || null,
        organizer_website: data.organizer_website || null, organizer_email: data.organizer_email || null,
        competition_website: data.website || null, competition_email: data.email || null, competition_phone: data.phone || null,
        registration_url: data.registration_url || null,
        judging_committee_data: data.judging_committee?.length ? data.judging_committee : null,
        prizes_data: data.prizes?.length ? data.prizes : null,
        schedule_data: data.competition_schedule?.length ? data.competition_schedule : null,
      };

      let competitionId: string;
      if (mode === "update" && existingId) {
        const { error } = await supabase.from("competitions").update(competitionPayload as any).eq("id", existingId);
        if (error) throw error;
        competitionId = existingId;
      } else {
        const { data: inserted, error } = await supabase.from("competitions").insert({ ...competitionPayload, status: "draft" as any, organizer_id: user?.id || "" } as any).select("id").single();
        if (error) throw error;
        competitionId = inserted.id;
      }

      if (data.judging_criteria?.length) {
        if (mode === "update") await supabase.from("judging_criteria").delete().eq("competition_id", competitionId);
        await supabase.from("judging_criteria").insert(data.judging_criteria.map((c, i) => ({
          competition_id: competitionId, name: c.criterion, name_ar: c.criterion_ar || null,
          description: c.description || null, description_ar: c.description_ar || null,
          weight: c.weight || 0, max_score: 100, sort_order: i + 1,
        })));
      }
      if (data.competition_versions?.length) {
        if (mode === "update") await supabase.from("competition_categories").delete().eq("competition_id", competitionId);
        await supabase.from("competition_categories").insert(data.competition_versions.map((v, i) => ({
          competition_id: competitionId, name: v.name, name_ar: v.name_ar || null,
          description: v.description || null, description_ar: v.description_ar || null,
          max_participants: v.max_participants || null, sort_order: i + 1, status: "active",
        })));
      }
      if (data.competition_rounds?.length) {
        if (mode === "update") await supabase.from("competition_rounds").delete().eq("competition_id", competitionId);
        await supabase.from("competition_rounds").insert(data.competition_rounds.map((r, i) => ({
          competition_id: competitionId, name: r.name, name_ar: r.name_ar || null,
          round_number: i + 1, sort_order: i + 1, format: "standard", round_type: "elimination", status: "pending",
        })));
      }

      setShowSmartImport(false);
      queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
      toast({ title: isAr ? "✅ تم بنجاح" : "✅ Success", description: `"${nameEn || nameAr}" ${isAr ? (mode === "update" ? "تم تحديثها" : "تم إنشاؤها") : (mode === "update" ? "updated" : "created")}` });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  }, [isAr, user, queryClient, toast]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-chart-4/10">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight">{isAr ? "إدارة المسابقات" : "Competitions Management"}</h1>
          <p className="text-xs text-muted-foreground">{isAr ? "إدارة ومراقبة وتحليل جميع المسابقات" : "Manage, monitor, and analyze all competitions"}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs rounded-xl" onClick={() => exportCSV(competitions || [])}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "تصدير" : "Export"}</span>
          </Button>
          <Button asChild size="sm" className="gap-1.5 h-8 text-xs rounded-xl shadow-lg shadow-primary/20">
            <Link to="/competitions/create">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isAr ? "إضافة مسابقة" : "Add Competition"}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Strip — interactive */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: Trophy, color: "text-primary", filter: "all" },
          { label: isAr ? "معلقة" : "Pending", value: stats.pending, icon: Clock, color: "text-chart-4", filter: "pending" },
          { label: isAr ? "نشطة" : "Active", value: stats.active, icon: Activity, color: "text-chart-3", filter: "in_progress" },
          { label: isAr ? "تحكيم" : "Judging", value: stats.judging, icon: Gavel, color: "text-chart-5", filter: "judging" },
          { label: isAr ? "مكتملة" : "Completed", value: stats.completed, icon: CheckCircle, color: "text-chart-2", filter: "completed" },
          { label: isAr ? "مسودة" : "Draft", value: stats.draft, icon: Edit, color: "text-muted-foreground", filter: "draft" },
        ].map(m => (
          <button
            key={m.filter}
            onClick={() => { setStatusFilter(m.filter === "all" ? "all" : m.filter); setActiveTab("list"); }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-card p-2.5 transition-all hover:border-primary/20 hover:shadow-sm",
              statusFilter === m.filter && activeTab === "list" && "ring-2 ring-primary/20 border-primary/30"
            )}
          >
            <m.icon className={cn("h-4 w-4 shrink-0", m.color)} />
            <AnimatedCounter value={m.value} className="text-lg font-bold leading-none" />
            <span className="text-[10px] text-muted-foreground font-medium">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Grouped Tab Navigation */}
      <div className="sticky top-0 z-20 rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <ScrollArea className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-stretch sm:divide-x sm:divide-border/40 sm:rtl:divide-x-reverse min-w-max">
            {TAB_GROUPS.map((group) => (
              <div key={group.labelEn} className="flex flex-col">
                <div className="px-3 py-1 bg-muted/40 border-b border-border/40">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? group.labelAr : group.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 px-1 py-1 flex-wrap sm:flex-nowrap">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[12px] font-medium transition-all active:scale-95 whitespace-nowrap",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>

      {/* Tab Content */}
      <div className="mt-1">
        <Suspense fallback={<TabSkeleton />}>
          {/* === LIST TAB === */}
          {activeTab === "list" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={isAr ? "بحث..." : "Search..."} className="ps-8 h-8 text-xs bg-card rounded-xl" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl"><SelectValue placeholder={isAr ? "الحالة" : "Status"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{isAr ? statusConfig[s].labelAr : statusConfig[s].label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {uniqueExhibitions.length > 0 && (
                  <Select value={exhibitionFilter} onValueChange={setExhibitionFilter}>
                    <SelectTrigger className="w-[140px] h-8 text-xs rounded-xl"><SelectValue placeholder={isAr ? "المعرض" : "Exhibition"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                      {uniqueExhibitions.map((ex) => <SelectItem key={ex.id} value={ex.id}>{isAr && ex.title_ar ? ex.title_ar : ex.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {uniqueYears.length > 0 && (
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-[100px] h-8 text-xs rounded-xl"><SelectValue placeholder={isAr ? "السنة" : "Year"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                      {uniqueYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {(searchQuery || statusFilter !== "all" || exhibitionFilter !== "all" || yearFilter !== "all") && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 rounded-xl" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setExhibitionFilter("all"); setYearFilter("all"); setOrganizerFilter("all"); }}>
                    <XCircle className="h-3.5 w-3.5" />{isAr ? "مسح" : "Clear"}
                  </Button>
                )}
              </div>

              <BulkActionBar count={bulkCount} onClear={clearSelection} onExport={() => exportCSV(selectedItems)} onStatusChange={bulkStatusChange} onDelete={bulkDelete} />

              {/* Table */}
              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : !competitions?.length ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border">
                  <Trophy className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مسابقات" : "No competitions found"}</p>
                  <Button asChild variant="outline" size="sm" className="mt-3 gap-1.5 rounded-xl">
                    <Link to="/competitions/create"><Plus className="h-3.5 w-3.5" />{isAr ? "إنشاء مسابقة" : "Create Competition"}</Link>
                  </Button>
                </div>
              ) : (
                <AdminTableCard>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10"><Checkbox checked={isAllSelected} onCheckedChange={toggleAll} /></TableHead>
                        <SortableTableHead column="title" label={isAr ? "المسابقة" : "Competition"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleCompSort} />
                        <TableHead className="hidden lg:table-cell">{isAr ? "المنظم" : "Organizer"}</TableHead>
                        <SortableTableHead column="status" label={isAr ? "الحالة" : "Status"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleCompSort} />
                        <SortableTableHead column="competition_start" label={isAr ? "التاريخ" : "Date"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleCompSort} className="hidden md:table-cell" />
                        <TableHead className="hidden xl:table-cell">{isAr ? "المشاركين" : "Participants"}</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compPagination.paginated?.map(comp => {
                        const counts = participantCounts?.[comp.id] || { approved: 0, pending: 0 };
                        const fillPct = comp.max_participants ? Math.min(Math.round((counts.approved / comp.max_participants) * 100), 100) : 0;

                        return (
                          <TableRow key={comp.id} className="group">
                            <TableCell className="w-10"><Checkbox checked={isSelected(comp.id)} onCheckedChange={() => toggleOne(comp.id)} /></TableCell>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[200px]">
                                  {(() => {
                                    const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
                                    const yr = comp.edition_year;
                                    if (!yr || title.includes(String(yr))) return title;
                                    return `${title} ${yr}`;
                                  })()}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {comp.edition_year && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 font-mono">{comp.edition_year}</Badge>
                                  )}
                                  {comp.competition_number && (
                                    <span className="text-[10px] text-muted-foreground font-mono">{comp.competition_number}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {comp.derivedOrganizer ? (
                                <div className="flex items-center gap-2">
                                  {comp.derivedOrganizer.logo_url ? (
                                    <img src={comp.derivedOrganizer.logo_url} alt="Organizer" className="h-5 w-5 rounded object-contain" loading="lazy" />
                                  ) : (
                                    <div className="h-5 w-5 rounded bg-muted flex items-center justify-center"><Building2 className="h-3 w-3 text-muted-foreground" /></div>
                                  )}
                                  <span className="text-xs truncate max-w-[100px]">{isAr && comp.derivedOrganizer.name_ar ? comp.derivedOrganizer.name_ar : comp.derivedOrganizer.name}</span>
                                </div>
                              ) : <span className="text-[11px] text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-[11px] font-normal border-0 rounded-lg ${statusConfig[comp.status as CompetitionStatus].bg}`}>
                                <span className={`me-1 inline-block h-1.5 w-1.5 rounded-full ${statusConfig[comp.status as CompetitionStatus].dot}`} />
                                {isAr ? statusConfig[comp.status as CompetitionStatus].labelAr : statusConfig[comp.status as CompetitionStatus].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {comp.competition_start ? (
                                <div>
                                  <span className="text-xs tabular-nums">{format(new Date(comp.competition_start), "MMM d, yyyy")}</span>
                                  {comp.city && <p className="text-[10px] text-muted-foreground">{comp.city}</p>}
                                </div>
                              ) : <span className="text-[11px] text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <div className="min-w-[70px]">
                                <span className="text-xs tabular-nums">{counts.approved}{comp.max_participants ? `/${comp.max_participants}` : ""}</span>
                                {comp.max_participants && <Progress value={fillPct} className="h-1 mt-1" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {comp.status === "pending" && (
                                  <>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => approveCompetition.mutate(comp)}><CheckCircle className="h-3.5 w-3.5 text-chart-3" /></Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => rejectCompetition.mutate(comp)}><XCircle className="h-3.5 w-3.5 text-destructive" /></Button>
                                  </>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="text-xs">
                                    <DropdownMenuItem asChild><Link to={`/competitions/${comp.id}`}><Eye className="me-2 h-3.5 w-3.5" />{isAr ? "عرض" : "View"}</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link to={`/competitions/${comp.id}/edit`}><Edit className="me-2 h-3.5 w-3.5" />{isAr ? "تعديل" : "Edit"}</Link></DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => duplicateMutation.mutate(comp)}><Copy className="me-2 h-3.5 w-3.5" />{isAr ? "نسخ" : "Duplicate"}</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {ALL_STATUSES.filter(s => s !== comp.status).slice(0, 4).map(status => (
                                      <DropdownMenuItem key={status} onClick={() => updateStatusMutation.mutate({ id: comp.id, status })}>
                                        <span className={`me-2 inline-block h-2 w-2 rounded-full ${statusConfig[status].dot}`} />
                                        {isAr ? statusConfig[status].labelAr : statusConfig[status].label}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    {(comp.status === "draft" || comp.status === "pending") && (
                                      <DropdownMenuItem onClick={() => { if (confirm(isAr ? "حذف؟" : "Delete?")) deleteMutation.mutate(comp.id); }} className="text-destructive">
                                        <Trash2 className="me-2 h-3.5 w-3.5" />{isAr ? "حذف" : "Delete"}
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <AdminTablePagination
                    page={compPagination.page} totalPages={compPagination.totalPages} totalItems={compPagination.totalItems}
                    startItem={compPagination.startItem} endItem={compPagination.endItem} pageSize={compPagination.pageSize}
                    pageSizeOptions={compPagination.pageSizeOptions} hasNext={compPagination.hasNext} hasPrev={compPagination.hasPrev}
                    onPageChange={compPagination.goTo} onPageSizeChange={compPagination.changePageSize}
                  />
                </AdminTableCard>
              )}
            </div>
          )}

          {/* === JUDGING TAB === */}
          {activeTab === "judging" && <JudgingPanel competitions={competitions || []} isAr={isAr} />}

          {/* === RESULTS TAB === */}
          {activeTab === "results" && <ResultsPanel competitions={competitions || []} isAr={isAr} />}

          {/* === PIPELINE TAB === */}
          {activeTab === "pipeline" && (
            <div className="space-y-4">
              <CompetitionLifecycleWidget />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2"><CompetitionPipelineTracker /></div>
                <RegistrationTimelineWidget />
              </div>
            </div>
          )}

          {/* === LIVE STATS TAB === */}
          {activeTab === "live" && (
            <div className="space-y-4">
              <CompetitionLiveStatsWidget />
              <JudgingOverviewWidget />
            </div>
          )}

          {/* === SCORING TAB === */}
          {activeTab === "scoring" && (
            <div className="space-y-4">
              <CompetitionScoringOverview />
              <CompetitionJudgingTracker />
            </div>
          )}

          {/* === INSIGHTS TAB === */}
          {activeTab === "insights" && (
            <div className="space-y-4">
              <CompetitionAnalyticsWidget />
            </div>
          )}

          {/* === IMPORT TAB === */}
          {activeTab === "import" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant={showSmartImport ? "default" : "outline"} size="sm" className="gap-1.5 text-xs rounded-xl" onClick={() => { setShowSmartImport(true); setShowBulkImport(false); }}>
                  <Sparkles className="h-3.5 w-3.5" />{isAr ? "استيراد ذكي" : "Smart Import"}
                </Button>
                <Button variant={showBulkImport ? "default" : "outline"} size="sm" className="gap-1.5 text-xs rounded-xl" onClick={() => { setShowBulkImport(true); setShowSmartImport(false); }}>
                  <FileSpreadsheet className="h-3.5 w-3.5" />{isAr ? "استيراد ملف" : "File Import"}
                </Button>
              </div>
              {showSmartImport && <CompetitionSmartImport onImport={handleSmartImport} onClose={() => setShowSmartImport(false)} />}
              {showBulkImport && <BulkImportPanel entityType="competition" onImportComplete={() => { setShowBulkImport(false); queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); }} />}
              {!showSmartImport && !showBulkImport && (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border">
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">{isAr ? "اختر طريقة الاستيراد" : "Choose an import method above"}</p>
                </div>
              )}
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}

// ── Judging Panel ──────────────────────────
function JudgingPanel({ competitions, isAr }: { competitions: Record<string, unknown>[]; isAr: boolean }) {
  const judgingComps = useMemo(() => competitions.filter(c => ["judging", "in_progress"].includes(c.status)), [competitions]);

  const { data: judgingData = [] } = useQuery({
    queryKey: ["judging-overview"],
    queryFn: async () => {
      const compIds = judgingComps.map(c => c.id);
      if (compIds.length === 0) return [];
      const { data } = await supabase.from("competition_registrations").select("id, competition_id, participant_id, status").in("competition_id", compIds).limit(QUERY_LIMIT_MEDIUM);
      return (data || []) as any[];
    },
    enabled: judgingComps.length > 0,
  });

  if (judgingComps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border">
        <Gavel className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مسابقات في مرحلة التحكيم" : "No competitions in judging phase"}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {judgingComps.map(comp => {
        const regs = judgingData.filter(s => s.competition_id === comp.id);
        const approved = regs.filter(s => s.status === "approved").length;
        const pending = regs.filter(s => s.status === "pending").length;
        const progress = comp.max_participants ? Math.round((approved / comp.max_participants) * 100) : 50;

        return (
          <div key={comp.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-3 transition-all hover:shadow-sm hover:border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{isAr && comp.title_ar ? comp.title_ar : comp.title}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{comp.competition_number}</p>
              </div>
              <Badge className={`text-[11px] border-0 rounded-lg ${statusConfig[comp.status as CompetitionStatus]?.bg}`}>
                {isAr ? statusConfig[comp.status as CompetitionStatus]?.labelAr : statusConfig[comp.status as CompetitionStatus]?.label}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: isAr ? "مسجلين" : "Registered", value: regs.length, color: "text-primary" },
                { label: isAr ? "معتمدين" : "Approved", value: approved, color: "text-chart-2" },
                { label: isAr ? "معلق" : "Pending", value: pending, color: "text-chart-4" },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-xl bg-muted/30">
                  <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{isAr ? "التقدم" : "Progress"}</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Results Panel ──────────────────────────
function ResultsPanel({ competitions, isAr }: { competitions: Record<string, unknown>[]; isAr: boolean }) {
  const completedComps = useMemo(() => competitions.filter(c => c.status === "completed"), [competitions]);

  const { data: resultsData = [] } = useQuery({
    queryKey: ["results-overview"],
    queryFn: async () => {
      const compIds = completedComps.map(c => c.id);
      if (compIds.length === 0) return [];
      const { data } = await supabase.from("competition_registrations").select("id, competition_id, participant_id, status, final_rank").in("competition_id", compIds).not("final_rank", "is", null).order("final_rank", { ascending: true }).limit(100);
      return (data || []) as any[];
    },
    enabled: completedComps.length > 0,
  });

  if (completedComps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border">
        <Medal className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مسابقات مكتملة" : "No completed competitions"}</p>
      </div>
    );
  }

  const medalEmoji = (rank: number) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {completedComps.map(comp => {
        const compResults = resultsData.filter(r => r.competition_id === comp.id);
        return (
          <div key={comp.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-3 transition-all hover:shadow-sm hover:border-primary/20">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{isAr && comp.title_ar ? comp.title_ar : comp.title}</p>
              <Badge variant="secondary" className="text-[11px] rounded-lg">{compResults.length} {isAr ? "نتيجة" : "results"}</Badge>
            </div>
            {compResults.length > 0 ? (
              <div className="space-y-1.5">
                {compResults.slice(0, 5).map(result => (
                  <div key={result.id} className="flex items-center gap-2.5 rounded-xl border border-border/40 p-2 bg-muted/20">
                    <span className="text-sm w-6 text-center">{medalEmoji(result.final_rank)}</span>
                    <p className="text-xs font-medium flex-1 truncate">{isAr ? "مشارك" : "Participant"} #{result.participant_id?.slice(0, 8)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا نتائج بعد" : "No results yet"}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
