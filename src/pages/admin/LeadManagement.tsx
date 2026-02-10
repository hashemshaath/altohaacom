import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

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
  created_at: string;
  updated_at: string;
}

const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
const LEAD_TYPES = ["sponsor", "organizer", "partnership", "general"] as const;

export default function LeadManagement() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [notes, setNotes] = useState("");

  // Fetch leads
  const { data: leads, isLoading } = useQuery({
    queryKey: ["adminLeads", searchQuery, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (searchQuery) {
        query = query.or(
          `contact_name.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        );
      }

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

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

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const { error } = await supabase
        .from("leads")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        action_type: "update_lead",
        details: { lead_id: id, updates },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLeads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      toast({ title: language === "ar" ? "تم تحديث العميل المحتمل" : "Lead updated successfully" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
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
    return (
      <Badge className={colors[status || "new"]} variant="outline">
        {label}
      </Badge>
    );
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
    return (
      <Badge className={colors[type] || colors.general} variant="outline">
        {label}
      </Badge>
    );
  };

  const statCards = [
    {
      title: language === "ar" ? "إجمالي العملاء المحتملين" : "Total Leads",
      value: stats?.total || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: language === "ar" ? "عملاء جدد" : "New Leads",
      value: stats?.newLeads || 0,
      icon: Clock,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      title: language === "ar" ? "مؤهلين" : "Qualified",
      value: stats?.qualified || 0,
      icon: TrendingUp,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: language === "ar" ? "صفقات ناجحة" : "Won Deals",
      value: stats?.won || 0,
      icon: CheckCircle2,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">
        {language === "ar" ? "إدارة العملاء المحتملين" : "Lead Management"}
      </h1>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
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

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "بحث بالاسم أو البريد الإلكتروني أو الشركة..." : "Search by name, email, or company..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={language === "ar" ? "نوع العميل" : "Lead Type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "ar" ? "جميع الأنواع" : "All Types"}</SelectItem>
              <SelectItem value="sponsor">{t("sponsor")}</SelectItem>
              <SelectItem value="organizer">{t("organizer")}</SelectItem>
              <SelectItem value="partnership">{language === "ar" ? "شراكة" : "Partnership"}</SelectItem>
              <SelectItem value="general">{language === "ar" ? "عام" : "General"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "ar" ? "جميع الحالات" : "All Statuses"}</SelectItem>
              <SelectItem value="new">{language === "ar" ? "جديد" : "New"}</SelectItem>
              <SelectItem value="contacted">{language === "ar" ? "تم التواصل" : "Contacted"}</SelectItem>
              <SelectItem value="qualified">{language === "ar" ? "مؤهل" : "Qualified"}</SelectItem>
              <SelectItem value="proposal">{language === "ar" ? "عرض سعر" : "Proposal"}</SelectItem>
              <SelectItem value="won">{language === "ar" ? "ناجح" : "Won"}</SelectItem>
              <SelectItem value="lost">{language === "ar" ? "خسارة" : "Lost"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "العملاء المحتملين" : "Leads"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : leads?.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {language === "ar" ? "لا توجد نتائج" : "No leads found"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "جهة الاتصال" : "Contact"}</TableHead>
                  <TableHead>{language === "ar" ? "الشركة" : "Company"}</TableHead>
                  <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{language === "ar" ? "المصدر" : "Source"}</TableHead>
                  <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads?.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openLeadDetail(lead)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.contact_name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.company_name || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{getTypeBadge(lead.type)}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {lead.source || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(lead.created_at), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openLeadDetail(lead)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {language === "ar" ? "عرض التفاصيل" : "View Details"}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${lead.email}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              {language === "ar" ? "إرسال بريد" : "Send Email"}
                            </a>
                          </DropdownMenuItem>
                          {lead.phone && (
                            <DropdownMenuItem asChild>
                              <a href={`tel:${lead.phone}`}>
                                <Phone className="mr-2 h-4 w-4" />
                                {language === "ar" ? "اتصال" : "Call"}
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(lead, "contacted")}
                            disabled={lead.status === "contacted"}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {language === "ar" ? "تحديد كـ تم التواصل" : "Mark Contacted"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(lead, "qualified")}
                            disabled={lead.status === "qualified"}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {language === "ar" ? "تحديد كـ مؤهل" : "Mark Qualified"}
                          </DropdownMenuItem>
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

      {/* Lead Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLead?.contact_name}
              {selectedLead && getTypeBadge(selectedLead.type)}
            </DialogTitle>
            <DialogDescription>
              {language === "ar" ? "تفاصيل العميل المحتمل والملاحظات" : "Lead details and notes"}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{language === "ar" ? "البريد الإلكتروني" : "Email"}</p>
                    <a href={`mailto:${selectedLead.email}`} className="text-sm font-medium text-primary hover:underline">
                      {selectedLead.email}
                    </a>
                  </div>
                </div>
                {selectedLead.phone && (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "الهاتف" : "Phone"}</p>
                      <a href={`tel:${selectedLead.phone}`} className="text-sm font-medium text-primary hover:underline">
                        {selectedLead.phone}
                      </a>
                    </div>
                  </div>
                )}
                {selectedLead.company_name && (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "الشركة" : "Company"}</p>
                      <p className="text-sm font-medium">{selectedLead.company_name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{language === "ar" ? "تاريخ الإنشاء" : "Created"}</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedLead.created_at), "PPP")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{language === "ar" ? "الرسالة" : "Message"}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-4 text-sm">
                    {selectedLead.message}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="space-y-2">
                <p className="text-sm font-medium">{language === "ar" ? "تحديث الحالة" : "Update Status"}</p>
                <Select
                  value={selectedLead.status || "new"}
                  onValueChange={(value) => {
                    updateLeadMutation.mutate({ id: selectedLead.id, updates: { status: value } });
                    setSelectedLead({ ...selectedLead, status: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{language === "ar" ? "جديد" : "New"}</SelectItem>
                    <SelectItem value="contacted">{language === "ar" ? "تم التواصل" : "Contacted"}</SelectItem>
                    <SelectItem value="qualified">{language === "ar" ? "مؤهل" : "Qualified"}</SelectItem>
                    <SelectItem value="proposal">{language === "ar" ? "عرض سعر" : "Proposal"}</SelectItem>
                    <SelectItem value="won">{language === "ar" ? "ناجح" : "Won"}</SelectItem>
                    <SelectItem value="lost">{language === "ar" ? "خسارة" : "Lost"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <p className="text-sm font-medium">{language === "ar" ? "ملاحظات داخلية" : "Internal Notes"}</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === "ar" ? "أضف ملاحظات حول هذا العميل المحتمل..." : "Add notes about this lead..."}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              {language === "ar" ? "إغلاق" : "Close"}
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateLeadMutation.isPending}>
              {language === "ar" ? "حفظ الملاحظات" : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
