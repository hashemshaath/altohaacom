import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageIcon, Plus, Trash2, Save, X, Star, ThumbsUp, ThumbsDown, Expand } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

interface ReferenceGalleryPanelProps {
  competitionId?: string;
  isAdmin?: boolean;
  isJudge?: boolean;
}

const RATINGS = [
  { value: "excellent", label: "Excellent", label_ar: "ممتاز", icon: Star },
  { value: "good", label: "Good", label_ar: "جيد", icon: ThumbsUp },
  { value: "average", label: "Average", label_ar: "متوسط", icon: null },
  { value: "poor", label: "Poor", label_ar: "ضعيف", icon: ThumbsDown },
];

const CATEGORIES = [
  { value: "preparation", label: "Preparation", label_ar: "التحضير" },
  { value: "plating", label: "Plating", label_ar: "التقديم" },
  { value: "technique", label: "Technique", label_ar: "التقنية" },
  { value: "final_dish", label: "Final Dish", label_ar: "الطبق النهائي" },
  { value: "workspace", label: "Workspace", label_ar: "بيئة العمل" },
  { value: "other", label: "Other", label_ar: "أخرى" },
];

export const ReferenceGalleryPanel = memo(function ReferenceGalleryPanel({ competitionId, isAdmin, isJudge }: ReferenceGalleryPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const canManage = isAdmin || isJudge;

  const [showForm, setShowForm] = useState(false);
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", title_ar: "", description: "", description_ar: "",
    image_url: "", rating: "excellent", score_range_min: 0, score_range_max: 10,
    competition_category: "", category: "final_dish", tags: "",
  });

  const { data: references, isLoading } = useQuery({
    queryKey: ["reference-gallery", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_gallery")
        .select("id, title, title_ar, description, description_ar, image_url, category, competition_category, rating, score_range_min, score_range_max, tags, sort_order, is_active, added_by, uploaded_by_name, created_at")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reference_gallery").insert({
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        image_url: form.image_url,
        rating: form.rating || null,
        score_range_min: form.score_range_min,
        score_range_max: form.score_range_max,
        competition_category: form.competition_category || null,
        category: form.category || null,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
        added_by: user?.id,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference-gallery"] });
      setShowForm(false);
      setForm({
        title: "", title_ar: "", description: "", description_ar: "",
        image_url: "", rating: "excellent", score_range_min: 0, score_range_max: 10,
        competition_category: "", category: "final_dish", tags: "",
      });
      toast({ title: isAr ? "تمت الإضافة" : "Reference added" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reference_gallery").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference-gallery"] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const filtered = references?.filter(r => {
    if (filterRating !== "all" && r.rating !== filterRating) return false;
    if (filterCategory !== "all" && (r as any).category !== filterCategory) return false;
    return true;
  }) || [];

  const getRatingInfo = (rating: string | null) => RATINGS.find(r => r.value === rating) || RATINGS[2];

  const lightboxImages = filtered.map(r => ({
    url: r.image_url,
    title: isAr && r.title_ar ? r.title_ar : r.title,
  }));

  return (
    <>
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-4/10">
              <ImageIcon className="h-4 w-4 text-chart-4" />
            </div>
            {isAr ? "معرض الصور" : "Gallery"}
            {filtered.length > 0 && <Badge variant="secondary" className="ms-1">{filtered.length}</Badge>}
          </h3>
          {canManage && !showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="me-1.5 h-4 w-4" />
              {isAr ? "إضافة صورة" : "Add Image"}
            </Button>
          )}
        </div>
        <CardContent className="p-4 space-y-4">
          {/* Add Form */}
          {showForm && (
            <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "العنوان" : "Title"}</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                  <Input dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} className="h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "رابط الصورة" : "Image URL"}</Label>
                <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="h-9" placeholder="https://..." />
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "الفئة" : "Category"}</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{isAr ? c.label_ar : c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "التقييم" : "Rating"}</Label>
                  <Select value={form.rating} onValueChange={v => setForm(f => ({ ...f, rating: v }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RATINGS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{isAr ? r.label_ar : r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "أدنى درجة" : "Min Score"}</Label>
                  <Input type="number" value={form.score_range_min} onChange={e => setForm(f => ({ ...f, score_range_min: Number(e.target.value) }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "أعلى درجة" : "Max Score"}</Label>
                  <Input type="number" value={form.score_range_max} onChange={e => setForm(f => ({ ...f, score_range_max: Number(e.target.value) }))} className="h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الوصف" : "Description"}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  <X className="me-1.5 h-4 w-4" /> {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button size="sm" onClick={() => addMutation.mutate()} disabled={!form.title || !form.image_url || addMutation.isPending}>
                  <Save className="me-1.5 h-4 w-4" /> {isAr ? "حفظ" : "Save"}
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder={isAr ? "الفئة" : "Category"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{isAr ? c.label_ar : c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1.5">
              <Button variant={filterRating === "all" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setFilterRating("all")}>
                {isAr ? "الكل" : "All"}
              </Button>
              {RATINGS.map(r => (
                <Button key={r.value} variant={filterRating === r.value ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setFilterRating(r.value)}>
                  {isAr ? r.label_ar : r.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "جاري التحميل..." : "Loading..."}</p>
          ) : filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((ref, idx) => {
                const ratingInfo = getRatingInfo(ref.rating);
                const cat = CATEGORIES.find(c => c.value === (ref as any).category);
                return (
                  <div
                    key={ref.id}
                    className="rounded-xl border overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <div className="aspect-video relative bg-muted">
                      <img src={ref.image_url} alt={ref.title} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow-sm">
                          <Expand className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="absolute top-2 start-2 flex gap-1.5">
                        <Badge variant="secondary" className="text-[9px] h-5 backdrop-blur-sm">
                          {isAr ? ratingInfo.label_ar : ratingInfo.label}
                        </Badge>
                        {cat && (
                          <Badge variant="outline" className="text-[9px] h-5 bg-background/80 backdrop-blur-sm">
                            {isAr ? cat.label_ar : cat.label}
                          </Badge>
                        )}
                      </div>
                      {canManage && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(ref.id); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="font-medium text-sm truncate">
                        {isAr && ref.title_ar ? ref.title_ar : ref.title}
                      </p>
                      {(ref.description || ref.description_ar) && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {isAr && ref.description_ar ? ref.description_ar : ref.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {isAr ? "النطاق:" : "Range:"} {ref.score_range_min}–{ref.score_range_max}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد صور بعد" : "No images yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
});
