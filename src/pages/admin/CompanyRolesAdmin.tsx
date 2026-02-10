import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Search,
  Plus,
  Building2,
  Trash2,
  CheckCircle,
  XCircle,
  Tags,
} from "lucide-react";
import { format } from "date-fns";

const AVAILABLE_ROLES = [
  { value: "sponsor", label: "Sponsor", labelAr: "راعي", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  { value: "supplier", label: "Supplier", labelAr: "مورد", color: "bg-primary/10 text-primary border-primary/20" },
  { value: "partner", label: "Partner", labelAr: "شريك", color: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  { value: "vendor", label: "Vendor", labelAr: "بائع", color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
  { value: "media", label: "Media", labelAr: "إعلام", color: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
  { value: "logistics", label: "Logistics", labelAr: "لوجستيات", color: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
];

interface RoleAssignment {
  id: string;
  company_id: string;
  role: string;
  is_active: boolean | null;
  assigned_at: string | null;
}

interface CompanyInfo {
  id: string;
  name: string;
  name_ar: string | null;
  type: string;
  status: string | null;
  company_number: string | null;
}

export default function CompanyRolesAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // Fetch all role assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["companyRoleAssignments", roleFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("company_role_assignments")
        .select("*")
        .order("assigned_at", { ascending: false });

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }
      if (statusFilter === "active") {
        query = query.eq("is_active", true);
      } else if (statusFilter === "inactive") {
        query = query.eq("is_active", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RoleAssignment[];
    },
  });

  // Fetch companies for display and assignment
  const companyIds = [...new Set(assignments.map((a) => a.company_id))];
  const { data: companies = [] } = useQuery({
    queryKey: ["companyRolesCompanies", companyIds.join(",")],
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, type, status, company_number")
        .in("id", companyIds);
      if (error) throw error;
      return (data || []) as CompanyInfo[];
    },
    enabled: companyIds.length > 0,
  });

  // All companies for the assign dialog
  const { data: allCompanies = [] } = useQuery({
    queryKey: ["allCompaniesForRoles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, type, status, company_number")
        .order("name");
      if (error) throw error;
      return (data || []) as CompanyInfo[];
    },
  });

  const companyMap = new Map(companies.map((c) => [c.id, c]));

  // Assign role
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompanyId || !selectedRole) throw new Error("Missing data");
      const { error } = await supabase.from("company_role_assignments").insert({
        company_id: selectedCompanyId,
        role: selectedRole,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyRoleAssignments"] });
      setAssignDialogOpen(false);
      setSelectedCompanyId("");
      setSelectedRole("");
      toast({ title: language === "ar" ? "تم تعيين الدور" : "Role assigned" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل التعيين" : "Assignment failed",
        description: err.message?.includes("duplicate") ? (language === "ar" ? "هذا الدور معيّن مسبقاً" : "This role is already assigned") : err.message,
      });
    },
  });

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("company_role_assignments")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyRoleAssignments"] });
      toast({ title: language === "ar" ? "تم التحديث" : "Updated" });
    },
  });

  // Delete assignment
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_role_assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyRoleAssignments"] });
      toast({ title: language === "ar" ? "تم الحذف" : "Role removed" });
    },
  });

  const getRoleBadge = (role: string) => {
    const r = AVAILABLE_ROLES.find((ar) => ar.value === role);
    return (
      <Badge className={r?.color || "bg-muted text-muted-foreground"}>
        {r ? (language === "ar" ? r.labelAr : r.label) : role}
      </Badge>
    );
  };

  // Search filter
  const filtered = searchQuery
    ? assignments.filter((a) => {
        const c = companyMap.get(a.company_id);
        const q = searchQuery.toLowerCase();
        return (
          a.role.toLowerCase().includes(q) ||
          (c?.name || "").toLowerCase().includes(q) ||
          (c?.company_number || "").toLowerCase().includes(q)
        );
      })
    : assignments;

  // Stats
  const activeCount = assignments.filter((a) => a.is_active).length;
  const roleDistribution = AVAILABLE_ROLES.map((r) => ({
    ...r,
    count: assignments.filter((a) => a.role === r.value).length,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {language === "ar" ? "أدوار الشركات" : "Company Roles"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === "ar" ? "تعيين وإدارة أدوار الشركات على المنصة" : "Assign and manage company roles on the platform"}
          </p>
        </div>
        <Button onClick={() => setAssignDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "ar" ? "تعيين دور" : "Assign Role"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Tags className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي التعيينات" : "Total Assignments"}</p>
              <p className="text-2xl font-bold">{assignments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-5/10 p-2.5">
              <CheckCircle className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "نشطة" : "Active"}</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-4/10 p-2.5">
              <Building2 className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "شركات فريدة" : "Unique Companies"}</p>
              <p className="text-2xl font-bold">{new Set(assignments.map((a) => a.company_id)).size}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-3">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-3/10 p-2.5">
              <Shield className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "أنواع الأدوار" : "Role Types"}</p>
              <p className="text-2xl font-bold">{new Set(assignments.map((a) => a.role)).size}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <div className="flex flex-wrap gap-2">
        {roleDistribution.filter((r) => r.count > 0).map((r) => (
          <Badge key={r.value} variant="outline" className="text-sm py-1 px-3">
            {language === "ar" ? r.labelAr : r.label}: {r.count}
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "ar" ? "بحث بالشركة أو الدور..." : "Search by company or role..."}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "كل الأدوار" : "All Roles"}</SelectItem>
            {AVAILABLE_ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {language === "ar" ? r.labelAr : r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
            <SelectItem value="active">{language === "ar" ? "نشط" : "Active"}</SelectItem>
            <SelectItem value="inactive">{language === "ar" ? "غير نشط" : "Inactive"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "الشركة" : "Company"}</TableHead>
                    <TableHead>{language === "ar" ? "رقم الشركة" : "Company #"}</TableHead>
                    <TableHead>{language === "ar" ? "الدور" : "Role"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "تاريخ التعيين" : "Assigned"}</TableHead>
                    <TableHead className="w-[120px]">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((assignment) => {
                    const company = companyMap.get(assignment.company_id);
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {company ? (language === "ar" && company.name_ar ? company.name_ar : company.name) : "Unknown"}
                              </p>
                              {company?.type && (
                                <p className="text-xs text-muted-foreground capitalize">{company.type}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {company?.company_number || "—"}
                        </TableCell>
                        <TableCell>{getRoleBadge(assignment.role)}</TableCell>
                        <TableCell>
                          {assignment.is_active ? (
                            <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">
                              {language === "ar" ? "نشط" : "Active"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {language === "ar" ? "غير نشط" : "Inactive"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {assignment.assigned_at
                            ? format(new Date(assignment.assigned_at), "MMM dd, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                toggleMutation.mutate({
                                  id: assignment.id,
                                  is_active: !assignment.is_active,
                                })
                              }
                              title={assignment.is_active ? "Deactivate" : "Activate"}
                            >
                              {assignment.is_active ? (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-chart-5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                <Shield className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {language === "ar" ? "لا توجد تعيينات أدوار" : "No role assignments found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "تعيين دور جديد" : "Assign New Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "ar" ? "الشركة" : "Company"}
              </label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "ar" ? "اختر شركة" : "Select company"} />
                </SelectTrigger>
                <SelectContent>
                  {allCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {language === "ar" && c.name_ar ? c.name_ar : c.name}
                      {c.company_number && ` (${c.company_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "ar" ? "الدور" : "Role"}
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "ar" ? "اختر دور" : "Select role"} />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {language === "ar" ? r.labelAr : r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedCompanyId || !selectedRole || assignMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {assignMutation.isPending
                ? (language === "ar" ? "جارٍ التعيين..." : "Assigning...")
                : (language === "ar" ? "تعيين" : "Assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
