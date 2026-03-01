import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAllCountries } from "@/hooks/useCountries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { countryFlag } from "@/lib/countryFlag";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Building2, X, Globe, Check, User, Briefcase } from "lucide-react";

type OrganizerType = "entity" | "company" | "chef" | "custom";

interface OrganizerValue {
  type: OrganizerType;
  entityId?: string | null;
  companyId?: string | null;
  userId?: string | null;
  name: string;
  nameAr: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
}

interface OrganizerSearchSelectorProps {
  value: OrganizerValue | null;
  onChange: (value: OrganizerValue | null) => void;
  label?: string;
}

const ENTITY_TYPES = [
  { value: "university", en: "University", ar: "جامعة" },
  { value: "college", en: "College", ar: "كلية" },
  { value: "training_center", en: "Training Center", ar: "مركز تدريب" },
  { value: "culinary_academy", en: "Culinary Academy", ar: "أكاديمية طهي" },
  { value: "culinary_association", en: "Culinary Association", ar: "جمعية طهي" },
  { value: "government_entity", en: "Government Entity", ar: "جهة حكومية" },
  { value: "private_association", en: "Private Association", ar: "جمعية خاصة" },
  { value: "industry_body", en: "Industry Body", ar: "هيئة صناعية" },
];

type SourceCategory = "all" | "entity" | "company" | "chef";

