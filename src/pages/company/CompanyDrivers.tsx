import { useState } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Truck, Plus, Search, User, Phone, Car, CheckCircle, XCircle, Trash2, Pencil, Filter, Download,
} from "lucide-react";
import { format } from "date-fns";

export default function CompanyDrivers() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [form, setForm] = useState({ name: "", name_ar: "", phone: "", vehicle_type: "", vehicle_plate: "", license_number: "" });

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["companyDrivers", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_drivers")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const payload = {
        company_id: companyId,
        name: form.name,
        name_ar: form.name_ar || null,
        phone: form.phone,
        vehicle_type: form.vehicle_type || null,
        vehicle_plate: form.vehicle_plate || null,
        license_number: form.license_number || null,
        is_active: true,
        is_available: true,
      };
      if (editingDriver) {
        const { error } = await supabase.from("company_drivers").update(payload).eq("id", editingDriver.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_drivers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyDrivers"] });
      closeDialog();
      toast({ title: editingDriver ? (isAr ? "تم التحديث" : "Driver updated") : (isAr ? "تمت الإضافة" : "Driver added") });
    },
    onError: () => toast({ variant: "destructive", title: isAr ? "فشلت العملية" : "Operation failed" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_drivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyDrivers"] });
      toast({ title: isAr ? "تم الحذف" : "Driver deleted" });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase.from("company_drivers").update({ is_available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companyDrivers"] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("company_drivers").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companyDrivers"] }),
  });

  const closeDialog = () => {
    setAddOpen(false);
    setEditingDriver(null);
    setForm({ name: "", name_ar: "", phone: "", vehicle_type: "", vehicle_plate: "", license_number: "" });
  };

  const openEdit = (d: any) => {
    setEditingDriver(d);
    setForm({
      name: d.name || "", name_ar: d.name_ar || "", phone: d.phone || "",
      vehicle_type: d.vehicle_type || "", vehicle_plate: d.vehicle_plate || "", license_number: d.license_number || "",
    });
    setAddOpen(true);
  };

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch = !search || d.name.toLowerCase().includes(q) || d.phone.includes(q) || (d.vehicle_plate || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "available" && d.is_available) ||
      (statusFilter === "unavailable" && !d.is_available) ||
      (statusFilter === "active" && d.is_active) ||
      (statusFilter === "inactive" && !d.is_active);
    return matchesSearch && matchesStatus;
  });

  const availableCount = drivers.filter((d) => d.is_available).length;
  const activeCount = drivers.filter((d) => d.is_active).length;

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const BOM = "\uFEFF";
    const headers = ["Name", "Name (AR)", "Phone", "Vehicle Type", "Plate", "License", "Active", "Available"];
    const rows = filtered.map((d) => [
      d.name, d.name_ar || "", d.phone, d.vehicle_type || "", d.vehicle_plate || "",
      d.license_number || "", d.is_active ? "Yes" : "No", d.is_available ? "Yes" : "No",
    ].join(","));
    const csv = BOM + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drivers_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isAr ? "تم التصدير" : "Exported" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            {isAr ? "السائقون" : "Drivers"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? "إدارة سائقي التوصيل" : "Manage delivery drivers"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="me-2 h-4 w-4" />
            {isAr ? "تصدير" : "Export"}
          </Button>
          <Button onClick={() => { setEditingDriver(null); setForm({ name: "", name_ar: "", phone: "", vehicle_type: "", vehicle_plate: "", license_number: "" }); setAddOpen(true); }}>
            <Plus className="me-2 h-4 w-4" />
            {isAr ? "إضافة سائق" : "Add Driver"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5"><User className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي السائقين" : "Total Drivers"}</p>
              <p className="text-2xl font-bold">{drivers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-5/10 p-2.5"><CheckCircle className="h-5 w-5 text-chart-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "متاحون" : "Available"}</p>
              <p className="text-2xl font-bold">{availableCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-4/10 p-2.5"><Car className="h-5 w-5 text-chart-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "نشطون" : "Active"}</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isAr ? "بحث بالاسم أو الهاتف أو اللوحة..." : "Search by name, phone, or plate..."} className="ps-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="me-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="available">{isAr ? "متاح" : "Available"}</SelectItem>
                <SelectItem value="unavailable">{isAr ? "غير متاح" : "Unavailable"}</SelectItem>
                <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-64" /></div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isAr ? "الهاتف" : "Phone"}</TableHead>
                    <TableHead>{isAr ? "المركبة" : "Vehicle"}</TableHead>
                    <TableHead>{isAr ? "اللوحة" : "Plate"}</TableHead>
                    <TableHead>{isAr ? "الرخصة" : "License"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "متاح" : "Available"}</TableHead>
                    <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {isAr && d.name_ar ? d.name_ar : d.name}
                      </TableCell>
                      <TableCell>
                        <a href={`tel:${d.phone}`} className="text-primary hover:underline flex items-center gap-1">
                          <Phone className="h-3 w-3" />{d.phone}
                        </a>
                      </TableCell>
                      <TableCell>{d.vehicle_type || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{d.vehicle_plate || "—"}</TableCell>
                      <TableCell className="text-sm">{d.license_number || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={d.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleActive.mutate({ id: d.id, is_active: !d.is_active })}
                        >
                          {d.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!d.is_available}
                          onCheckedChange={(val) => toggleAvailability.mutate({ id: d.id, is_available: val })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{isAr ? "حذف السائق؟" : "Delete driver?"}</AlertDialogTitle>
                                <AlertDialogDescription>{isAr ? "لا يمكن التراجع." : "This cannot be undone."}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(d.id)}>{isAr ? "حذف" : "Delete"}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                <Truck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{isAr ? "لا يوجد سائقون" : "No drivers found"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Driver Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) closeDialog(); else setAddOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDriver ? (isAr ? "تعديل السائق" : "Edit Driver") : (isAr ? "إضافة سائق جديد" : "Add New Driver")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder={isAr ? "الاسم (إنجليزي)" : "Name"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder={isAr ? "الاسم (عربي)" : "Name (Arabic)"} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
            <Input placeholder={isAr ? "رقم الهاتف" : "Phone number"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
            <Input placeholder={isAr ? "نوع المركبة" : "Vehicle type"} value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} />
            <Input placeholder={isAr ? "لوحة المركبة" : "Vehicle plate"} value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} dir="ltr" />
            <Input placeholder={isAr ? "رقم الرخصة" : "License number"} value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} dir="ltr" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.phone || saveMutation.isPending}>
              {saveMutation.isPending ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
