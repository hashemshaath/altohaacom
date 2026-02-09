import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageIcon, Plus, Trash2, Save, X, Star, ThumbsUp, ThumbsDown } from "lucide-react";

interface ReferenceGalleryPanelProps {
  competitionId?: string;
  isAdmin?: boolean;
  isJudge?: boolean;
}

const RATINGS = [
  { value: "excellent", label: "Excellent", label_ar: "ممتاز", color: "bg-chart-3/20 text-chart-3", icon: Star },
  { value: "good", label: "Good", label_ar: "جيد", color: "bg-primary/20 text-primary", icon: ThumbsUp },
  { value: "average", label: "Average", label_ar: "متوسط", color: "bg-chart-4/20 text-chart-4", icon: null },
  { value: "poor", label: "Poor", label_ar: "ضعيف", color: "bg-destructive/20 text-destructive", icon: ThumbsDown },
];

export function ReferenceGalleryPanel({ competitionId, isAdmin, isJudge }: ReferenceGalleryPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canManage = isAdmin || isJudge;

  const [showForm, setShowForm] = useState(false);
  const [filterRating, setFilterRating] = useState<string>("all");
  const [form, setForm] = useState({
    title: "", title_ar: "", description: "", description_ar: "",
    image_url: "", rating: "excellent", score_range_min: 0, score_range_max: 10,
    competition_category: "", tags: "",
  });

  const { data: references, isLoading } = useQuery({
    queryKey: ["reference-gallery", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_gallery")
        .select("*")
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
        tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
        added_by: user?.id,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference-gallery"] });
      setShowForm(false);
      setForm({ title: "", title_ar: "", description: "", description_ar: "", image_url: "", rating: "excellent", score_range_min: 0, score_range_max: 10, competition_category: "", tags: "" });
      toast({ title: language === "ar" ? "تمت الإضافة" : "Reference added" });
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
      toast({ title: language === "ar" ? "تم الحذف" : "Deleted" });
    },
  });

  const filtered = references?.filter(r => filterRating === "all" || r.rating === filterRating) || [];

  const getRatingInfo = (rating: string | null) => RATINGS.find(r => r.value === rating) || RATINGS[2];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5" />
              {language === "ar" ? "معرض المراجع" : "Reference Gallery"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "أمثلة مرجعية للتقييم مع نطاقات الدرجات" : "Visual examples with score ranges for calibration"}
            </CardDescription>
          </div>
          {canManage && !showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "ar" ? "إضافة مرجع" : "Add Reference"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        {showForm && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title (Arabic)</Label>
                <Input dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{language === "ar" ? "رابط الصورة" : "Image URL"}</Label>
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">{language === "ar" ? "التقييم" : "Rating"}</Label>
                <Select value={form.rating} onValueChange={v => setForm(f => ({ ...f, rating: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RATINGS.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        {language === "ar" ? r.label_ar : r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "ar" ? "أدنى درجة" : "Min Score"}</Label>
                <Input type="number" value={form.score_range_min} onChange={e => setForm(f => ({ ...f, score_range_min: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "ar" ? "أعلى درجة" : "Max Score"}</Label>
                <Input type="number" value={form.score_range_max} onChange={e => setForm(f => ({ ...f, score_range_max: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{language === "ar" ? "الوصف" : "Description"}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">{language === "ar" ? "الفئة" : "Category"}</Label>
                <Input value={form.competition_category} onChange={e => setForm(f => ({ ...f, competition_category: e.target.value }))} placeholder="e.g., pastry, hot kitchen" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "ar" ? "الوسوم" : "Tags (comma-separated)"}</Label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="mr-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button size="sm" onClick={() => addMutation.mutate()} disabled={!form.title || !form.image_url || addMutation.isPending}>
                <Save className="mr-2 h-4 w-4" /> {language === "ar" ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button variant={filterRating === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterRating("all")}>
            {language === "ar" ? "الكل" : "All"}
          </Button>
          {RATINGS.map(r => (
            <Button key={r.value} variant={filterRating === r.value ? "default" : "outline"} size="sm" onClick={() => setFilterRating(r.value)}>
              {language === "ar" ? r.label_ar : r.label}
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(ref => {
              const ratingInfo = getRatingInfo(ref.rating);
              return (
                <div key={ref.id} className="rounded-lg border overflow-hidden group">
                  <div className="aspect-video relative bg-muted">
                    <img src={ref.image_url} alt={ref.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute top-2 left-2">
                      <Badge className={ratingInfo.color}>
                        {language === "ar" ? ratingInfo.label_ar : ratingInfo.label}
                      </Badge>
                    </div>
                    {canManage && (
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7" onClick={() => deleteMutation.mutate(ref.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm">
                      {language === "ar" && ref.title_ar ? ref.title_ar : ref.title}
                    </p>
                    {(ref.description || ref.description_ar) && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {language === "ar" && ref.description_ar ? ref.description_ar : ref.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {language === "ar" ? "النطاق:" : "Range:"} {ref.score_range_min}–{ref.score_range_max}
                      </Badge>
                      {ref.competition_category && (
                        <Badge variant="secondary" className="text-[10px]">{ref.competition_category}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            {language === "ar" ? "لا توجد أمثلة مرجعية بعد" : "No reference examples yet"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