export function OrganizerSearchSelector({ value, onChange, label }: OrganizerSearchSelectorProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<SourceCategory>("all");
  const [filterCountry, setFilterCountry] = useState("all");

  // Add new entity inline
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newType, setNewType] = useState("culinary_association");
  const [isAdding, setIsAdding] = useState(false);

  const t = (en: string, ar: string) => isAr ? ar : en;
  const { data: countries } = useAllCountries();

  // Fetch entities
  const { data: entities = [] } = useQuery({
    queryKey: ["organizer-entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, type, country, city, logo_url, website, status, email")
        .in("status", ["active", "pending"])
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["organizer-companies"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("companies")
        .select("id, name, name_ar, type, country_code, city, logo_url, website, email, phone")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as Array<{id:string; name:string; name_ar:string|null; type:string; country_code:string|null; city:string|null; logo_url:string|null; website:string|null; email:string|null; phone:string|null}>;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch chefs (only when searching)
  const { data: chefs = [] } = useQuery({
    queryKey: ["organizer-chefs", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, avatar_url, nationality, email")
        .or(`full_name.ilike.%${search}%,full_name_ar.ilike.%${search}%`)
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: search.length >= 2 && isOpen && (category === "all" || category === "chef"),
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Unified results
  const results = useMemo(() => {
    if (!isOpen || search.length < 1) return [];
    const q = search.toLowerCase();
    const items: Array<{
      id: string;
      source: OrganizerType;
      name: string;
      nameAr: string;
      subtitle: string;
      country?: string;
      logoUrl?: string;
      email?: string;
      phone?: string;
      website?: string;
      entityId?: string;
      companyId?: string;
      userId?: string;
    }> = [];

    // Entities
    if (category === "all" || category === "entity") {
      entities
        .filter(e => e.name?.toLowerCase().includes(q) || e.name_ar?.includes(q))
        .forEach(e => {
          const typeLabel = ENTITY_TYPES.find(t => t.value === e.type);
          items.push({
            id: `entity-${e.id}`,
            source: "entity",
            name: e.name || "",
            nameAr: e.name_ar || "",
            subtitle: `${isAr ? (typeLabel?.ar || e.type) : (typeLabel?.en || e.type)}${e.city ? ` • ${e.city}` : ""}${e.country ? ` • ${e.country}` : ""}`,
            country: e.country || undefined,
            logoUrl: e.logo_url || undefined,
            email: e.email || undefined,
            website: e.website || undefined,
            entityId: e.id,
          });
        });
    }

    // Companies
    if (category === "all" || category === "company") {
      companies
        .filter(c => c.name?.toLowerCase().includes(q) || c.name_ar?.includes(q))
        .forEach(c => {
          items.push({
            id: `company-${c.id}`,
            source: "company",
            name: c.name || "",
            nameAr: c.name_ar || "",
            subtitle: `${t("Company", "شركة")}${c.city ? ` • ${c.city}` : ""}`,
            country: c.country_code || undefined,
            logoUrl: c.logo_url || undefined,
            email: c.email || undefined,
            phone: c.phone || undefined,
            website: c.website || undefined,
            companyId: c.id,
          });
        });
    }

    // Chefs
    if (category === "all" || category === "chef") {
      chefs.forEach(ch => {
        items.push({
          id: `chef-${ch.user_id}`,
          source: "chef",
          name: ch.full_name || "",
          nameAr: ch.full_name_ar || "",
          subtitle: t("Chef", "شيف"),
          country: ch.nationality || undefined,
          logoUrl: ch.avatar_url || undefined,
          email: ch.email || undefined,
          userId: ch.user_id,
        });
      });
    }

    // Filter by country
    if (filterCountry !== "all") {
      return items.filter(i => i.country === filterCountry);
    }

    return items.slice(0, 20);
  }, [isOpen, search, category, filterCountry, entities, companies, chefs, isAr]);

  const handleSelect = useCallback((item: typeof results[0]) => {
    onChange({
      type: item.source,
      entityId: item.entityId || null,
      companyId: item.companyId || null,
      userId: item.userId || null,
      name: item.name,
      nameAr: item.nameAr,
      country: item.country,
      email: item.email,
      phone: item.phone,
      website: item.website,
      logoUrl: item.logoUrl,
    });
    setSearch("");
    setIsOpen(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
    setSearch("");
  }, [onChange]);

  const sourceIcon = (type: OrganizerType) => {
    switch (type) {
      case "entity": return <Building2 className="h-3.5 w-3.5" />;
      case "company": return <Briefcase className="h-3.5 w-3.5" />;
      case "chef": return <User className="h-3.5 w-3.5" />;
      default: return <Building2 className="h-3.5 w-3.5" />;
    }
  };

  const sourceBadge = (type: OrganizerType) => {
    const labels: Record<OrganizerType, { en: string; ar: string; color: string }> = {
      entity: { en: "Entity", ar: "جهة", color: "bg-chart-1/10 text-chart-1" },
      company: { en: "Company", ar: "شركة", color: "bg-chart-2/10 text-chart-2" },
      chef: { en: "Chef", ar: "شيف", color: "bg-chart-4/10 text-chart-4" },
      custom: { en: "Custom", ar: "مخصص", color: "bg-muted text-muted-foreground" },
    };
    const l = labels[type];
    return <Badge className={`text-[9px] h-4 border-0 ${l.color}`}>{isAr ? l.ar : l.en}</Badge>;
  };

  const handleAddNew = async () => {
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      const slug = newName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { data, error } = await supabase.from("culinary_entities").insert({
        name: newName,
        name_ar: newNameAr || null,
        country: newCountry || null,
        type: newType as any,
        slug,
        entity_number: "",
        status: "pending" as any,
        scope: "local" as any,
        is_visible: false,
      }).select("id, name, name_ar, country").single();

      if (error) throw error;
      if (data) {
        onChange({
          type: "entity",
          entityId: data.id,
          name: data.name,
          nameAr: data.name_ar || "",
          country: data.country || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["organizer-entities"] });
        toast({ title: t("Added successfully — pending review", "تمت الإضافة — بانتظار المراجعة") });
        setShowAddForm(false);
        setNewName(""); setNewNameAr(""); setNewCountry(""); setNewType("culinary_association");
      }
    } catch (err: any) {
      toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  // Available countries for filter
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    entities.forEach(e => e.country && set.add(e.country));
    companies.forEach(c => c.country_code && set.add(c.country_code));
    return Array.from(set).sort();
  }, [entities, companies]);

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label>{label || t("Organizer", "الجهة المنظمة")}</Label>

      {/* Selected display */}
      {value ? (
        <div className="flex items-center gap-2.5 rounded-xl border p-2.5 bg-muted/30">
          {value.logoUrl ? (
            <img src={value.logoUrl} alt="" className="h-9 w-9 rounded-md object-cover shrink-0" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
              {sourceIcon(value.type)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-sm truncate">{isAr ? (value.nameAr || value.name) : value.name}</p>
              {sourceBadge(value.type)}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {[value.email, value.country].filter(Boolean).join(" • ")}
            </p>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleClear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Category tabs */}
          <div className="flex gap-1 flex-wrap">
            {([
              { value: "all", en: "All", ar: "الكل" },
              { value: "entity", en: "Entities", ar: "الجهات" },
              { value: "company", en: "Companies", ar: "الشركات" },
              { value: "chef", en: "Chefs", ar: "الطهاة" },
            ] as { value: SourceCategory; en: string; ar: string }[]).map(cat => (
              <Button
                key={cat.value}
                type="button"
                variant={category === cat.value ? "default" : "outline"}
                size="sm"
                className="h-7 text-[11px] px-2.5"
                onClick={() => setCategory(cat.value)}
              >
                {isAr ? cat.ar : cat.en}
              </Button>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                placeholder={t("Search by name...", "ابحث بالاسم...")}
                className="ps-8 h-9 text-sm"
              />
            </div>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder={t("Country", "الدولة")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Countries", "جميع الدول")}</SelectItem>
                {availableCountries.map(c => {
                  const country = countries?.find(co => co.code === c || co.name === c);
                  return (
                    <SelectItem key={c} value={c}>
                      <span className="flex items-center gap-1">
                        {country && <span>{countryFlag(country.code)}</span>}
                        <span>{isAr ? (country?.name_ar || c) : (country?.name || c)}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {isOpen && search.length >= 1 && (
            <ScrollArea className="max-h-48 rounded-md border bg-popover">
              {results.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">{t("No results found", "لا توجد نتائج")}</p>
              ) : (
                <div className="p-1 space-y-0.5">
                  {results.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-2 rounded-md p-2 text-start hover:bg-accent/50 transition-colors text-sm"
                    >
                      {item.logoUrl ? (
                        <img src={item.logoUrl} alt="" className="h-7 w-7 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
                          {sourceIcon(item.source)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-xs truncate">{isAr ? (item.nameAr || item.name) : item.name}</p>
                          {sourceBadge(item.source)}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* Add new */}
          {!showAddForm ? (
            <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => setShowAddForm(true)}>
              <Plus className="h-3.5 w-3.5" />
              {t("Add New Organizer", "إضافة جهة منظمة جديدة")}
            </Button>
          ) : (
            <div className="rounded-md border p-3 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">{t("Add New Entity", "إضافة جهة جديدة")}</p>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowAddForm(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("Name (EN)", "الاسم (إنجليزي)")} *</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("Name (AR)", "الاسم (عربي)")}</Label>
                  <Input value={newNameAr} onChange={e => setNewNameAr(e.target.value)} className="h-8 text-sm" dir="rtl" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("Type", "النوع")}</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map(et => (
                        <SelectItem key={et.value} value={et.value}>{isAr ? et.ar : et.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CountrySelector value={newCountry} onChange={setNewCountry} label={t("Country", "الدولة")} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {t("⚠️ Will be pending admin review", "⚠️ ستكون بحالة 'قيد المراجعة' حتى الاعتماد")}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAddForm(false)}>
                  {t("Cancel", "إلغاء")}
                </Button>
                <Button size="sm" className="flex-1 gap-1" onClick={handleAddNew} disabled={!newName.trim() || isAdding}>
                  {isAdding ? <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" /> : <Check className="h-3.5 w-3.5" />}
                  {t("Add", "إضافة")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { OrganizerValue, OrganizerType };
