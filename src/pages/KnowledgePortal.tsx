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
    staleTime: 1000 * 60 * 3,
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
    staleTime: 1000 * 60 * 10,
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
    staleTime: 1000 * 60 * 10,
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
    staleTime: 1000 * 60 * 5,
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      {/* Compact Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
        <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container relative py-10 md:py-14">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {language === "ar" ? "مركز المعرفة" : "Knowledge Hub"}
                </span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                {language === "ar" ? "بوابة المعرفة" : "Knowledge Portal"}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                {language === "ar"
                  ? "الموارد والمراجع ومعايير التحكيم والمساعد الذكي"
                  : "Resources, references, judging standards, and AI assistant"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-8 md:py-12">

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="resources">
              {/* Premium sticky tab bar */}
              <div className="sticky top-12 z-30 -mx-4 mb-6 border-y border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md md:rounded-2xl md:border md:mx-0 md:px-6 shadow-sm">
                <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 no-scrollbar">
                  <TabsTrigger value="resources" className="gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20">
                    <BookOpen className="h-4 w-4" />
                    {language === "ar" ? "الموارد" : "Resources"}
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20">
                    <GalleryHorizontalEnd className="h-4 w-4" />
                    {language === "ar" ? "معرض المراجع" : "Reference Gallery"}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="resources" className="space-y-4">
                {/* Premium Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl"
                      placeholder={language === "ar" ? "بحث في الموارد..." : "Search resources..."}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-48 focus:ring-primary/20">
                      <SelectValue placeholder={language === "ar" ? "التصنيف" : "Category"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      <SelectItem value="all" className="rounded-xl">{language === "ar" ? "الكل" : "All"}</SelectItem>
                      {categories?.map(c => (
                        <SelectItem key={c.id} value={c.id} className="rounded-xl">
                          {language === "ar" && c.name_ar ? c.name_ar : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-40 focus:ring-primary/20">
                      <SelectValue placeholder={language === "ar" ? "النوع" : "Type"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      <SelectItem value="all" className="rounded-xl">{language === "ar" ? "الكل" : "All"}</SelectItem>
                      <SelectItem value="link" className="rounded-xl">{language === "ar" ? "رابط" : "Link"}</SelectItem>
                      <SelectItem value="file" className="rounded-xl">{language === "ar" ? "ملف" : "File"}</SelectItem>
                      <SelectItem value="document" className="rounded-xl">{language === "ar" ? "مستند" : "Document"}</SelectItem>
                      <SelectItem value="image" className="rounded-xl">{language === "ar" ? "صورة" : "Image"}</SelectItem>
                      <SelectItem value="law" className="rounded-xl">{language === "ar" ? "قانون" : "Law"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
                ) : filteredResources && filteredResources.length > 0 ? (
                  <div className="space-y-3">
                    {filteredResources.map(resource => (
                      <Card key={resource.id} className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-500">
                        <CardContent className="flex items-start gap-4 p-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10">
                            {resourceTypeIcon(resource.resource_type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-sm">
                                {language === "ar" && resource.title_ar ? resource.title_ar : resource.title}
                              </h3>
                              {resource.url && (
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition-colors">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            {resource.description && (
                              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                                {language === "ar" && resource.description_ar ? resource.description_ar : resource.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              <Badge variant="outline" className="text-[10px] rounded-xl">{resource.resource_type}</Badge>
                              {resource.is_judge_resource && (
                                <Badge variant="secondary" className="text-[10px] rounded-xl">
                                  <Scale className="me-1 h-3 w-3" />
                                  {language === "ar" ? "للحكام" : "Judge Resource"}
                                </Badge>
                              )}
                              {resource.tags?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] rounded-xl">{tag}</Badge>
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
                          <Badge className={`absolute top-2 end-2 ${ratingColors[ref.rating || "good"]}`}>
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
