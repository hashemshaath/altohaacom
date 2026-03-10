import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OpenToWorkBadge } from "@/components/profile/OpenToWorkBadge";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Briefcase, Search, MapPin, Building2, Clock, Users, ChefHat, Filter, DollarSign,
  Utensils, Coffee, Cake, Soup, Salad, Award, GraduationCap, X,
  ArrowRight, Sparkles, Eye, Star, Globe, BarChart3, Megaphone, Home, ChevronRight,
  LayoutGrid, LayoutList, Bell, BellRing, Heart, Bookmark, TrendingUp,
  SlidersHorizontal, History, Zap, Share2, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  { key: "chef", icon: ChefHat, en: "Head Chef", ar: "رئيس طهاة", count: 0 },
  { key: "pastry", icon: Cake, en: "Pastry & Bakery", ar: "حلويات ومخابز", count: 0 },
  { key: "restaurant", icon: Utensils, en: "Restaurants", ar: "مطاعم", count: 0 },
  { key: "cafe", icon: Coffee, en: "Cafés & Coffee", ar: "مقاهي وقهوة", count: 0 },
  { key: "catering", icon: Soup, en: "Catering", ar: "تموين وضيافة", count: 0 },
  { key: "nutrition", icon: Salad, en: "Nutrition", ar: "تغذية", count: 0 },
  { key: "consulting", icon: Award, en: "Consulting", ar: "استشارات", count: 0 },
  { key: "training", icon: GraduationCap, en: "Training", ar: "تدريب", count: 0 },
];

const SALARY_RANGES = [
  { key: "0-3000", en: "Up to 3,000", ar: "حتى 3,000" },
  { key: "3000-5000", en: "3,000 – 5,000", ar: "3,000 – 5,000" },
  { key: "5000-8000", en: "5,000 – 8,000", ar: "5,000 – 8,000" },
  { key: "8000+", en: "8,000+", ar: "8,000+" },
];

// Recent searches from localStorage
function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem("job-recent-searches") || "[]").slice(0, 5);
  } catch { return []; }
}
function addRecentSearch(q: string) {
  if (!q.trim()) return;
  const list = getRecentSearches().filter(s => s !== q);
  list.unshift(q);
  localStorage.setItem("job-recent-searches", JSON.stringify(list.slice(0, 5)));
}

