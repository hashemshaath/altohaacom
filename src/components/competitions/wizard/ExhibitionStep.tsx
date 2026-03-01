import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Building2, Globe, Check, X, Search, ChefHat, Users, Utensils } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useCountries } from "@/hooks/useCountries";

interface ExhibitionStepProps {
  selectedId: string | null;
  onChange: (id: string | null) => void;
  linkType?: string;
  onLinkTypeChange?: (type: string) => void;
  linkedEntityId?: string | null;
  onLinkedEntityChange?: (id: string | null) => void;
  linkedChefId?: string | null;
  onLinkedChefChange?: (id: string | null) => void;
}

export function ExhibitionStep({
  selectedId,
  onChange,
  linkType = "exhibition",
  onLinkTypeChange,
  linkedEntityId,
  onLinkedEntityChange,
  linkedChefId,
  onLinkedChefChange,
}: ExhibitionStepProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const { data: countries } = useCountries();

  const activeTab = linkType || "exhibition";

  const { data: exhibitions, isLoading: loadingExh } = useQuery({
    queryKey: ["exhibitions-for-wizard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, start_date, end_date, venue, venue_ar, city, country, is_virtual, type, status, organizer_name, organizer_name_ar, organizer_email, organizer_phone, organizer_website, cover_image_url, max_attendees")
        .in("status", ["upcoming", "active"])
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: entities, isLoading: loadingEnt } = useQuery({
    queryKey: ["entities-for-linking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, type, scope, logo_url, country, city, abbreviation, abbreviation_ar")
        .eq("status", "active")
        .eq("is_visible", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: chefs, isLoading: loadingChefs } = useQuery({
    queryKey: ["chefs-for-linking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, avatar_url, specialization, country_code, city")
        .not("full_name", "is", null)
        .order("full_name")
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filterBySearch = (text: string | null | undefined, textAr: string | null | undefined) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (text?.toLowerCase().includes(q)) || (textAr?.toLowerCase().includes(q));
  };

  const filterByCountry = (country: string | null | undefined) => {
    if (countryFilter === "all") return true;
    return country?.toLowerCase() === countryFilter.toLowerCase();
  };

  const filteredExhibitions = exhibitions?.filter((e) => filterBySearch(e.title, e.title_ar) && filterByCountry(e.country));
  const filteredEntities = entities?.filter((e) => filterBySearch(e.name, e.name_ar) && filterByCountry(e.country));
  const filteredChefs = chefs?.filter((c) => filterBySearch(c.full_name, c.full_name_ar));

  const handleTabChange = (tab: string) => {
    onLinkTypeChange?.(tab);
    // Clear all selections when switching tabs
    onChange(null);
    onLinkedEntityChange?.(null);
    onLinkedChefChange?.(null);
    setSearch("");
    setCountryFilter("all");
  };

  const getSelectedLabel = () => {
    if (activeTab === "exhibition" && selectedId) {
      const exh = exhibitions?.find((e) => e.id === selectedId);
      return exh ? (isAr && exh.title_ar ? exh.title_ar : exh.title) : selectedId;
    }
    if (activeTab === "entity" && linkedEntityId) {
      const ent = entities?.find((e) => e.id === linkedEntityId);
      return ent ? (isAr && ent.name_ar ? ent.name_ar : ent.name) : linkedEntityId;
    }
    if (activeTab === "chef" && linkedChefId) {
      const chef = chefs?.find((c) => c.user_id === linkedChefId);
      return chef ? (isAr && chef.full_name_ar ? chef.full_name_ar : chef.full_name) : linkedChefId;
    }
    return null;
  };

  const clearSelection = () => {
    onChange(null);
    onLinkedEntityChange?.(null);
    onLinkedChefChange?.(null);
  };

  const hasSelection = (activeTab === "exhibition" && selectedId) || (activeTab === "entity" && linkedEntityId) || (activeTab === "chef" && linkedChefId);

  const uniqueCountries = [...new Set([
    ...(exhibitions?.map((e) => e.country).filter(Boolean) || []),
    ...(entities?.map((e) => e.country).filter(Boolean) || []),
  ])].sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "ربط بمعرض أو جهة" : "Link to Exhibition or Entity"}</CardTitle>
        <CardDescription>
          {isAr
            ? "اختر المعرض أو الجهة أو الشيف المرتبط بهذه المسابقة، أو اتركه فارغاً لمسابقة مستقلة"
            : "Select the exhibition, entity, or chef this competition belongs to, or leave empty for standalone"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSelection && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <Check className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium flex-1 truncate">
              {isAr ? "تم الاختيار" : "Selected"}: {getSelectedLabel()}
            </span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="exhibition" className="gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5" />
              {isAr ? "معرض" : "Exhibition"}
            </TabsTrigger>
            <TabsTrigger value="entity" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              {isAr ? "جهة / جمعية" : "Entity"}
            </TabsTrigger>
            <TabsTrigger value="chef" className="gap-1.5 text-xs">
              <ChefHat className="h-3.5 w-3.5" />
              {isAr ? "شيف" : "Chef"}
            </TabsTrigger>
          </TabsList>

          {/* Shared filters */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10"
              />
            </div>
            {activeTab !== "chef" && (
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                  {uniqueCountries.map((c) => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <TabsContent value="exhibition" className="mt-3">
            {loadingExh ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredExhibitions?.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {isAr ? "لا توجد معارض أو أحداث قادمة" : "No upcoming exhibitions or events"}
              </p>
            ) : (
              <div className="grid gap-2 max-h-[350px] overflow-y-auto pe-1">
                {filteredExhibitions?.map((exh) => {
                  const isSelected = selectedId === exh.id;
                  return (
                    <button
                      key={exh.id}
                      type="button"
                      onClick={() => onChange(isSelected ? null : exh.id)}
                      className={`group w-full rounded-xl border p-3 text-start transition-all hover:shadow-md ${
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/60 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex gap-3">
                        {exh.cover_image_url && (
                          <img src={exh.cover_image_url} alt="" className="h-14 w-20 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm truncate">
                              {isAr && exh.title_ar ? exh.title_ar : exh.title}
                            </h4>
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {exh.type?.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(exh.start_date), "MMM d")} – {format(new Date(exh.end_date), "MMM d, yyyy")}
                            </span>
                            {exh.is_virtual ? (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" /> {isAr ? "افتراضي" : "Virtual"}
                              </span>
                            ) : exh.city ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {exh.city}{exh.country ? `, ${exh.country}` : ""}
                              </span>
                            ) : null}
                            {exh.organizer_name && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {isAr && exh.organizer_name_ar ? exh.organizer_name_ar : exh.organizer_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="entity" className="mt-3">
            {loadingEnt ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredEntities?.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {isAr ? "لا توجد جهات مطابقة" : "No matching entities"}
              </p>
            ) : (
              <div className="grid gap-2 max-h-[350px] overflow-y-auto pe-1">
                {filteredEntities?.map((ent) => {
                  const isSelected = linkedEntityId === ent.id;
                  return (
                    <button
                      key={ent.id}
                      type="button"
                      onClick={() => onLinkedEntityChange?.(isSelected ? null : ent.id)}
                      className={`flex items-center gap-3 w-full rounded-xl border p-3 text-start transition-all hover:shadow-md ${
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/60 hover:border-primary/30"
                      }`}
                    >
                      {ent.logo_url ? (
                        <img src={ent.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isAr && ent.name_ar ? ent.name_ar : ent.name}
                          {ent.abbreviation && <span className="text-muted-foreground"> ({ent.abbreviation})</span>}
                        </p>
                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                          <span>{ent.type?.replace("_", " ")}</span>
                          {ent.country && <span>· {ent.country}</span>}
                          <span>· {ent.scope}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chef" className="mt-3">
            {loadingChefs ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredChefs?.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {isAr ? "لا يوجد طهاة مطابقون" : "No matching chefs"}
              </p>
            ) : (
              <div className="grid gap-2 max-h-[350px] overflow-y-auto pe-1">
                {filteredChefs?.map((chef) => {
                  const isSelected = linkedChefId === chef.user_id;
                  return (
                    <button
                      key={chef.user_id}
                      type="button"
                      onClick={() => onLinkedChefChange?.(isSelected ? null : chef.user_id)}
                      className={`flex items-center gap-3 w-full rounded-xl border p-3 text-start transition-all hover:shadow-md ${
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/60 hover:border-primary/30"
                      }`}
                    >
                      {chef.avatar_url ? (
                        <img src={chef.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                          <ChefHat className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isAr && chef.full_name_ar ? chef.full_name_ar : chef.full_name}
                        </p>
                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                          {chef.specialization && <span>{chef.specialization}</span>}
                          {chef.city && <span>· {chef.city}</span>}
                          {chef.country_code && <span>· {chef.country_code}</span>}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          {isAr
            ? "عند ربط المسابقة بمعرض، سيتم استخدام بيانات الموقع والتاريخ تلقائياً"
            : "When linked to an exhibition, location and date info can be auto-populated"}
        </p>
      </CardContent>
    </Card>
  );
}
