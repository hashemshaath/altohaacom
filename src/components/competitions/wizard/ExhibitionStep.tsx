import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Building2, Globe, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface ExhibitionStepProps {
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export function ExhibitionStep({ selectedId, onChange }: ExhibitionStepProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");

  const { data: exhibitions, isLoading } = useQuery({
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

  const filtered = exhibitions?.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.title_ar?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "ربط بمعرض أو حدث" : "Link to Exhibition / Event"}</CardTitle>
        <CardDescription>
          {isAr
            ? "اختر المعرض أو الحدث المرتبط بهذه المسابقة، أو اتركه فارغاً لمسابقة مستقلة"
            : "Select the exhibition or event this competition belongs to, or leave empty for standalone"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedId && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <Check className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium flex-1">
              {isAr ? "تم اختيار معرض" : "Exhibition selected"}:{" "}
              {exhibitions?.find((e) => e.id === selectedId)?.title || selectedId}
            </span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <Input
          placeholder={isAr ? "بحث في المعارض والأحداث..." : "Search exhibitions & events..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered?.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {isAr ? "لا توجد معارض أو أحداث قادمة" : "No upcoming exhibitions or events"}
          </p>
        ) : (
          <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1">
            {filtered?.map((exh) => {
              const isSelected = selectedId === exh.id;
              return (
                <button
                  key={exh.id}
                  type="button"
                  onClick={() => onChange(isSelected ? null : exh.id)}
                  className={`group w-full rounded-xl border p-4 text-start transition-all hover:shadow-md ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 hover:border-primary/30"
                  }`}
                >
                  <div className="flex gap-3">
                    {exh.cover_image_url && (
                      <img src={exh.cover_image_url} alt="" className="h-16 w-24 rounded-lg object-cover shrink-0" />
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

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(exh.start_date), "MMM d")} – {format(new Date(exh.end_date), "MMM d, yyyy")}
                        </span>
                        {exh.is_virtual ? (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {isAr ? "افتراضي" : "Virtual"}
                          </span>
                        ) : exh.city ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exh.city}{exh.country ? `, ${exh.country}` : ""}
                          </span>
                        ) : null}
                        {exh.organizer_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {isAr && exh.organizer_name_ar ? exh.organizer_name_ar : exh.organizer_name}
                          </span>
                        )}
                      </div>

                      {/* Organizer contact details */}
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-muted-foreground/70">
                        {exh.organizer_email && <span>{exh.organizer_email}</span>}
                        {exh.organizer_phone && <span>{exh.organizer_phone}</span>}
                        {exh.max_attendees && <span>{isAr ? `السعة: ${exh.max_attendees}` : `Capacity: ${exh.max_attendees}`}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {isAr
            ? "عند ربط المسابقة بمعرض، سيتم استخدام بيانات الموقع والتاريخ تلقائياً"
            : "When linked to an exhibition, location and date info can be auto-populated"}
        </p>
      </CardContent>
    </Card>
  );
}
