import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { JudgeAIAssistant } from "@/components/knowledge/JudgeAIAssistant";
import {
  BookOpen, Link, FileText, Image, Scale, Search, Folder,
  GalleryHorizontalEnd, ExternalLink, Star
} from "lucide-react";

export default function KnowledgePortal() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCompetition, setSelectedCompetition] = useState("all");

  const { data: resources, isLoading } = useQuery({
    queryKey: ["knowledge-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_resources")
        .select("*, category:knowledge_categories(name, name_ar)")
        .eq("is_published", true)
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
    queryKey: ["reference-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_gallery")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: competitions } = useQuery({
    queryKey: ["competitions-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar")
        .neq("status", "draft")
        .order("competition_start", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredResources = resources?.filter(r => {
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || r.category_id === selectedCategory;
    const matchesType = selectedType === "all" || r.resource_type === selectedType;
    const matchesCompetition = selectedCompetition === "all" || r.competition_id === selectedCompetition;
    return matchesSearch && matchesCategory && matchesType && matchesCompetition;
  });

  const resourceTypeIcon = (type: string) => {
    switch (type) {
      case "link": return <Link className="h-4 w-4" />;
      case "file": case "document": return <FileText className="h-4 w-4" />;
      case "image": return <Image className="h-4 w-4" />;
      case "law": return <Scale className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const ratingLabels: Record<string, string> = {
    excellent: language === "ar" ? "ممتاز" : "Excellent",
    good: language === "ar" ? "جيد" : "Good",
    average: language === "ar" ? "متوسط" : "Average",
    poor: language === "ar" ? "ضعيف" : "Poor",
  };

  const ratingColors: Record<string, string> = {
    excellent: "bg-chart-3/10 text-chart-3",
    good: "bg-primary/10 text-primary",
    average: "bg-chart-4/10 text-chart-4",
    poor: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8 md:py-12">
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">
              {language === "ar" ? "بوابة المعرفة" : "Knowledge Portal"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === "ar"
              ? "الموارد والمراجع ومعايير التحكيم والمساعد الذكي"
              : "Resources, references, judging standards, and AI assistant"}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="resources">
              <TabsList className="mb-4">
                <TabsTrigger value="resources" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  {language === "ar" ? "الموارد" : "Resources"}
                </TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2">
                  <GalleryHorizontalEnd className="h-4 w-4" />
                  {language === "ar" ? "معرض المراجع" : "Reference Gallery"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="resources" className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder={language === "ar" ? "بحث في الموارد..." : "Search resources..."}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder={language === "ar" ? "التصنيف" : "Category"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                      {categories?.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {language === "ar" && c.name_ar ? c.name_ar : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={language === "ar" ? "النوع" : "Type"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                      <SelectItem value="link">{language === "ar" ? "رابط" : "Link"}</SelectItem>
                      <SelectItem value="file">{language === "ar" ? "ملف" : "File"}</SelectItem>
                      <SelectItem value="document">{language === "ar" ? "مستند" : "Document"}</SelectItem>
                      <SelectItem value="image">{language === "ar" ? "صورة" : "Image"}</SelectItem>
                      <SelectItem value="law">{language === "ar" ? "قانون" : "Law"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
                ) : filteredResources && filteredResources.length > 0 ? (
                  <div className="space-y-3">
                    {filteredResources.map(resource => (
                      <Card key={resource.id} className="hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <CardContent className="flex items-start gap-4 p-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            {resourceTypeIcon(resource.resource_type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium">
                                {language === "ar" && resource.title_ar ? resource.title_ar : resource.title}
                              </h3>
                              {resource.url && (
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:text-primary/80">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                            {resource.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {language === "ar" && resource.description_ar ? resource.description_ar : resource.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{resource.resource_type}</Badge>
                              {resource.is_judge_resource && (
                                <Badge variant="secondary" className="text-xs">
                                  <Scale className="mr-1 h-3 w-3" />
                                  {language === "ar" ? "للحكام" : "Judge Resource"}
                                </Badge>
                              )}
                              {resource.tags?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
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
                        {language === "ar" ? "لا توجد موارد مطابقة" : "No resources found"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="gallery" className="space-y-4">
                {references && references.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {references.map(ref => (
                      <Card key={ref.id} className="group overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={ref.image_url}
                            alt={ref.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                          />
                          <Badge className={`absolute top-2 ${language === "ar" ? "left-2" : "right-2"} ${ratingColors[ref.rating || "good"]}`}>
                            {ratingLabels[ref.rating || "good"]}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium">{language === "ar" && ref.title_ar ? ref.title_ar : ref.title}</h3>
                          {ref.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {language === "ar" && ref.description_ar ? ref.description_ar : ref.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {ref.competition_category && (
                              <Badge variant="outline" className="text-xs">{ref.competition_category}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {language === "ar" ? "نطاق الدرجات:" : "Score:"} {ref.score_range_min}-{ref.score_range_max}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <GalleryHorizontalEnd className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        {language === "ar" ? "لا توجد مراجع بعد" : "No references yet"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Assistant sidebar */}
          <div className="lg:col-span-1">
            <JudgeAIAssistant />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
