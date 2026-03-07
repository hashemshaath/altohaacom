import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { LayoutGrid, Search, DollarSign, MapPin, Building, Users, CheckCircle2, Clock, XCircle, Eye, Bookmark } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props { exhibitionId: string; isAr: boolean; isOwner?: boolean; }

const STATUS_COLORS: Record<string, string> = {
  available: "bg-chart-3/20 border-chart-3/40 text-chart-3",
  reserved: "bg-chart-4/20 border-chart-4/40 text-chart-4",
  occupied: "bg-primary/20 border-primary/40 text-primary",
};

const STATUS_FILL: Record<string, string> = {
  available: "fill-chart-3/30 stroke-chart-3",
  reserved: "fill-chart-4/30 stroke-chart-4",
  occupied: "fill-primary/30 stroke-primary",
};

export default memo(function ExhibitionInteractiveBoothManager({ exhibitionId, isAr, isOwner }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBooth, setSelectedBooth] = useState<any>(null);

  const { data: booths = [], isLoading } = useQuery({
    queryKey: ["interactive-booths", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_booths")
        .select("id, booth_number, name, name_ar, description, description_ar, category, hall, hall_ar, floor_level, size, size_sqm, location_x, location_y, is_featured, logo_url, website_url, contact_name, contact_email, contact_phone, status, color_hex, price, currency, assigned_to, booking_status, notes")
        .eq("exhibition_id", exhibitionId)
        .order("booth_number");
      if (error) throw error;
      return data || [];
    },
  });

  const bookBooth = useMutation({
    mutationFn: async (boothId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("exhibition_booths")
        .update({ booking_status: "pending", booked_by: user.id, booked_at: new Date().toISOString(), status: "reserved" })
        .eq("id", boothId)
        .eq("status", "available");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactive-booths", exhibitionId] });
      toast({ title: t("Booth booking request sent! ✅", "تم إرسال طلب حجز الجناح! ✅") });
      setSelectedBooth(null);
    },
    onError: () => toast({ title: t("Booking failed", "فشل الحجز"), variant: "destructive" }),
  });

  const filtered = useMemo(() => booths.filter((b: any) => {
    if (filterStatus !== "all" && (b.status || "available") !== filterStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return b.booth_number.toLowerCase().includes(q) || b.name?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q);
  }), [booths, search, filterStatus]);

  const stats = useMemo(() => ({
    total: booths.length,
    available: booths.filter((b: any) => b.status === "available").length,
    reserved: booths.filter((b: any) => b.status === "reserved").length,
    occupied: booths.filter((b: any) => b.status === "occupied").length,
  }), [booths]);

  // Group by hall for the visual floor map
  const halls = useMemo(() => {
    const map: Record<string, any[]> = {};
    filtered.forEach(b => {
      const h = (isAr && b.hall_ar ? b.hall_ar : b.hall) || t("Main Hall", "القاعة الرئيسية");
      if (!map[h]) map[h] = [];
      map[h].push(b);
    });
    return map;
  }, [filtered, isAr]);

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  if (booths.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* KPI Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: t("Total", "إجمالي"), value: stats.total, icon: LayoutGrid, color: "text-primary" },
          { label: t("Available", "متاح"), value: stats.available, icon: CheckCircle2, color: "text-chart-3" },
          { label: t("Reserved", "محجوز"), value: stats.reserved, icon: Clock, color: "text-chart-4" },
          { label: t("Occupied", "مشغول"), value: stats.occupied, icon: Building, color: "text-primary" },
        ].map(kpi => (
          <Card key={kpi.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(kpi.label === t("Total", "إجمالي") ? "all" : kpi.label.toLowerCase() === t("Available", "متاح").toLowerCase() ? "available" : kpi.label.toLowerCase() === t("Reserved", "محجوز").toLowerCase() ? "reserved" : "occupied")}>
            <CardContent className="p-3 flex items-center gap-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <div>
                <p className="text-lg font-bold">{kpi.value}</p>
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Search booths...", "ابحث عن جناح...")} className="ps-9 h-9 text-xs" />
        </div>
        <div className="flex gap-1">
          {["all", "available", "reserved", "occupied"].map(s => (
            <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} className="text-[10px] h-9 px-2" onClick={() => setFilterStatus(s)}>
              {s === "all" ? t("All", "الكل") : s === "available" ? t("Available", "متاح") : s === "reserved" ? t("Reserved", "محجوز") : t("Occupied", "مشغول")}
            </Button>
          ))}
        </div>
      </div>

      {/* Interactive Visual Floor Map */}
      {Object.entries(halls).map(([hallName, hallBooths]) => (
        <Card key={hallName}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {hallName}
              <Badge variant="outline" className="text-[9px]">{hallBooths.length} {t("booths", "أجنحة")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              <TooltipProvider>
                {hallBooths.map((booth: any) => {
                  const st = booth.status || "available";
                  return (
                    <Tooltip key={booth.id}>
                      <TooltipTrigger asChild>
                        <button
                          className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all hover:scale-105 hover:shadow-lg active:scale-95 ${STATUS_COLORS[st] || "bg-muted border-border"} ${booth.is_featured ? "ring-2 ring-primary/40" : ""}`}
                          onClick={() => setSelectedBooth(booth)}
                        >
                          {booth.logo_url ? (
                            <img src={booth.logo_url} alt={booth.name} className="h-8 w-8 rounded object-contain mb-1" loading="lazy" />
                          ) : (
                            <LayoutGrid className="h-5 w-5 mb-1 opacity-60" />
                          )}
                          <span className="text-[10px] font-bold">{booth.booth_number}</span>
                          <span className="text-[8px] truncate max-w-full">{isAr && booth.name_ar ? booth.name_ar : booth.name}</span>
                          {booth.price > 0 && (
                            <span className="text-[8px] font-semibold mt-0.5">{booth.price} {booth.currency}</span>
                          )}
                          {booth.is_featured && <Badge className="absolute -top-1 -end-1 text-[7px] h-3.5 px-1">⭐</Badge>}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold">{booth.booth_number} — {isAr && booth.name_ar ? booth.name_ar : booth.name}</p>
                        <p className="text-muted-foreground capitalize">{st} • {booth.category || "general"}</p>
                        {booth.size_sqm > 0 && <p>{booth.size_sqm} m²</p>}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Booth Detail Dialog */}
      <Dialog open={!!selectedBooth} onOpenChange={() => setSelectedBooth(null)}>
        <DialogContent className="max-w-md">
          {selectedBooth && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedBooth.logo_url && <img src={selectedBooth.logo_url} className="h-8 w-8 rounded object-contain" />}
                  {selectedBooth.booth_number} — {isAr && selectedBooth.name_ar ? selectedBooth.name_ar : selectedBooth.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-muted p-2">
                    <p className="text-muted-foreground">{t("Category", "الفئة")}</p>
                    <p className="font-medium capitalize">{selectedBooth.category || "general"}</p>
                  </div>
                  <div className="rounded-xl bg-muted p-2">
                    <p className="text-muted-foreground">{t("Size", "المساحة")}</p>
                    <p className="font-medium">{selectedBooth.size_sqm > 0 ? `${selectedBooth.size_sqm} m²` : selectedBooth.size || "—"}</p>
                  </div>
                  <div className="rounded-xl bg-muted p-2">
                    <p className="text-muted-foreground">{t("Hall", "القاعة")}</p>
                    <p className="font-medium">{(isAr && selectedBooth.hall_ar ? selectedBooth.hall_ar : selectedBooth.hall) || "—"}</p>
                  </div>
                  <div className="rounded-xl bg-muted p-2">
                    <p className="text-muted-foreground">{t("Price", "السعر")}</p>
                    <p className="font-bold text-primary">{selectedBooth.price > 0 ? `${selectedBooth.price} ${selectedBooth.currency}` : t("Free", "مجاني")}</p>
                  </div>
                </div>

                {(selectedBooth.description || selectedBooth.description_ar) && (
                  <p className="text-xs text-muted-foreground">{isAr && selectedBooth.description_ar ? selectedBooth.description_ar : selectedBooth.description}</p>
                )}

                {selectedBooth.contact_name && (
                  <div className="rounded-xl border p-2 text-xs">
                    <p className="font-medium">{selectedBooth.contact_name}</p>
                    {selectedBooth.contact_email && <p className="text-muted-foreground">{selectedBooth.contact_email}</p>}
                    {selectedBooth.contact_phone && <p className="text-muted-foreground">{selectedBooth.contact_phone}</p>}
                  </div>
                )}

                <Badge className={`${STATUS_COLORS[selectedBooth.status || "available"]} border`}>
                  {(selectedBooth.status || "available").toUpperCase()}
                </Badge>

                {user && selectedBooth.status === "available" && !isOwner && (
                  <Button className="w-full" onClick={() => bookBooth.mutate(selectedBooth.id)} disabled={bookBooth.isPending}>
                    <Bookmark className="me-2 h-4 w-4" />
                    {t("Request Booth Booking", "طلب حجز الجناح")}
                  </Button>
                )}

                {selectedBooth.website_url && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={selectedBooth.website_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="me-2 h-3.5 w-3.5" /> {t("Visit Website", "زيارة الموقع")}
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});
