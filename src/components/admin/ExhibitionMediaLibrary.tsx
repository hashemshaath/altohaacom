import { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadAndGetUrl } from "@/lib/storageUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, Loader2, Search, Filter, Image, FileText, Grid3X3, List, CheckSquare, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

interface Props {
  exhibitionId: string;
  coverImageUrl?: string;
  onCoverChange?: (url: string) => void;
  isAr: boolean;
}

const MEDIA_CATEGORIES = [
  { value: "all", en: "All", ar: "الكل" },
  { value: "cover", en: "Cover Image", ar: "صورة الغلاف" },
  { value: "logo", en: "Logo", ar: "الشعار" },
  { value: "gallery", en: "Gallery", ar: "معرض الصور" },
  { value: "sponsor", en: "Sponsor Logo", ar: "شعار الراعي" },
  { value: "banner", en: "Banner", ar: "بانر" },
  { value: "floorplan", en: "Floor Plan", ar: "مخطط الطابق" },
  { value: "brochure", en: "Brochure", ar: "كتيب" },
  { value: "document", en: "Document", ar: "مستند" },
  { value: "video", en: "Video", ar: "فيديو" },
  { value: "other", en: "Other", ar: "أخرى" },
];

export const ExhibitionMediaLibrary = memo(function ExhibitionMediaLibrary({ exhibitionId, coverImageUrl, onCoverChange, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("gallery");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["exhibition-media", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_media")
        .select("id, exhibition_id, file_url, file_type, title, category, sort_order, created_at")
        .eq("exhibition_id", exhibitionId)
        .order("sort_order");
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
    enabled: !!exhibitionId,
  });

  const filtered = media.filter(item => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (searchTerm && !(item.title || "").toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `exhibitions/${exhibitionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url: fileUrl, error: uploadError } = await uploadAndGetUrl("exhibition-files", path, file);
        if (uploadError) throw uploadError;
        const { error: dbError } = await supabase.from("exhibition_media").insert({
          exhibition_id: exhibitionId,
          file_url: fileUrl,
          file_type: file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "file",
          title: file.name,
          category,
        });
        if (dbError) throw dbError;
        if (category === "cover" && onCoverChange) onCoverChange(fileUrl);
      }
      queryClient.invalidateQueries({ queryKey: ["exhibition-media", exhibitionId] });
      toast({ title: t("Uploaded successfully", "تم الرفع بنجاح") });
    } catch (err: unknown) {
      toast({ title: t("Upload failed", "فشل الرفع"), description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [exhibitionId, category, onCoverChange, queryClient, t]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase.from("exhibition_media").delete().eq("id", id);
        if (error) throw handleSupabaseError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-media", exhibitionId] });
      setSelectedIds(new Set());
      toast({ title: t("Deleted", "تم الحذف") });
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(m => m.id)));
  };

  if (!exhibitionId) {
    return <p className="text-xs text-muted-foreground italic">{t("Save first to manage media.", "احفظ أولاً لإدارة الوسائط.")}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Upload */}
          <div className="flex items-center gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEDIA_CATEGORIES.filter(c => c.value !== "all").map(c => (
                  <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor={`media-lib-upload-${exhibitionId}`} className="cursor-pointer">
              <Button type="button" size="sm" variant="default" className="gap-1.5 text-xs h-8" asChild disabled={uploading}>
                <span>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {t("Upload", "رفع")}
                </span>
              </Button>
            </Label>
            <input id={`media-lib-upload-${exhibitionId}`} type="file" accept="image/*,video/*,.pdf,.doc,.docx" multiple className="hidden" onChange={handleUpload} />
          </div>
          <Separator orientation="vertical" className="h-6" />
          {/* Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-xs w-[110px]">
              <Filter className="h-3 w-3 me-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEDIA_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input className="h-8 text-xs ps-7 w-[150px]" placeholder={t("Search...", "بحث...")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {selectedIds.size > 0 && (
            <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={() => deleteMutation.mutate(Array.from(selectedIds))}>
              <Trash2 className="h-3 w-3" />
              {t(`Delete (${selectedIds.size})`, `حذف (${selectedIds.size})`)}
            </Button>
          )}
          <Button size="icon" variant={viewMode === "grid" ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant={viewMode === "list" ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setViewMode("list")}>
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Cover preview */}
      {coverImageUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
          <img loading="lazy" decoding="async" src={coverImageUrl} alt="Cover" className="h-16 w-24 rounded-lg object-cover border" />
          <div>
            <p className="text-xs font-medium">{t("Current Cover", "الغلاف الحالي")}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{coverImageUrl}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>{t(`${media.length} files total`, `${media.length} ملف إجمالاً`)}</span>
        {filterCategory !== "all" && <span>· {t(`${filtered.length} shown`, `${filtered.length} معروض`)}</span>}
        {selectedIds.size > 0 && (
          <button className="text-primary underline" onClick={selectAll}>
            {selectedIds.size === filtered.length ? t("Deselect all", "إلغاء تحديد الكل") : t("Select all", "تحديد الكل")}
          </button>
        )}
      </div>

      {/* Media Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filtered.map(item => {
              const selected = selectedIds.has(item.id);
              const catInfo = MEDIA_CATEGORIES.find(c => c.value === item.category);
              return (
                <div key={item.id} className={cn("group relative rounded-xl border overflow-hidden bg-muted/20 transition-all", selected && "ring-2 ring-primary border-primary")}>
                  {item.file_type === "image" ? (
                    <img loading="lazy" decoding="async" src={item.file_url} alt={item.title || ""} className="h-24 w-full object-cover" />
                  ) : (
                    <div className="h-24 w-full flex items-center justify-center bg-muted/40">
                      <FileText className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  {/* Select overlay */}
                  <button className="absolute top-1.5 start-1.5 z-10" onClick={() => toggleSelect(item.id)}>
                    {selected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => deleteMutation.mutate([item.id])}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {item.category === "cover" && onCoverChange && (
                      <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={() => onCoverChange(item.file_url)}>
                        {t("Set Cover", "غلاف")}
                      </Button>
                    )}
                  </div>
                  {/* Category badge */}
                  <Badge className="absolute bottom-1 start-1 text-xs h-4 border-0 bg-background/80 text-foreground">
                    {catInfo ? (isAr ? catInfo.ar : catInfo.en) : item.category}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border divide-y">
            {filtered.map(item => {
              const selected = selectedIds.has(item.id);
              const catInfo = MEDIA_CATEGORIES.find(c => c.value === item.category);
              return (
                <div key={item.id} className={cn("flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition-colors", selected && "bg-primary/5")}>
                  <button onClick={() => toggleSelect(item.id)}>
                    {selected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground/40" />}
                  </button>
                  {item.file_type === "image" ? (
                    <img loading="lazy" decoding="async" src={item.file_url} alt={item.title || "Media file"} className="h-10 w-14 rounded-lg object-cover border shrink-0" />
                  ) : (
                    <div className="h-10 w-14 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.title || t("Untitled", "بدون عنوان")}</p>
                    <p className="text-xs text-muted-foreground">{catInfo ? (isAr ? catInfo.ar : catInfo.en) : item.category}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteMutation.mutate([item.id])}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Image className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">{t("No media uploaded yet", "لم يتم رفع وسائط بعد")}</p>
        </div>
      )}
    </div>
  );
});
