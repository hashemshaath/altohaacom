import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenToWorkBadge } from "@/components/profile/OpenToWorkBadge";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Briefcase, Search, MapPin, Building2, Clock, Users, ChefHat, Filter, DollarSign,
  Utensils, Coffee, Cake, Soup, Salad, Award, GraduationCap, X,
  ArrowRight, Sparkles, Eye, Star, Globe, BarChart3, Megaphone, Home, ChevronRight
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

const SALARY_RANGES = [
  { key: "0-3000", en: "Up to 3,000", ar: "حتى 3,000" },
  { key: "3000-5000", en: "3,000 – 5,000", ar: "3,000 – 5,000" },
  { key: "5000-8000", en: "5,000 – 8,000", ar: "5,000 – 8,000" },
  { key: "8000+", en: "8,000+", ar: "8,000+" },
];

export default function JobSearch() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [searchParams] = useSearchParams();

  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || null;
  const initialType = searchParams.get("type") || "all";
  const initialTab = searchParams.get("tab") || "postings";

  const [search, setSearch] = useState(initialQ);
  const [jobTypeFilter, setJobTypeFilter] = useState(initialType);
  const [cityFilter, setCityFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [salaryFilter, setSalaryFilter] = useState("all");
  const [tab, setTab] = useState(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [sortBy, setSortBy] = useState<"newest" | "salary">("newest");

  const { data: jobPostings = [], isLoading: loadingPostings } = useQuery({
    queryKey: ["job-postings-search", jobTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("job_postings")
        .select("*, companies(name, name_ar, logo_url, slug)")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (jobTypeFilter !== "all") query = query.eq("job_type", jobTypeFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: availableChefs = [], isLoading: loadingChefs } = useQuery({
    queryKey: ["available-chefs-search"],
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

  const cities = useMemo(() => {
    const set = new Set<string>();
    jobPostings.forEach((j: any) => { if (j.city) set.add(j.city); });
    return Array.from(set).sort();
  }, [jobPostings]);

  const activeFilterCount = [
    jobTypeFilter !== "all" ? 1 : 0,
    cityFilter !== "all" ? 1 : 0,
    expFilter !== "all" ? 1 : 0,
    salaryFilter !== "all" ? 1 : 0,
    selectedCategory ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setJobTypeFilter("all"); setCityFilter("all"); setExpFilter("all");
    setSalaryFilter("all"); setSelectedCategory(null); setSearch("");
  };

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
    if (cityFilter !== "all") results = results.filter((j: any) => j.city === cityFilter);
    if (expFilter !== "all") results = results.filter((j: any) => j.experience_level === expFilter);
    if (salaryFilter !== "all") {
      results = results.filter((j: any) => {
        if (!j.salary_min) return false;
        if (salaryFilter === "0-3000") return j.salary_min <= 3000;
        if (salaryFilter === "3000-5000") return j.salary_min >= 3000 && j.salary_min <= 5000;
        if (salaryFilter === "5000-8000") return j.salary_min >= 5000 && j.salary_min <= 8000;
        if (salaryFilter === "8000+") return j.salary_min >= 8000;
        return true;
      });
    }
    if (selectedCategory) {
      results = results.filter((j: any) =>
        j.specialization?.toLowerCase().includes(selectedCategory) ||
        j.title?.toLowerCase().includes(selectedCategory)
      );
    }
    if (sortBy === "salary") results = [...results].sort((a: any, b: any) => (b.salary_min || 0) - (a.salary_min || 0));
    return results;
  }, [jobPostings, search, cityFilter, expFilter, salaryFilter, selectedCategory, sortBy]);

  const filteredChefs = useMemo(() => {
    let results = availableChefs;
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((c: any) =>
        c.full_name?.toLowerCase().includes(q) || c.full_name_ar?.includes(q) ||
        c.specialization?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)
      );
    }
    if (expFilter !== "all") results = results.filter((c: any) => c.experience_level === expFilter);
    return results;
  }, [availableChefs, search, expFilter]);

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={isAr ? "بحث الوظائف - Altoha" : "Job Search - Altoha"}
        description={isAr ? "ابحث وتصفح جميع وظائف الطهي والضيافة" : "Search and browse all culinary and hospitality jobs"}
      />
      <Header />
      <main className="flex-1">

        {/* Search Header */}
        <section className="bg-gradient-to-b from-primary/5 to-background border-b border-border/10">
          <div className="max-w-5xl mx-auto px-4 pt-4 pb-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /></Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              <Link to="/jobs" className="hover:text-primary transition-colors">{isAr ? "الوظائف" : "Jobs"}</Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              <span className="text-foreground font-medium">{isAr ? "بحث" : "Search"}</span>
            </nav>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-5">
              {isAr ? "بحث الوظائف" : "Job Search"}
            </h1>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3 mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  !selectedCategory ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-card border border-border/20 text-muted-foreground hover:border-primary/20"
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                {isAr ? "الكل" : "All"}
              </button>
              {CULINARY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(isActive ? null : cat.key)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                      isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-card border border-border/20 text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {isAr ? cat.ar : cat.en}
                  </button>
                );
              })}
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input
                  className="ps-10 h-11 rounded-xl border-border/20 bg-card text-sm"
                  placeholder={isAr ? "ابحث عن وظيفة، شركة، أو تخصص..." : "Search jobs, companies, specializations..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl border-border/20 bg-card text-xs h-11">
                    <Filter className="h-3 w-3 me-1 text-muted-foreground/50" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{isAr ? "نوع العمل" : "Job Type"}</SelectItem>
                    {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={expFilter} onValueChange={setExpFilter}>
                  <SelectTrigger className="w-[120px] rounded-xl border-border/20 bg-card text-xs h-11">
                    <SelectValue placeholder={isAr ? "الخبرة" : "Experience"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{isAr ? "الخبرة" : "Experience"}</SelectItem>
                    {Object.entries(EXP_LEVELS).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={salaryFilter} onValueChange={setSalaryFilter}>
                  <SelectTrigger className="w-[120px] rounded-xl border-border/20 bg-card text-xs h-11">
                    <DollarSign className="h-3 w-3 me-1 text-muted-foreground/50" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{isAr ? "الراتب" : "Salary"}</SelectItem>
                    {SALARY_RANGES.map((s) => <SelectItem key={s.key} value={s.key}>{isAr ? s.ar : s.en}</SelectItem>)}
                  </SelectContent>
                </Select>

                {cities.length > 0 && (
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-[120px] rounded-xl border-border/20 bg-card text-xs h-11">
                      <MapPin className="h-3 w-3 me-1 text-muted-foreground/50" /><SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">{isAr ? "كل المدن" : "All Cities"}</SelectItem>
                      {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[110px] rounded-xl border-border/20 bg-card text-xs h-11">
                    <BarChart3 className="h-3 w-3 me-1 text-muted-foreground/50" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
                    <SelectItem value="salary">{isAr ? "الأعلى راتباً" : "Highest Salary"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground font-medium">{isAr ? "نشط:" : "Active:"}</span>
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10" onClick={() => setSelectedCategory(null)}>
                    {isAr ? CULINARY_CATEGORIES.find(c => c.key === selectedCategory)?.ar : CULINARY_CATEGORIES.find(c => c.key === selectedCategory)?.en}
                    <X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {jobTypeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10" onClick={() => setJobTypeFilter("all")}>
                    {isAr ? JOB_TYPE_LABELS[jobTypeFilter]?.ar : JOB_TYPE_LABELS[jobTypeFilter]?.en}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {cityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10" onClick={() => setCityFilter("all")}>
                    {cityFilter}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {expFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10" onClick={() => setExpFilter("all")}>
                    {isAr ? EXP_LEVELS[expFilter]?.ar : EXP_LEVELS[expFilter]?.en}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {salaryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10" onClick={() => setSalaryFilter("all")}>
                    {isAr ? SALARY_RANGES.find(s => s.key === salaryFilter)?.ar : SALARY_RANGES.find(s => s.key === salaryFilter)?.en}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-destructive" onClick={clearAllFilters}>{isAr ? "مسح الكل" : "Clear all"}</Button>
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="py-6">
          <div className="max-w-5xl mx-auto px-4">
            {/* Result count + Tabs */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">
                {tab === "postings"
                  ? `${filteredPostings.length} ${isAr ? "وظيفة" : "jobs found"}`
                  : `${filteredChefs.length} ${isAr ? "طاهٍ متاح" : "chefs available"}`
                }
              </p>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="rounded-xl bg-card border border-border/15 p-1 h-auto mb-5">
                <TabsTrigger value="postings" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs px-5 py-2.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {isAr ? "الوظائف" : "Job Postings"}
                  {filteredPostings.length > 0 && <Badge variant="secondary" className="ms-1 text-[10px] px-1.5 h-4">{filteredPostings.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="chefs" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs px-5 py-2.5">
                  <ChefHat className="h-3.5 w-3.5" />
                  {isAr ? "طهاة متاحون" : "Available Talent"}
                  {filteredChefs.length > 0 && <Badge variant="secondary" className="ms-1 text-[10px] px-1.5 h-4">{filteredChefs.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="postings" className="space-y-3">
                {loadingPostings ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl animate-pulse bg-card border border-border/10" />)}</div>
                ) : filteredPostings.length === 0 ? (
                  <EmptyState
                    icon={<Briefcase className="h-12 w-12 text-muted-foreground/20" />}
                    title={isAr ? "لا توجد وظائف" : "No jobs found"}
                    description={isAr ? "جرب تغيير معايير البحث" : "Try adjusting your search or filters"}
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredPostings.map((job: any) => <JobPostingCard key={job.id} job={job} isAr={isAr} />)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="chefs">
                {loadingChefs ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-2xl animate-pulse bg-card border border-border/10" />)}</div>
                ) : filteredChefs.length === 0 ? (
                  <EmptyState
                    icon={<ChefHat className="h-12 w-12 text-muted-foreground/20" />}
                    title={isAr ? "لا يوجد طهاة متاحون" : "No available talent"}
                    description={isAr ? "عُد لاحقاً" : "Check back later"}
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredChefs.map((chef: any) => <AvailableChefCard key={chef.user_id} chef={chef} isAr={isAr} />)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

/* ───── Sub Components ───── */

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
  const isNew = daysAgo <= 3;

  return (
    <Link to={`/jobs/${job.id}`} className="block">
      <Card className={`rounded-2xl border-border/15 hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${
        job.is_featured ? "ring-1 ring-primary/20 bg-primary/[0.02]" : ""
      }`}>
        <div className="absolute top-0 end-0 flex items-center gap-1 p-3">
          {job.is_featured && (
            <Badge className="bg-primary text-primary-foreground text-[9px] font-bold px-2 h-5 rounded-lg gap-0.5">
              <Megaphone className="h-2.5 w-2.5" />{isAr ? "مميزة" : "Featured"}
            </Badge>
          )}
          {isNew && !job.is_featured && (
            <Badge className="bg-[hsl(var(--chart-2))] text-primary-foreground text-[9px] font-bold px-2 h-5 rounded-lg">{isAr ? "جديدة" : "New"}</Badge>
          )}
        </div>

        <CardContent className="p-5">
          <div className="flex gap-4">
            <Avatar className="h-14 w-14 rounded-xl shrink-0 border border-border/10">
              {company?.logo_url && <AvatarImage src={company.logo_url} alt={company.name} />}
              <AvatarFallback className="rounded-xl bg-primary/5 text-primary font-bold text-sm">{(company?.name || "C")[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2.5">
              <div>
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{isAr ? (company?.name_ar || company?.name) : company?.name}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {job.is_salary_visible && job.salary_min && (
                  <span className="text-sm font-bold text-foreground">
                    {job.salary_min.toLocaleString()}{job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : "+"} {job.salary_currency || ""}
                    <span className="text-[10px] text-muted-foreground font-normal"> / {isAr ? "شهرياً" : "mo"}</span>
                  </span>
                )}
                <Badge variant="secondary" className="text-[10px] rounded-lg">{isAr ? typeLabel.ar : typeLabel.en}</Badge>
              </div>

              {job.description && (
                <p className="text-xs text-muted-foreground/50 line-clamp-2">{isAr ? (job.description_ar || job.description) : job.description}</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground/70">
                {location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>}
                {job.experience_level && (
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {isAr ? (EXP_LEVELS[job.experience_level]?.ar || job.experience_level) : (EXP_LEVELS[job.experience_level]?.en || job.experience_level)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{job.applications_count || 0} {isAr ? "متقدم" : "applicants"}</span>
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{job.views_count || 0}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{daysAgo === 0 ? (isAr ? "اليوم" : "Today") : `${daysAgo}d`}</span>
                </div>
                <Button size="sm" className="rounded-xl text-[10px] h-7 px-3 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAr ? "تفاصيل" : "View"} <ArrowRight className="h-3 w-3 ms-1" />
                </Button>
              </div>

              {job.application_deadline && (
                <div className="text-[10px] text-destructive/70 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />{isAr ? "آخر موعد:" : "Deadline:"} {format(new Date(job.application_deadline), "MMM d, yyyy")}
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
      <Card className="rounded-2xl border-border/15 hover:shadow-xl transition-all duration-300 group h-full">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14 rounded-xl shrink-0 ring-2 ring-[hsl(var(--chart-2))]/20">
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
            {chef.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{chef.city}</span>}
            {chef.years_of_experience && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{chef.years_of_experience} {isAr ? "سنة" : "yrs"}</span>}
            {expLabel && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{expLabel}</Badge>}
            {chef.willing_to_relocate && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[hsl(var(--chart-2))]/20 text-[hsl(var(--chart-2))]">
                <Globe className="h-2 w-2 me-0.5" />{isAr ? "انتقال" : "Relocate"}
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
            <p className="text-[10px] text-muted-foreground/50 line-clamp-2 italic border-s-2 border-[hsl(var(--chart-2))]/20 ps-2">"{note}"</p>
          )}

          <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] h-7 font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
            {isAr ? "عرض الملف" : "View Profile"} <ArrowRight className="h-3 w-3 ms-1" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
});
