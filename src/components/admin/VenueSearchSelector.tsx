import { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  MapPin, Search, Plus, Building2, X, Check, Globe, Users, Loader2,
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
  onVenueSelected?: (venue: VenueValue) => void;
  isAr?: boolean;
  disabled?: boolean;
}

export const VenueSearchSelector = memo(function VenueSearchSelector({
  value, onChange, onVenueSelected, isAr = false, disabled = false,
}: VenueSearchSelectorProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: venues, isLoading } = useQuery({
    queryKey: ["venue-search", search],
    queryFn: async () => {
      let query = (supabase as any)
        .from("exhibition_venues")
        .select("id, name, name_ar, city, city_ar, country, address, address_ar, capacity, logo_url, cover_image_url, map_url, phone, email, website, is_verified")
        .eq("is_active", true).order("name").limit(20);
      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,city.ilike.%${search}%`);
      }
      const { data } = await query;
      return (data || []) as Array<Record<string, string | number | boolean | null>>;
    },
    enabled: showResults,
    staleTime: 30_000,
  });

  const selectVenue = useCallback((v: Record<string, string | number | boolean | null>) => {
    const venue: VenueValue = {
      id: v.id, name: v.name, nameAr: v.name_ar,
      city: v.city, country: v.country, address: v.address,
      capacity: v.capacity, logoUrl: v.logo_url, mapUrl: v.map_url,
    };
    onChange(venue);
    onVenueSelected?.(venue);
    setShowResults(false);
    setSearch("");
  }, [onChange, onVenueSelected]);

  // ── Selected Venue Display ──
  if (value && !showResults) {
    return (
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {t("Exhibition Venue", "مقر المعرض")}
        </Label>
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.03] to-transparent p-3">
          {value.logoUrl ? (
            <img loading="lazy" decoding="async" src={value.logoUrl} alt="" className="h-11 w-11 rounded-xl object-contain bg-background p-1 shrink-0 border" />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{isAr && value.nameAr ? value.nameAr : value.name}</p>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-0.5">
              {value.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{value.city}</span>}
              {value.country && <span className="flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />{value.country}</span>}
              {value.capacity && <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{value.capacity.toLocaleString()}</span>}
            </div>
          </div>
          {!disabled && (
            <div className="flex gap-1 shrink-0">
              <Button variant="outline" size="sm" className="h-7 text-[12px] rounded-lg gap-1" onClick={() => { setShowResults(true); setSearch(""); }}>
                <Search className="h-3 w-3" />{t("Change", "تغيير")}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => onChange(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
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
        <div className="rounded-xl border shadow-sm max-h-60 overflow-y-auto bg-popover">
          <div className="p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("Searching...", "جارِ البحث...")}
              </div>
            ) : venues && venues.length > 0 ? (
              venues.map((v: any) => (
                <button key={v.id} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-start hover:bg-muted/50 transition-colors" onClick={() => selectVenue(v)}>
                  {v.logo_url ? (
                    <img loading="lazy" decoding="async" src={v.logo_url} alt="" className="h-8 w-8 rounded object-contain bg-muted p-0.5 shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {isAr && v.name_ar ? v.name_ar : v.name}
                      {v.is_verified && <Badge variant="secondary" className="ms-1.5 text-[12px] h-3.5 px-1">✓</Badge>}
                    </p>
                    <p className="text-[12px] text-muted-foreground truncate">
                      {[v.city, v.country].filter(Boolean).join(", ")}
                      {v.capacity ? ` · ${v.capacity.toLocaleString()} ${t("capacity", "سعة")}` : ""}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-xs text-muted-foreground py-4">{t("No venues found", "لم يتم العثور على مقرات")}</p>
            )}

            <button
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 mt-0.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors border-t border-border/40"
              onClick={() => { setShowCreateForm(true); setShowResults(false); }}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("Add New Venue", "إضافة مقر جديد")}
            </button>
          </div>
        </div>
      )}

      {showResults && <div className="fixed inset-0 z-[-1]" onClick={() => setShowResults(false)} />}

      {/* ── Inline Create Venue Form (no popup) ── */}
      {showCreateForm && (
        <InlineCreateVenueForm
          isAr={isAr}
          initialSearch={search}
          onCreated={(v) => {
            queryClient.invalidateQueries({ queryKey: ["venue-search"] });
            selectVenue(v);
            setShowCreateForm(false);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
});

/* ─── Inline Create Venue Form ─── */

function InlineCreateVenueForm({ isAr, initialSearch, onCreated, onCancel }: {
  isAr: boolean;
  initialSearch: string;
  onCreated: (venue: any) => void;
  onCancel: () => void;
}) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [form, setForm] = useState({
    name: initialSearch, name_ar: "", city: "", city_ar: "", country: "",
    address: "", address_ar: "", capacity: "", logo_url: "",
    map_url: "", phone: "", email: "", website: "", description: "",
  });
  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any)
        .from("exhibition_venues")
        .insert({ ...form, capacity: form.capacity ? parseInt(form.capacity) : null })
        .select("*").single();
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
    <div className="rounded-xl border border-chart-2/20 bg-chart-2/5 p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-chart-2" />
          {t("Add New Venue", "إضافة مقر جديد")}
        </p>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label className="text-[12px]">{t("Name (EN)", "الاسم (EN)")} *</Label><Input className="h-8 text-xs" value={form.name} onChange={e => update("name", e.target.value)} /></div>
        <div><Label className="text-[12px]">{t("Name (AR)", "الاسم (AR)")}</Label><Input className="h-8 text-xs" value={form.name_ar} onChange={e => update("name_ar", e.target.value)} dir="rtl" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label className="text-[12px]">{t("City", "المدينة")}</Label><Input className="h-8 text-xs" value={form.city} onChange={e => update("city", e.target.value)} /></div>
        <div><Label className="text-[12px]">{t("Country", "الدولة")}</Label><Input className="h-8 text-xs" value={form.country} onChange={e => update("country", e.target.value)} /></div>
        <div><Label className="text-[12px]">{t("Capacity", "السعة")}</Label><Input className="h-8 text-xs" type="number" value={form.capacity} onChange={e => update("capacity", e.target.value)} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label className="text-[12px]">{t("Address", "العنوان")}</Label><Input className="h-8 text-xs" value={form.address} onChange={e => update("address", e.target.value)} /></div>
        <div><Label className="text-[12px]">{t("Map URL", "رابط الخريطة")}</Label><Input className="h-8 text-xs" value={form.map_url} onChange={e => update("map_url", e.target.value)} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label className="text-[12px]">{t("Phone", "الهاتف")}</Label><Input className="h-8 text-xs" value={form.phone} onChange={e => update("phone", e.target.value)} /></div>
        <div><Label className="text-[12px]">{t("Email", "البريد")}</Label><Input className="h-8 text-xs" value={form.email} onChange={e => update("email", e.target.value)} /></div>
        <div><Label className="text-[12px]">{t("Website", "الموقع")}</Label><Input className="h-8 text-xs" value={form.website} onChange={e => update("website", e.target.value)} /></div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          {t("Create Venue", "إنشاء المقر")}
        </Button>
        <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={onCancel}>{t("Cancel", "إلغاء")}</Button>
      </div>
    </div>
  );
}
