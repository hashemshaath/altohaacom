import { useState, useMemo } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Plus, Pencil, Trash2, Eye, FileText, 
  Calendar, Clock, Star, Download, BarChart3, TrendingUp, ToggleLeft, ToggleRight,
  Timer, Sparkles,
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
  const [activeTab, setActiveTab] = useState<string>("all");
  const isAr = language === "ar";
  const t = (ar: string, en: string) => isAr ? ar : en;

  const [formData, setFormData] = useState({
    title: "", title_ar: "", slug: "", excerpt: "", excerpt_ar: "",
    content: "", content_ar: "", type: "news", status: "draft",
    featured_image_url: "", is_featured: false, published_at: "", category_id: "",
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-articles", search, statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, content, content_ar, type, status, featured_image_url, is_featured, published_at, view_count, created_at, updated_at, category_id")
        .order("created_at", { ascending: false });
      if (search) query = query.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%,slug.ilike.%${search}%`);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("articles").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      setViewMode("list");
      setEditingArticleId(null);
      toast({ title: t("تم التحديث", "Updated") });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t("فشل التحديث", "Update failed"), description: err instanceof Error ? err.message : String(err) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({ title: t("تم الحذف", "Deleted") });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", title_ar: "", slug: "", excerpt: "", excerpt_ar: "", content: "", content_ar: "", type: "news", status: "draft", featured_image_url: "", is_featured: false, published_at: "", category_id: "" });
  };

  const handleEdit = (article: any) => {
    setEditingArticleId(article.id);
    setFormData({
      title: article.title || "", title_ar: article.title_ar || "", slug: article.slug || "",
      excerpt: article.excerpt || "", excerpt_ar: article.excerpt_ar || "",
      content: article.content || "", content_ar: article.content_ar || "",
      type: article.type || "news", status: article.status || "draft",
      featured_image_url: article.featured_image_url || "", is_featured: article.is_featured || false,
      published_at: article.published_at || "", category_id: article.category_id || "",
    });
    setViewMode("edit");
  };

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

  const { exportCSV } = useCSVExport({
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

  // Filter articles by tab
  const tabFiltered = useMemo(() => {
    if (!articles) return [];
    if (activeTab === "all") return articles;
    if (activeTab === "published") return articles.filter(a => a.status === "published");
    if (activeTab === "draft") return articles.filter(a => a.status === "draft");
    if (activeTab === "featured") return articles.filter(a => a.is_featured);
    return articles;
  }, [articles, activeTab]);

  const { sorted: sortedArticles, sortColumn, sortDirection, toggleSort } = useTableSort(tabFiltered, "created_at", "desc");
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

  // Editor view
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <ArticleEditorPro
        articleId={editingArticleId}
        initialData={viewMode === "edit" ? formData : undefined}
        onBack={() => { setViewMode("list"); setEditingArticleId(null); resetForm(); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={FileText}
        title={t("إدارة المقالات والأخبار", "Articles & News")}
        description={t("إنشاء وتعديل ونشر المحتوى", "Create, edit and publish content")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(articles || [])} className="gap-1.5 rounded-xl text-xs">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button onClick={() => setViewMode("create")} className="rounded-xl gap-1.5">
              <Plus className="h-4 w-4" />
              {t("مقال جديد", "New Article")}
            </Button>
          </div>
        }
      />

      {/* Compact Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { icon: FileText, value: stats.total, label: t("إجمالي", "Total"), color: "text-primary", bg: "bg-primary/10" },
          { icon: TrendingUp, value: stats.published, label: t("منشور", "Published"), color: "text-chart-2", bg: "bg-chart-2/10" },
          { icon: Clock, value: stats.drafts, label: t("مسودات", "Drafts"), color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: BarChart3, value: stats.totalViews, label: t("مشاهدات", "Views"), color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Star, value: stats.featured, label: t("مميز", "Featured"), color: "text-chart-1", bg: "bg-chart-1/10" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-border/40">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <div>
                <AnimatedCounter value={stat.value} className="text-lg font-bold leading-none" />
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + Filters */}
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TabsList className="rounded-xl h-9">
              <TabsTrigger value="all" className="rounded-lg text-xs px-3">
                {t("الكل", "All")} <span className="ms-1 text-[9px] opacity-60">({stats.total})</span>
              </TabsTrigger>
              <TabsTrigger value="published" className="rounded-lg text-xs px-3">
                {t("منشور", "Published")} <span className="ms-1 text-[9px] opacity-60">({stats.published})</span>
              </TabsTrigger>
              <TabsTrigger value="draft" className="rounded-lg text-xs px-3">
                {t("مسودات", "Drafts")} <span className="ms-1 text-[9px] opacity-60">({stats.drafts})</span>
              </TabsTrigger>
              <TabsTrigger value="featured" className="rounded-lg text-xs px-3">
                <Sparkles className="h-3 w-3 me-1" />
                {t("مميز", "Featured")} <span className="ms-1 text-[9px] opacity-60">({stats.featured})</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <AdminFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("ابحث بالعنوان أو الرابط...", "Search by title or slug...")}
        >
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] rounded-xl h-9 text-xs">
              <SelectValue placeholder={t("النوع", "Type")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t("كل الأنواع", "All Types")}</SelectItem>
              <SelectItem value="news">{t("أخبار", "News")}</SelectItem>
              <SelectItem value="blog">{t("مدونة", "Blog")}</SelectItem>
              <SelectItem value="article">{t("مقال", "Article")}</SelectItem>
              <SelectItem value="exhibition">{t("معرض", "Exhibition")}</SelectItem>
            </SelectContent>
          </Select>
        </AdminFilterBar>
      </div>

      {/* Bulk Actions */}
      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onDelete={() => {
          if (confirm(t("حذف المقالات المحددة؟", "Delete selected articles?"))) {
            bulkDeleteMutation.mutate(bulk.selectedItems.map(i => i.id));
          }
        }}
        onStatusChange={(status) => bulkStatusMutation.mutate({ ids: bulk.selectedItems.map(i => i.id), status })}
        onExport={() => exportCSV(bulk.selectedItems)}
      />

      {/* Table */}
      <AdminTableCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 bg-muted/30">
                <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} aria-label={t("تحديد الكل", "Select all")} />
              </TableHead>
              <SortableTableHead column="title" label={t("العنوان", "Title")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30" />
              <SortableTableHead column="type" label={t("النوع", "Type")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30 hidden sm:table-cell" />
              <SortableTableHead column="status" label={t("الحالة", "Status")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30" />
              <SortableTableHead column="view_count" label={t("المشاهدات", "Views")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30 hidden md:table-cell" />
              <SortableTableHead column="created_at" label={t("التاريخ", "Date")} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} className="bg-muted/30 hidden lg:table-cell" />
              <TableHead className="w-[120px] bg-muted/30">{t("الإجراءات", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                  <TableCell><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-20 rounded" /></TableCell>
                </TableRow>
              ))
            ) : sortedArticles.length === 0 ? (
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
                      <Checkbox checked={bulk.isSelected(article.id)} onCheckedChange={() => bulk.toggleOne(article.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {article.featured_image_url ? (
                          <img src={article.featured_image_url} alt="" className="h-10 w-14 rounded-xl object-cover ring-1 ring-border/40 shrink-0" loading="lazy" />
                        ) : (
                          <div className="flex h-10 w-14 items-center justify-center rounded-xl bg-primary/5 shrink-0">
                            <FileText className="h-4 w-4 text-primary/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium line-clamp-1 text-sm">{isAr && article.title_ar ? article.title_ar : article.title}</p>
                            {article.is_featured && <Star className="h-3 w-3 text-chart-1 fill-chart-1 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary transition-colors truncate max-w-[180px]">
                              /{article.slug}
                            </a>
                            {isScheduled && (
                              <Badge variant="outline" className="text-[8px] gap-0.5 px-1 py-0 text-chart-4 border-chart-4/30">
                                <Timer className="h-2 w-2" />{t("مجدول", "Scheduled")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{getTypeBadge(article.type)}</TableCell>
                    <TableCell><AdminStatusBadge status={article.status || "draft"} /></TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-xs tabular-nums">{(article.view_count || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(article.created_at), "MMM d, yyyy")}
                        {article.published_at && article.status === "published" && (
                          <p className="text-[10px] text-chart-2">{t("نُشر", "Published")} {format(new Date(article.published_at), "MMM d")}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                              const newStatus = article.status === "published" ? "draft" : "published";
                              updateMutation.mutate({ id: article.id, data: { status: newStatus, ...(newStatus === "published" && !article.published_at ? { published_at: new Date().toISOString() } : {}) } });
                            }}>
                              {article.status === "published" ? <ToggleRight className="h-4 w-4 text-chart-2" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            {article.status === "published" ? t("إلغاء النشر", "Unpublish") : t("نشر الآن", "Publish")}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                              <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 text-muted-foreground" /></a>
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                              if (confirm(t("هل أنت متأكد من حذف هذا المقال؟", "Delete this article?"))) deleteMutation.mutate(article.id);
                            }}>
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