export default function JobSearch() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const navigate = useNavigate();
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
  const [sortBy, setSortBy] = useState<"newest" | "salary" | "views">("newest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showSalaryOnly, setShowSalaryOnly] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("saved-jobs") || "[]")); } catch { return new Set(); }
  });

  // Save search on Enter
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      addRecentSearch(search.trim());
      setRecentSearches(getRecentSearches());
      setShowRecentSearches(false);
    }
  }, [search]);

  const toggleSaveJob = useCallback((jobId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
      localStorage.setItem("saved-jobs", JSON.stringify([...next]));
      return next;
    });
  }, []);

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

  // Stats from data
  const stats = useMemo(() => {
    const totalJobs = jobPostings.length;
    const featuredCount = jobPostings.filter((j: any) => j.is_featured).length;
    const newThisWeek = jobPostings.filter((j: any) => {
      const d = Math.floor((Date.now() - new Date(j.created_at).getTime()) / 86400000);
      return d <= 7;
    }).length;
    return { totalJobs, featuredCount, newThisWeek, totalChefs: availableChefs.length };
  }, [jobPostings, availableChefs]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CULINARY_CATEGORIES.forEach(c => { counts[c.key] = 0; });
    jobPostings.forEach((j: any) => {
      CULINARY_CATEGORIES.forEach(c => {
        if (j.specialization?.toLowerCase().includes(c.key) || j.title?.toLowerCase().includes(c.key)) {
          counts[c.key]++;
        }
      });
    });
    return counts;
  }, [jobPostings]);

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
    showSalaryOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setJobTypeFilter("all"); setCityFilter("all"); setExpFilter("all");
    setSalaryFilter("all"); setSelectedCategory(null); setSearch("");
    setShowSalaryOnly(false);
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
    if (showSalaryOnly) results = results.filter((j: any) => j.is_salary_visible && j.salary_min);
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
    if (sortBy === "views") results = [...results].sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0));
    return results;
  }, [jobPostings, search, cityFilter, expFilter, salaryFilter, selectedCategory, sortBy, showSalaryOnly]);

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

        {/* ═══════ SEARCH HEADER ═══════ */}
        <section className="bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background border-b border-border/10">
          <div className="max-w-6xl mx-auto px-4 pt-4 pb-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /></Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              <Link to="/jobs" className="hover:text-primary transition-colors">{isAr ? "الوظائف" : "Jobs"}</Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              <span className="text-foreground font-medium">{isAr ? "بحث" : "Search"}</span>
            </nav>

            {/* Title + stats mini bar */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {isAr ? "بحث الوظائف" : "Job Search"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr 
                    ? `${stats.totalJobs} وظيفة متاحة • ${stats.newThisWeek} جديدة هذا الأسبوع`
                    : `${stats.totalJobs} jobs available • ${stats.newThisWeek} new this week`}
                </p>
              </div>
              {/* Mini stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                  <span className="text-muted-foreground">{stats.totalChefs} {isAr ? "طاهٍ متاح" : "talent available"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">{stats.featuredCount} {isAr ? "مميزة" : "featured"}</span>
                </div>
              </div>
            </div>

            {/* Category pills with counts */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3 mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all touch-manipulation",
                  !selectedCategory
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-card border border-border/20 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
              >
                <Search className="h-3.5 w-3.5" />
                {isAr ? "الكل" : "All"}
                <span className="text-[10px] opacity-70">({stats.totalJobs})</span>
              </button>
              {CULINARY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.key;
                const count = categoryCounts[cat.key] || 0;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(isActive ? null : cat.key)}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all touch-manipulation",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-card border border-border/20 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {isAr ? cat.ar : cat.en}
                    {count > 0 && <span className="text-[10px] opacity-60">({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    className="ps-11 pe-10 h-12 rounded-2xl border-border/20 bg-card shadow-sm text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder={isAr ? "ابحث عن وظيفة، شركة، تخصص، أو مدينة..." : "Search jobs, companies, specializations, or cities..."}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowRecentSearches(!e.target.value); }}
                    onFocus={() => { if (!search) setShowRecentSearches(true); }}
                    onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted transition-colors">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}

                  {/* Recent searches dropdown */}
                  {showRecentSearches && recentSearches.length > 0 && (
                    <div className="absolute top-full mt-1.5 start-0 end-0 bg-card border border-border/20 rounded-xl shadow-xl z-50 p-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <History className="h-3 w-3" />
                        {isAr ? "عمليات بحث سابقة" : "Recent Searches"}
                      </div>
                      {recentSearches.map((rs) => (
                        <button
                          key={rs}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setSearch(rs); setShowRecentSearches(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-start text-sm hover:bg-muted/60 rounded-lg transition-colors"
                        >
                          <Search className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                          <span className="truncate text-foreground">{rs}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter toggle button (mobile) */}
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-4 rounded-2xl border-border/20 md:hidden relative"
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                <Button type="submit" className="h-12 px-6 rounded-2xl font-bold shadow-md shadow-primary/15 hidden sm:flex">
                  <Search className="h-4 w-4 me-2" />
                  {isAr ? "بحث" : "Search"}
                </Button>
              </div>
            </form>

            {/* Desktop filters row */}
            <div className={cn(
              "mt-3 flex flex-col md:flex-row gap-3",
              showFiltersPanel ? "flex" : "hidden md:flex"
            )}>
              <div className="flex gap-2 flex-wrap flex-1">
                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl border-border/20 bg-card text-xs h-10">
                    <Filter className="h-3 w-3 me-1 text-muted-foreground/50" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{isAr ? "نوع العمل" : "Job Type"}</SelectItem>
                    {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={expFilter} onValueChange={setExpFilter}>
                  <SelectTrigger className="w-[120px] rounded-xl border-border/20 bg-card text-xs h-10">
                    <SelectValue placeholder={isAr ? "الخبرة" : "Experience"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{isAr ? "الخبرة" : "Experience"}</SelectItem>
                    {Object.entries(EXP_LEVELS).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={salaryFilter} onValueChange={setSalaryFilter}>
                  <SelectTrigger className="w-[120px] rounded-xl border-border/20 bg-card text-xs h-10">
                    <DollarSign className="h-3 w-3 me-1 text-muted-foreground/50" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{isAr ? "الراتب" : "Salary"}</SelectItem>
                    {SALARY_RANGES.map((s) => <SelectItem key={s.key} value={s.key}>{isAr ? s.ar : s.en}</SelectItem>)}
                  </SelectContent>
                </Select>

                {cities.length > 0 && (
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-[120px] rounded-xl border-border/20 bg-card text-xs h-10">
                      <MapPin className="h-3 w-3 me-1 text-muted-foreground/50" /><SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">{isAr ? "كل المدن" : "All Cities"}</SelectItem>
                      {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                {/* Salary only toggle */}
                <div className="flex items-center gap-2 rounded-xl border border-border/20 bg-card px-3 h-10">
                  <Switch
                    id="salary-only"
                    checked={showSalaryOnly}
                    onCheckedChange={setShowSalaryOnly}
                    className="scale-75"
                  />
                  <Label htmlFor="salary-only" className="text-[10px] text-muted-foreground cursor-pointer whitespace-nowrap">
                    {isAr ? "الراتب ظاهر فقط" : "With salary only"}
                  </Label>
                </div>
              </div>

              {/* Sort + View toggle */}
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[130px] rounded-xl border-border/20 bg-card text-xs h-10">
                    <BarChart3 className="h-3 w-3 me-1 text-muted-foreground/50" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
                    <SelectItem value="salary">{isAr ? "الأعلى راتباً" : "Highest Salary"}</SelectItem>
                    <SelectItem value="views">{isAr ? "الأكثر مشاهدة" : "Most Viewed"}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden md:flex items-center border border-border/20 rounded-xl bg-card overflow-hidden h-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewMode("list")}
                        className={cn("h-full px-2.5 transition-colors", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
                      >
                        <LayoutList className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[10px]">{isAr ? "عرض قائمة" : "List View"}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewMode("grid")}
                        className={cn("h-full px-2.5 transition-colors", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[10px]">{isAr ? "عرض شبكة" : "Grid View"}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground font-medium">{isAr ? "نشط:" : "Active:"}</span>
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setSelectedCategory(null)}>
                    {isAr ? CULINARY_CATEGORIES.find(c => c.key === selectedCategory)?.ar : CULINARY_CATEGORIES.find(c => c.key === selectedCategory)?.en}
                    <X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {jobTypeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setJobTypeFilter("all")}>
                    {isAr ? JOB_TYPE_LABELS[jobTypeFilter]?.ar : JOB_TYPE_LABELS[jobTypeFilter]?.en}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {cityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setCityFilter("all")}>
                    {cityFilter}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {expFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setExpFilter("all")}>
                    {isAr ? EXP_LEVELS[expFilter]?.ar : EXP_LEVELS[expFilter]?.en}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {salaryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setSalaryFilter("all")}>
                    {isAr ? SALARY_RANGES.find(s => s.key === salaryFilter)?.ar : SALARY_RANGES.find(s => s.key === salaryFilter)?.en}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {showSalaryOnly && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setShowSalaryOnly(false)}>
                    {isAr ? "الراتب ظاهر" : "With salary"}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-destructive hover:text-destructive" onClick={clearAllFilters}>
                  {isAr ? "مسح الكل" : "Clear all"}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ═══════ RESULTS AREA ═══════ */}
        <section className="py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-[1fr_280px] gap-6">
              {/* Main content */}
              <div>
                {/* Tabs + result info */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <TabsList className="rounded-xl bg-card border border-border/15 p-1 h-auto">
                        <TabsTrigger value="postings" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs px-5 py-2.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {isAr ? "الوظائف" : "Jobs"}
                          {filteredPostings.length > 0 && <Badge variant="secondary" className="ms-1 text-[10px] px-1.5 h-4">{filteredPostings.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="chefs" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs px-5 py-2.5">
                          <ChefHat className="h-3.5 w-3.5" />
                          {isAr ? "المواهب" : "Talent"}
                          {filteredChefs.length > 0 && <Badge variant="secondary" className="ms-1 text-[10px] px-1.5 h-4">{filteredChefs.length}</Badge>}
                        </TabsTrigger>
                      </TabsList>

                      <p className="text-[11px] text-muted-foreground hidden sm:block">
                        {tab === "postings"
                          ? `${filteredPostings.length} ${isAr ? "نتيجة" : "results"}`
                          : `${filteredChefs.length} ${isAr ? "نتيجة" : "results"}`
                        }
                      </p>
                    </div>

                    {/* Job Postings */}
                    <TabsContent value="postings" className="mt-0">
                      {loadingPostings ? (
                        <div className={cn(
                          viewMode === "grid" ? "grid sm:grid-cols-2 gap-3" : "space-y-3"
                        )}>
                          {[1,2,3,4].map(i => <div key={i} className="h-40 rounded-2xl animate-pulse bg-card border border-border/10" />)}
                        </div>
                      ) : filteredPostings.length === 0 ? (
                        <EmptyState isAr={isAr} type="jobs" onClear={clearAllFilters} />
                      ) : (
                        <div className={cn(
                          viewMode === "grid" ? "grid sm:grid-cols-2 gap-3" : "space-y-3"
                        )}>
                          {filteredPostings.map((job: any) => (
                            <JobPostingCard
                              key={job.id}
                              job={job}
                              isAr={isAr}
                              viewMode={viewMode}
                              isSaved={savedJobs.has(job.id)}
                              onToggleSave={toggleSaveJob}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Available Talent */}
                    <TabsContent value="chefs" className="mt-0">
                      {loadingChefs ? (
                        <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl animate-pulse bg-card border border-border/10" />)}</div>
                      ) : filteredChefs.length === 0 ? (
                        <EmptyState isAr={isAr} type="chefs" onClear={clearAllFilters} />
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {filteredChefs.map((chef: any) => <AvailableChefCard key={chef.user_id} chef={chef} isAr={isAr} />)}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* ═══════ SIDEBAR ═══════ */}
              <aside className="space-y-4 hidden md:block">
                {/* Job Alert CTA */}
                <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                        <BellRing className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">{isAr ? "تنبيهات الوظائف" : "Job Alerts"}</h4>
                        <p className="text-[10px] text-muted-foreground">{isAr ? "احصل على إشعار فوري" : "Get notified instantly"}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {isAr
                        ? "فعّل تنبيهات الوظائف واحصل على إشعارات فورية عند نشر وظائف جديدة تطابق اهتماماتك"
                        : "Enable job alerts and get instant notifications when new jobs matching your interests are posted"}
                    </p>
                    {user ? (
                      <Button size="sm" className="w-full rounded-xl text-xs gap-1.5 font-semibold">
                        <Bell className="h-3.5 w-3.5" />
                        {isAr ? "تفعيل التنبيهات" : "Enable Alerts"}
                      </Button>
                    ) : (
                      <Link to="/login" className="block">
                        <Button size="sm" variant="outline" className="w-full rounded-xl text-xs gap-1.5 font-semibold">
                          {isAr ? "سجّل دخول لتفعيل" : "Sign in to enable"}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="rounded-2xl border-border/15">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="text-xs font-bold flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "إحصائيات سريعة" : "Quick Stats"}
                    </h4>
                    <div className="space-y-3">
                      <StatRow icon={Briefcase} label={isAr ? "إجمالي الوظائف" : "Total Jobs"} value={stats.totalJobs} />
                      <StatRow icon={Zap} label={isAr ? "جديدة هذا الأسبوع" : "New This Week"} value={stats.newThisWeek} accent />
                      <StatRow icon={Sparkles} label={isAr ? "وظائف مميزة" : "Featured"} value={stats.featuredCount} />
                      <StatRow icon={Users} label={isAr ? "مواهب متاحة" : "Available Talent"} value={stats.totalChefs} />
                    </div>
                  </CardContent>
                </Card>

                {/* Saved Jobs */}
                {savedJobs.size > 0 && (
                  <Card className="rounded-2xl border-border/15">
                    <CardContent className="p-5 space-y-3">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <Bookmark className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
                        {isAr ? "الوظائف المحفوظة" : "Saved Jobs"}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {savedJobs.size} {isAr ? "وظيفة محفوظة" : "jobs saved"}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Popular cities */}
                {cities.length > 0 && (
                  <Card className="rounded-2xl border-border/15">
                    <CardContent className="p-5 space-y-3">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[hsl(var(--chart-2))]" />
                        {isAr ? "المدن المتاحة" : "Available Cities"}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {cities.slice(0, 8).map((city) => (
                          <button
                            key={city}
                            onClick={() => setCityFilter(city === cityFilter ? "all" : city)}
                            className={cn(
                              "text-[10px] px-2.5 py-1 rounded-lg border transition-colors",
                              cityFilter === city
                                ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                                : "border-border/20 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                            )}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Employer CTA */}
                <Card className="rounded-2xl border-border/15 bg-muted/20">
                  <CardContent className="p-5 space-y-3 text-center">
                    <Building2 className="h-8 w-8 mx-auto text-muted-foreground/30" />
                    <h4 className="text-xs font-bold">{isAr ? "هل أنت صاحب عمل؟" : "Are you an employer?"}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {isAr ? "انشر وظيفتك ووصل لأفضل المواهب" : "Post your job and reach top talent"}
                    </p>
                    <Link to="/company-login" className="block">
                      <Button variant="outline" size="sm" className="w-full rounded-xl text-xs gap-1 font-semibold">
                        {isAr ? "انشر وظيفة" : "Post a Job"} <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

/* ───── Sub Components ───── */

function StatRow({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3 w-3" />{label}
      </span>
      <span className={cn("text-xs font-bold tabular-nums", accent && "text-primary")}>{value}</span>
    </div>
  );
}

function EmptyState({ isAr, type, onClear }: { isAr: boolean; type: "jobs" | "chefs"; onClear: () => void }) {
  return (
    <Card className="rounded-2xl border-border/15">
      <CardContent className="py-20 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/10 mx-auto">
          {type === "jobs" ? <Briefcase className="h-7 w-7 text-muted-foreground/25" /> : <ChefHat className="h-7 w-7 text-muted-foreground/25" />}
        </div>
        <div className="space-y-1.5">
          <p className="font-bold text-sm">
            {type === "jobs" ? (isAr ? "لم نجد وظائف تطابق بحثك" : "No jobs match your search") : (isAr ? "لا يوجد طهاة متاحون حالياً" : "No available talent right now")}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {type === "jobs"
              ? (isAr ? "جرب تغيير الفلاتر أو استخدم كلمات بحث مختلفة" : "Try adjusting filters or using different search terms")
              : (isAr ? "عُد لاحقاً للاطلاع على المواهب الجديدة" : "Check back later for new talent")}
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={onClear}>
            <X className="h-3 w-3" />
            {isAr ? "مسح الفلاتر" : "Clear Filters"}
          </Button>
          <Link to="/jobs">
            <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1">
              {isAr ? "العودة" : "Back to Jobs"} <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

const JobPostingCard = memo(function JobPostingCard({ job, isAr, viewMode, isSaved, onToggleSave }: {
  job: any; isAr: boolean; viewMode: "list" | "grid"; isSaved: boolean; onToggleSave: (id: string, e: React.MouseEvent) => void;
}) {
  const company = job.companies;
  const title = isAr ? (job.title_ar || job.title) : job.title;
  const location = isAr ? (job.location_ar || job.location) : job.location;
  const typeLabel = JOB_TYPE_LABELS[job.job_type] || { en: job.job_type, ar: job.job_type };
  const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000);
  const isNew = daysAgo <= 3;
  const isUrgent = job.application_deadline && (new Date(job.application_deadline).getTime() - Date.now()) < 7 * 86400000 && new Date(job.application_deadline) > new Date();

  return (
    <Link to={`/jobs/${job.id}`} className="block">
      <Card className={cn(
        "rounded-2xl border-border/15 hover:shadow-xl transition-all duration-300 group relative overflow-hidden",
        job.is_featured && "ring-1 ring-primary/20 bg-primary/[0.02]",
        isUrgent && "border-destructive/20"
      )}>
        {/* Top badges */}
        <div className="absolute top-0 end-0 flex items-center gap-1 p-3 z-10">
          {job.is_featured && (
            <Badge className="bg-primary text-primary-foreground text-[9px] font-bold px-2 h-5 rounded-lg gap-0.5">
              <Megaphone className="h-2.5 w-2.5" />{isAr ? "مميزة" : "Featured"}
            </Badge>
          )}
          {isNew && !job.is_featured && (
            <Badge className="bg-[hsl(var(--chart-2))] text-primary-foreground text-[9px] font-bold px-2 h-5 rounded-lg">{isAr ? "جديدة" : "New"}</Badge>
          )}
          {isUrgent && (
            <Badge variant="destructive" className="text-[9px] font-bold px-2 h-5 rounded-lg gap-0.5">
              <AlertCircle className="h-2.5 w-2.5" />{isAr ? "عاجل" : "Urgent"}
            </Badge>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={(e) => onToggleSave(job.id, e)}
          className="absolute top-3 start-3 z-10 p-1.5 rounded-lg bg-card/80 backdrop-blur-sm border border-border/10 hover:bg-card transition-colors"
        >
          <Bookmark className={cn("h-3.5 w-3.5 transition-colors", isSaved ? "text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" : "text-muted-foreground/40")} />
        </button>

        <CardContent className="p-5">
          <div className={cn(viewMode === "grid" ? "space-y-3" : "flex gap-4")}>
            <Avatar className={cn("rounded-xl shrink-0 border border-border/10", viewMode === "grid" ? "h-12 w-12" : "h-14 w-14")}>
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

              {viewMode === "list" && job.description && (
                <p className="text-xs text-muted-foreground/50 line-clamp-2">{isAr ? (job.description_ar || job.description) : job.description}</p>
              )}

              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground/70">
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
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{job.applications_count || 0}</span>
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{job.views_count || 0}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{daysAgo === 0 ? (isAr ? "اليوم" : "Today") : `${daysAgo}d`}</span>
                </div>
                <Button size="sm" className="rounded-xl text-[10px] h-7 px-3 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAr ? "تفاصيل" : "View"} <ArrowRight className="h-3 w-3 ms-1" />
                </Button>
              </div>

              {job.application_deadline && (
                <div className={cn("text-[10px] flex items-center gap-1", isUrgent ? "text-destructive font-medium" : "text-muted-foreground/50")}>
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
