import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCSVExport } from "@/hooks/useCSVExport";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MoreHorizontal,
  Eye,
  UserPlus,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  Calendar,
  Users,
  UserSearch,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  Download,
  Kanban,
  List,
  Trash2,
  ArrowRight,
  History,
  GripVertical,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Lead {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  type: string;
  status: string | null;
  source: string | null;
  notes: string | null;
  assigned_to: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
const LEAD_TYPES = ["sponsor", "organizer", "partnership", "general"] as const;
const PIPELINE_STAGES = ["new", "contacted", "qualified", "proposal", "won"] as const;

export default function LeadManagement() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [bulkActionPlaceholder] = useState(false); // moved bulk below leads
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create lead form
  const [newLead, setNewLead] = useState({
    contact_name: "",
    email: "",
    phone: "",
    company_name: "",
    type: "general",
    source: "",
    message: "",
    notes: "",
  });

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["adminLeads", searchQuery, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (searchQuery) {
        query = query.or(
          `contact_name.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        );
      }
      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  const bulk = useAdminBulkActions(leads);
  const selectedIds = bulk.selected;
  const setSelectedIds = (_v: any) => { bulk.clearSelection(); };

  // Lead stats
  const { data: stats } = useQuery({
    queryKey: ["leadStats"],
    queryFn: async () => {
      const { data: allLeads } = await supabase.from("leads").select("status, type");
      const total = allLeads?.length || 0;
      const newLeads = allLeads?.filter(l => l.status === "new").length || 0;
      const qualified = allLeads?.filter(l => l.status === "qualified").length || 0;
      const won = allLeads?.filter(l => l.status === "won").length || 0;
      return { total, newLeads, qualified, won };
    },
  });

  // Activity log for selected lead
  const { data: activityLog = [] } = useQuery({
    queryKey: ["leadActivity", selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead?.id) return [];
      const { data } = await supabase
        .from("admin_actions")
        .select("*")
        .eq("action_type", "update_lead")
        .order("created_at", { ascending: false })
        .limit(50);
      // Filter for this lead
      return (data || []).filter((a: any) => a.details?.lead_id === selectedLead.id);
    },
    enabled: !!selectedLead?.id && isDetailOpen,
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").insert({
        contact_name: newLead.contact_name,
        email: newLead.email,
        phone: newLead.phone || null,
        company_name: newLead.company_name || null,
        type: newLead.type,
        source: newLead.source || null,
        message: newLead.message || null,
        notes: newLead.notes || null,
        status: "new",
      });
      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        action_type: "update_lead",
        details: { action: "created", contact_name: newLead.contact_name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLeads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      setIsCreateOpen(false);
      setNewLead({ contact_name: "", email: "", phone: "", company_name: "", type: "general", source: "", message: "", notes: "" });
      toast({ title: isAr ? "تم إنشاء العميل المحتمل" : "Lead created successfully" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const { error } = await supabase
        .from("leads")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        action_type: "update_lead",
        details: { lead_id: id, updates },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLeads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      toast({ title: isAr ? "تم تحديث العميل المحتمل" : "Lead updated successfully" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        action_type: "update_lead",
        details: { action: "bulk_status_change", lead_ids: ids, new_status: status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLeads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      setSelectedIds(new Set());
      setBulkAction(null);
      toast({ title: isAr ? "تم تحديث العملاء المحتملين" : "Leads updated" });
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("leads").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLeads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      setSelectedIds(new Set());
      setBulkAction(null);
      toast({ title: isAr ? "تم حذف العملاء المحتملين" : "Leads deleted" });
    },
  });

  const handleStatusChange = (lead: Lead, newStatus: string) => {
    updateLeadMutation.mutate({ id: lead.id, updates: { status: newStatus } });
  };

  const handleSaveNotes = () => {
    if (selectedLead) {
      updateLeadMutation.mutate({ id: selectedLead.id, updates: { notes } });
      setIsDetailOpen(false);
    }
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || "");
    setIsDetailOpen(true);
  };

  const toggleSelect = bulk.toggleOne;
  const toggleSelectAll = bulk.toggleAll;

  const { exportCSV: exportLeadsCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (l: Lead) => l.contact_name },
      { header: isAr ? "البريد" : "Email", accessor: (l: Lead) => l.email },
      { header: isAr ? "الهاتف" : "Phone", accessor: (l: Lead) => l.phone || "" },
      { header: isAr ? "الشركة" : "Company", accessor: (l: Lead) => l.company_name || "" },
      { header: isAr ? "النوع" : "Type", accessor: (l: Lead) => l.type },
      { header: isAr ? "الحالة" : "Status", accessor: (l: Lead) => l.status || "new" },
      { header: isAr ? "المصدر" : "Source", accessor: (l: Lead) => l.source || "" },
      { header: isAr ? "التاريخ" : "Created", accessor: (l: Lead) => format(new Date(l.created_at), "yyyy-MM-dd") },
      { header: isAr ? "ملاحظات" : "Notes", accessor: (l: Lead) => (l.notes || "").replace(/\n/g, " ") },
    ],
    filename: "leads",
  });

  // Kanban data
  const kanbanData = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    PIPELINE_STAGES.forEach(s => { map[s] = []; });
    map["lost"] = [];
    leads.forEach(l => {
      const status = l.status || "new";
      if (map[status]) map[status].push(l);
    });
    return map;
  }, [leads]);

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      new: "bg-primary/10 text-primary",
      contacted: "bg-chart-4/10 text-chart-4",
      qualified: "bg-chart-5/10 text-chart-5",
      proposal: "bg-chart-3/10 text-chart-3",
      won: "bg-chart-5/10 text-chart-5",
      lost: "bg-destructive/10 text-destructive",
    };
    const statusLabels: Record<string, { en: string; ar: string }> = {
      new: { en: "New", ar: "جديد" },
      contacted: { en: "Contacted", ar: "تم التواصل" },
      qualified: { en: "Qualified", ar: "مؤهل" },
      proposal: { en: "Proposal", ar: "عرض سعر" },
      won: { en: "Won", ar: "ناجح" },
      lost: { en: "Lost", ar: "خسارة" },
    };
    const label = statusLabels[status || "new"]?.[language] || status || "New";
    return <Badge className={colors[status || "new"]} variant="outline">{label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      sponsor: "bg-chart-4/10 text-chart-4",
      organizer: "bg-chart-1/10 text-chart-1",
      partnership: "bg-chart-3/10 text-chart-3",
      general: "bg-muted text-muted-foreground",
    };
    const typeLabels: Record<string, { en: string; ar: string }> = {
      sponsor: { en: "Sponsor", ar: "راعٍ" },
      organizer: { en: "Organizer", ar: "منظم" },
      partnership: { en: "Partnership", ar: "شراكة" },
      general: { en: "General", ar: "عام" },
    };
    const label = typeLabels[type]?.[language] || type;
    return <Badge className={colors[type] || colors.general} variant="outline">{label}</Badge>;
  };

  const stageLabels: Record<string, { en: string; ar: string }> = {
    new: { en: "New", ar: "جديد" },
    contacted: { en: "Contacted", ar: "تم التواصل" },
    qualified: { en: "Qualified", ar: "مؤهل" },
    proposal: { en: "Proposal", ar: "عرض سعر" },
    won: { en: "Won", ar: "ناجح" },
    lost: { en: "Lost", ar: "خسارة" },
  };

  const stageColors: Record<string, string> = {
    new: "border-t-primary",
    contacted: "border-t-chart-4",
    qualified: "border-t-chart-5",
    proposal: "border-t-chart-3",
    won: "border-t-chart-5",
    lost: "border-t-destructive",
  };

  const statCards = [
    { title: isAr ? "إجمالي العملاء المحتملين" : "Total Leads", value: stats?.total || 0, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: isAr ? "عملاء جدد" : "New Leads", value: stats?.newLeads || 0, icon: Clock, color: "text-chart-4", bgColor: "bg-chart-4/10" },
    { title: isAr ? "مؤهلين" : "Qualified", value: stats?.qualified || 0, icon: TrendingUp, color: "text-chart-3", bgColor: "bg-chart-3/10" },
    { title: isAr ? "صفقات ناجحة" : "Won Deals", value: stats?.won || 0, icon: CheckCircle2, color: "text-chart-5", bgColor: "bg-chart-5/10" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={UserSearch}
        title={isAr ? "إدارة العملاء المحتملين" : "Lead Management"}
        description={isAr ? "تتبع وإدارة العملاء المحتملين والصفقات" : "Track and manage leads & deals pipeline"}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportLeadsCSV(bulk.count > 0 ? bulk.selectedItems : leads)} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {isAr ? "تصدير" : "Export"}
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {isAr ? "إضافة عميل" : "Add Lead"}
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + View Toggle */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث بالاسم أو البريد الإلكتروني أو الشركة..." : "Search by name, email, or company..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={isAr ? "نوع العميل" : "Lead Type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
              <SelectItem value="sponsor">{t("sponsor")}</SelectItem>
              <SelectItem value="organizer">{t("organizer")}</SelectItem>
              <SelectItem value="partnership">{isAr ? "شراكة" : "Partnership"}</SelectItem>
              <SelectItem value="general">{isAr ? "عام" : "General"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={isAr ? "الحالة" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الحالات" : "All Statuses"}</SelectItem>
              {LEAD_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{stageLabels[s]?.[language] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-e-none"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-s-none"
              onClick={() => setViewMode("kanban")}
            >
              <Kanban className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onExport={() => exportLeadsCSV(bulk.selectedItems)}
        onDelete={() => deleteLeadMutation.mutate([...bulk.selected])}
        onStatusChange={(status) => bulkUpdateMutation.mutate({ ids: [...bulk.selected], status })}
      />

      {/* Main Content */}
      {viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : leads.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {isAr ? "لا توجد نتائج" : "No leads found"}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={bulk.isAllSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{isAr ? "جهة الاتصال" : "Contact"}</TableHead>
                    <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "المصدر" : "Source"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map(lead => (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={bulk.isSelected(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                        />
                      </TableCell>
                      <TableCell onClick={() => openLeadDetail(lead)}>
                        <div>
                          <p className="font-medium">{lead.contact_name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => openLeadDetail(lead)}>
                        {lead.company_name || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell onClick={() => openLeadDetail(lead)}>{getTypeBadge(lead.type)}</TableCell>
                      <TableCell onClick={() => openLeadDetail(lead)}>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell onClick={() => openLeadDetail(lead)}>
                        <span className="text-sm text-muted-foreground">{lead.source || "-"}</span>
                      </TableCell>
                      <TableCell onClick={() => openLeadDetail(lead)}>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(lead.created_at), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openLeadDetail(lead)}>
                              <Eye className="me-2 h-4 w-4" />{isAr ? "عرض التفاصيل" : "View Details"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${lead.email}`}><Mail className="me-2 h-4 w-4" />{isAr ? "إرسال بريد" : "Send Email"}</a>
                            </DropdownMenuItem>
                            {lead.phone && (
                              <DropdownMenuItem asChild>
                                <a href={`tel:${lead.phone}`}><Phone className="me-2 h-4 w-4" />{isAr ? "اتصال" : "Call"}</a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {LEAD_STATUSES.filter(s => s !== lead.status).map(s => (
                              <DropdownMenuItem key={s} onClick={() => handleStatusChange(lead, s)}>
                                <ArrowRight className="me-2 h-4 w-4" />
                                {isAr ? stageLabels[s]?.ar : stageLabels[s]?.en}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Kanban Board View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...PIPELINE_STAGES, "lost" as const].map(stage => (
            <div key={stage} className="flex-shrink-0 w-[280px]">
              <Card className={`border-t-4 ${stageColors[stage]}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{isAr ? stageLabels[stage]?.ar : stageLabels[stage]?.en}</span>
                    <Badge variant="secondary" className="text-xs">{kanbanData[stage]?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2">
                      {(kanbanData[stage] || []).map(lead => (
                        <Card
                          key={lead.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => openLeadDetail(lead)}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium leading-tight">{lead.contact_name}</p>
                              {getTypeBadge(lead.type)}
                            </div>
                            {lead.company_name && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> {lead.company_name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              {lead.email && <Mail className="h-3 w-3" />}
                              {lead.phone && <Phone className="h-3 w-3" />}
                              <span className="ms-auto">
                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                              </span>
                            </div>
                            {/* Quick stage change */}
                            <div className="flex gap-1 pt-1 border-t" onClick={e => e.stopPropagation()}>
                              {LEAD_STATUSES.filter(s => s !== stage).slice(0, 3).map(s => (
                                <Button
                                  key={s}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={() => handleStatusChange(lead, s)}
                                >
                                  {isAr ? stageLabels[s]?.ar : stageLabels[s]?.en}
                                </Button>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {(kanbanData[stage] || []).length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-6">
                          {isAr ? "لا يوجد عملاء" : "No leads"}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Lead Detail Dialog with Activity Log */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLead?.contact_name}
              {selectedLead && getTypeBadge(selectedLead.type)}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "تفاصيل العميل المحتمل والملاحظات" : "Lead details, notes & activity"}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  {isAr ? "التفاصيل" : "Details"}
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-1.5 text-xs">
                  <History className="h-3.5 w-3.5" />
                  {isAr ? "السجل" : "Activity Log"}
                  {activityLog.length > 0 && (
                    <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[9px]">{activityLog.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {/* Contact Info */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border p-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? "البريد الإلكتروني" : "Email"}</p>
                      <a href={`mailto:${selectedLead.email}`} className="text-sm font-medium text-primary hover:underline">{selectedLead.email}</a>
                    </div>
                  </div>
                  {selectedLead.phone && (
                    <div className="flex items-center gap-3 rounded-xl border p-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{isAr ? "الهاتف" : "Phone"}</p>
                        <a href={`tel:${selectedLead.phone}`} className="text-sm font-medium text-primary hover:underline">{selectedLead.phone}</a>
                      </div>
                    </div>
                  )}
                  {selectedLead.company_name && (
                    <div className="flex items-center gap-3 rounded-xl border p-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{isAr ? "الشركة" : "Company"}</p>
                        <p className="text-sm font-medium">{selectedLead.company_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 rounded-xl border p-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? "تاريخ الإنشاء" : "Created"}</p>
                      <p className="text-sm font-medium">{format(new Date(selectedLead.created_at), "PPP")}</p>
                    </div>
                  </div>
                </div>

                {selectedLead.message && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{isAr ? "الرسالة" : "Message"}</p>
                    </div>
                    <div className="rounded-xl bg-muted p-4 text-sm">{selectedLead.message}</div>
                  </div>
                )}

                {/* Status Update */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">{isAr ? "تحديث الحالة" : "Update Status"}</p>
                  <Select
                    value={selectedLead.status || "new"}
                    onValueChange={value => {
                      updateLeadMutation.mutate({ id: selectedLead.id, updates: { status: value } });
                      setSelectedLead({ ...selectedLead, status: value });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{stageLabels[s]?.[language] || s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">{isAr ? "ملاحظات داخلية" : "Internal Notes"}</p>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={isAr ? "أضف ملاحظات حول هذا العميل المحتمل..." : "Add notes about this lead..."}
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-3">
                {activityLog.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد سجل نشاط" : "No activity recorded yet"}</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[350px]">
                    <div className="relative ps-6 space-y-4">
                      <div className="absolute start-2 top-0 bottom-0 w-px bg-border" />
                      {activityLog.map((entry: any) => (
                        <div key={entry.id} className="relative">
                          <div className="absolute start-[-18px] top-1 h-4 w-4 rounded-full bg-primary/10 ring-2 ring-background flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          </div>
                          <div className="rounded-xl border p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium">
                                {entry.details?.action === "created"
                                  ? (isAr ? "تم إنشاء العميل" : "Lead created")
                                  : entry.details?.action === "bulk_status_change"
                                    ? (isAr ? "تغيير حالة جماعي" : "Bulk status change")
                                    : entry.details?.updates?.status
                                      ? `${isAr ? "الحالة → " : "Status → "}${stageLabels[entry.details.updates.status]?.[language] || entry.details.updates.status}`
                                      : entry.details?.updates?.notes !== undefined
                                        ? (isAr ? "تحديث الملاحظات" : "Notes updated")
                                        : (isAr ? "تحديث" : "Updated")}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateLeadMutation.isPending}>
              {isAr ? "حفظ الملاحظات" : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Lead Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {isAr ? "إضافة عميل محتمل" : "Add New Lead"}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "أدخل بيانات العميل المحتمل الجديد" : "Enter new lead contact information"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={isAr ? "اسم جهة الاتصال *" : "Contact Name *"}
                value={newLead.contact_name}
                onChange={e => setNewLead({ ...newLead, contact_name: e.target.value })}
              />
              <Input
                placeholder={isAr ? "البريد الإلكتروني *" : "Email *"}
                type="email"
                value={newLead.email}
                onChange={e => setNewLead({ ...newLead, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={isAr ? "رقم الهاتف" : "Phone"}
                value={newLead.phone}
                onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
              />
              <Input
                placeholder={isAr ? "اسم الشركة" : "Company Name"}
                value={newLead.company_name}
                onChange={e => setNewLead({ ...newLead, company_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={newLead.type} onValueChange={v => setNewLead({ ...newLead, type: v })}>
                <SelectTrigger><SelectValue placeholder={isAr ? "النوع" : "Type"} /></SelectTrigger>
                <SelectContent>
                  {LEAD_TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                      {t === "sponsor" ? (isAr ? "راعٍ" : "Sponsor") :
                       t === "organizer" ? (isAr ? "منظم" : "Organizer") :
                       t === "partnership" ? (isAr ? "شراكة" : "Partnership") :
                       (isAr ? "عام" : "General")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={isAr ? "المصدر (مثال: موقع، إحالة)" : "Source (e.g., website, referral)"}
                value={newLead.source}
                onChange={e => setNewLead({ ...newLead, source: e.target.value })}
              />
            </div>
            <Textarea
              placeholder={isAr ? "رسالة أو وصف..." : "Message or description..."}
              value={newLead.message}
              onChange={e => setNewLead({ ...newLead, message: e.target.value })}
              rows={3}
            />
            <Textarea
              placeholder={isAr ? "ملاحظات داخلية..." : "Internal notes..."}
              value={newLead.notes}
              onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => createLeadMutation.mutate()}
              disabled={!newLead.contact_name.trim() || !newLead.email.trim() || createLeadMutation.isPending}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {createLeadMutation.isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء" : "Create Lead")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirm */}
      <AlertDialog open={bulkAction === "delete"} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Deletion"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل تريد حذف ${selectedIds.size} عميل محتمل؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Delete ${selectedIds.size} leads? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteLeadMutation.mutate([...selectedIds])}
            >
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
