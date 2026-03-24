import { useState, useMemo } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { ContentQuickNav } from "@/components/admin/ContentQuickNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContentStatsWidget } from "@/components/admin/ContentStatsWidget";
import { ContentQuickToolbar } from "@/components/admin/ContentQuickToolbar";
import { ContentInsightsWidget } from "@/components/admin/ContentInsightsWidget";
import { ContentPipelineWidget } from "@/components/admin/ContentPipelineWidget";
import { ContentLiveStatsWidget } from "@/components/admin/ContentLiveStatsWidget";
import { ContentPerformanceWidget } from "@/components/admin/ContentPerformanceWidget";
import { EditorialCalendarWidget, ArticlePerformanceWidget } from "@/components/admin/EditorialCalendarWidget";
import { ArticleEditorPro } from "@/components/articles/ArticleEditorPro";
import { AdminTableCard } from "@/components/admin/AdminTableCard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCSVExport } from "@/hooks/useCSVExport";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Plus, Pencil, Trash2, Eye, FileText, X, Save, ArrowLeft,
  Calendar, Clock, Star, Download, BarChart3, TrendingUp, ToggleLeft, ToggleRight,
  Timer, ExternalLink,
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
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;

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
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, content, content_ar, type, status, featured_image_url, is_featured, published_at, view_count, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%,slug.ilike.%${search}%`);
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
        title: t("تم الإنشاء", "Created"),
        description: t("تم إنشاء المقال بنجاح", "Article created successfully"),
      });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: t("فشل الإنشاء", "Creation failed"), description: err.message });
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
        title: t("تم التحديث", "Updated"),
        description: t("تم تحديث المقال بنجاح", "Article updated successfully"),
      });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: t("فشل التحديث", "Update failed"), description: err.message });
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
        title: t("تم الحذف", "Deleted"),
        description: t("تم حذف المقال", "Article deleted"),
      });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: t("فشل الحذف", "Delete failed"), description: err.message });
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

  const { sorted: sortedArticles, sortColumn, sortDirection, toggleSort } = useTableSort(articles || [], "created_at", "desc");
  const pagination = usePagination(sortedArticles, { defaultPageSize: 15 });
  const bulk = useAdminBulkActions(sortedArticles);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("articles").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      bulk.clearSelection();
      toast({ title: t("تم حذف المقالات", "Articles deleted") });
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
      toast({ title: t("تم تحديث الحالة", "Status updated") });
    },
  });

  const handleBackToList = () => {
    setViewMode("list");
    setEditingArticleId(null);
    resetForm();
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; label: string; labelAr: string }> = {
      news: { bg: "bg-primary/10 text-primary border-primary/20", label: "News", labelAr: "أخبار" },
      article: { bg: "bg-chart-3/10 text-chart-3 border-chart-3/20", label: "Article", labelAr: "مقال" },
      blog: { bg: "bg-chart-2/10 text-chart-2 border-chart-2/20", label: "Blog", labelAr: "مدونة" },
      exhibition: { bg: "bg-chart-5/10 text-chart-5 border-chart-5/20", label: "Exhibition", labelAr: "معرض" },
    };
    const c = config[type] || { bg: "", label: type, labelAr: type };
    return <Badge variant="outline" className={cn("text-[10px]", c.bg)}>{isAr ? c.labelAr : c.label}</Badge>;
  };

  // Create/Edit Form View — now uses professional editor
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <ArticleEditorPro
        articleId={editingArticleId}
        initialData={viewMode === "edit" ? formData : undefined}
        onBack={handleBackToList}
      />
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={FileText}
        title={t("إدارة المقالات والأخبار", "Articles & News Management")}
        description={t("إنشاء وتعديل المحتوى", "Create and manage content")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportArticlesCSV(articles || [])} className="gap-1.5 rounded-xl">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button onClick={() => setViewMode("create")} className="rounded-xl">
              <Plus className="me-2 h-4 w-4" />
              {t("مقال جديد", "New Article")}
            </Button>
          </div>
        }
      />

      <ContentQuickNav />

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

      {/* Editorial Calendar & Top Articles */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EditorialCalendarWidget />
        <ArticlePerformanceWidget />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { icon: FileText, value: stats.total, label: t("إجمالي", "Total"), color: "text-primary", bg: "bg-primary/10" },
          { icon: TrendingUp, value: stats.published, label: t("منشور", "Published"), color: "text-chart-2", bg: "bg-chart-2/10" },
          { icon: Clock, value: stats.drafts, label: t("مسودات", "Drafts"), color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: BarChart3, value: stats.totalViews, label: t("مشاهدات", "Views"), color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Star, value: stats.featured, label: t("مميز", "Featured"), color: "text-chart-1", bg: "bg-chart-1/10" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-border/40 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-4 text-center">
              <div className={cn("mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <AnimatedCounter value={stat.value} className="text-xl font-bold" />
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("ابحث بالعنوان أو الرابط...", "Search by title or slug...")}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] rounded-xl h-9 text-sm">
            <SelectValue placeholder={t("الحالة", "Status")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">{t("الكل", "All Status")}</SelectItem>
            <SelectItem value="draft">{t("مسودة", "Draft")}</SelectItem>
            <SelectItem value="published">{t("منشور", "Published")}</SelectItem>
            <SelectItem value="archived">{t("مؤرشف", "Archived")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] rounded-xl h-9 text-sm">
            <SelectValue placeholder={t("النوع", "Type")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">{t("الكل", "All Types")}</SelectItem>
            <SelectItem value="news">{t("أخبار", "News")}</SelectItem>
            <SelectItem value="blog">{t("مدونة", "Blog")}</SelectItem>
            <SelectItem value="article">{t("مقال", "Article")}</SelectItem>
            <SelectItem value="exhibition">{t("معرض", "Exhibition")}</SelectItem>
          </SelectContent>
        </Select>
      </AdminFilterBar>

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onDelete={() => {
          if (confirm(t("حذف المقالات المحددة؟", "Delete selected articles?"))) {
            bulkDeleteMutation.mutate(bulk.selectedItems.map(i => i.id));
          }
        }}
        onStatusChange={(status) => bulkStatusMutation.mutate({ ids: bulk.selectedItems.map(i => i.id), status })}
        onExport={() => exportArticlesCSV(bulk.selectedItems)}
      />

      {/* Articles Table */}
      <AdminTableCard>
          <Table>
            <TableHeader>
               <TableRow>
                <TableHead className="w-10 bg-muted/30">
                  <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} aria-label={t("تحديد الكل", "Select all")} />
                </TableHead>
                <SortableTableHead column="title" label={t("العنوان", "Title")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30" />
                <SortableTableHead column="type" label={t("النوع", "Type")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30" />
                <SortableTableHead column="status" label={t("الحالة", "Status")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30" />
                <SortableTableHead column="view_count" label={t("المشاهدات", "Views")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30" />
                <SortableTableHead column="created_at" label={t("التاريخ", "Date")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30" />
                <TableHead className="w-[140px] bg-muted/30">{t("الإجراءات", "Actions")}</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-7 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : articles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <AdminEmptyState
                      icon={FileText}
                      title="No articles found"
                      titleAr="لا توجد مقالات"
                      description="Create your first article to get started"
                      descriptionAr="أنشئ أول مقال للبدء"
                      actionLabel="New Article"
                      actionLabelAr="مقال جديد"
                      onAction={() => setViewMode("create")}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pagination.paginated.map((article) => {
                  const isScheduled = article.status === "published" && article.published_at && new Date(article.published_at) > new Date();
                  return (
                  <TableRow key={article.id} className={cn("hover:bg-accent/30 transition-colors group", bulk.isSelected(article.id) && "bg-primary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={bulk.isSelected(article.id)}
                        onCheckedChange={() => bulk.toggleOne(article.id)}
                        aria-label={`Select ${article.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {article.featured_image_url ? (
                          <img 
                            src={article.featured_image_url} 
                            alt={article.title}
                            className="h-10 w-14 rounded-xl object-cover ring-1 ring-border/40 group-hover:ring-primary/30 transition-all"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-10 w-14 items-center justify-center rounded-xl bg-primary/5">
                            <FileText className="h-4 w-4 text-primary/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium line-clamp-1">
                              {isAr && article.title_ar ? article.title_ar : article.title}
                            </p>
                            {article.is_featured && <Star className="h-3 w-3 text-chart-1 fill-chart-1 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`/news/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors truncate max-w-[200px]"
                              title={`/news/${article.slug}`}
                            >
                              /{article.slug}
                            </a>
                            {isScheduled && (
                              <Badge variant="outline" className="text-[8px] gap-0.5 px-1 py-0 text-chart-4 border-chart-4/30">
                                <Timer className="h-2 w-2" />
                                {t("مجدول", "Scheduled")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(article.type)}</TableCell>
                    <TableCell><AdminStatusBadge status={article.status || "draft"} /></TableCell>
                    <TableCell>
                      <span className="font-mono text-xs tabular-nums">{(article.view_count || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(article.created_at), "MMM d, yyyy")}
                        {article.published_at && article.status === "published" && (
                          <p className="text-[10px] text-chart-2">
                            {t("نُشر", "Published")} {format(new Date(article.published_at), "MMM d")}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        {/* Quick publish toggle */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const newStatus = article.status === "published" ? "draft" : "published";
                                updateMutation.mutate({
                                  id: article.id,
                                  data: {
                                    status: newStatus,
                                    ...(newStatus === "published" && !article.published_at ? { published_at: new Date().toISOString() } : {}),
                                  } as any,
                                });
                              }}
                            >
                              {article.status === "published" ? (
                                <ToggleRight className="h-4 w-4 text-chart-2" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            {article.status === "published" ? t("إلغاء النشر", "Unpublish") : t("نشر الآن", "Publish now")}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                              <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">{t("معاينة", "Preview")}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(article)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">{t("تعديل", "Edit")}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                if (confirm(t("هل أنت متأكد من حذف هذا المقال؟", "Are you sure you want to delete this article?"))) {
                                  deleteMutation.mutate(article.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">{t("حذف", "Delete")}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <AdminTablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            pageSize={pagination.pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onPageChange={pagination.goTo}
            onPageSizeChange={pagination.changePageSize}
          />
      </AdminTableCard>
    </div>
  );
}
