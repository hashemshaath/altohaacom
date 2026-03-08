import { useState, useMemo, useCallback, memo } from "react";
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
import { Search, Plus, Building2, X, Globe, ChevronDown, ChevronUp, Check } from "lucide-react";

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

interface EntitySelectorProps {
  value: string | null;
  entityName?: string;
  onChange: (entityId: string | null, entityName: string) => void;
  label?: string;
}

export function EntitySelector({ value, entityName, onChange, label }: EntitySelectorProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isFocused, setIsFocused] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New entity inline form
  const [newName, setNewName] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newType, setNewType] = useState("university");
  const [newWebsite, setNewWebsite] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: countries } = useAllCountries();

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ["entities-for-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, type, country, city, logo_url, website, status")
        .in("status", ["active", "pending"])
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Only show results when user is searching or focused
  const shouldShowResults = isFocused && (search.trim().length > 0);

  const filtered = useMemo(() => {
    if (!shouldShowResults) return [];
    return entities.filter((e) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        e.name?.toLowerCase().includes(q) ||
        e.name_ar?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q);
      const matchesCountry = filterCountry === "all" || e.country === filterCountry;
      const matchesType = filterType === "all" || e.type === filterType;
      return matchesSearch && matchesCountry && matchesType;
    });
  }, [entities, search, filterCountry, filterType, shouldShowResults]);

  const selectedEntity = entities.find((e) => e.id === value);

  const handleSelect = useCallback((entity: typeof entities[0]) => {
    const name = isAr ? (entity.name_ar || entity.name) : entity.name;
    onChange(entity.id, name);
    setSearch("");
    setIsFocused(false);
  }, [isAr, onChange]);

  const handleClear = useCallback(() => {
    onChange(null, "");
    setSearch("");
  }, [onChange]);

  const resetAddForm = () => {
    setNewName(""); setNewNameAr(""); setNewCountry(""); setNewCity(""); setNewType("university"); setNewWebsite("");
    setShowAddForm(false);
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
        city: newCity || null,
        type: newType as any,
        website: newWebsite || null,
        slug,
        entity_number: "",
        status: "pending" as any,
        scope: "local" as any,
        is_visible: false,
      }).select("id, name, name_ar").single();

      if (error) throw error;
      if (data) {
        onChange(data.id, isAr ? (data.name_ar || data.name) : data.name);
        queryClient.invalidateQueries({ queryKey: ["entities-for-selector"] });
        toast({
          title: isAr ? "تمت الإضافة بنجاح" : "Added successfully",
          description: isAr
            ? "المؤسسة قيد المراجعة من قبل الإدارة وستظهر في القائمة"
            : "The institution is under review by admin and will appear in the list",
        });
        // Notify admins about new entity for review
        import("@/lib/notificationTriggers").then(({ notifyAdminEntityReview }) => {
          notifyAdminEntityReview({
            entityName: newName,
            entityNameAr: newNameAr || undefined,
            submittedBy: "User",
          });
        });
        resetAddForm();
      }
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const typeLabel = (type: string) => {
    const t = ENTITY_TYPES.find((et) => et.value === type);
    return t ? (isAr ? t.ar : t.en) : type;
  };

  // Unique countries from entities for filter
  const entityCountries = useMemo(() => {
    const set = new Set(entities.map((e) => e.country).filter(Boolean));
    return Array.from(set).sort();
  }, [entities]);

  return (
    <div className="space-y-2">
      <Label>{label || (isAr ? "المؤسسة التعليمية" : "Educational Institution")}</Label>

      {/* Selected entity display */}
      {selectedEntity ? (
        <div className="flex items-center gap-2 rounded-md border p-2 bg-muted/30">
          {selectedEntity.logo_url ? (
            <img src={selectedEntity.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {isAr ? (selectedEntity.name_ar || selectedEntity.name) : selectedEntity.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {typeLabel(selectedEntity.type)} {selectedEntity.city && `• ${selectedEntity.city}`} {selectedEntity.country && `• ${selectedEntity.country}`}
            </p>
          </div>
          {selectedEntity.status === "pending" && (
            <Badge variant="secondary" className="text-[10px] h-5 shrink-0">{isAr ? "قيد المراجعة" : "Pending"}</Badge>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleClear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : entityName ? (
        <div className="flex items-center gap-2 rounded-md border p-2 bg-muted/30">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm">{entityName}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleClear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      {/* Search input */}
      {!selectedEntity && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={isAr ? "ابحث بالاسم أو المدينة..." : "Search by name or city..."}
              className="ps-8 h-9 text-sm"
            />
          </div>

          {/* Filters - only show when focused */}
          {isFocused && (
            <div className="flex gap-2">
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                  {entityCountries.map((c) => {
                    const country = countries?.find((co) => co.code === c || co.name === c);
                    return (
                      <SelectItem key={c as string} value={c as string}>
                        <span className="flex items-center gap-1.5">
                          {country && <span>{countryFlag(country.code)}</span>}
                          <span>{isAr ? (country?.name_ar || c) : (country?.name || c)}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder={isAr ? "النوع" : "Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
                  {ENTITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Results list - only when searching */}
          {shouldShowResults && (
            <ScrollArea className="max-h-40 rounded-md border bg-popover">
              {isLoading ? (
                <p className="text-center text-xs text-muted-foreground py-4">{isAr ? "جاري التحميل..." : "Loading..."}</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">{isAr ? "لا توجد نتائج" : "No results found"}</p>
              ) : (
                <div className="p-1 space-y-0.5">
                  {filtered.map((entity) => (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => handleSelect(entity)}
                      className="w-full flex items-center gap-2 rounded-md p-2 text-start hover:bg-accent/50 transition-colors text-sm"
                    >
                      {entity.logo_url ? (
                        <img src={entity.logo_url} alt="" className="h-7 w-7 rounded object-cover shrink-0" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-muted shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">
                          {isAr ? (entity.name_ar || entity.name) : entity.name}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span>{typeLabel(entity.type)}</span>
                          {entity.city && <><span>•</span><span>{entity.city}</span></>}
                          {entity.country && <><span>•</span><span>{entity.country}</span></>}
                        </div>
                      </div>
                      {entity.status === "pending" && (
                        <Badge variant="secondary" className="text-[10px] h-5">{isAr ? "قيد المراجعة" : "Pending"}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* Add New - inline toggle */}
          {!showAddForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              {isAr ? "إضافة مؤسسة جديدة" : "Add New Institution"}
            </Button>
          ) : (
            <div className="rounded-md border p-3 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">{isAr ? "إضافة مؤسسة تعليمية جديدة" : "Add New Educational Institution"}</p>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={resetAddForm}>
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                  <Input value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} className="h-8 text-sm" dir="rtl" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "النوع" : "Type"}</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <CountrySelector
                  value={newCountry}
                  onChange={(code) => setNewCountry(code)}
                  label={isAr ? "الدولة" : "Country"}
                />
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
                  <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Globe className="h-3 w-3" /> {isAr ? "الموقع الإلكتروني" : "Website"}</Label>
                <Input value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} className="h-8 text-sm" placeholder="https://..." dir="ltr" />
              </div>

              <p className="text-[11px] text-muted-foreground">
                {isAr ? "⚠️ ستكون الجهة بحالة 'قيد المراجعة' حتى يتم اعتمادها من الإدارة" : "⚠️ The institution will be in 'Pending' status until approved by admin"}
              </p>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={resetAddForm}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button size="sm" className="flex-1 gap-1" onClick={handleAddNew} disabled={!newName.trim() || isAdding}>
                  {isAdding ? (
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {isAr ? "إضافة" : "Add"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
