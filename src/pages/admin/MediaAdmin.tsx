import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Search, 
  Upload,
  Image,
  File,
  Video,
  MoreVertical,
  Trash2,
  Copy,
  Download,
  Grid,
  List,
  Filter,
} from "lucide-react";

export default function MediaAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const { data: media, isLoading } = useQuery({
    queryKey: ["admin-media", search],
    queryFn: async () => {
      let query = supabase
        .from("media_library")
        .select("*")
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {language === "ar" ? "مكتبة الوسائط" : "Media Library"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إدارة الصور والملفات" : "Manage images and files"}
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          {language === "ar" ? "رفع ملف" : "Upload File"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={language === "ar" ? "بحث في الملفات..." : "Search files..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {language === "ar" ? "الملفات" : "Files"} 
              <Badge variant="secondary" className="ml-2">{media?.length || 0}</Badge>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !media || media.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>{language === "ar" ? "لا توجد ملفات" : "No files found"}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {media.map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <div 
                    key={file.id} 
                    className="group relative rounded-lg border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
                    onClick={() => setSelectedMedia(file)}
                  >
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
                          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyUrl(file.file_url); }}>
                          <Copy className="mr-2 h-4 w-4" />
                          {language === "ar" ? "نسخ الرابط" : "Copy URL"}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={file.file_url} download target="_blank" rel="noopener">
                            <Download className="mr-2 h-4 w-4" />
                            {language === "ar" ? "تحميل" : "Download"}
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
              {media.map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <div 
                    key={file.id}
                    className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/50 cursor-pointer"
                    onClick={() => setSelectedMedia(file)}
                  >
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
                          <Copy className="mr-2 h-4 w-4" />
                          {language === "ar" ? "نسخ الرابط" : "Copy URL"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
                  className="w-full rounded-lg"
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
                  <Copy className="mr-2 h-4 w-4" />
                  {language === "ar" ? "نسخ الرابط" : "Copy URL"}
                </Button>
                <Button variant="outline" asChild>
                  <a href={selectedMedia.file_url} download target="_blank" rel="noopener">
                    <Download className="mr-2 h-4 w-4" />
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
