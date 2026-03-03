import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { 
  Search, Upload, Image, File, Video, MoreVertical, Trash2, Copy, Download,
  Grid, List, Filter, HardDrive, ImageIcon, FileVideo, FileText,
} from "lucide-react";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminWidgetSkeleton } from "@/components/admin/AdminTableSkeleton";

export default function MediaAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: media, isLoading } = useQuery({
    queryKey: ["admin-media", search],
    queryFn: async () => {
      let query = supabase
        .from("media_library")
        .select("id, filename, original_filename, file_url, file_type, file_size, alt_text, uploaded_by, created_at")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`filename.ilike.%${search}%,original_filename.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("media_library").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast({
        title: language === "ar" ? "تم الحذف" : "Deleted",
        description: language === "ar" ? "تم حذف الملف" : "File deleted",
      });
    },
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith("image")) return Image;
    if (type.startsWith("video")) return Video;
    return File;
  };

  const getFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: language === "ar" ? "تم النسخ" : "Copied",
      description: language === "ar" ? "تم نسخ الرابط" : "URL copied to clipboard",
    });
  };

  // Upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !user?.id) return;
    setUploading(true);
    setUploadProgress(0);
    const total = files.length;
    let done = 0;

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("user-media").upload(path, file);
      if (uploadError) {
        toast({ variant: "destructive", title: "Upload failed", description: uploadError.message });
        continue;
      }
      const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
      await supabase.from("media_library").insert({
        filename: path,
        original_filename: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
      });
      done++;
      setUploadProgress(Math.round((done / total) * 100));
    }
    queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({ title: language === "ar" ? `تم رفع ${done} ملف` : `${done} file(s) uploaded` });
  };

  // Filter by type
  const filteredMedia = useMemo(() => {
    if (!media) return [];
    return media.filter(f => {
      if (typeFilter === "images" && !f.file_type.startsWith("image")) return false;
      if (typeFilter === "videos" && !f.file_type.startsWith("video")) return false;
      if (typeFilter === "documents" && (f.file_type.startsWith("image") || f.file_type.startsWith("video"))) return false;
      return true;
    });
  }, [media, typeFilter]);

  const bulk = useAdminBulkActions(filteredMedia);

  const { exportCSV: exportMedia } = useCSVExport({
    columns: [
      { header: language === "ar" ? "الملف" : "Filename", accessor: (r: any) => r.original_filename || r.filename },
      { header: language === "ar" ? "النوع" : "Type", accessor: (r: any) => r.file_type },
      { header: language === "ar" ? "الحجم" : "Size", accessor: (r: any) => r.file_size || 0 },
      { header: language === "ar" ? "الرابط" : "URL", accessor: (r: any) => r.file_url },
      { header: language === "ar" ? "التاريخ" : "Date", accessor: (r: any) => format(new Date(r.created_at), "yyyy-MM-dd") },
    ],
    filename: "media",
  });

  const bulkDeleteMedia = async () => {
    const ids = [...bulk.selected];
    const { error } = await supabase.from("media_library").delete().in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    bulk.clearSelection();
    toast({ title: language === "ar" ? `تم حذف ${ids.length} ملف` : `${ids.length} deleted` });
  };

  // Stats
  const stats = useMemo(() => {
    if (!media) return { total: 0, images: 0, videos: 0, totalSize: 0 };
    return {
      total: media.length,
      images: media.filter(f => f.file_type.startsWith("image")).length,
      videos: media.filter(f => f.file_type.startsWith("video")).length,
      totalSize: media.reduce((sum, f) => sum + (f.file_size || 0), 0),
    };
  }, [media]);

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={handleUpload} />
      <AdminPageHeader
        icon={ImageIcon}
        title={language === "ar" ? "مكتبة الوسائط" : "Media Library"}
        description={language === "ar" ? "إدارة الصور والملفات" : "Manage images and files"}
        actions={
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="me-2 h-4 w-4" />
            {uploading ? `${uploadProgress}%` : (language === "ar" ? "رفع ملف" : "Upload File")}
          </Button>
        }
      />

      {uploading && <Progress value={uploadProgress} className="h-2" />}

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onExport={() => exportMedia(bulk.selectedItems)}
        onDelete={bulkDeleteMedia}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: HardDrive, label: language === "ar" ? "إجمالي" : "Total", value: stats.total, color: "text-primary", bg: "bg-primary/10" },
          { icon: ImageIcon, label: language === "ar" ? "صور" : "Images", value: stats.images, color: "text-chart-2", bg: "bg-chart-2/10" },
          { icon: FileVideo, label: language === "ar" ? "فيديو" : "Videos", value: stats.videos, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: FileText, label: language === "ar" ? "حجم التخزين" : "Storage", value: getFileSize(stats.totalSize), color: "text-chart-4", bg: "bg-chart-4/10" },
        ].map(s => (
          <Card key={s.label} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={language === "ar" ? "بحث في الملفات..." : "Search files..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "ar" ? "الكل" : "All Types"}</SelectItem>
                  <SelectItem value="images">{language === "ar" ? "صور" : "Images"}</SelectItem>
                  <SelectItem value="videos">{language === "ar" ? "فيديو" : "Videos"}</SelectItem>
                  <SelectItem value="documents">{language === "ar" ? "مستندات" : "Documents"}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")}>
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {language === "ar" ? "الملفات" : "Files"} 
              <Badge variant="secondary" className="ms-2">{filteredMedia?.length || 0}</Badge>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <AdminWidgetSkeleton rows={5} />
          ) : !filteredMedia || filteredMedia.length === 0 ? (
            <AdminEmptyState
              icon={ImageIcon}
              title="No files found"
              titleAr="لا توجد ملفات"
              description="Upload your first file to get started"
              descriptionAr="ارفع أول ملف للبدء"
              actionLabel="Upload File"
              actionLabelAr="رفع ملف"
              onAction={() => fileInputRef.current?.click()}
            />
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredMedia.map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <div 
                    key={file.id} 
                    className={`group relative rounded-xl border border-border/40 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-200 hover:shadow-md ${bulk.isSelected(file.id) ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedMedia(file)}
                  >
                    <div className="absolute top-2 start-2 z-10" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={bulk.isSelected(file.id)} onCheckedChange={() => bulk.toggleOne(file.id)} />
                    </div>
                    {file.file_type.startsWith("image") ? (
                      <div className="aspect-square">
                        <img 
                          src={file.file_url} 
                          alt={file.alt_text || file.filename}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square flex items-center justify-center bg-muted">
                        <FileIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{file.original_filename}</p>
                      <p className="text-xs text-muted-foreground">{getFileSize(file.file_size)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="absolute top-2 end-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyUrl(file.file_url); }}>
                          <Copy className="me-2 h-4 w-4" />
                          {language === "ar" ? "نسخ الرابط" : "Copy URL"}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={file.file_url} download target="_blank" rel="noopener">
                            <Download className="me-2 h-4 w-4" />
                            {language === "ar" ? "تحميل" : "Download"}
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {language === "ar" ? "حذف" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedia.map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <div 
                    key={file.id}
                    className={`flex items-center gap-4 rounded-xl border p-3 hover:bg-accent/50 cursor-pointer ${bulk.isSelected(file.id) ? "ring-1 ring-primary bg-primary/5" : ""}`}
                    onClick={() => setSelectedMedia(file)}
                  >
                    <div onClick={e => e.stopPropagation()}>
                      <Checkbox checked={bulk.isSelected(file.id)} onCheckedChange={() => bulk.toggleOne(file.id)} />
                    </div>
                    {file.file_type.startsWith("image") ? (
                      <img 
                        src={file.file_url} 
                        alt=""
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.original_filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.file_type} • {getFileSize(file.file_size)} • {format(new Date(file.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyUrl(file.file_url); }}>
                          <Copy className="me-2 h-4 w-4" />
                          {language === "ar" ? "نسخ الرابط" : "Copy URL"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {language === "ar" ? "حذف" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Detail Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMedia?.original_filename}</DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-4">
              {selectedMedia.file_type.startsWith("image") && (
                <img 
                  src={selectedMedia.file_url}
                  alt={selectedMedia.alt_text || ""}
                  className="w-full rounded-xl"
                />
              )}
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "ar" ? "النوع" : "Type"}:</span>
                  <span>{selectedMedia.file_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "ar" ? "الحجم" : "Size"}:</span>
                  <span>{getFileSize(selectedMedia.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "ar" ? "التاريخ" : "Date"}:</span>
                  <span>{format(new Date(selectedMedia.created_at), "PPP")}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => copyUrl(selectedMedia.file_url)}>
                  <Copy className="me-2 h-4 w-4" />
                  {language === "ar" ? "نسخ الرابط" : "Copy URL"}
                </Button>
                <Button variant="outline" asChild>
                  <a href={selectedMedia.file_url} download target="_blank" rel="noopener">
                    <Download className="me-2 h-4 w-4" />
                    {language === "ar" ? "تحميل" : "Download"}
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
