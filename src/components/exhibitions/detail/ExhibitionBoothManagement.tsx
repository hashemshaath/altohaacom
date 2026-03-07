import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Hash, Search, CheckCircle2, Clock, XCircle, Edit2, Save } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionBoothManagement({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const { data: booths = [], isLoading } = useQuery({
    queryKey: ["organizer-booths", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_booths")
        .select("id, booth_number, name, name_ar, status, booking_status, category, hall, size, price, currency, contact_name, contact_email, company_id, assigned_to")
        .eq("exhibition_id", exhibitionId)
        .order("booth_number");
      if (error) throw error;
      return data || [];
    },
  });

  const updateBooth = useMutation({
    mutationFn: async ({ boothId, status }: { boothId: string; status: string }) => {
      const { error } = await supabase
        .from("exhibition_booths")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", boothId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-booths", exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ["organizer-booth-stats", exhibitionId] });
      toast({ title: t("Booth updated ✅", "تم تحديث الجناح ✅") });
      setEditingId(null);
    },
    onError: () => {
      toast({ title: t("Update failed", "فشل التحديث"), variant: "destructive" });
    },
  });

  const filtered = booths.filter((b: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.booth_number.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q) ||
      b.contact_name?.toLowerCase().includes(q);
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "available": return <CheckCircle2 className="h-3 w-3 text-chart-3" />;
      case "reserved": return <Clock className="h-3 w-3 text-chart-4" />;
      case "occupied": return <Building className="h-3 w-3 text-primary" />;
      default: return <XCircle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (booths.length === 0 && !isLoading) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-10 text-center">
          <Building className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t("No booths to manage", "لا توجد أجنحة للإدارة")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{t("Booth Management", "إدارة الأجنحة")} ({booths.length})</CardTitle>
          <div className="flex gap-2">
            {["available", "reserved", "occupied"].map(s => {
              const count = booths.filter((b: any) => (b.status || "available") === s).length;
              return (
                <Badge key={s} variant="outline" className="text-[10px] gap-1">
                  {statusIcon(s)}
                  <span className="capitalize">{s}</span>
                  <span className="font-bold">{count}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("Search booths...", "ابحث عن جناح...")}
              className="ps-9 h-9 text-xs"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t("Booth #", "رقم")}</TableHead>
                <TableHead className="text-xs">{t("Name", "الاسم")}</TableHead>
                <TableHead className="text-xs">{t("Category", "الفئة")}</TableHead>
                <TableHead className="text-xs">{t("Hall", "القاعة")}</TableHead>
                <TableHead className="text-xs">{t("Status", "الحالة")}</TableHead>
                <TableHead className="text-xs">{t("Contact", "جهة الاتصال")}</TableHead>
                <TableHead className="text-xs w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booth: any) => (
                <TableRow key={booth.id}>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-muted-foreground/50" />
                      {booth.booth_number}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{isAr && booth.name_ar ? booth.name_ar : booth.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] capitalize">{booth.category || "general"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{booth.hall || "—"}</TableCell>
                  <TableCell>
                    {editingId === booth.id ? (
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-7 text-[10px] w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">{t("Available", "متاح")}</SelectItem>
                          <SelectItem value="reserved">{t("Reserved", "محجوز")}</SelectItem>
                          <SelectItem value="occupied">{t("Occupied", "مشغول")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 capitalize">
                        {statusIcon(booth.status || "available")}
                        {booth.status || "available"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{booth.contact_name || "—"}</TableCell>
                  <TableCell>
                    {editingId === booth.id ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateBooth.mutate({ boothId: booth.id, status: editStatus })}
                        disabled={updateBooth.isPending}
                      >
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => { setEditingId(booth.id); setEditStatus(booth.status || "available"); }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
