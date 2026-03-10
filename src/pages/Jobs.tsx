import { useState, useMemo, memo, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenToWorkBadge } from "@/components/profile/OpenToWorkBadge";
import {
  Briefcase, Search, MapPin, Building2, Clock, Users, ChefHat, Filter, DollarSign,
  Utensils, Coffee, Cake, Soup, Salad, IceCream, Star, TrendingUp, Globe,
  ArrowRight, Sparkles, Eye, Heart, Award, GraduationCap
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

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
  const [search, setSearch] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [tab, setTab] = useState("postings");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch active job postings
  const { data: jobPostings = [], isLoading: loadingPostings } = useQuery({
    queryKey: ["job-postings", jobTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("job_postings")
        .select("*, companies(name, name_ar, logo_url, slug)")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (jobTypeFilter !== "all") {
        query = query.eq("job_type", jobTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch available chefs
  const { data: availableChefs = [], isLoading: loadingChefs } = useQuery({
    queryKey: ["available-chefs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, specialization, specialization_ar, job_title, job_title_ar, country_code, city, years_of_experience, experience_level, work_availability_note, work_availability_note_ar, preferred_job_types, preferred_work_locations, willing_to_relocate, is_verified")
        .eq("is_open_to_work", true)
        .eq("job_availability_visibility", "public")
        .eq("account_type", "professional")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["jobs-stats"],
    queryFn: async () => {
      const [{ count: jobCount }, { count: chefCount }, { count: companyCount }] = await Promise.all([
        supabase.from("job_postings").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_open_to_work", true).eq("job_availability_visibility", "public").eq("account_type", "professional"),
        supabase.from("job_postings").select("company_id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      return { jobs: jobCount || 0, chefs: chefCount || 0, companies: companyCount || 0 };
    },
    staleTime: 60000,
  });

  // Unique cities from postings
  const cities = useMemo(() => {
    const set = new Set<string>();
    jobPostings.forEach((j: any) => { if (j.city) set.add(j.city); });
    return Array.from(set).sort();
  }, [jobPostings]);

  const filteredPostings = useMemo(() => {
    let results = jobPostings;
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((j: any) =>
        j.title?.toLowerCase().includes(q) || j.title_ar?.includes(q) ||
        (j.companies as any)?.name?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) ||
        j.specialization?.toLowerCase().includes(q)
      );
    }
    if (cityFilter !== "all") {
      results = results.filter((j: any) => j.city === cityFilter);
    }
    if (expFilter !== "all") {
      results = results.filter((j: any) => j.experience_level === expFilter);
    }
    if (selectedCategory) {
      results = results.filter((j: any) =>
        j.specialization?.toLowerCase().includes(selectedCategory) ||
        j.title?.toLowerCase().includes(selectedCategory)
      );
    }
    return results;
  }, [jobPostings, search, cityFilter, expFilter, selectedCategory]);

  const filteredChefs = useMemo(() => {
    let results = availableChefs;
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((c: any) =>
        c.full_name?.toLowerCase().includes(q) || c.full_name_ar?.includes(q) ||
        c.specialization?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) ||
        c.job_title?.toLowerCase().includes(q)
      );
    }
    if (expFilter !== "all") {
      results = results.filter((c: any) => c.experience_level === expFilter);
    }
    return results;
  }, [availableChefs, search, expFilter]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -end-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -start-20 w-60 h-60 bg-chart-2/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1 rounded-full">
              <Sparkles className="h-3 w-3" />
              {isAr ? "منصة التوظيف الأولى للطهاة" : "The Leading Culinary Recruitment Platform"}
            </Badge>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {isAr ? (
                <>
                  <span className="text-foreground">المنصة الرائدة</span>{" "}
                  <span className="text-primary">للتوظيف</span>{" "}
                  <span className="text-foreground">في عالم الطهي</span>
                </>
              ) : (
                <>
                  <span className="text-foreground">The Leading Platform for</span>{" "}
                  <span className="text-primary">Culinary Recruitment</span>
                </>
              )}
            </h1>

            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              {isAr
                ? "أكبر وجهة للطهاة الباحثين عن عمل والمنشآت الراغبة في التوظيف في قطاع الطهي والضيافة"
                : "The largest destination connecting culinary professionals with top hospitality employers"}
            </p>

            {/* Hero Search */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto pt-2">
              <div className="relative flex-1">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  className="ps-10 h-12 rounded-2xl border-border/20 bg-card/80 backdrop-blur-sm shadow-sm text-sm"
                  placeholder={isAr ? "ابحث عن وظيفة، شركة، أو تخصص..." : "Search jobs, companies, or specializations..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                size="lg"
                className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/20 font-bold"
                onClick={() => {
                  setTab("postings");
                  document.getElementById("jobs-listing")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Search className="h-4 w-4 me-2" />
                {isAr ? "ابحث" : "Search"}
              </Button>
            </div>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <p className="text-sm text-muted-foreground/70 self-center">{isAr ? "أنا:" : "I am:"}</p>
              <Button
                variant="outline"
                className="rounded-2xl gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                onClick={() => { setTab("postings"); document.getElementById("jobs-listing")?.scrollIntoView({ behavior: "smooth" }); }}
              >
                <Briefcase className="h-4 w-4" />
                {isAr ? "أبحث عن وظيفة" : "Looking for a Job"}
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl gap-2 border-chart-2/20 hover:bg-chart-2/5 hover:border-chart-2/40"
                onClick={() => { setTab("chefs"); document.getElementById("jobs-listing")?.scrollIntoView({ behavior: "smooth" }); }}
              >
                <Users className="h-4 w-4" />
                {isAr ? "أبحث عن موظفين" : "Looking for Talent"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/10 bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-extrabold text-primary">{stats?.jobs || 0}+</p>
              <p className="text-xs text-muted-foreground">{isAr ? "وظيفة متاحة" : "Active Jobs"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-extrabold text-chart-2">{stats?.chefs || 0}+</p>
              <p className="text-xs text-muted-foreground">{isAr ? "طاهٍ متاح" : "Available Chefs"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-extrabold text-accent-foreground">{stats?.companies || 0}+</p>
              <p className="text-xs text-muted-foreground">{isAr ? "شركة موظفة" : "Hiring Companies"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-background">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl md:text-2xl font-bold">{isAr ? "فرص عمل في جميع التخصصات" : "Jobs Across All Specializations"}</h2>
            <p className="text-sm text-muted-foreground">{isAr ? "بدوام كامل أو جزئي، في مختلف أنحاء المنطقة" : "Full-time or part-time, across the region"}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CULINARY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setSelectedCategory(isActive ? null : cat.key);
                    setTab("postings");
                    document.getElementById("jobs-listing")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`group flex flex-col items-center gap-2.5 p-5 rounded-2xl border transition-all duration-300 text-center
                    ${isActive
                      ? "border-primary/30 bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border/15 bg-card/60 hover:border-primary/20 hover:shadow-md hover:bg-card"
                    }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    isActive ? "bg-primary/15" : "bg-muted/10 group-hover:bg-primary/10"
                  }`}>
                    <Icon className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary"}`} />
                  </div>
                  <span className={`text-xs font-semibold transition-colors ${isActive ? "text-primary" : "text-foreground"}`}>
                    {isAr ? cat.ar : cat.en}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedCategory && (
            <div className="text-center mt-4">
              <Button variant="ghost" size="sm" className="text-xs rounded-xl" onClick={() => setSelectedCategory(null)}>
                {isAr ? "إزالة الفلتر" : "Clear filter"} ✕
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Main Listings */}
      <section id="jobs-listing" className="bg-muted/5 scroll-mt-4">
        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                className="ps-9 rounded-xl border-border/20 bg-card"
                placeholder={isAr ? "ابحث هنا..." : "Search here..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                <SelectTrigger className="w-[140px] rounded-xl border-border/20 bg-card text-xs">
                  <Filter className="h-3 w-3 me-1 text-muted-foreground/50" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">{isAr ? "نوع العمل" : "Job Type"}</SelectItem>
                  {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={expFilter} onValueChange={setExpFilter}>
                <SelectTrigger className="w-[130px] rounded-xl border-border/20 bg-card text-xs">
                  <SelectValue placeholder={isAr ? "الخبرة" : "Experience"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">{isAr ? "مستوى الخبرة" : "Experience"}</SelectItem>
                  {Object.entries(EXP_LEVELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {cities.length > 0 && (
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl border-border/20 bg-card text-xs">
                    <MapPin className="h-3 w-3 me-1 text-muted-foreground/50" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{isAr ? "كل المدن" : "All Cities"}</SelectItem>
                    {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="rounded-xl bg-card border border-border/15 p-1 h-auto">
              <TabsTrigger value="postings" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs px-4 py-2">
                <Building2 className="h-3.5 w-3.5" />
                {isAr ? "الوظائف" : "Job Postings"}
                {filteredPostings.length > 0 && <Badge variant="secondary" className="ms-1 text-[10px] px-1.5 h-4">{filteredPostings.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="chefs" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs px-4 py-2">
                <ChefHat className="h-3.5 w-3.5" />
                {isAr ? "طهاة متاحون" : "Available Talent"}
                {filteredChefs.length > 0 && <Badge variant="secondary" className="ms-1 text-[10px] px-1.5 h-4">{filteredChefs.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* Job Postings */}
            <TabsContent value="postings" className="mt-5 space-y-3">
              {loadingPostings ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl animate-pulse bg-card border border-border/10" />)}
                </div>
              ) : filteredPostings.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="h-12 w-12 text-muted-foreground/20" />}
                  title={isAr ? "لا توجد وظائف حالياً" : "No jobs found"}
                  description={isAr ? "جرب تغيير معايير البحث أو الفلاتر" : "Try adjusting your search or filters"}
                />
              ) : (
                <div className="space-y-3">
                  {filteredPostings.map((job: any) => (
                    <JobPostingCard key={job.id} job={job} isAr={isAr} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Available Chefs */}
            <TabsContent value="chefs" className="mt-5">
              {loadingChefs ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-2xl animate-pulse bg-card border border-border/10" />)}
                </div>
              ) : filteredChefs.length === 0 ? (
                <EmptyState
                  icon={<ChefHat className="h-12 w-12 text-muted-foreground/20" />}
                  title={isAr ? "لا يوجد طهاة متاحون حالياً" : "No available talent right now"}
                  description={isAr ? "عُد لاحقاً للاطلاع على المواهب الجديدة" : "Check back later for new talent"}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredChefs.map((chef: any) => (
                    <AvailableChefCard key={chef.user_id} chef={chef} isAr={isAr} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* For Employers / For Job Seekers */}
      <section className="bg-background border-t border-border/10">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="grid md:grid-cols-2 gap-6">
            {/* For Employers */}
            <Card className="rounded-2xl border-border/15 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">{isAr ? "للشركات وأصحاب العمل" : "For Employers"}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isAr ? "نربطك بأفضل الطهاة... من بين مئات المواهب!" : "We connect you with the best chefs from hundreds of talents!"}
                  </p>
                </div>
                <div className="p-6 pt-4 space-y-3">
                  <FeatureItem icon={Users} text={isAr ? "تصفح طهاة متاحين بمختلف التخصصات" : "Browse chefs across all specializations"} />
                  <FeatureItem icon={TrendingUp} text={isAr ? "نختصر وقت البحث والتوظيف" : "We shorten your hiring time"} />
                  <FeatureItem icon={Star} text={isAr ? "ملفات شخصية موثقة ومفصلة" : "Verified and detailed profiles"} />
                  <Button className="w-full rounded-xl gap-2 mt-2" onClick={() => { setTab("chefs"); document.getElementById("jobs-listing")?.scrollIntoView({ behavior: "smooth" }); }}>
                    {isAr ? "تصفح المواهب" : "Browse Talent"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* For Job Seekers */}
            <Card className="rounded-2xl border-border/15 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 p-6 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-chart-2/15">
                      <ChefHat className="h-5 w-5 text-chart-2" />
                    </div>
                    <h3 className="text-lg font-bold">{isAr ? "للطهاة الباحثين عن عمل" : "For Job Seekers"}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isAr ? "وجهتك الأولى لجميع فرص العمل في عالم الطهي" : "Your first stop for all culinary career opportunities"}
                  </p>
                </div>
                <div className="p-6 pt-4 space-y-3">
                  <FeatureItem icon={Search} text={isAr ? "ابحث عن وظيفة تناسب تخصصك" : "Find a job matching your expertise"} />
                  <FeatureItem icon={Eye} text={isAr ? "أظهر ملفك للشركات كمتاح للعمل" : "Show your profile as 'Open to Work'"} />
                  <FeatureItem icon={Sparkles} text={isAr ? "قدّم طلبك بضغطة زر واحدة" : "Apply with a single click"} />
                  {user ? (
                    <Link to="/profile?tab=edit" className="block">
                      <Button variant="outline" className="w-full rounded-xl gap-2 mt-2 border-chart-2/30 text-chart-2 hover:bg-chart-2/5">
                        {isAr ? "تعديل حالة التوظيف" : "Update Availability"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/register" className="block">
                      <Button variant="outline" className="w-full rounded-xl gap-2 mt-2 border-chart-2/30 text-chart-2 hover:bg-chart-2/5">
                        {isAr ? "سجّل الآن" : "Register Now"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-chart-2/10 border-t border-border/10">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center space-y-5">
          <h2 className="text-xl md:text-2xl font-bold">
            {isAr ? "ابدأ رحلتك المهنية اليوم" : "Start Your Culinary Career Journey Today"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            {isAr
              ? "سواء كنت طاهياً تبحث عن فرصة أو صاحب عمل يبحث عن موهبة، نحن هنا لنربطك بالمناسب"
              : "Whether you're a chef seeking opportunity or an employer searching for talent, we're here to connect you"}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/register">
              <Button size="lg" className="rounded-2xl font-bold gap-2 shadow-lg shadow-primary/15">
                <Briefcase className="h-4 w-4" />
                {isAr ? "سجّل مجاناً" : "Join Free"}
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl font-bold gap-2"
              onClick={() => { setTab("postings"); document.getElementById("jobs-listing")?.scrollIntoView({ behavior: "smooth" }); }}
            >
              {isAr ? "تصفح الوظائف" : "Browse Jobs"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───── Sub Components ───── */

function FeatureItem({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/10">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
      </div>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="rounded-2xl border-border/15">
      <CardContent className="py-16 text-center space-y-3">
        <div className="mx-auto w-fit">{icon}</div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

const JobPostingCard = memo(function JobPostingCard({ job, isAr }: { job: any; isAr: boolean }) {
  const company = job.companies;
  const title = isAr ? (job.title_ar || job.title) : job.title;
  const location = isAr ? (job.location_ar || job.location) : job.location;
  const typeLabel = JOB_TYPE_LABELS[job.job_type] || { en: job.job_type, ar: job.job_type };
  const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000);

  return (
    <Link to={`/jobs/${job.id}`} className="block">
      <Card className={`rounded-2xl border-border/15 hover:shadow-lg transition-all duration-300 group relative overflow-hidden ${
        job.is_featured ? "ring-1 ring-primary/20" : ""
      }`}>
        {job.is_featured && (
          <div className="absolute top-0 end-0 bg-primary text-primary-foreground text-[9px] font-bold px-2.5 py-0.5 rounded-es-xl">
            {isAr ? "مميزة" : "Featured"}
          </div>
        )}
        <CardContent className="p-5">
          <div className="flex gap-4">
            <Avatar className="h-14 w-14 rounded-xl shrink-0 border border-border/10">
              {company?.logo_url ? (
                <AvatarImage src={company.logo_url} alt={company.name} />
              ) : null}
              <AvatarFallback className="rounded-xl bg-primary/5 text-primary font-bold text-sm">
                {(company?.name || "C")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? (company?.name_ar || company?.name) : company?.name}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px] rounded-lg">
                  {isAr ? typeLabel.ar : typeLabel.en}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground/70">
                {location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>
                )}
                {job.experience_level && (
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {isAr ? (EXP_LEVELS[job.experience_level]?.ar || job.experience_level) : (EXP_LEVELS[job.experience_level]?.en || job.experience_level)}
                  </span>
                )}
                {job.is_salary_visible && job.salary_min && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {job.salary_min.toLocaleString()}{job.salary_max ? `–${job.salary_max.toLocaleString()}` : "+"} {job.salary_currency}
                  </span>
                )}
              </div>

              {job.description && (
                <p className="text-xs text-muted-foreground/50 line-clamp-2">{isAr ? (job.description_ar || job.description) : job.description}</p>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{job.applications_count || 0} {isAr ? "متقدم" : "applicants"}</span>
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{job.views_count || 0} {isAr ? "مشاهدة" : "views"}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{daysAgo === 0 ? (isAr ? "اليوم" : "Today") : `${daysAgo}${isAr ? " يوم" : "d ago"}`}</span>
                </div>
                <Button size="sm" className="rounded-xl text-[10px] h-7 px-3 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAr ? "تفاصيل" : "View"} <ArrowRight className="h-3 w-3 ms-1" />
                </Button>
              </div>

              {job.application_deadline && (
                <div className="text-[10px] text-destructive/70 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {isAr ? "آخر موعد:" : "Deadline:"} {format(new Date(job.application_deadline), "MMM d, yyyy")}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

const AvailableChefCard = memo(function AvailableChefCard({ chef, isAr }: { chef: any; isAr: boolean }) {
  const name = isAr ? (chef.full_name_ar || chef.full_name) : (chef.full_name || chef.full_name_ar);
  const spec = isAr ? (chef.specialization_ar || chef.specialization) : (chef.specialization || chef.specialization_ar);
  const jobTitle = isAr ? (chef.job_title_ar || chef.job_title) : (chef.job_title || chef.job_title_ar);
  const note = isAr ? (chef.work_availability_note_ar || chef.work_availability_note) : (chef.work_availability_note || chef.work_availability_note_ar);
  const expLabel = chef.experience_level ? (isAr ? EXP_LEVELS[chef.experience_level]?.ar : EXP_LEVELS[chef.experience_level]?.en) : null;

  return (
    <Link to={`/${chef.username || chef.user_id}`}>
      <Card className="rounded-2xl border-border/15 hover:shadow-lg transition-all duration-300 group h-full">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14 rounded-xl shrink-0 ring-2 ring-chart-2/20">
                <AvatarImage src={chef.avatar_url} alt={name || ""} />
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              {chef.is_verified && (
                <div className="absolute -bottom-1 -end-1 bg-primary text-primary-foreground rounded-full p-0.5">
                  <Star className="h-2.5 w-2.5 fill-current" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{name}</h3>
                <OpenToWorkBadge isAr={isAr} size="sm" />
              </div>
              {jobTitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{jobTitle}</p>}
            </div>
          </div>

          {spec && <p className="text-xs text-muted-foreground/70 line-clamp-1">{spec}</p>}

          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground/60">
            {chef.city && (
              <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{chef.city}</span>
            )}
            {chef.years_of_experience && (
              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{chef.years_of_experience} {isAr ? "سنة خبرة" : "yrs exp"}</span>
            )}
            {expLabel && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{expLabel}</Badge>
            )}
            {chef.willing_to_relocate && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-chart-2/20 text-chart-2">
                <Globe className="h-2 w-2 me-0.5" />{isAr ? "مستعد للانتقال" : "Relocate"}
              </Badge>
            )}
          </div>

          {(chef.preferred_job_types || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(chef.preferred_job_types as string[]).slice(0, 3).map((t: string) => (
                <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  {isAr ? (JOB_TYPE_LABELS[t]?.ar || t) : (JOB_TYPE_LABELS[t]?.en || t)}
                </Badge>
              ))}
            </div>
          )}

          {note && (
            <p className="text-[10px] text-muted-foreground/50 line-clamp-2 italic border-s-2 border-chart-2/20 ps-2">"{note}"</p>
          )}

          <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] h-7 font-semibold opacity-80 group-hover:opacity-100 transition-opacity border-border/15">
            {isAr ? "عرض الملف الشخصي" : "View Profile"} <ArrowRight className="h-3 w-3 ms-1" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
});
