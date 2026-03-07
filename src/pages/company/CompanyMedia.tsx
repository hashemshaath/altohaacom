import { useState, useRef } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Image, Upload, Trash2, Search, Filter, X, ChevronLeft, ChevronRight, FileText, Download, Eye,
} from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "logo", en: "Logo", ar: "شعار" },
  { value: "banner", en: "Banner", ar: "بانر" },
  { value: "product", en: "Product", ar: "منتج" },
  { value: "certificate", en: "Certificate", ar: "شهادة" },
  { value: "document", en: "Document", ar: "مستند" },
  { value: "other", en: "Other", ar: "أخرى" },
];

interface MediaItem {
  id: string;
  company_id: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  category: string;
  title: string | null;
  title_ar: string | null;
  description: string | null;
  is_public: boolean | null;
  uploaded_by: string | null;
  created_at: string | null;
}

export default function CompanyMedia() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["companyMedia", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_media")
        .select("id, company_id, filename, file_url, file_type, file_size, category, title, title_ar, description, is_public, uploaded_by, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MediaItem[];
    },
    enabled: !!companyId,
  });

  const filtered = media.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      (item.title || "").toLowerCase().includes(q) ||
      item.filename.toLowerCase().includes(q);
    const matchesCat = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const imageItems = filtered.filter((m) => m.file_type?.startsWith("image"));

  const handleUpload = async (files: FileList | null) => {
    if (!files || !companyId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("company-media")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("company-media")
          .getPublicUrl(path);

        const { error: dbError } = await supabase.from("company_media").insert({
          company_id: companyId,
          filename: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          category: file.type.startsWith("image") ? "product" : "document",
          title: file.name.replace(/\.[^/.]+$/, ""),
          uploaded_by: user?.id || null,
        });
        if (dbError) throw dbError;
      }
      queryClient.invalidateQueries({ queryKey: ["companyMedia"] });
      toast({ title: isAr ? "تم رفع الملفات" : "Files uploaded successfully" });
    } catch {
      toast({ title: isAr ? "فشل رفع الملف" : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      // Extract path from URL for storage deletion
      const urlParts = item.file_url.split("/company-media/");
      if (urlParts[1]) {
        await supabase.storage.from("company-media").remove([decodeURIComponent(urlParts[1])]);
      }
      const { error } = await supabase.from("company_media").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyMedia"] });
      toast({ title: isAr ? "تم حذف الملف" : "File deleted" });
    },
    onError: () => {
      toast({ title: isAr ? "فشل الحذف" : "Delete failed", variant: "destructive" });
    },
  });

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => {
    if (lightboxIndex !== null) setLightboxIndex((lightboxIndex + 1) % imageItems.length);
  };
  const prevImage = () => {
    if (lightboxIndex !== null) setLightboxIndex((lightboxIndex - 1 + imageItems.length) % imageItems.length);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const usedCategories = [...new Set(media.map((m) => m.category))];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image className="h-6 w-6 text-primary" />
            {isAr ? "مكتبة الوسائط" : "Media Library"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? `${media.length} ملف` : `${media.length} files`}
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="me-2 h-4 w-4" />
            {uploading ? (isAr ? "جارٍ الرفع..." : "Uploading...") : (isAr ? "رفع ملفات" : "Upload Files")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "بحث بالاسم..." : "Search by name..."}
                className="ps-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="me-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الفئات" : "All Categories"}</SelectItem>
                {CATEGORIES.filter((c) => usedCategories.includes(c.value)).map((c) => (
                  <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item, idx) => {
            const isImage = item.file_type?.startsWith("image");
            const imageIndex = isImage ? imageItems.indexOf(item) : -1;
            return (
              <Card key={item.id} className="group overflow-hidden">
                <div className="relative">
                  {isImage ? (
                    <img
                      src={item.file_url}
                      alt={item.title || item.filename}
                      className="h-48 w-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => openLightbox(imageIndex)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-muted">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                    {isImage && (
                      <Button size="icon" variant="secondary" className="h-9 w-9" onClick={() => openLightbox(imageIndex)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="secondary" className="h-9 w-9" asChild>
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="destructive" className="h-9 w-9">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{isAr ? "حذف الملف؟" : "Delete file?"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {isAr ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(item)}>
                            {isAr ? "حذف" : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="truncate text-sm font-medium">{item.title || item.filename}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORIES.find((c) => c.value === item.category)?.[isAr ? "ar" : "en"] || item.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatSize(item.file_size)}</span>
                  </div>
                  {item.created_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "MMM dd, yyyy")}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
              <Image className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {isAr ? "لا توجد ملفات" : "No files found"}
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="me-2 h-4 w-4" />
              {isAr ? "رفع أول ملف" : "Upload your first file"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && imageItems[lightboxIndex] && (
        <Dialog open onOpenChange={closeLightbox}>
          <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur-sm">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="text-sm">
                {imageItems[lightboxIndex].title || imageItems[lightboxIndex].filename}
              </DialogTitle>
            </DialogHeader>
            <div className="relative flex items-center justify-center p-4">
              {imageItems.length > 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute start-2 top-1/2 -translate-y-1/2 z-10"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              <img
                src={imageItems[lightboxIndex].file_url}
                alt={imageItems[lightboxIndex].title || ""}
                className="max-h-[70vh] max-w-full rounded-xl object-contain"
              />
              {imageItems.length > 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute end-2 top-1/2 -translate-y-1/2 z-10"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {lightboxIndex + 1} / {imageItems.length}
              </span>
              <Button size="sm" variant="outline" asChild>
                <a href={imageItems[lightboxIndex].file_url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="me-2 h-4 w-4" />
                  {isAr ? "تحميل" : "Download"}
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
