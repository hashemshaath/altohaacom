import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Plus, Trash2, Edit, Link, FileText, Image, Scale, Upload,
  Folder, Star, Eye, EyeOff, Save, X, GalleryHorizontalEnd, Globe, Loader2
} from "lucide-react";

type ResourceType = "link" | "file" | "document" | "image" | "video" | "law" | "scraped_content";

export default function KnowledgeAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("resources");
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddReference, setShowAddReference] = useState(false);
  const [showAddRubric, setShowAddRubric] = useState(false);
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [showScrapeUrl, setShowScrapeUrl] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  // Form states
  const [resourceForm, setResourceForm] = useState({
    title: "", title_ar: "", description: "", description_ar: "",
    resource_type: "link" as ResourceType, url: "", tags: "",
    is_published: true, is_judge_resource: false, category_id: "",
    competition_id: "",
  });
  const [categoryForm, setCategoryForm] = useState({ name: "", name_ar: "", description: "", description_ar: "", icon: "folder" });
  const [referenceForm, setReferenceForm] = useState({
    title: "", title_ar: "", description: "", description_ar: "",
    image_url: "", rating: "good", competition_category: "",
    score_range_min: 0, score_range_max: 100, tags: "",
  });
  const [rubricForm, setRubricForm] = useState({
    name: "", name_ar: "", description: "", description_ar: "",
    competition_type: "", category_type: "", criteria: "[]",
  });

  // Queries
  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ["admin-knowledge-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_resources")
        .select("*, category:knowledge_categories(name, name_ar)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["knowledge-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: references } = useQuery({
    queryKey: ["admin-reference-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_gallery")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: rubrics } = useQuery({
    queryKey: ["admin-rubric-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judging_rubric_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: competitions } = useQuery({
    queryKey: ["competitions-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const addResourceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("knowledge_resources").insert({
        title: resourceForm.title,
        title_ar: resourceForm.title_ar || null,
        description: resourceForm.description || null,
        description_ar: resourceForm.description_ar || null,
        resource_type: resourceForm.resource_type,
        url: resourceForm.url || null,
        tags: resourceForm.tags ? resourceForm.tags.split(",").map(t => t.trim()) : [],
        is_published: resourceForm.is_published,
        is_judge_resource: resourceForm.is_judge_resource,
        category_id: resourceForm.category_id || null,
        competition_id: resourceForm.competition_id || null,
        added_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-knowledge-resources"] });
      setShowAddResource(false);
      setResourceForm({
        title: "", title_ar: "", description: "", description_ar: "",
        resource_type: "link", url: "", tags: "",
        is_published: true, is_judge_resource: false, category_id: "", competition_id: "",
      });
      toast({ title: language === "ar" ? "تمت الإضافة" : "Resource added" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("knowledge_categories").insert({
        name: categoryForm.name,
        name_ar: categoryForm.name_ar || null,
        description: categoryForm.description || null,
        description_ar: categoryForm.description_ar || null,
        icon: categoryForm.icon,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-categories"] });
      setShowAddCategory(false);
      setCategoryForm({ name: "", name_ar: "", description: "", description_ar: "", icon: "folder" });
      toast({ title: language === "ar" ? "تمت الإضافة" : "Category added" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const addReferenceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reference_gallery").insert({
        title: referenceForm.title,
        title_ar: referenceForm.title_ar || null,
        description: referenceForm.description || null,
        description_ar: referenceForm.description_ar || null,
        image_url: referenceForm.image_url,
        rating: referenceForm.rating,
        competition_category: referenceForm.competition_category || null,
        score_range_min: referenceForm.score_range_min,
        score_range_max: referenceForm.score_range_max,
        tags: referenceForm.tags ? referenceForm.tags.split(",").map(t => t.trim()) : [],
        added_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reference-gallery"] });
      setShowAddReference(false);
      setReferenceForm({
        title: "", title_ar: "", description: "", description_ar: "",
        image_url: "", rating: "good", competition_category: "",
        score_range_min: 0, score_range_max: 100, tags: "",
      });
      toast({ title: language === "ar" ? "تمت الإضافة" : "Reference added" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const addRubricMutation = useMutation({
    mutationFn: async () => {
      let parsedCriteria;
      try {
        parsedCriteria = JSON.parse(rubricForm.criteria);
      } catch {
        throw new Error("Invalid JSON for criteria");
      }
      const { error } = await supabase.from("judging_rubric_templates").insert({
        name: rubricForm.name,
        name_ar: rubricForm.name_ar || null,
        description: rubricForm.description || null,
        description_ar: rubricForm.description_ar || null,
        competition_type: rubricForm.competition_type || null,
        category_type: rubricForm.category_type || null,
        criteria: parsedCriteria,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rubric-templates"] });
      setShowAddRubric(false);
      setRubricForm({
        name: "", name_ar: "", description: "", description_ar: "",
        competition_type: "", category_type: "", criteria: "[]",
      });
      toast({ title: language === "ar" ? "تمت الإضافة" : "Rubric template added" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-knowledge-resources"] });
      toast({ title: language === "ar" ? "تم الحذف" : "Resource deleted" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("knowledge_resources").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-knowledge-resources"] }),
  });

  const handleScrapeUrl = async () => {
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firecrawl-scrape`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url: scrapeUrl, options: { formats: ["markdown"] } }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Scraping failed");
      }
      const markdown = data.data?.markdown || data.markdown || "";
      const title = data.data?.metadata?.title || data.metadata?.title || scrapeUrl;
      const { error } = await supabase.from("knowledge_resources").insert({
        title,
        description: (data.data?.metadata?.description || data.metadata?.description || "").slice(0, 500),
        resource_type: "scraped_content",
        url: scrapeUrl,
        scraped_content: markdown,
        is_published: true,
        is_judge_resource: true,
        added_by: user?.id,
        tags: ["scraped"],
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-knowledge-resources"] });
      setScrapeUrl("");
      setShowScrapeUrl(false);
      toast({ title: language === "ar" ? "تم استخراج المحتوى بنجاح" : "Content scraped successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Scrape failed", description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setIsScraping(false);
    }
  };

  const resourceTypeIcon = (type: string) => {
    switch (type) {
      case "link": return <Link className="h-4 w-4" />;
      case "file": case "document": return <FileText className="h-4 w-4" />;
      case "image": return <Image className="h-4 w-4" />;
      case "law": return <Scale className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const ratingColors: Record<string, string> = {
    excellent: "bg-chart-5/10 text-chart-5",
    good: "bg-primary/10 text-primary",
    average: "bg-chart-4/10 text-chart-4",
    poor: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">
            {language === "ar" ? "بوابة المعرفة" : "Knowledge Portal"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {language === "ar"
              ? "إدارة الموارد والمراجع ومعايير التحكيم"
              : "Manage resources, references, and judging standards"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="resources" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {language === "ar" ? "الموارد" : "Resources"}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Folder className="h-4 w-4" />
            {language === "ar" ? "التصنيفات" : "Categories"}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2">
            <GalleryHorizontalEnd className="h-4 w-4" />
            {language === "ar" ? "معرض المراجع" : "Reference Gallery"}
          </TabsTrigger>
          <TabsTrigger value="rubrics" className="gap-2">
            <Scale className="h-4 w-4" />
            {language === "ar" ? "قوالب التقييم" : "Rubric Templates"}
          </TabsTrigger>
        </TabsList>

        {/* RESOURCES TAB */}
        <TabsContent value="resources" className="space-y-4">
          {!showAddResource && !showScrapeUrl ? (
            <div className="flex gap-2">
              <Button onClick={() => setShowAddResource(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {language === "ar" ? "إضافة مورد" : "Add Resource"}
              </Button>
              <Button variant="outline" onClick={() => setShowScrapeUrl(true)}>
                <Globe className="mr-2 h-4 w-4" />
                {language === "ar" ? "استخراج من رابط" : "Scrape URL"}
              </Button>
            </div>
          ) : showScrapeUrl ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {language === "ar" ? "استخراج محتوى من رابط" : "Scrape Content from URL"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "أدخل رابطاً لاستخراج المحتوى تلقائياً وإضافته لقاعدة المعرفة"
                    : "Enter a URL to automatically extract content and add it to the knowledge base"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={scrapeUrl}
                    onChange={e => setScrapeUrl(e.target.value)}
                    placeholder="https://example.com/judging-rules"
                    disabled={isScraping}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setShowScrapeUrl(false); setScrapeUrl(""); }} disabled={isScraping}>
                    <X className="mr-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button onClick={handleScrapeUrl} disabled={!scrapeUrl.trim() || isScraping}>
                    {isScraping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                    {isScraping
                      ? (language === "ar" ? "جاري الاستخراج..." : "Scraping...")
                      : (language === "ar" ? "استخراج" : "Scrape")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === "ar" ? "إضافة مورد جديد" : "Add New Resource"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                    <Input value={resourceForm.title} onChange={e => setResourceForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                    <Input dir="rtl" value={resourceForm.title_ar} onChange={e => setResourceForm(f => ({ ...f, title_ar: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الوصف" : "Description"}</Label>
                    <Textarea value={resourceForm.description} onChange={e => setResourceForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                    <Textarea dir="rtl" value={resourceForm.description_ar} onChange={e => setResourceForm(f => ({ ...f, description_ar: e.target.value }))} rows={3} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "نوع المورد" : "Resource Type"}</Label>
                    <Select value={resourceForm.resource_type} onValueChange={v => setResourceForm(f => ({ ...f, resource_type: v as ResourceType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">{language === "ar" ? "رابط" : "Link"}</SelectItem>
                        <SelectItem value="file">{language === "ar" ? "ملف" : "File"}</SelectItem>
                        <SelectItem value="document">{language === "ar" ? "مستند" : "Document"}</SelectItem>
                        <SelectItem value="image">{language === "ar" ? "صورة" : "Image"}</SelectItem>
                        <SelectItem value="video">{language === "ar" ? "فيديو" : "Video"}</SelectItem>
                        <SelectItem value="law">{language === "ar" ? "قانون / لائحة" : "Law / Regulation"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "التصنيف" : "Category"}</Label>
                    <Select value={resourceForm.category_id} onValueChange={v => setResourceForm(f => ({ ...f, category_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر تصنيف" : "Select category"} /></SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {language === "ar" && c.name_ar ? c.name_ar : c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "المسابقة" : "Competition"}</Label>
                    <Select value={resourceForm.competition_id} onValueChange={v => setResourceForm(f => ({ ...f, competition_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={language === "ar" ? "عام" : "General"} /></SelectTrigger>
                      <SelectContent>
                        {competitions?.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {language === "ar" && c.title_ar ? c.title_ar : c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الرابط / URL" : "URL / Link"}</Label>
                  <Input value={resourceForm.url} onChange={e => setResourceForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الوسوم (مفصولة بفاصلة)" : "Tags (comma-separated)"}</Label>
                  <Input value={resourceForm.tags} onChange={e => setResourceForm(f => ({ ...f, tags: e.target.value }))} placeholder="judging, presentation, technique" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={resourceForm.is_published} onCheckedChange={v => setResourceForm(f => ({ ...f, is_published: v }))} />
                    <Label>{language === "ar" ? "منشور" : "Published"}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={resourceForm.is_judge_resource} onCheckedChange={v => setResourceForm(f => ({ ...f, is_judge_resource: v }))} />
                    <Label>{language === "ar" ? "مرجع للحكام" : "Judge Resource"}</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddResource(false)}>
                    <X className="mr-2 h-4 w-4" />
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button onClick={() => addResourceMutation.mutate()} disabled={!resourceForm.title || addResourceMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {language === "ar" ? "حفظ" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingResources ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
          ) : resources && resources.length > 0 ? (
            <div className="space-y-3">
              {resources.map(resource => (
                <Card key={resource.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        {resourceTypeIcon(resource.resource_type)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {language === "ar" && resource.title_ar ? resource.title_ar : resource.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{resource.resource_type}</Badge>
                          {resource.is_judge_resource && (
                            <Badge variant="secondary" className="text-xs">
                              {language === "ar" ? "للحكام" : "Judge"}
                            </Badge>
                          )}
                          {(resource as any).category && (
                            <Badge variant="outline" className="text-xs">
                              {language === "ar" && (resource as any).category.name_ar
                                ? (resource as any).category.name_ar
                                : (resource as any).category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePublishMutation.mutate({ id: resource.id, is_published: !resource.is_published })}
                        title={resource.is_published ? "Unpublish" : "Publish"}
                      >
                        {resource.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteResourceMutation.mutate(resource.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {language === "ar" ? "لم تتم إضافة أي موارد بعد" : "No resources added yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="space-y-4">
          {!showAddCategory ? (
            <Button onClick={() => setShowAddCategory(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "ar" ? "إضافة تصنيف" : "Add Category"}
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "ar" ? "إضافة تصنيف" : "Add Category"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (Arabic)</Label>
                    <Input dir="rtl" value={categoryForm.name_ar} onChange={e => setCategoryForm(f => ({ ...f, name_ar: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                    <X className="mr-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button onClick={() => addCategoryMutation.mutate()} disabled={!categoryForm.name}>
                    <Save className="mr-2 h-4 w-4" /> {language === "ar" ? "حفظ" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categories?.map(cat => (
              <Card key={cat.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{language === "ar" && cat.name_ar ? cat.name_ar : cat.name}</p>
                    {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* REFERENCE GALLERY TAB */}
        <TabsContent value="gallery" className="space-y-4">
          {!showAddReference ? (
            <Button onClick={() => setShowAddReference(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "ar" ? "إضافة مرجع" : "Add Reference"}
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "ar" ? "إضافة مرجع" : "Add Reference"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={referenceForm.title} onChange={e => setReferenceForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Title (Arabic)</Label>
                    <Input dir="rtl" value={referenceForm.title_ar} onChange={e => setReferenceForm(f => ({ ...f, title_ar: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={referenceForm.description} onChange={e => setReferenceForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Arabic)</Label>
                    <Textarea dir="rtl" value={referenceForm.description_ar} onChange={e => setReferenceForm(f => ({ ...f, description_ar: e.target.value }))} rows={2} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "رابط الصورة" : "Image URL"}</Label>
                  <Input value={referenceForm.image_url} onChange={e => setReferenceForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "التقييم" : "Rating"}</Label>
                    <Select value={referenceForm.rating} onValueChange={v => setReferenceForm(f => ({ ...f, rating: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">{language === "ar" ? "ممتاز" : "Excellent"}</SelectItem>
                        <SelectItem value="good">{language === "ar" ? "جيد" : "Good"}</SelectItem>
                        <SelectItem value="average">{language === "ar" ? "متوسط" : "Average"}</SelectItem>
                        <SelectItem value="poor">{language === "ar" ? "ضعيف" : "Poor"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الحد الأدنى" : "Min Score"}</Label>
                    <Input type="number" value={referenceForm.score_range_min} onChange={e => setReferenceForm(f => ({ ...f, score_range_min: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الحد الأقصى" : "Max Score"}</Label>
                    <Input type="number" value={referenceForm.score_range_max} onChange={e => setReferenceForm(f => ({ ...f, score_range_max: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "فئة المسابقة" : "Competition Category"}</Label>
                  <Input value={referenceForm.competition_category} onChange={e => setReferenceForm(f => ({ ...f, competition_category: e.target.value }))} placeholder="e.g. Decoration, Hot Kitchen" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddReference(false)}>
                    <X className="mr-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button onClick={() => addReferenceMutation.mutate()} disabled={!referenceForm.title || !referenceForm.image_url}>
                    <Save className="mr-2 h-4 w-4" /> {language === "ar" ? "حفظ" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {references?.map(ref => (
              <Card key={ref.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={ref.image_url}
                    alt={ref.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  <Badge className={`absolute top-2 ${language === "ar" ? "left-2" : "right-2"} ${ratingColors[ref.rating || "good"]}`}>
                    {ref.rating}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <p className="font-medium">{language === "ar" && ref.title_ar ? ref.title_ar : ref.title}</p>
                  {ref.competition_category && (
                    <Badge variant="outline" className="mt-1 text-xs">{ref.competition_category}</Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Score range: {ref.score_range_min} - {ref.score_range_max}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* RUBRIC TEMPLATES TAB */}
        <TabsContent value="rubrics" className="space-y-4">
          {!showAddRubric ? (
            <Button onClick={() => setShowAddRubric(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "ar" ? "إضافة قالب تقييم" : "Add Rubric Template"}
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "ar" ? "إضافة قالب تقييم" : "Add Rubric Template"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={rubricForm.name} onChange={e => setRubricForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (Arabic)</Label>
                    <Input dir="rtl" value={rubricForm.name_ar} onChange={e => setRubricForm(f => ({ ...f, name_ar: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "نوع المسابقة" : "Competition Type"}</Label>
                    <Input value={rubricForm.competition_type} onChange={e => setRubricForm(f => ({ ...f, competition_type: e.target.value }))} placeholder="e.g. Culinary, Pastry" />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "نوع الفئة" : "Category Type"}</Label>
                    <Input value={rubricForm.category_type} onChange={e => setRubricForm(f => ({ ...f, category_type: e.target.value }))} placeholder="e.g. Decoration, Hot Kitchen" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "المعايير (JSON)" : "Criteria (JSON)"}</Label>
                  <Textarea
                    value={rubricForm.criteria}
                    onChange={e => setRubricForm(f => ({ ...f, criteria: e.target.value }))}
                    rows={6}
                    placeholder='[{"name": "Presentation", "weight": 0.3, "max_score": 10, "description": "..."}]'
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddRubric(false)}>
                    <X className="mr-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button onClick={() => addRubricMutation.mutate()} disabled={!rubricForm.name}>
                    <Save className="mr-2 h-4 w-4" /> {language === "ar" ? "حفظ" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {rubrics?.map(rubric => (
              <Card key={rubric.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{language === "ar" && rubric.name_ar ? rubric.name_ar : rubric.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {rubric.competition_type && <Badge variant="outline" className="text-xs">{rubric.competition_type}</Badge>}
                      {rubric.category_type && <Badge variant="secondary" className="text-xs">{rubric.category_type}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
