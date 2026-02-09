import { useState, useEffect } from "react";
import { Search, BookOpen, HelpCircle, MessageSquare, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AIAssistant } from "@/components/knowledge/AIAssistant";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface FAQ {
  id: string;
  question: string;
  question_ar: string | null;
  answer: string;
  answer_ar: string | null;
  category: string;
  is_featured: boolean;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  title_ar: string | null;
  content: string;
  content_ar: string | null;
  category: string;
  tags: string[];
}

const helpCategories = [
  { id: "getting-started", icon: BookOpen, labelEn: "Getting Started", labelAr: "البدء" },
  { id: "competitions", icon: HelpCircle, labelEn: "Competitions", labelAr: "المسابقات" },
  { id: "judging", icon: MessageSquare, labelEn: "Judging", labelAr: "التحكيم" },
  { id: "organizing", icon: BookOpen, labelEn: "Organizing", labelAr: "التنظيم" },
];

export default function HelpCenter() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [faqsRes, articlesRes] = await Promise.all([
        supabase.from("faqs").select("*").order("sort_order"),
        supabase.from("knowledge_articles").select("*").eq("status", "published").order("created_at", { ascending: false }),
      ]);

      if (faqsRes.data) setFaqs(faqsRes.data);
      if (articlesRes.data) setArticles(articlesRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faq.question_ar && faq.question_ar.includes(searchQuery)) ||
      (faq.answer_ar && faq.answer_ar.includes(searchQuery));
    
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredFaqs = faqs.filter(f => f.is_featured);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl font-bold mb-4">
              {language === "ar" ? "مركز المساعدة" : "Help Center"}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {language === "ar" 
                ? "اعثر على إجابات لأسئلتك أو تحدث مع مساعدنا الذكي"
                : "Find answers to your questions or chat with our AI assistant"}
            </p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={language === "ar" ? "ابحث عن مساعدة..." : "Search for help..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Categories */}
              <div className="grid sm:grid-cols-2 gap-4">
                {helpCategories.map((cat) => (
                  <Card 
                    key={cat.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <cat.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {language === "ar" ? cat.labelAr : cat.labelEn}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {filteredFaqs.filter(f => f.category === cat.id).length} {language === "ar" ? "مقالات" : "articles"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Featured FAQs */}
              {featuredFaqs.length > 0 && activeCategory === "all" && !searchQuery && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      {language === "ar" ? "الأسئلة الشائعة" : "Featured Questions"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {featuredFaqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left">
                            {language === "ar" && faq.question_ar ? faq.question_ar : faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {language === "ar" && faq.answer_ar ? faq.answer_ar : faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* All FAQs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {language === "ar" ? "جميع الأسئلة" : "All Questions"}
                    </CardTitle>
                    {activeCategory !== "all" && (
                      <Button variant="ghost" size="sm" onClick={() => setActiveCategory("all")}>
                        {language === "ar" ? "عرض الكل" : "Show All"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : filteredFaqs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === "ar" ? "لا توجد نتائج" : "No results found"}
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFaqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center gap-2">
                              {language === "ar" && faq.question_ar ? faq.question_ar : faq.question}
                              <Badge variant="outline" className="ml-2">
                                {faq.category}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {language === "ar" && faq.answer_ar ? faq.answer_ar : faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              {/* Knowledge Articles */}
              {articles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {language === "ar" ? "مقالات المعرفة" : "Knowledge Articles"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {articles.slice(0, 5).map((article) => (
                        <Link
                          key={article.id}
                          to={`/help/article/${article.id}`}
                          className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <h4 className="font-medium mb-1">
                            {language === "ar" && article.title_ar ? article.title_ar : article.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {language === "ar" && article.content_ar 
                              ? article.content_ar.slice(0, 150) 
                              : article.content.slice(0, 150)}...
                          </p>
                          <div className="flex gap-2 mt-2">
                            {article.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* AI Assistant Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <AIAssistant />
                
                {/* Contact Card */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === "ar" ? "لم تجد إجابتك؟" : "Can't find your answer?"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/contact">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {language === "ar" ? "تواصل معنا" : "Contact Support"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
