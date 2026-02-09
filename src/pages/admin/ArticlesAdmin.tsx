import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Eye, 
  FileText,
  X,
  Save,
  ArrowLeft,
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
    });
    setViewMode("edit");
  };

  const handleSubmit = () => {
    if (viewMode === "edit" && editingArticleId) {
      updateMutation.mutate({ id: editingArticleId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

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
      news: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      article: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      exhibition: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return <Badge className={colors[type] || ""}>{type}</Badge>;
  };

  // Create/Edit Form View
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === "ar" ? "رجوع" : "Back"}
          </Button>
          <h1 className="font-serif text-2xl font-bold">
            {viewMode === "edit" 
              ? (language === "ar" ? "تعديل المقال" : "Edit Article")
              : (language === "ar" ? "مقال جديد" : "New Article")}
          </h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <Tabs defaultValue="en">
                <TabsList>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleBackToList}>
                  <X className="mr-2 h-4 w-4" />
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {language === "ar" ? "إدارة المقالات والأخبار" : "Articles & News Management"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إنشاء وتعديل المحتوى" : "Create and manage content"}
          </p>
        </div>
        <Button onClick={() => setViewMode("create")}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "ar" ? "مقال جديد" : "New Article"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={language === "ar" ? "بحث..." : "Search..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "الكل" : "All Status"}</SelectItem>
                <SelectItem value="draft">{language === "ar" ? "مسودة" : "Draft"}</SelectItem>
                <SelectItem value="published">{language === "ar" ? "منشور" : "Published"}</SelectItem>
                <SelectItem value="archived">{language === "ar" ? "مؤرشف" : "Archived"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "الكل" : "All Types"}</SelectItem>
                <SelectItem value="news">{language === "ar" ? "أخبار" : "News"}</SelectItem>
                <SelectItem value="article">{language === "ar" ? "مقال" : "Article"}</SelectItem>
                <SelectItem value="exhibition">{language === "ar" ? "معرض" : "Exhibition"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : articles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {language === "ar" ? "لا توجد مقالات" : "No articles found"}
                  </TableCell>
                </TableRow>
              ) : (
                articles?.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {article.featured_image_url ? (
                          <img 
                            src={article.featured_image_url} 
                            alt="" 
                            className="h-10 w-14 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-14 items-center justify-center rounded bg-muted">
                            <FileText className="h-4 w-4 text-muted-foreground" />
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
