import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEOHead } from "@/components/SEOHead";
import { RelatedPages } from "@/components/seo/RelatedPages";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Briefcase, Search, MapPin, Building2, Clock, Users, ChefHat, DollarSign,
  Utensils, Coffee, Cake, Soup, Salad, Award, GraduationCap,
  ArrowRight, Sparkles, Eye, Star, TrendingUp,
  CheckCircle2, XCircle, Zap, Shield, MessageSquare, Crown, Timer,
  Play, Target, Rocket, Globe, Heart
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import heroImage from "@/assets/jobs-hero.jpg";
import employerImage from "@/assets/jobs-employer.jpg";
import chefImage from "@/assets/jobs-chef.jpg";

const JOB_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  full_time: { en: "Full-time", ar: "دوام كامل" },
  part_time: { en: "Part-time", ar: "دوام جزئي" },
  freelance: { en: "Freelance", ar: "عمل حر" },
  contract: { en: "Contract", ar: "عقد مؤقت" },
  consulting: { en: "Consulting", ar: "استشارات" },
};

const EXP_LEVELS: Record<string, { en: string; ar: string }> = {
  beginner: { en: "Entry Level", ar: "مبتدئ" },
  intermediate: { en: "Mid Level", ar: "متوسط" },
  advanced: { en: "Senior", ar: "متقدم" },
  expert: { en: "Expert", ar: "خبير" },
};

const CULINARY_CATEGORIES = [
  { key: "chef", icon: ChefHat, en: "Head Chef", ar: "رئيس طهاة" },
  { key: "pastry", icon: Cake, en: "Pastry & Bakery", ar: "حلويات ومخابز" },
  { key: "restaurant", icon: Utensils, en: "Restaurants", ar: "مطاعم" },
  { key: "cafe", icon: Coffee, en: "Cafés & Coffee", ar: "مقاهي وقهوة" },
  { key: "catering", icon: Soup, en: "Catering", ar: "تموين وضيافة" },
  { key: "nutrition", icon: Salad, en: "Nutrition", ar: "تغذية" },
  { key: "consulting", icon: Award, en: "Consulting", ar: "استشارات" },
  { key: "training", icon: GraduationCap, en: "Training", ar: "تدريب" },
];

