import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Image, FileText, Search, Eye, Calendar, Globe, Plus, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ContentMediaDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [tab, setTab] = useState("articles");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["admin-content-articles", search, statusFilter],
    queryFn: async () => {
      let query = supabase.from("articles").select("*").order("created_at", { ascending: false }).limit(50);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (search) query = query.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: tab === "articles",
  });

  const { data: mediaFiles = [], isLoading: mediaLoading } = useQuery({
    queryKey: ["admin-content-media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_library").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) return [];
      return data || [];
    },
    enabled: tab === "media",
  });

  // Article stats
  const stats = {
    total: articles.length,
    published: articles.filter((a: any) => a.status === "published").length,
    draft: articles.filter((a: any) => a.status === "draft").length,
    totalViews: articles.reduce((s: number, a: any) => s + (a.view_count || 0), 0),
  };

  const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    draft: "bg-yellow-100 text-yellow-700",
    archived: "bg-muted text-muted-foreground",
  };

  const typeLabels: Record<string, { en: string; ar: string }> = {
    article: { en: "Article", ar: "مقال" },
    news: { en: "News", ar: "أخبار" },
    event: { en: "Event", ar: "فعالية" },
    announcement: { en: "Announcement", ar: "إعلان" },
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="articles" className="gap-1.5"><FileText className="h-4 w-4" />{isAr ? "المقالات" : "Articles"}</TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5"><Image className="h-4 w-4" />{isAr ? "الوسائط" : "Media"}</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5"><Globe className="h-4 w-4" />{isAr ? "SEO" : "SEO"}</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <MiniStat icon={FileText} label={isAr ? "إجمالي" : "Total"} value={stats.total} />
            <MiniStat icon={Eye} label={isAr ? "منشور" : "Published"} value={stats.published} />
            <MiniStat icon={Calendar} label={isAr ? "مسودة" : "Draft"} value={stats.draft} />
            <MiniStat icon={BarChart3} label={isAr ? "المشاهدات" : "Views"} value={stats.totalViews} />
          </div>

          {/* Toolbar */}
          <Card className="border-border/50">
            <CardContent className="p-3 flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="published">{isAr ? "منشور" : "Published"}</SelectItem>
                  <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Table */}
          {articlesLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                    <TableHead className="hidden md:table-cell">{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="hidden md:table-cell">{isAr ? "المشاهدات" : "Views"}</TableHead>
                    <TableHead className="hidden lg:table-cell">{isAr ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {a.featured_image_url && (
                            <img src={a.featured_image_url} alt="" className="h-10 w-14 rounded object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{isAr && a.title_ar ? a.title_ar : a.title}</p>
                            <p className="text-xs text-muted-foreground">/{a.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {isAr ? typeLabels[a.type]?.ar || a.type : typeLabels[a.type]?.en || a.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[a.status] || "")}>
                          {a.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{a.view_count || 0}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {a.published_at ? new Date(a.published_at).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          {mediaLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>
          ) : !mediaFiles.length ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Image className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد وسائط" : "No media files"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {mediaFiles.map((f: any) => (
                <Card key={f.id} className="overflow-hidden group cursor-pointer">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {f.file_url && f.file_type?.startsWith("image") ? (
                      <img src={f.file_url} alt={f.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs truncate">{f.file_name || f.title || "Untitled"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isAr ? "تحسين محركات البحث" : "SEO Overview"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {articles.filter((a: any) => a.status === "published").slice(0, 10).map((a: any) => {
                  const hasExcerpt = !!a.excerpt;
                  const hasImage = !!a.featured_image_url;
                  const titleLen = (a.title || "").length;
                  const score = (hasExcerpt ? 30 : 0) + (hasImage ? 30 : 0) + (titleLen > 20 && titleLen < 60 ? 40 : titleLen > 10 ? 20 : 0);

                  return (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold", score >= 80 ? "bg-green-100 text-green-700" : score >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700")}>
                        {score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <div className="flex gap-2 mt-1">
                          {!hasExcerpt && <Badge variant="outline" className="text-[10px] text-amber-600">{isAr ? "بدون وصف" : "No excerpt"}</Badge>}
                          {!hasImage && <Badge variant="outline" className="text-[10px] text-amber-600">{isAr ? "بدون صورة" : "No image"}</Badge>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-lg font-bold">{value.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
