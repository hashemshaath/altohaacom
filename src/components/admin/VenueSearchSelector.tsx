import { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  MapPin, Search, Plus, Building2, X, Check, Globe, Phone, Mail,
  Users, ExternalLink, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface VenueValue {
  id: string;
  name: string;
  nameAr: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  capacity: number | null;
  logoUrl: string | null;
  mapUrl: string | null;
}

interface VenueSearchSelectorProps {
  value: VenueValue | null;
  onChange: (venue: VenueValue | null) => void;
  /** Also update venue/city text fields */
  onVenueSelected?: (venue: VenueValue) => void;
  isAr?: boolean;
  disabled?: boolean;
}

export const VenueSearchSelector = memo(function VenueSearchSelector({
  value,
  onChange,
  onVenueSelected,
  isAr = false,
  disabled = false,
}: VenueSearchSelectorProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Search venues
  const { data: venues, isLoading } = useQuery({
    queryKey: ["venue-search", search],
    queryFn: async () => {
      let query = (supabase as any)
        .from("exhibition_venues")
        .select("id, name, name_ar, city, city_ar, country, address, address_ar, capacity, logo_url, cover_image_url, map_url, phone, email, website, is_verified")
        .eq("is_active", true)
        .order("name")
        .limit(20);

      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,city.ilike.%${search}%`);
      }

      const { data } = await query;
      return (data || []) as any[];
    },
    enabled: showResults,
    staleTime: 30_000,
  });

  const selectVenue = useCallback((v: any) => {
    const venue: VenueValue = {
      id: v.id,
      name: v.name,
      nameAr: v.name_ar,
      city: v.city,
      country: v.country,
      address: v.address,
      capacity: v.capacity,
      logoUrl: v.logo_url,
      mapUrl: v.map_url,
    };
    onChange(venue);
    onVenueSelected?.(venue);
    setShowResults(false);
    setSearch("");
  }, [onChange, onVenueSelected]);

  const clearVenue = () => {
    onChange(null);
  };

  // Selected venue display
  if (value && !showResults) {
    return (
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {t("Exhibition Venue", "مقر المعرض")}
        </Label>
        <Card className="rounded-xl border-primary/20 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-3">
            {value.logoUrl ? (
              <img src={value.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-background p-1 shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {isAr && value.nameAr ? value.nameAr : value.name}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {value.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{value.city}</span>}
                {value.capacity && <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{value.capacity.toLocaleString()}</span>}
              </div>
            </div>
            {!disabled && (
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowResults(true); setSearch(""); }}>
                  <Search className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={clearVenue}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs flex items-center gap-1.5">
        <MapPin className="h-3 w-3" />
        {t("Exhibition Venue", "مقر المعرض")}
      </Label>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="h-9 ps-9 rounded-xl"
          placeholder={t("Search venues by name or city...", "ابحث عن المقرات بالاسم أو المدينة...")}
          value={search}
          onChange={e => { setSearch(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          disabled={disabled}
        />
      </div>

      {showResults && (
        <Card className="rounded-xl border shadow-lg max-h-64 overflow-y-auto">
          <CardContent className="p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("Searching...", "جارِ البحث...")}
              </div>
            ) : venues && venues.length > 0 ? (
              <div className="space-y-0.5">
                {venues.map((v: any) => (
                  <button
                    key={v.id}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-start hover:bg-muted/50 transition-colors"
                    onClick={() => selectVenue(v)}
                  >
                    {v.logo_url ? (
                      <img src={v.logo_url} alt="" className="h-8 w-8 rounded object-contain bg-muted p-0.5 shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {isAr && v.name_ar ? v.name_ar : v.name}
                        {v.is_verified && <Badge variant="secondary" className="ms-1.5 text-[8px] h-3.5 px-1">✓</Badge>}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {[v.city, v.country].filter(Boolean).join(", ")}
                        {v.capacity ? ` · ${v.capacity.toLocaleString()} ${t("capacity", "سعة")}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  {t("No venues found", "لم يتم العثور على مقرات")}
                </p>
              </div>
            )}

            {/* Add new venue button */}
            <button
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 mt-0.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors border-t border-border/40"
              onClick={() => { setShowCreateDialog(true); setShowResults(false); }}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("Add New Venue", "إضافة مقر جديد")}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Click-away handler */}
      {showResults && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setShowResults(false)} />
      )}

      {/* Create Venue Dialog */}
      <CreateVenueDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        isAr={isAr}
        onCreated={(v) => {
          queryClient.invalidateQueries({ queryKey: ["venue-search"] });
          selectVenue(v);
          setShowCreateDialog(false);
        }}
        initialSearch={search}
      />
    </div>
  );
});

/* ─── Create Venue Dialog ─── */

function CreateVenueDialog({ open, onClose, isAr, onCreated, initialSearch }: {
  open: boolean;
  onClose: () => void;
  isAr: boolean;
  onCreated: (venue: any) => void;
  initialSearch: string;
}) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [form, setForm] = useState({
    name: initialSearch, name_ar: "", city: "", city_ar: "", country: "",
    address: "", address_ar: "", capacity: "", logo_url: "", cover_image_url: "",
    map_url: "", phone: "", email: "", website: "", description: "", description_ar: "",
  });

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any)
        .from("exhibition_venues")
        .insert({
          ...form,
          capacity: form.capacity ? parseInt(form.capacity) : null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: t("Venue created", "تم إنشاء المقر") });
      onCreated(data);
    },
    onError: (err: Error) => toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t("Add New Venue", "إضافة مقر جديد")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">{t("Name (EN)", "الاسم (إنجليزي)")} *</Label>
              <Input className="h-9" value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("Name (AR)", "الاسم (عربي)")}</Label>
              <Input className="h-9" value={form.name_ar} onChange={e => update("name_ar", e.target.value)} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">{t("City", "المدينة")}</Label>
              <Input className="h-9" value={form.city} onChange={e => update("city", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("City (AR)", "المدينة (عربي)")}</Label>
              <Input className="h-9" value={form.city_ar} onChange={e => update("city_ar", e.target.value)} dir="rtl" />
            </div>
            <div>
              <Label className="text-xs">{t("Country", "الدولة")}</Label>
              <Input className="h-9" value={form.country} onChange={e => update("country", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">{t("Address (EN)", "العنوان")}</Label>
              <Input className="h-9" value={form.address} onChange={e => update("address", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("Address (AR)", "العنوان (عربي)")}</Label>
              <Input className="h-9" value={form.address_ar} onChange={e => update("address_ar", e.target.value)} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">{t("Capacity", "السعة")}</Label>
              <Input className="h-9" type="number" value={form.capacity} onChange={e => update("capacity", e.target.value)} placeholder="10000" />
            </div>
            <div>
              <Label className="text-xs">{t("Phone", "الهاتف")}</Label>
              <Input className="h-9" value={form.phone} onChange={e => update("phone", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("Email", "البريد")}</Label>
              <Input className="h-9" type="email" value={form.email} onChange={e => update("email", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">{t("Website", "الموقع")}</Label>
              <Input className="h-9" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">{t("Map URL", "رابط الخريطة")}</Label>
              <Input className="h-9" value={form.map_url} onChange={e => update("map_url", e.target.value)} placeholder="https://maps..." />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("Logo URL", "رابط الشعار")}</Label>
            <Input className="h-9" value={form.logo_url} onChange={e => update("logo_url", e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>{t("Cancel", "إلغاء")}</Button>
          <Button size="sm" onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="me-1.5 h-3.5 w-3.5" />}
            {t("Create Venue", "إنشاء المقر")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
