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
  Truck,
  Plus,
  Search,
  User,
  Phone,
  Car,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function CompanyDrivers() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
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

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase.from("company_drivers").insert({
        company_id: companyId,
        name: form.name,
        name_ar: form.name_ar || null,
        phone: form.phone,
        vehicle_type: form.vehicle_type || null,
        vehicle_plate: form.vehicle_plate || null,
        license_number: form.license_number || null,
        is_active: true,
        is_available: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyDrivers"] });
      setAddOpen(false);
      setForm({ name: "", name_ar: "", phone: "", vehicle_type: "", vehicle_plate: "", license_number: "" });
      toast({ title: language === "ar" ? "تمت الإضافة" : "Driver added" });
    },
    onError: () => toast({ variant: "destructive", title: language === "ar" ? "فشلت الإضافة" : "Failed to add" }),
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase.from("company_drivers").update({ is_available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companyDrivers"] }),
  });

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    return !search || d.name.toLowerCase().includes(q) || d.phone.includes(q) || (d.vehicle_plate || "").toLowerCase().includes(q);
  });

  const availableCount = drivers.filter((d) => d.is_available).length;
  const activeCount = drivers.filter((d) => d.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            {language === "ar" ? "السائقون" : "Drivers"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === "ar" ? "إدارة سائقي التوصيل" : "Manage delivery drivers"}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "ar" ? "إضافة سائق" : "Add Driver"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5"><User className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي السائقين" : "Total Drivers"}</p>
              <p className="text-2xl font-bold">{drivers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-5/10 p-2.5"><CheckCircle className="h-5 w-5 text-chart-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "متاحون" : "Available"}</p>
              <p className="text-2xl font-bold">{availableCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-4/10 p-2.5"><Car className="h-5 w-5 text-chart-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "نشطون" : "Active"}</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={language === "ar" ? "بحث..." : "Search..."} className="pl-10" />
      </div>

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
                    <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{language === "ar" ? "الهاتف" : "Phone"}</TableHead>
                    <TableHead>{language === "ar" ? "المركبة" : "Vehicle"}</TableHead>
                    <TableHead>{language === "ar" ? "اللوحة" : "Plate"}</TableHead>
                    <TableHead>{language === "ar" ? "الرخصة" : "License"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "متاح" : "Available"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {language === "ar" && d.name_ar ? d.name_ar : d.name}
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
                        <Badge variant={d.is_active ? "default" : "secondary"}>
                          {d.is_active ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "غير نشط" : "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!d.is_available}
                          onCheckedChange={(val) => toggleAvailability.mutate({ id: d.id, is_available: val })}
                        />
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
              <p className="text-muted-foreground">{language === "ar" ? "لا يوجد سائقون" : "No drivers found"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إضافة سائق جديد" : "Add New Driver"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder={language === "ar" ? "الاسم (إنجليزي)" : "Name"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder={language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
            <Input placeholder={language === "ar" ? "رقم الهاتف" : "Phone number"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder={language === "ar" ? "نوع المركبة" : "Vehicle type"} value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} />
            <Input placeholder={language === "ar" ? "لوحة المركبة" : "Vehicle plate"} value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} />
            <Input placeholder={language === "ar" ? "رقم الرخصة" : "License number"} value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{language === "ar" ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!form.name || !form.phone || addMutation.isPending}>
              {addMutation.isPending ? (language === "ar" ? "جارٍ الإضافة..." : "Adding...") : (language === "ar" ? "إضافة" : "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
