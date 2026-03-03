import { useState, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CompetitionPipelineTracker } from "@/components/admin/CompetitionPipelineTracker";
import { JudgingOverviewWidget } from "@/components/admin/JudgingOverviewWidget";
import { RegistrationTimelineWidget } from "@/components/admin/RegistrationTimelineWidget";
import { CompetitionAnalyticsWidget } from "@/components/admin/CompetitionAnalyticsWidget";
import { CompetitionLiveStatsWidget } from "@/components/admin/CompetitionLiveStatsWidget";
import { CompetitionScoringOverview } from "@/components/admin/CompetitionScoringOverview";
import { CompetitionJudgingTracker } from "@/components/admin/CompetitionJudgingTracker";
import { CompetitionLifecycleWidget } from "@/components/admin/CompetitionLifecycleWidget";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { CompetitionSmartImport } from "@/components/smart-import/CompetitionSmartImport";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MoreHorizontal, Eye, Edit, Trash2, Trophy, Users, Calendar, MapPin, Sparkles, Filter, Globe, Plus, Copy, Building2, Tag, FileSpreadsheet, Gavel, Medal, BarChart3, CheckCircle, XCircle, Layers, Download } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

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
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [viewTab, setViewTab] = useState<"list" | "judging" | "results">("list");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");

  // Fetch event series for filter
  const { data: seriesList } = useQuery({
    queryKey: ["event-series-comp-filter"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("event_series").select("id, name, name_ar").eq("is_active", true).order("name");
      if (error) throw error;
      return data as { id: string; name: string; name_ar: string | null }[];
    },
  });

  // Fetch competitions with organizer and exhibition info
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
      if (yearFilter !== "all") query = query.gte("competition_start", `${yearFilter}-01-01`).lte("competition_start", `${yearFilter}-12-31`);

      const { data, error } = await query;
      if (error) throw error;

      // Collect entity IDs from exhibitions for organizer display
      const entityIds = [...new Set((data || []).map(c => (c.exhibition as any)?.organizer_entity_id).filter(Boolean))];
      const companyIds = [...new Set((data || []).map(c => (c.exhibition as any)?.organizer_company_id).filter(Boolean))];

      let entityMap: Record<string, any> = {};
      let companyMap: Record<string, any> = {};

      if (entityIds.length > 0) {
        const { data: entities } = await supabase
          .from("culinary_entities")
          .select("id, name, name_ar, logo_url, abbreviation")
          .in("id", entityIds);
        entities?.forEach(e => { entityMap[e.id] = e; });
      }

      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, name, name_ar, logo_url")
          .in("id", companyIds);
        companies?.forEach(c => { companyMap[c.id] = c; });
      }

      return (data || []).map(c => {
        const exh = c.exhibition as any;
        // Derive organizer from exhibition entity/company first, fallback to exhibition name
        let derivedOrganizer: any = null;
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
    staleTime: 1000 * 60 * 2,
  });

  // Fetch categories for display
  const { data: allCategories } = useQuery({
    queryKey: ["adminCompetitionCategories"],
    queryFn: async () => {
      const { data } = await supabase.from("competition_categories").select("id, competition_id, name, name_ar");
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch type assignments
  const { data: typeAssignments } = useQuery({
    queryKey: ["adminCompetitionTypes"],
    queryFn: async () => {
      const { data } = await supabase.from("competition_type_assignments").select("competition_id, type:competition_types(id, name, name_ar)");
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
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

  // Unique organizers for filter (derived from exhibition)
  const uniqueOrganizers = competitions?.reduce((acc, c) => {
    if (c.derivedOrganizer && !acc.find((o: any) => o.name === c.derivedOrganizer.name)) acc.push(c.derivedOrganizer);
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] }); toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" }); },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const approveCompetition = useMutation({
    mutationFn: async (comp: any) => {
      const { error } = await supabase.from("competitions").update({ status: "draft" as CompetitionStatus }).eq("id", comp.id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "approve_competition", details: { competition_id: comp.id } });
      // Notify admins
      import("@/lib/notificationTriggers").then(({ notifyAdminCompetitionReview }) => {
        // We reuse the pattern but with a status-change style notification
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] });
      toast({ title: isAr ? "تمت الموافقة ونقلها إلى مسودة" : "Competition approved and moved to draft" });
    },
    onError: (error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const rejectCompetition = useMutation({
    mutationFn: async (comp: any) => {
      const { error } = await supabase.from("competitions").update({ status: "cancelled" as CompetitionStatus }).eq("id", comp.id);
      if (error) throw error;
      await supabase.from("admin_actions").insert({ admin_id: user!.id, action_type: "reject_competition", details: { competition_id: comp.id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] });
      toast({ title: isAr ? "تم رفض المسابقة" : "Competition rejected" });
    },
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

  // Bulk actions
  const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count: bulkCount, selectedItems, isSelected } =
    useAdminBulkActions(competitions || []);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "العنوان" : "Title", accessor: (r: any) => isAr && r.title_ar ? r.title_ar : r.title },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.status },
      { header: isAr ? "التاريخ" : "Start Date", accessor: (r: any) => r.competition_start || "" },
      { header: isAr ? "المدينة" : "City", accessor: (r: any) => r.city || "" },
      { header: isAr ? "الدولة" : "Country", accessor: (r: any) => r.country || "" },
      { header: isAr ? "الحد الأقصى" : "Max Participants", accessor: (r: any) => r.max_participants || "" },
      { header: isAr ? "رقم المسابقة" : "Competition #", accessor: (r: any) => r.competition_number || "" },
    ],
    filename: "competitions",
  });

  const bulkStatusChange = async (status: string) => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("competitions").update({ status: status as CompetitionStatus }).in("id", ids);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
    clearSelection();
    toast({ title: isAr ? `تم تحديث ${ids.length} مسابقة` : `${ids.length} competitions updated` });
  };

  const bulkDelete = async () => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف المسابقات المحددة؟" : "Delete selected competitions?")) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("competitions").delete().in("id", ids);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
    clearSelection();
    toast({ title: isAr ? `تم حذف ${ids.length} مسابقة` : `${ids.length} competitions deleted` });
  };

  const stats = {
    total: competitions?.length || 0,
    pending: competitions?.filter(c => c.status === "pending").length || 0,
    active: competitions?.filter(c => ["in_progress", "judging", "registration_open"].includes(c.status)).length || 0,
    completed: competitions?.filter(c => c.status === "completed").length || 0,
    draft: competitions?.filter(c => c.status === "draft").length || 0,
  };

  const getCategoriesForComp = (compId: string) => allCategories?.filter(c => c.competition_id === compId) || [];
  const getTypesForComp = (compId: string) => typeAssignments?.filter((t: any) => t.competition_id === compId) || [];

  // Smart Import handler with create/update support and related data saving
  const handleSmartImport = useCallback(async (data: ImportedData, mode: "create" | "update", existingId?: string) => {
    try {
      const nameEn = data.name_en?.trim();
      const nameAr = data.name_ar?.trim();
      const now = new Date().toISOString();

      const competitionPayload: Record<string, any> = {
        title: nameEn || nameAr || "Untitled",
        title_ar: nameAr || null,
        description: data.description_en || null,
        description_ar: data.description_ar || null,
        city: data.city_en || null,
        country_code: data.country_code || null,
        country: data.country_en || null,
        venue: data.venue_en || null,
        venue_ar: data.venue_ar || null,
        competition_start: data.start_date || now,
        competition_end: data.end_date || now,
        registration_start: data.start_date || null,
        registration_end: data.registration_deadline || null,
        edition_year: data.edition_year || new Date().getFullYear(),
        registration_fee: data.registration_fee || null,
        registration_currency: data.currency || "SAR",
        rules_summary: data.rules_summary_en || null,
        rules_summary_ar: data.rules_summary_ar || null,
        scoring_notes: data.scoring_method_en || null,
        scoring_notes_ar: data.scoring_method_ar || null,
        cover_image_url: data.cover_url || null,
        max_participants: data.max_attendees || null,
        max_team_size: data.max_team_size || null,
        min_team_size: data.min_team_size || null,
        allowed_entry_types: data.allowed_entry_types || null,
        blind_judging_enabled: data.blind_judging || false,
        is_virtual: data.is_virtual || false,
        import_source: "smart_import",
        // New structured columns
        terms_conditions: data.terms_conditions_en || null,
        terms_conditions_ar: data.terms_conditions_ar || null,
        eligibility: data.eligibility_en || null,
        eligibility_ar: data.eligibility_ar || null,
        participation_requirements: data.participation_requirements_en?.length ? data.participation_requirements_en : null,
        participation_requirements_ar: data.participation_requirements_ar?.length ? data.participation_requirements_ar : null,
        dress_code: data.dress_code || null,
        dress_code_ar: data.dress_code_ar || null,
        age_restrictions: data.age_restrictions || null,
        equipment_provided: data.equipment_provided?.length ? data.equipment_provided : null,
        equipment_required: data.equipment_required?.length ? data.equipment_required : null,
        organizer_name: data.organizer_name_en || null,
        organizer_name_ar: data.organizer_name_ar || null,
        organizer_website: data.organizer_website || null,
        organizer_email: data.organizer_email || null,
        competition_website: data.website || null,
        competition_email: data.email || null,
        competition_phone: data.phone || null,
        registration_url: data.registration_url || null,
        // JSONB columns for complex structured data
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
        const { data: inserted, error } = await supabase.from("competitions").insert({
          ...competitionPayload,
          status: "draft" as any,
          organizer_id: user?.id || "",
        } as any).select("id").single();
        if (error) throw error;
        competitionId = inserted.id;
      }

      // Save judging criteria to judging_criteria table
      if (data.judging_criteria?.length) {
        if (mode === "update") {
          await supabase.from("judging_criteria").delete().eq("competition_id", competitionId);
        }
        const criteriaRows = data.judging_criteria.map((c, i) => ({
          competition_id: competitionId,
          name: c.criterion,
          name_ar: c.criterion_ar || null,
          description: c.description || null,
          description_ar: c.description_ar || null,
          weight: c.weight || 0,
          max_score: 100,
          sort_order: i + 1,
        }));
        await supabase.from("judging_criteria").insert(criteriaRows);
      }

      // Save competition categories/versions
      if (data.competition_versions?.length) {
        if (mode === "update") {
          await supabase.from("competition_categories").delete().eq("competition_id", competitionId);
        }
        const catRows = data.competition_versions.map((v, i) => ({
          competition_id: competitionId,
          name: v.name,
          name_ar: v.name_ar || null,
          description: v.description || null,
          description_ar: v.description_ar || null,
          max_participants: v.max_participants || null,
          sort_order: i + 1,
          status: "active",
        }));
        await supabase.from("competition_categories").insert(catRows);
      }

      // Save competition rounds
      if (data.competition_rounds?.length) {
        if (mode === "update") {
          await supabase.from("competition_rounds").delete().eq("competition_id", competitionId);
        }
        const roundRows = data.competition_rounds.map((r, i) => ({
          competition_id: competitionId,
          name: r.name,
          name_ar: r.name_ar || null,
          round_number: i + 1,
          sort_order: i + 1,
          format: "standard",
          round_type: "elimination",
          status: "pending",
        }));
        await supabase.from("competition_rounds").insert(roundRows);
      }

      // Close the smart import panel after successful save
      setShowSmartImport(false);

      queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
      const savedParts: string[] = [];
      if (data.judging_criteria?.length) savedParts.push(`${data.judging_criteria.length} ${isAr ? "معايير تحكيم" : "judging criteria"}`);
      if (data.judging_committee?.length) savedParts.push(`${data.judging_committee.length} ${isAr ? "أعضاء لجنة" : "committee members"}`);
      if (data.competition_versions?.length) savedParts.push(`${data.competition_versions.length} ${isAr ? "فئات" : "categories"}`);
      if (data.competition_rounds?.length) savedParts.push(`${data.competition_rounds.length} ${isAr ? "جولات" : "rounds"}`);
      if (data.prizes?.length) savedParts.push(`${data.prizes.length} ${isAr ? "جوائز" : "prizes"}`);
      if (data.competition_schedule?.length) savedParts.push(`${data.competition_schedule.length} ${isAr ? "أحداث جدول" : "schedule items"}`);
      if (data.terms_conditions_en) savedParts.push(isAr ? "الشروط والأحكام" : "terms & conditions");
      if (data.eligibility_en) savedParts.push(isAr ? "شروط الأهلية" : "eligibility");

      toast({
        title: isAr ? (mode === "update" ? "✅ تم تحديث المسابقة بنجاح" : "✅ تم استيراد المسابقة بنجاح") : (mode === "update" ? "✅ Competition Updated Successfully" : "✅ Competition Imported Successfully"),
        description: `"${nameEn || nameAr}" ${isAr ? (mode === "update" ? "تم تحديثها" : "تم إنشاؤها كمسودة") : (mode === "update" ? "updated" : "created as draft")}${savedParts.length ? ` + ${savedParts.join(", ")}` : ""}`,
      });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    }
  }, [isAr, user, queryClient, toast]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Trophy}
        title={isAr ? "إدارة المسابقات" : "Competition Management"}
        description={isAr ? "إدارة ومراقبة جميع المسابقات" : "Manage and monitor all competitions"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(competitions || [])}>
              <Download className="me-2 h-4 w-4" />
              {isAr ? "تصدير" : "Export"}
            </Button>
            <Button variant={showSmartImport ? "secondary" : "outline"} size="sm" onClick={() => setShowSmartImport(!showSmartImport)}>
              <Sparkles className="me-2 h-4 w-4" />
              {isAr ? "استيراد ذكي" : "Smart Import"}
            </Button>
            <Button variant={showBulkImport ? "secondary" : "outline"} size="sm" onClick={() => setShowBulkImport(!showBulkImport)}>
              <FileSpreadsheet className="me-2 h-4 w-4" />
              {isAr ? "استيراد ملف" : "File Import"}
            </Button>
            <Button asChild className="gap-2 shadow-lg shadow-primary/20">
              <Link to="/competitions/create">
                <Plus className="h-4 w-4" />
                {isAr ? "إضافة مسابقة" : "Add Competition"}
              </Link>
            </Button>
          </div>
        }
      />

      {/* Smart Import Panel (inline) */}
      {showSmartImport && (
        <CompetitionSmartImport
          onImport={handleSmartImport}
          onClose={() => setShowSmartImport(false)}
        />
      )}

      {/* Competition Analytics */}
      <CompetitionLifecycleWidget />
      <CompetitionLiveStatsWidget />
      <CompetitionScoringOverview />
      <CompetitionJudgingTracker />
      <CompetitionAnalyticsWidget />

      {/* Bulk Import */}
      {showBulkImport && (
        <BulkImportPanel entityType="competition" onImportComplete={() => { setShowBulkImport(false); queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] }); }} />
      )}

      {/* Pipeline, Judging & Registration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CompetitionPipelineTracker />
        </div>
        <div className="space-y-4">
          <JudgingOverviewWidget />
          <RegistrationTimelineWidget />
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as any)}>
        <TabsList className="rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5 h-auto">
          <TabsTrigger value="list" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm">
            <Trophy className="h-3.5 w-3.5" /> {isAr ? "المسابقات" : "Competitions"}
          </TabsTrigger>
          <TabsTrigger value="judging" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm">
            <Gavel className="h-3.5 w-3.5" /> {isAr ? "التحكيم" : "Judging"}
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5 rounded-xl data-[state=active]:shadow-sm">
            <Medal className="h-3.5 w-3.5" /> {isAr ? "النتائج" : "Results"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="judging">
          <JudgingPanel competitions={competitions || []} isAr={isAr} />
        </TabsContent>

        <TabsContent value="results">
          <ResultsPanel competitions={competitions || []} isAr={isAr} />
        </TabsContent>

        <TabsContent value="list">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, icon: <Trophy className="h-4 w-4 text-primary" />, bg: "bg-primary/10" },
          { label: isAr ? "معلقة" : "Pending", value: stats.pending, icon: <Calendar className="h-4 w-4 text-chart-4" />, bg: "bg-chart-4/10" },
          { label: isAr ? "نشطة" : "Active", value: stats.active, icon: <Sparkles className="h-4 w-4 text-chart-3" />, bg: "bg-chart-3/10" },
          { label: isAr ? "مكتملة" : "Completed", value: stats.completed, icon: <Calendar className="h-4 w-4 text-chart-5" />, bg: "bg-chart-5/10" },
          { label: isAr ? "مسودة" : "Draft", value: stats.draft, icon: <Edit className="h-4 w-4 text-muted-foreground" />, bg: "bg-muted" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} shrink-0 transition-transform duration-300 group-hover:scale-110`}>{stat.icon}</div>
              <div>
                <AnimatedCounter value={stat.value} className="text-2xl font-bold" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-wrap gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث بالعنوان أو المدينة..." : "Search by title or city..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10 rounded-xl"
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
                {uniqueOrganizers.map((org: any, i: number) => (
                  <SelectItem key={org.name + i} value={org.name}>
                    {isAr && org.name_ar ? org.name_ar : org.name}
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
          {seriesList && seriesList.length > 0 && (
            <Select value={seriesFilter} onValueChange={setSeriesFilter}>
              <SelectTrigger className="w-40">
                <Layers className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={isAr ? "السلسلة" : "Series"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع السلاسل" : "All Series"}</SelectItem>
                <SelectItem value="none">{isAr ? "بدون سلسلة" : "No Series"}</SelectItem>
                {seriesList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{isAr && s.name_ar ? s.name_ar : s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={bulkCount}
        onClear={clearSelection}
        onExport={() => exportCSV(selectedItems)}
        onStatusChange={(s) => bulkStatusChange(s)}
        onDelete={bulkDelete}
      />

      {/* Table */}
      <Card className="rounded-2xl border-border/40 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <AdminTableSkeleton rows={6} columns={6} />
            </div>
          ) : competitions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Trophy className="h-6 w-6 text-primary/40" />
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
                  <TableHead className="w-10">
                    <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                  </TableHead>
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
                    <TableRow key={comp.id} className={`group hover:bg-muted/20 transition-colors duration-150 ${isSelected(comp.id) ? "bg-primary/5" : ""}`}>
                      <TableCell>
                        <Checkbox checked={isSelected(comp.id)} onCheckedChange={() => toggleOne(comp.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[220px]">
                          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {isAr && comp.title_ar ? comp.title_ar : comp.title}
                            {comp.edition_year && <span className="ms-1.5 text-primary font-bold text-[10px]">+{comp.edition_year}</span>}
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
                          {comp.derivedOrganizer ? (
                            <div className="flex items-center gap-2">
                              {comp.derivedOrganizer.logo_url ? (
                                <img src={comp.derivedOrganizer.logo_url} alt="" className="h-6 w-6 rounded-xl object-contain" />
                              ) : (
                                <div className="h-6 w-6 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-3 w-3 text-primary/50" />
                                </div>
                              )}
                              <span className="text-xs truncate max-w-[120px]">
                                {isAr && comp.derivedOrganizer.name_ar ? comp.derivedOrganizer.name_ar : comp.derivedOrganizer.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {comp.exhibition && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{isAr && (comp.exhibition as any).title_ar ? (comp.exhibition as any).title_ar : (comp.exhibition as any).title}</span>
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
                        <div className="flex justify-end gap-1">
                          {comp.status === "pending" && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => approveCompetition.mutate(comp)} className="h-8 w-8 text-chart-2 hover:text-chart-2" title={isAr ? "موافقة" : "Approve"}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => rejectCompetition.mutate(comp)} className="h-8 w-8 text-destructive hover:text-destructive" title={isAr ? "رفض" : "Reject"}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/competitions/${comp.id}`}><Eye className="me-2 h-4 w-4" />{isAr ? "عرض" : "View"}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/competitions/${comp.id}/edit`}><Edit className="me-2 h-4 w-4" />{isAr ? "تعديل" : "Edit"}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateMutation.mutate(comp)}>
                              <Copy className="me-2 h-4 w-4" />{isAr ? "نسخ" : "Duplicate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ALL_STATUSES.filter(s => s !== comp.status).slice(0, 4).map(status => (
                              <DropdownMenuItem key={status} onClick={() => updateStatusMutation.mutate({ id: comp.id, status })}>
                                <span className={`me-2 inline-block h-2 w-2 rounded-full ${statusConfig[status].dot}`} />
                                {isAr ? statusConfig[status].labelAr : statusConfig[status].label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            {(comp.status === "draft" || comp.status === "pending") && (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
                                    deleteMutation.mutate(comp.id);
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="me-2 h-4 w-4" />{isAr ? "حذف" : "Delete"}
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
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>


    </div>
  );
}

// ── Judging Panel ──────────────────────────
function JudgingPanel({ competitions, isAr }: { competitions: any[]; isAr: boolean }) {
  const judgingComps = competitions.filter(c => ["judging", "in_progress"].includes(c.status));

  const { data: judgingData = [] } = useQuery({
    queryKey: ["judging-overview"],
    queryFn: async () => {
      const compIds = judgingComps.map(c => c.id);
      if (compIds.length === 0) return [];
      const { data } = await supabase
        .from("competition_registrations")
        .select("id, competition_id, participant_id, status")
        .in("competition_id", compIds)
        .limit(500);
      return (data || []) as any[];
    },
    enabled: judgingComps.length > 0,
  });

  if (judgingComps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Gavel className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مسابقات في مرحلة التحكيم" : "No competitions in judging phase"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {judgingComps.map(comp => {
        const regs = judgingData.filter((s: any) => s.competition_id === comp.id);
        const approvedRegs = regs.filter((s: any) => s.status === "approved");
        const uniqueParticipants = approvedRegs.length;
        const progress = comp.max_participants ? Math.round((uniqueParticipants / comp.max_participants) * 100) : 50;

        return (
          <Card key={comp.id} className="rounded-2xl border-border/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{isAr && comp.title_ar ? comp.title_ar : comp.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{comp.competition_number}</p>
                </div>
                <Badge className={statusConfig[comp.status as CompetitionStatus]?.bg || "bg-muted"}>
                  {isAr ? statusConfig[comp.status as CompetitionStatus]?.labelAr : statusConfig[comp.status as CompetitionStatus]?.label}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center rounded-xl border border-border/40 p-2.5 bg-muted/20">
                  <AnimatedCounter value={regs.length} className="text-lg font-bold" />
                  <p className="text-[10px] text-muted-foreground">{isAr ? "مسجلين" : "Registered"}</p>
                </div>
                <div className="text-center rounded-xl border border-border/40 p-2.5 bg-chart-5/5">
                  <AnimatedCounter value={uniqueParticipants} className="text-lg font-bold text-chart-5" />
                  <p className="text-[10px] text-muted-foreground">{isAr ? "معتمدين" : "Approved"}</p>
                </div>
                <div className="text-center rounded-xl border border-border/40 p-2.5 bg-chart-4/5">
                  <AnimatedCounter value={regs.filter((r: any) => r.status === "pending").length} className="text-lg font-bold text-chart-4" />
                  <p className="text-[10px] text-muted-foreground">{isAr ? "معلق" : "Pending"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{isAr ? "تقدم التحكيم" : "Judging Progress"}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Results Panel ──────────────────────────
function ResultsPanel({ competitions, isAr }: { competitions: any[]; isAr: boolean }) {
  const completedComps = competitions.filter(c => c.status === "completed");

  const { data: resultsData = [] } = useQuery({
    queryKey: ["results-overview"],
    queryFn: async () => {
      const compIds = completedComps.map(c => c.id);
      if (compIds.length === 0) return [];
      const { data } = await supabase
        .from("competition_registrations")
        .select("id, competition_id, participant_id, status, final_rank")
        .in("competition_id", compIds)
        .not("final_rank", "is", null)
        .order("final_rank", { ascending: true })
        .limit(100);
      return (data || []) as any[];
    },
    enabled: completedComps.length > 0,
  });

  if (completedComps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Medal className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مسابقات مكتملة بنتائج" : "No completed competitions with results"}</p>
        </CardContent>
      </Card>
    );
  }

  const medalEmoji = (rank: number) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  return (
    <div className="space-y-4">
      {completedComps.map(comp => {
        const compResults = resultsData.filter(r => r.competition_id === comp.id);
        return (
          <Card key={comp.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{isAr && comp.title_ar ? comp.title_ar : comp.title}</p>
                <Badge variant="secondary" className="text-[10px]">{compResults.length} {isAr ? "نتيجة" : "results"}</Badge>
              </div>
              {compResults.length > 0 ? (
                <div className="space-y-2">
                  {compResults.slice(0, 5).map((result: any) => {
                    return (
                      <div key={result.id} className="flex items-center gap-3 rounded-xl border p-2.5">
                        <span className="text-lg w-8 text-center">{medalEmoji(result.final_rank)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {isAr ? "مشارك" : "Participant"} #{result.participant_id?.slice(0, 8)}
                          </p>
                        </div>
                        {result.total_score != null && (
                          <Badge variant="outline" className="text-[10px]">{result.total_score} {isAr ? "نقطة" : "pts"}</Badge>
                        )}
                        {result.medal && (
                          <Badge className="text-[10px] bg-chart-4/10 text-chart-4 border-0">{result.medal}</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لم يتم إدخال النتائج بعد" : "No results entered yet"}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