export default function Jobs() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["jobs-stats"],
    queryFn: async () => {
      const [{ count: jobCount }, { count: chefCount }, { count: companyCount }] = await Promise.all([
        supabase.from("job_postings").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_open_to_work", true).eq("job_availability_visibility", "public").eq("is_chef_visible", true),
        supabase.from("job_postings").select("company_id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      return { jobs: jobCount || 0, chefs: chefCount || 0, companies: companyCount || 0 };
    },
    staleTime: 60000,
  });

  // Featured jobs for showcase
  const { data: featuredJobs = [] } = useQuery({
    queryKey: ["featured-jobs-landing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_postings")
        .select("id, title, title_ar, job_type, location, location_ar, salary_min, salary_max, salary_currency, is_salary_visible, is_featured, created_at, companies(name, name_ar, logo_url)")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    staleTime: 60000,
  });

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/jobs/search${heroSearch.trim() ? `?q=${encodeURIComponent(heroSearch.trim())}` : ""}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={isAr ? "وظائف الطهي والضيافة" : "Culinary & Hospitality Jobs"}
        description={isAr ? "ابحث عن أفضل الفرص الوظيفية في قطاع الطهي والضيافة حول العالم" : "Find top culinary and hospitality career opportunities worldwide on Altoha"}
        keywords={isAr ? "وظائف طهي, وظائف مطاعم, وظائف فنادق, وظائف ضيافة, توظيف شيف" : "culinary jobs, restaurant jobs, hotel jobs, hospitality careers, chef recruitment"}
      />
      <Header />
      <main className="flex-1">

        {/* ═══════ CINEMATIC HERO ═══════ */}
        <section className="relative min-h-[520px] md:min-h-[600px] flex items-center overflow-hidden">
          {/* Background image */}
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {/* Triple gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-foreground/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />

          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-20 md:py-28">
            <div className="max-w-2xl space-y-6">
              <Badge className="bg-primary/90 text-primary-foreground border-0 gap-1.5 text-xs px-4 py-1.5 rounded-full shadow-lg">
                <Sparkles className="h-3 w-3" />
                {isAr ? "المنصة الأولى للتوظيف في الطهي" : "#1 Culinary Recruitment Platform"}
              </Badge>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-card-foreground leading-[1.1] tracking-tight drop-shadow-lg"
                  style={{ color: "white" }}>
                {isAr ? (
                  <>ابحث عن وظيفتك المثالية<br />في عالم <span className="text-primary">الطهي والضيافة</span></>
                ) : (
                  <>Find Your Dream Role<br />in <span className="text-primary">Culinary & Hospitality</span></>
                )}
              </h1>

              <p className="text-base md:text-lg max-w-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                {isAr
                  ? "آلاف الفرص الوظيفية من أفضل الفنادق والمطاعم والمقاهي في المنطقة. قدّم طلبك بضغطة واحدة."
                  : "Thousands of career opportunities from top hotels, restaurants, and cafés across the region. Apply with one click."}
              </p>

              {/* Hero Search */}
              <form onSubmit={handleHeroSearch} className="flex gap-2.5 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/50" />
                  <Input
                    className="ps-11 h-13 rounded-2xl border-0 bg-card/95 backdrop-blur-md shadow-xl text-sm placeholder:text-muted-foreground/50"
                    placeholder={isAr ? "ابحث عن وظيفة، شركة، أو تخصص..." : "Search jobs, companies, or specializations..."}
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="rounded-2xl h-13 px-7 shadow-xl shadow-primary/30 font-bold text-sm">
                  {isAr ? "ابحث" : "Search"}
                </Button>
              </form>

              {/* Quick links */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { en: "Full-time", ar: "دوام كامل", filter: "full_time" },
                  { en: "Part-time", ar: "دوام جزئي", filter: "part_time" },
                  { en: "Head Chef", ar: "رئيس طهاة", filter: "chef" },
                  { en: "Pastry", ar: "حلويات", filter: "pastry" },
                ].map((q) => (
                  <Link key={q.filter} to={`/jobs/search?category=${q.filter}`}>
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs cursor-pointer border-border/30 hover:bg-card/20 transition-colors" style={{ color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.25)" }}>
                      {isAr ? q.ar : q.en}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ ANIMATED STATS BAR ═══════ */}
        <section className="relative -mt-8 z-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              {[
                { value: stats?.jobs || 0, label: isAr ? "وظيفة متاحة" : "Active Jobs", color: "bg-primary" },
                { value: stats?.chefs || 0, label: isAr ? "طاهٍ متاح" : "Available Talent", color: "bg-[hsl(var(--chart-2))]" },
                { value: stats?.companies || 0, label: isAr ? "شركة موظِّفة" : "Hiring Companies", color: "bg-[hsl(var(--accent))]" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-card border border-border/20 p-4 md:p-6 text-center shadow-xl backdrop-blur-sm">
                  <p className="text-2xl md:text-4xl font-extrabold tracking-tight">{stat.value}+</p>
                  <div className={`h-1 w-8 ${stat.color} rounded-full mx-auto my-2`} />
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ VALUE PROPOSITIONS ═══════ */}
        <section className="py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {isAr ? "لماذا يختارنا أصحاب العمل والمواهب؟" : "Why Top Employers & Talent Choose Us"}
              </h2>
              <p className="text-muted-foreground mt-3 text-sm md:text-base">
                {isAr ? "نوفر لك الأدوات والتقنيات للوصول إلى الفرصة المثالية بأسرع وقت" : "We provide the tools and technology to match you with the perfect opportunity faster"}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Zap, title: isAr ? "توظيف في 24 ساعة" : "Hire in 24hrs", desc: isAr ? "متقدمين مطابقين لمتطلباتك خلال يوم واحد" : "Matching candidates delivered within a single day", color: "text-primary bg-primary/10" },
                { icon: Target, title: isAr ? "تطابق ذكي" : "Smart Matching", desc: isAr ? "خوارزميات ذكية تربطك بالمرشح الأنسب" : "Smart algorithms connect you with the best fit", color: "text-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2))]/10" },
                { icon: Shield, title: isAr ? "ملفات موثقة" : "Verified Profiles", desc: isAr ? "جميع الملفات الشخصية موثقة ومُراجعة" : "All profiles are verified and professionally reviewed", color: "text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10" },
                { icon: Rocket, title: isAr ? "تقديم بنقرة" : "One-Click Apply", desc: isAr ? "قدّم على أي وظيفة بنقرة واحدة مع ملفك المرفق" : "Apply to any job with one click, profile attached", color: "text-[hsl(var(--chart-3))] bg-[hsl(var(--chart-3))]/10" },
              ].map((item) => (
                <Card key={item.title} className="rounded-2xl border-border/15 p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ BROWSE BY CATEGORY ═══════ */}
        <section className="py-14 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                  {isAr ? "تصفح حسب التخصص" : "Browse by Specialization"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{isAr ? "اختر تخصصك واكتشف الفرص المتاحة" : "Choose your specialty and discover available opportunities"}</p>
              </div>
              <Link to="/jobs/search">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                  {isAr ? "عرض الكل" : "View All"} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CULINARY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link key={cat.key} to={`/jobs/search?category=${cat.key}`}>
                    <Card className="rounded-2xl border-border/15 p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group cursor-pointer text-center h-full">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 mx-auto mb-3 group-hover:bg-primary/15 group-hover:scale-105 transition-all">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {isAr ? cat.ar : cat.en}
                      </span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════ FEATURED JOBS ═══════ */}
        {featuredJobs.length > 0 && (
          <section className="py-14">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{isAr ? "الأكثر طلباً" : "Trending"}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">{isAr ? "وظائف مميزة" : "Featured Opportunities"}</h2>
                </div>
                <Link to="/jobs/search">
                  <Button variant="outline" size="sm" className="gap-1 rounded-xl text-xs">
                    {isAr ? "تصفح الكل" : "Browse All"} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredJobs.map((job) => {
                  const company = job.companies as any;
                  const title = isAr ? (job.title_ar || job.title) : job.title;
                  const location = isAr ? (job.location_ar || job.location) : job.location;
                  const typeLabel = JOB_TYPE_LABELS[job.job_type];
                  const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000);
                  const isNew = daysAgo <= 3;

                  return (
                    <Link key={job.id} to={`/jobs/${job.id}`}>
                      <Card className={`rounded-2xl border-border/15 hover:shadow-xl transition-all duration-300 group h-full relative overflow-hidden ${
                        job.is_featured ? "ring-1 ring-primary/15" : ""
                      }`}>
                        {(job.is_featured || isNew) && (
                          <div className="absolute top-3 end-3 z-10">
                            <Badge className={`text-[10px] font-bold px-2 h-5 rounded-lg ${
                              job.is_featured ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--chart-2))] text-primary-foreground"
                            }`}>
                              {job.is_featured ? (isAr ? "مميزة" : "Featured") : (isAr ? "جديدة" : "New")}
                            </Badge>
                          </div>
                        )}
                        <CardContent className="p-5 space-y-3">
                          <div className="flex gap-3">
                            <Avatar className="h-12 w-12 rounded-xl shrink-0 border border-border/10">
                              {company?.logo_url && <AvatarImage src={company.logo_url} />}
                              <AvatarFallback className="rounded-xl bg-primary/5 text-primary font-bold">{(company?.name || "C")[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
                              <p className="text-xs text-muted-foreground truncate">{isAr ? (company?.name_ar || company?.name) : company?.name}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {typeLabel && <Badge variant="secondary" className="text-[10px] rounded-lg">{isAr ? typeLabel.ar : typeLabel.en}</Badge>}
                            {location && <Badge variant="outline" className="text-[10px] rounded-lg gap-0.5"><MapPin className="h-2.5 w-2.5" />{location}</Badge>}
                          </div>

                          {job.is_salary_visible && job.salary_min && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 text-primary" />
                              <span className="text-sm font-bold">{job.salary_min.toLocaleString()}{job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : "+"}</span>
                              <span className="text-[10px] text-muted-foreground">{job.salary_currency} / {isAr ? "شهرياً" : "mo"}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 pt-1">
                            <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{daysAgo === 0 ? (isAr ? "اليوم" : "Today") : `${daysAgo}d`}</span>
                            <span className="text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              {isAr ? "تفاصيل" : "View"} <ArrowRight className="h-2.5 w-2.5" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              <div className="text-center mt-8">
                <Link to="/jobs/search">
                  <Button size="lg" className="rounded-2xl px-10 font-bold shadow-lg shadow-primary/15 gap-2">
                    <Search className="h-4 w-4" />
                    {isAr ? "تصفح جميع الوظائف" : "Browse All Jobs"}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ═══════ DUAL CTA — EMPLOYER & SEEKER ═══════ */}
        <section className="py-14 bg-muted/20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Employer Card */}
              <Card className="rounded-2xl border-border/15 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="relative h-48 overflow-hidden">
                  <img src={employerImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                  <div className="absolute bottom-4 start-5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                        <Building2 className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-extrabold">{isAr ? "لأصحاب العمل" : "For Employers"}</h3>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "وظّف أفضل الطهاة والمتخصصين من قاعدة بيانات تضم مئات المواهب المؤهلة" : "Hire the best chefs and specialists from a database of hundreds of qualified talents"}
                  </p>
                  <div className="space-y-2.5">
                    <FeatureRow icon={Users} text={isAr ? "تصفح طهاة متاحين بمختلف التخصصات" : "Browse available chefs across all specializations"} />
                    <FeatureRow icon={Zap} text={isAr ? "مرشحون مطابقون خلال 24 ساعة" : "Matching candidates within 24 hours"} />
                    <FeatureRow icon={Shield} text={isAr ? "ملفات شخصية موثقة ومفصلة" : "Verified and detailed profiles"} />
                  </div>
                  <Link to="/jobs/search?tab=chefs" className="block">
                    <Button className="w-full rounded-xl gap-2 font-bold shadow-md shadow-primary/15">
                      {isAr ? "تصفح المواهب" : "Browse Talent"} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Job Seeker Card */}
              <Card className="rounded-2xl border-border/15 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="relative h-48 overflow-hidden">
                  <img src={chefImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                  <div className="absolute bottom-4 start-5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--chart-2))] shadow-lg">
                        <ChefHat className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-extrabold">{isAr ? "للباحثين عن عمل" : "For Job Seekers"}</h3>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "اكتشف فرص عمل حصرية من أفضل الفنادق والمطاعم والمقاهي في المنطقة" : "Discover exclusive opportunities from top hotels, restaurants, and cafés in the region"}
                  </p>
                  <div className="space-y-2.5">
                    <FeatureRow icon={Search} text={isAr ? "ابحث عن وظيفة تناسب تخصصك وخبرتك" : "Find a job matching your expertise and experience"} />
                    <FeatureRow icon={Sparkles} text={isAr ? "قدّم طلبك بضغطة زر واحدة" : "Apply with a single click"} />
                    <FeatureRow icon={Eye} text={isAr ? "أظهر ملفك كمتاح للعمل" : "Show your profile as 'Open to Work'"} />
                  </div>
                  <Link to="/jobs/search" className="block">
                    <Button variant="outline" className="w-full rounded-xl gap-2 font-bold border-[hsl(var(--chart-2))]/30 text-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2))]/5">
                      {isAr ? "ابحث عن وظيفة" : "Find a Job"} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ═══════ EMPLOYER PRICING ═══════ */}
        <section className="py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="secondary" className="rounded-full mb-4 gap-1"><Crown className="h-3 w-3" />{isAr ? "باقات التوظيف" : "Recruitment Plans"}</Badge>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {isAr ? "وظّف بسرعة وادفع عند النجاح فقط!" : "Hire Fast — Pay Only for Results!"}
              </h2>
              <p className="text-muted-foreground mt-3 text-sm">{isAr ? "باقات مرنة تناسب جميع احتياجات التوظيف" : "Flexible plans to fit all recruitment needs"}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Basic */}
              <Card className="rounded-2xl border-border/15 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-7 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/15">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold">{isAr ? "الأساسية" : "Basic"}</h3>
                      <p className="text-[11px] text-muted-foreground">{isAr ? "مثالية للبدء" : "Perfect to get started"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <PlanFeature text={isAr ? "إعلان وظيفي واحد" : "1 Job Posting"} />
                    <PlanFeature text={isAr ? "عدد غير محدود من السير الذاتية" : "Unlimited CV Access"} />
                    <PlanFeature text={isAr ? "تواصل مع 50 متقدم" : "Contact up to 50 applicants"} />
                    <PlanFeature text={isAr ? "مدة شهر واحد" : "1 Month Duration"} />
                  </div>
                  <Link to="/company-login" className="block">
                    <Button variant="outline" className="w-full rounded-xl font-bold">{isAr ? "إبدأ مجاناً" : "Start Free"}</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Premium */}
              <Card className="rounded-2xl border-primary/25 hover:shadow-xl transition-all duration-300 ring-1 ring-primary/10 relative">
                <div className="absolute top-0 end-0 bg-primary text-primary-foreground text-[10px] font-bold px-4 py-1.5 rounded-es-xl">{isAr ? "الأكثر شعبية" : "Most Popular"}</div>
                <CardContent className="p-7 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">{isAr ? "المميزة" : "Premium"}</h3>
                      <p className="text-[11px] text-muted-foreground">{isAr ? "وظف 10x أسرع" : "Hire 10x faster"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <PlanFeature text={isAr ? "إعلان مميز بظهور 3x" : "Featured listing — 3x visibility"} highlighted />
                    <PlanFeature text={isAr ? "عدد غير محدود من السير الذاتية" : "Unlimited CV Access"} />
                    <PlanFeature text={isAr ? "تواصل مع 150 متقدم" : "Contact up to 150 applicants"} highlighted />
                    <PlanFeature text={isAr ? "فيديوهات تعريفية للمتقدمين" : "Applicant intro videos"} highlighted />
                    <PlanFeature text={isAr ? "مدة شهر واحد" : "1 Month Duration"} />
                  </div>
                  <Link to="/company-login" className="block">
                    <Button className="w-full rounded-xl font-bold shadow-lg shadow-primary/20">{isAr ? "إبدأ الآن" : "Get Started"}</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/50 mt-6">
              {isAr ? "جميع الأسعار تخضع لضريبة القيمة المضافة. لا تجديد تلقائي." : "All prices subject to VAT. No auto-renewal."}
            </p>
          </div>
        </section>

        {/* ═══════ WHY CHOOSE US ═══════ */}
        <section className="py-14 bg-muted/20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">{isAr ? "ما الذي يميزنا؟" : "Why Choose Us?"}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="rounded-2xl border-border/15 p-5 space-y-4">
                <h4 className="font-bold text-xs text-muted-foreground">{isAr ? "التواصل الاجتماعي" : "Social Media"}</h4>
                <div className="space-y-2.5">
                  <ComparisonItem negative text={isAr ? "آلاف المتقدمين العشوائيين" : "Thousands of random applicants"} />
                  <ComparisonItem negative text={isAr ? "صعوبة التصفية" : "Hard to filter"} />
                  <ComparisonItem negative text={isAr ? "متقدمين غير جادين" : "Non-serious applicants"} />
                </div>
              </Card>
              <Card className="rounded-2xl border-primary/25 p-5 space-y-4 ring-1 ring-primary/10 relative shadow-lg">
                <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground rounded-full px-3 py-0.5 text-[10px]">{isAr ? "منصتنا" : "Our Platform"}</Badge>
                </div>
                <h4 className="font-bold text-xs text-primary mt-2">Altoha</h4>
                <div className="space-y-2.5">
                  <ComparisonItem positive text={isAr ? "متقدمين مطابقين لشروطك" : "Matching candidates for your needs"} />
                  <ComparisonItem positive text={isAr ? "ملفات مفصلة وموثقة" : "Detailed, verified profiles"} />
                  <ComparisonItem positive text={isAr ? "أدوات تصفية متقدمة" : "Advanced filtering tools"} />
                </div>
              </Card>
              <Card className="rounded-2xl border-border/15 p-5 space-y-4">
                <h4 className="font-bold text-xs text-muted-foreground">{isAr ? "مواقع التوظيف العامة" : "Generic Job Boards"}</h4>
                <div className="space-y-2.5">
                  <ComparisonItem negative text={isAr ? "غير متخصصة في الطهي" : "Not specialized in culinary"} />
                  <ComparisonItem negative text={isAr ? "منافسة عالية من قطاعات أخرى" : "High competition from other sectors"} />
                  <ComparisonItem negative text={isAr ? "ملفات عامة بدون تفاصيل" : "Generic profiles without detail"} />
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ═══════ TESTIMONIALS ═══════ */}
        <section className="py-14">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">{isAr ? "قصص نجاح حقيقية" : "Real Success Stories"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{isAr ? "اكتشف كيف ساعدنا شركات ومواهب على النجاح" : "Discover how we helped companies and talent succeed"}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <TestimonialCard
                quote={isAr ? "وفرت لنا المنصة مواهب متنوعة ووظفنا بسرعة خلال 3 أيام فقط!" : "The platform gave us diverse talent and we hired within just 3 days!"}
                name={isAr ? "أحمد المنصوري" : "Ahmed Al-Mansouri"}
                company={isAr ? "مطاعم الشرق الفاخرة" : "Al Sharq Fine Dining"}
                rating={5}
              />
              <TestimonialCard
                quote={isAr ? "أفضل منصة للبحث عن وظائف الطهي. حصلت على وظيفة أحلامي!" : "Best platform for culinary jobs. I got my dream position!"}
                name={isAr ? "فاطمة الراشد" : "Fatima Al-Rashid"}
                company={isAr ? "شيف حلويات" : "Pastry Chef"}
                rating={5}
              />
              <TestimonialCard
                quote={isAr ? "ساعدتنا في العثور على موظفين ممتازين بسهولة وبتكلفة معقولة" : "Helped us find excellent staff easily and at reasonable cost"}
                name={isAr ? "سارة العتيبي" : "Sarah Al-Otaibi"}
                company={isAr ? "كافيه لاتيه" : "Café Latte"}
                rating={5}
              />
            </div>
          </div>
        </section>

        {/* ═══════ FAQ ═══════ */}
        <section className="py-14 bg-muted/20">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">{isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {[
                { q: isAr ? "كيف تعمل المنصة؟" : "How does the platform work?", a: isAr ? "أنشئ حسابك، انشر إعلان وظيفتك، واستقبل متقدمين مطابقين خلال 24 ساعة. تصفية المتقدمين والتواصل مباشرة." : "Create your account, post your job, and receive matching applicants within 24 hours. Filter and contact directly." },
                { q: isAr ? "هل المنصة مجانية للباحثين عن عمل؟" : "Is it free for job seekers?", a: isAr ? "نعم، مجانية تماماً. أنشئ ملفك وقدّم على الوظائف بدون رسوم." : "Yes, completely free. Create your profile and apply at no cost." },
                { q: isAr ? "ما التخصصات المتاحة؟" : "What specializations are available?", a: isAr ? "جميع تخصصات الطهي والضيافة: رئيس طهاة، حلويات، باريستا، مدير مطعم، وغيرها." : "All culinary and hospitality roles: Head Chef, Pastry, Barista, Restaurant Manager, and more." },
                { q: isAr ? "هل توفرون دوام كامل وجزئي؟" : "Full-time and part-time?", a: isAr ? "نعم، جميع أنواع الدوام: كامل، جزئي، حر، عقود، واستشارات." : "Yes, all types: full-time, part-time, freelance, contract, and consulting." },
                { q: isAr ? "كيف أتواصل مع المتقدمين؟" : "How to contact applicants?", a: isAr ? "تواصل مباشرة عبر المنصة أو احصل على معلومات التواصل الموثقة." : "Contact directly through the platform or get verified contact info." },
              ].map((faq, i) => (
                <AccordionItem key={i} value={String(i)} className="border border-border/15 rounded-xl px-4 data-[state=open]:bg-card">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground pb-4 leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ═══════ FINAL CTA ═══════ */}
        <section className="relative py-20 overflow-hidden">
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "white" }}>
              {isAr ? "ابدأ رحلتك المهنية اليوم" : "Start Your Culinary Career Journey Today"}
            </h2>
            <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
              {isAr
                ? "سواء كنت طاهياً يبحث عن فرصة أو صاحب عمل يبحث عن موهبة، نحن هنا لنربطك بالمناسب"
                : "Whether you're a chef seeking opportunity or an employer searching for talent, we're here to connect you"}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/jobs/search">
                <Button size="lg" className="rounded-2xl font-bold gap-2 bg-card text-foreground hover:bg-card/90 shadow-xl">
                  <Search className="h-4 w-4" />
                  {isAr ? "تصفح الوظائف" : "Browse Jobs"}
                </Button>
              </Link>
              <Link to="/company-login">
                <Button size="lg" variant="outline" className="rounded-2xl font-bold gap-2 border-2" style={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}>
                  <Building2 className="h-4 w-4" />
                  {isAr ? "دخول الشركات" : "Employer Login"}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════ SEO FOOTER ═══════ */}
        <section className="bg-card/50 border-t border-border/10">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-xs">
              <div className="space-y-3">
                <h4 className="font-bold text-foreground text-sm">{isAr ? "وظائف حسب التخصص" : "Jobs by Specialization"}</h4>
                <div className="space-y-1.5 text-muted-foreground">
                  {CULINARY_CATEGORIES.map(cat => (
                    <Link key={cat.key} to={`/jobs/search?category=${cat.key}`} className="block hover:text-primary transition-colors">
                      {isAr ? `وظائف ${cat.ar}` : `${cat.en} Jobs`}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-foreground text-sm">{isAr ? "وظائف حسب النوع" : "Jobs by Type"}</h4>
                <div className="space-y-1.5 text-muted-foreground">
                  {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => (
                    <Link key={k} to={`/jobs/search?type=${k}`} className="block hover:text-primary transition-colors">
                      {isAr ? `وظائف ${v.ar}` : `${v.en} Jobs`}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-foreground text-sm">{isAr ? "روابط مفيدة" : "Useful Links"}</h4>
                <div className="space-y-1.5 text-muted-foreground">
                  <Link to="/for-companies" className="block hover:text-primary transition-colors">{isAr ? "للشركات" : "For Companies"}</Link>
                  <Link to="/for-chefs" className="block hover:text-primary transition-colors">{isAr ? "للطهاة" : "For Chefs"}</Link>
                  <Link to="/membership" className="block hover:text-primary transition-colors">{isAr ? "خطط العضوية" : "Membership"}</Link>
                  <Link to="/competitions" className="block hover:text-primary transition-colors">{isAr ? "المسابقات" : "Competitions"}</Link>
                  <Link to="/help" className="block hover:text-primary transition-colors">{isAr ? "مركز المساعدة" : "Help Center"}</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="container">
          <RelatedPages currentPath="/jobs" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ───── Sub Components ───── */

function PlanFeature({ text, highlighted }: { text: string; highlighted?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${highlighted ? "text-primary" : "text-[hsl(var(--chart-2))]"}`} />
      <span className={`text-xs ${highlighted ? "text-foreground font-medium" : "text-muted-foreground"}`}>{text}</span>
    </div>
  );
}

function ComparisonItem({ positive, negative, text }: { positive?: boolean; negative?: boolean; text: string }) {
  return (
    <div className="flex items-start gap-2">
      {positive && <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[hsl(var(--chart-2))]" />}
      {negative && <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive/50" />}
      <span className="text-[11px] text-muted-foreground">{text}</span>
    </div>
  );
}

function TestimonialCard({ quote, name, company, rating }: { quote: string; name: string; company: string; rating: number }) {
  return (
    <Card className="rounded-2xl border-border/15 p-6 space-y-4 hover:shadow-lg transition-all duration-300">
      <div className="flex gap-0.5">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" />
        ))}
      </div>
      <p className="text-sm text-muted-foreground italic leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 rounded-lg">
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">{name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs font-bold">{name}</p>
          <p className="text-[10px] text-muted-foreground">{company}</p>
        </div>
      </div>
    </Card>
  );
}

function FeatureRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/10">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
      </div>
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}
