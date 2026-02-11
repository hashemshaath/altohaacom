import { useState, useEffect } from "react";
import { Search, BookOpen, HelpCircle, MessageSquare, ChevronRight, Ticket, Headphones } from "lucide-react";
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
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background py-16">
          <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
          <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="container relative text-center">
            <div className="flex justify-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/15 shadow-sm">
                <HelpCircle className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h1 className="font-serif text-3xl font-bold mb-4 md:text-4xl">
              {language === "ar" ? "مركز المساعدة" : "Help Center"}
            </h1>
            <p className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto">
              {language === "ar" 
                ? "اعثر على إجابات لأسئلتك أو تحدث مع مساعدنا الذكي"
                : "Find answers to your questions or chat with our AI assistant"}
            </p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={language === "ar" ? "ابحث عن مساعدة..." : "Search for help..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 h-12 text-lg"
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
                    className="cursor-pointer hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
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
                      <ChevronRight className="h-5 w-5 text-muted-foreground ms-auto" />
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
                          className="block p-4 rounded-xl border hover:bg-muted/30 hover:border-primary/20 hover:shadow-sm transition-all duration-200"
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
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                      <Link to="/support">
                        <Ticket className="h-4 w-4" />
                        {language === "ar" ? "إرسال تذكرة دعم" : "Submit a Support Ticket"}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                      <Link to="/messages">
                        <MessageSquare className="h-4 w-4" />
                        {language === "ar" ? "المراسلة المباشرة" : "Direct Messages"}
                      </Link>
                    </Button>
                    <div className="rounded-lg bg-primary/5 p-3 text-center">
                      <Headphones className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">
                        {language === "ar" 
                          ? "أو استخدم زر الدعم المباشر أسفل الشاشة" 
                          : "Or use the Live Chat button at the bottom of the screen"}
                      </p>
                    </div>
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
