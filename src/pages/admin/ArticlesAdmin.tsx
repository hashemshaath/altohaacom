import { useState, useMemo } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContentStatsWidget } from "@/components/admin/ContentStatsWidget";
import { ContentQuickToolbar } from "@/components/admin/ContentQuickToolbar";
import { ContentInsightsWidget } from "@/components/admin/ContentInsightsWidget";
import { ContentPipelineWidget } from "@/components/admin/ContentPipelineWidget";
import { ContentLiveStatsWidget } from "@/components/admin/ContentLiveStatsWidget";
import { ContentPerformanceWidget } from "@/components/admin/ContentPerformanceWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCSVExport } from "@/hooks/useCSVExport";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Plus, Search, Pencil, Trash2, Eye, FileText, X, Save, ArrowLeft,
  Calendar, Clock, Star, Download, BarChart3, TrendingUp,
} from "lucide-react";

type ViewMode = "list" | "create" | "edit";

export default function ArticlesAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    title_ar: "",
    slug: "",
    excerpt: "",
    excerpt_ar: "",
    content: "",
    content_ar: "",
    type: "news",
    status: "draft",
    featured_image_url: "",
    is_featured: false,
    published_at: "",
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-articles", search, statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("articles").insert([{
        ...data,
        slug: data.slug || data.title.toLowerCase().replace(/\s+/g, "-"),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      setViewMode("list");
      resetForm();
      toast({
        title: language === "ar" ? "تم الإنشاء" : "Created",
        description: language === "ar" ? "تم إنشاء المقال بنجاح" : "Article created successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase.from("articles").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      setViewMode("list");
      setEditingArticleId(null);
      resetForm();
      toast({
        title: language === "ar" ? "تم التحديث" : "Updated",
        description: language === "ar" ? "تم تحديث المقال بنجاح" : "Article updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({
        title: language === "ar" ? "تم الحذف" : "Deleted",
        description: language === "ar" ? "تم حذف المقال" : "Article deleted",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      title_ar: "",
      slug: "",
      excerpt: "",
      excerpt_ar: "",
      content: "",
      content_ar: "",
      type: "news",
      status: "draft",
      featured_image_url: "",
      is_featured: false,
      published_at: "",
    });
  };

  const handleEdit = (article: any) => {
    setEditingArticleId(article.id);
    setFormData({
      title: article.title || "",
      title_ar: article.title_ar || "",
      slug: article.slug || "",
      excerpt: article.excerpt || "",
      excerpt_ar: article.excerpt_ar || "",
      content: article.content || "",
      content_ar: article.content_ar || "",
      type: article.type || "news",
      status: article.status || "draft",
      featured_image_url: article.featured_image_url || "",
      is_featured: article.is_featured || false,
      published_at: article.published_at || "",
    });
    setViewMode("edit");
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      published_at: formData.published_at || (formData.status === "published" ? new Date().toISOString() : null),
    };
    if (viewMode === "edit" && editingArticleId) {
      updateMutation.mutate({ id: editingArticleId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // Stats
  const stats = useMemo(() => {
    if (!articles) return { total: 0, published: 0, drafts: 0, totalViews: 0, featured: 0 };
    return {
      total: articles.length,
      published: articles.filter(a => a.status === "published").length,
      drafts: articles.filter(a => a.status === "draft").length,
      totalViews: articles.reduce((sum, a) => sum + (a.view_count || 0), 0),
      featured: articles.filter(a => a.is_featured).length,
    };
  }, [articles]);

  const { exportCSV: exportArticlesCSV } = useCSVExport({
    columns: [
      { header: "Title", accessor: (a: any) => a.title },
      { header: "Type", accessor: (a: any) => a.type },
      { header: "Status", accessor: (a: any) => a.status },
      { header: "Views", accessor: (a: any) => a.view_count || 0 },
      { header: "Featured", accessor: (a: any) => a.is_featured ? "Yes" : "No" },
      { header: "Published", accessor: (a: any) => a.published_at ? format(new Date(a.published_at), "yyyy-MM-dd") : "" },
      { header: "Created", accessor: (a: any) => format(new Date(a.created_at), "yyyy-MM-dd") },
    ],
    filename: "articles",
  });

  const bulk = useAdminBulkActions(articles || []);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("articles").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      bulk.clearSelection();
      toast({ title: language === "ar" ? "تم حذف المقالات" : "Articles deleted" });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from("articles").update({ status }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      bulk.clearSelection();
      toast({ title: language === "ar" ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const handleBackToList = () => {
    setViewMode("list");
    setEditingArticleId(null);
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      published: "default",
      draft: "secondary",
      archived: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      news: "bg-primary/10 text-primary",
      article: "bg-chart-3/10 text-chart-3",
      exhibition: "bg-chart-5/10 text-chart-5",
    };
    return <Badge variant="outline" className={colors[type] || ""}>{type}</Badge>;
  };

  // Create/Edit Form View
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {language === "ar" ? "رجوع" : "Back"}
          </Button>
          <h1 className="font-serif text-2xl font-bold">
            {viewMode === "edit" 
              ? (language === "ar" ? "تعديل المقال" : "Edit Article")
              : (language === "ar" ? "مقال جديد" : "New Article")}
          </h1>
        </div>

        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <Tabs defaultValue="en">
                <TabsList className="rounded-xl">
                  <TabsTrigger value="en" className="rounded-xl">English</TabsTrigger>
                  <TabsTrigger value="ar" className="rounded-xl">العربية</TabsTrigger>
                </TabsList>
                <TabsContent value="en" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter article title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Excerpt</Label>
                    <Textarea
                      rows={3}
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief summary of the article"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      rows={12}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Full article content"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="ar" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      dir="rtl"
                      value={formData.title_ar}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      placeholder="أدخل عنوان المقال"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المقتطف</Label>
                    <Textarea
                      dir="rtl"
                      rows={3}
                      value={formData.excerpt_ar}
                      onChange={(e) => setFormData({ ...formData, excerpt_ar: e.target.value })}
                      placeholder="ملخص موجز للمقال"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المحتوى</Label>
                    <Textarea
                      dir="rtl"
                      rows={12}
                      value={formData.content_ar}
                      onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                      placeholder="محتوى المقال الكامل"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-if-empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Featured Image URL</Label>
                  <Input
                    value={formData.featured_image_url}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="exhibition">Exhibition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scheduling & Featured */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {language === "ar" ? "جدولة النشر" : "Schedule Publication"}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formData.published_at ? formData.published_at.slice(0, 16) : ""}
                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {language === "ar" ? "اتركه فارغاً للنشر الفوري" : "Leave empty for immediate publishing"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    {language === "ar" ? "مقال مميز" : "Featured Article"}
                  </Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.is_featured
                        ? (language === "ar" ? "مميز - يظهر في الواجهة" : "Featured - shown on homepage")
                        : (language === "ar" ? "عادي" : "Regular")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleBackToList}>
                  <X className="me-2 h-4 w-4" />
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  <Save className="me-2 h-4 w-4" />
                  {viewMode === "edit" 
                    ? (language === "ar" ? "تحديث" : "Update")
                    : (language === "ar" ? "إنشاء" : "Create")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={FileText}
        title={language === "ar" ? "إدارة المقالات والأخبار" : "Articles & News Management"}
        description={language === "ar" ? "إنشاء وتعديل المحتوى" : "Create and manage content"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportArticlesCSV(articles || [])} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button onClick={() => setViewMode("create")}>
              <Plus className="me-2 h-4 w-4" />
              {language === "ar" ? "مقال جديد" : "New Article"}
            </Button>
          </div>
        }
      />

      {/* Quick Metrics */}
      <ContentQuickToolbar />

      {/* Content Analytics Widget */}
      <ContentPerformanceWidget />
      <ContentLiveStatsWidget />
      <ContentStatsWidget />

      {/* Content Insights */}
      <ContentInsightsWidget />

      {/* Content Pipeline */}
      <ContentPipelineWidget />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { icon: FileText, value: stats.total, label: language === "ar" ? "إجمالي" : "Total", color: "text-primary", bg: "bg-primary/10" },
          { icon: TrendingUp, value: stats.published, label: language === "ar" ? "منشور" : "Published", color: "text-chart-2", bg: "bg-chart-2/10" },
          { icon: Clock, value: stats.drafts, label: language === "ar" ? "مسودات" : "Drafts", color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: BarChart3, value: stats.totalViews.toLocaleString(), label: language === "ar" ? "مشاهدات" : "Views", color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Star, value: stats.featured, label: language === "ar" ? "مميز" : "Featured", color: "text-chart-1", bg: "bg-chart-1/10" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-border/40 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-4 text-center">
              <div className={cn("mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <AnimatedCounter value={typeof stat.value === "number" ? stat.value : Number(stat.value) || 0} className="text-xl font-bold" />
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={language === "ar" ? "بحث..." : "Search..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-9 rounded-xl"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{language === "ar" ? "الكل" : "All Status"}</SelectItem>
                <SelectItem value="draft">{language === "ar" ? "مسودة" : "Draft"}</SelectItem>
                <SelectItem value="published">{language === "ar" ? "منشور" : "Published"}</SelectItem>
                <SelectItem value="archived">{language === "ar" ? "مؤرشف" : "Archived"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{language === "ar" ? "الكل" : "All Types"}</SelectItem>
                <SelectItem value="news">{language === "ar" ? "أخبار" : "News"}</SelectItem>
                <SelectItem value="article">{language === "ar" ? "مقال" : "Article"}</SelectItem>
                <SelectItem value="exhibition">{language === "ar" ? "معرض" : "Exhibition"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onDelete={() => {
          if (confirm(language === "ar" ? "حذف المقالات المحددة؟" : "Delete selected articles?")) {
            bulkDeleteMutation.mutate(bulk.selectedItems.map(i => i.id));
          }
        }}
        onStatusChange={(status) => bulkStatusMutation.mutate({ ids: bulk.selectedItems.map(i => i.id), status })}
        onExport={() => exportArticlesCSV(bulk.selectedItems)}
      />

      {/* Articles Table */}
      <Card className="rounded-2xl border-border/40 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={bulk.isAllSelected}
                    onCheckedChange={bulk.toggleAll}
                  />
                </TableHead>
                <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead>{language === "ar" ? "المشاهدات" : "Views"}</TableHead>
                <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="w-[120px]">{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                    <TableCell><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-7 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : articles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {language === "ar" ? "لا توجد مقالات" : "No articles found"}
                  </TableCell>
                </TableRow>
              ) : (
                articles?.map((article) => (
                  <TableRow key={article.id} className={cn("hover:bg-accent/30 transition-colors group", bulk.isSelected(article.id) && "bg-primary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={bulk.isSelected(article.id)}
                        onCheckedChange={() => bulk.toggleOne(article.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {article.featured_image_url ? (
                          <img 
                            src={article.featured_image_url} 
                            alt="" 
                            className="h-10 w-14 rounded-xl object-cover ring-1 ring-border/40 group-hover:ring-primary/30 transition-all"
                          />
                        ) : (
                          <div className="flex h-10 w-14 items-center justify-center rounded-xl bg-primary/5">
                            <FileText className="h-4 w-4 text-primary/40" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium line-clamp-1">
                            {language === "ar" && article.title_ar ? article.title_ar : article.title}
                          </p>
                          <p className="text-xs text-muted-foreground">/{article.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(article.type)}</TableCell>
                    <TableCell>{getStatusBadge(article.status || "draft")}</TableCell>
                    <TableCell>{article.view_count || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(article.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(article)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(language === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
                              deleteMutation.mutate(article.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
