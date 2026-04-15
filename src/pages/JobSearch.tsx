import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { OpenToWorkBadge } from "@/components/profile/OpenToWorkBadge";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Briefcase, Search, MapPin, Building2, Clock, Users, ChefHat, Filter, DollarSign,
  Utensils, Coffee, Cake, Soup, Salad, Award, GraduationCap, X,
  ArrowRight, Sparkles, Eye, Star, Globe, BarChart3, Megaphone, Home, ChevronRight,
  LayoutGrid, LayoutList, Bell, BellRing, Bookmark, TrendingUp,
  SlidersHorizontal, History, Zap, AlertCircle, Share2, Copy, Check,
  ArrowUpDown, Flame, Target, Crown, ExternalLink, ChevronDown, Command, Loader2, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MS_PER_DAY, MS_PER_WEEK } from "@/lib/constants";
import {
  useJobSearchData,
  JOB_TYPE_LABELS, EXP_LEVELS, CULINARY_CATEGORIES, SALARY_RANGES, ITEMS_PER_PAGE,
} from "./job-search/useJobSearchData";

export default function JobSearch() {
  const {
    isAr, user, searchInputRef,
    search, setSearch, jobTypeFilter, setJobTypeFilter,
    cityFilter, setCityFilter, expFilter, setExpFilter,
    salaryFilter, setSalaryFilter, tab, setTab,
    selectedCategory, setSelectedCategory,
    sortBy, setSortBy, viewMode, setViewMode,
    showSalaryOnly, setShowSalaryOnly,
    showFiltersPanel, setShowFiltersPanel,
    recentSearches, showRecentSearches, setShowRecentSearches,
    visibleCount, setVisibleCount, copiedShare, savedJobs, setSavedJobs,
    handleSearchSubmit, toggleSaveJob, handleShareSearch, clearAllFilters,
    loadingPostings, loadingChefs,
    jobPostings, availableChefs,
    topCompanies, salaryInsights, stats, categoryCounts, cities,
    activeFilterCount,
    filteredPostings, filteredChefs,
    paginatedPostings, hasMoreJobs,
  } = useJobSearchData();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={isAr ? "بحث الوظائف" : "Job Search"}
        description={isAr ? "ابحث وتصفح جميع وظائف الطهي والضيافة" : "Search and browse all culinary and hospitality jobs"}
        keywords={isAr ? "بحث وظائف, وظائف طهي, وظائف ضيافة, فرص عمل, توظيف" : "job search, culinary jobs, hospitality jobs, career opportunities, recruitment"}
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

            {/* Title + stats + share */}
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
              <div className="flex items-center gap-3">
                {stats.urgentCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Flame className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-destructive font-medium">{stats.urgentCount} {isAr ? "عاجلة" : "urgent"}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                  <span className="text-muted-foreground">{stats.totalChefs} {isAr ? "طاهٍ متاح" : "talent"}</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={handleShareSearch}>
                      {copiedShare ? <Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> : <Share2 className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-[12px]">{isAr ? "مشاركة البحث" : "Share search"}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Category pills */}
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
                <span className="text-[12px] opacity-70">({stats.totalJobs})</span>
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
                    {count > 0 && <span className="text-[12px] opacity-60">({count})</span>}
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
                    ref={searchInputRef}
                    className="ps-11 pe-20 h-12 rounded-2xl border-border/20 bg-card shadow-sm text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder={isAr ? "ابحث عن وظيفة، شركة، تخصص، أو مدينة..." : "Search jobs, companies, specializations, or cities..."}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowRecentSearches(!e.target.value); }}
                    onFocus={() => { if (!search) setShowRecentSearches(true); }}
                    onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                  />
                  <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {search ? (
                      <button type="button" onClick={() => setSearch("")} className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/30 bg-muted/30 px-1.5 text-[12px] font-mono text-muted-foreground/50">
                        /
                      </kbd>
                    )}
                  </div>

                  {/* Recent searches dropdown */}
                  {showRecentSearches && recentSearches.length > 0 && (
                    <div className="absolute top-full mt-1.5 start-0 end-0 bg-card border border-border/20 rounded-xl shadow-xl z-50 p-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
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

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-4 rounded-2xl border-border/20 md:hidden relative"
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[12px] font-bold flex items-center justify-center">
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
                      {cities.map((c) => <SelectItem key={c.city} value={c.city}>{c.city} ({c.count})</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center gap-2 rounded-xl border border-border/20 bg-card px-3 h-10">
                  <Switch id="salary-only" checked={showSalaryOnly} onCheckedChange={setShowSalaryOnly} className="scale-75" />
                  <Label htmlFor="salary-only" className="text-[12px] text-muted-foreground cursor-pointer whitespace-nowrap">
                    {isAr ? "الراتب ظاهر فقط" : "With salary only"}
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[140px] rounded-xl border-border/20 bg-card text-xs h-10">
                    <ArrowUpDown className="h-3 w-3 me-1 text-muted-foreground/50" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
                    <SelectItem value="salary">{isAr ? "الأعلى راتباً" : "Highest Salary"}</SelectItem>
                    <SelectItem value="views">{isAr ? "الأكثر مشاهدة" : "Most Viewed"}</SelectItem>
                    <SelectItem value="deadline">{isAr ? "أقرب موعد" : "Soonest Deadline"}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden md:flex items-center border border-border/20 rounded-xl bg-card overflow-hidden h-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => setViewMode("list")} className={cn("h-full px-2.5 transition-colors", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                        <LayoutList className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[12px]">{isAr ? "قائمة" : "List"}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => setViewMode("grid")} className={cn("h-full px-2.5 transition-colors", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[12px]">{isAr ? "شبكة" : "Grid"}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground font-medium">{isAr ? "نشط:" : "Active:"}</span>
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[12px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setSelectedCategory(null)}>
                    {isAr ? CULINARY_CATEGORIES.find(c => c.key === selectedCategory)?.ar : CULINARY_CATEGORIES.find(c => c.key === selectedCategory)?.en}
                    <X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {jobTypeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[12px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setJobTypeFilter("all")}>
                    {isAr ? JOB_TYPE_LABELS[jobTypeFilter]?.ar : JOB_TYPE_LABELS[jobTypeFilter]?.en}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {cityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[12px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setCityFilter("all")}>
                    {cityFilter}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {expFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[12px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setExpFilter("all")}>
                    {isAr ? EXP_LEVELS[expFilter]?.ar : EXP_LEVELS[expFilter]?.en}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {salaryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[12px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setSalaryFilter("all")}>
                    {isAr ? SALARY_RANGES.find(s => s.key === salaryFilter)?.ar : SALARY_RANGES.find(s => s.key === salaryFilter)?.en}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {showSalaryOnly && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-[12px] px-2.5 py-0.5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setShowSalaryOnly(false)}>
                    {isAr ? "الراتب ظاهر" : "With salary"}<X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="text-[12px] h-6 px-2 text-destructive hover:text-destructive" onClick={clearAllFilters}>
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
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <TabsList className="rounded-xl bg-card border border-border/15 p-1 h-auto">
                        <TabsTrigger value="postings" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs px-5 py-2.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {isAr ? "الوظائف" : "Jobs"}
                          {filteredPostings.length > 0 && <Badge variant="secondary" className="ms-1 text-[12px] px-1.5 h-4">{filteredPostings.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="chefs" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs px-5 py-2.5">
                          <ChefHat className="h-3.5 w-3.5" />
                          {isAr ? "المواهب" : "Talent"}
                          {filteredChefs.length > 0 && <Badge variant="secondary" className="ms-1 text-[12px] px-1.5 h-4">{filteredChefs.length}</Badge>}
                        </TabsTrigger>
                      </TabsList>

                      <p className="text-[12px] text-muted-foreground hidden sm:block">
                        {tab === "postings"
                          ? (isAr
                            ? `عرض ${Math.min(visibleCount, filteredPostings.length)} من ${filteredPostings.length}`
                            : `Showing ${Math.min(visibleCount, filteredPostings.length)} of ${filteredPostings.length}`)
                          : `${filteredChefs.length} ${isAr ? "نتيجة" : "results"}`
                        }
                      </p>
                    </div>

                    {/* Job Postings */}
                    <TabsContent value="postings" className="mt-0">
                      {loadingPostings ? (
                        <div className={cn(viewMode === "grid" ? "grid sm:grid-cols-2 gap-3" : "space-y-3")}>
                          {[1,2,3,4,5,6].map(i => <JobCardSkeleton key={i} viewMode={viewMode} />)}
                        </div>
                      ) : filteredPostings.length === 0 ? (
                        <EmptyState isAr={isAr} type="jobs" onClear={clearAllFilters} />
                      ) : (
                        <>
                          <div className={cn(viewMode === "grid" ? "grid sm:grid-cols-2 gap-3" : "space-y-3")}>
                            {paginatedPostings.map((job) => (
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
                          {/* Load More */}
                          {hasMoreJobs && (
                            <div className="mt-6 text-center space-y-3">
                              <Progress value={(visibleCount / filteredPostings.length) * 100} className="h-1 max-w-xs mx-auto" />
                              <Button
                                variant="outline"
                                className="rounded-xl text-xs gap-2 px-8"
                                onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                                {isAr ? `عرض المزيد (${filteredPostings.length - visibleCount} متبقية)` : `Load More (${filteredPostings.length - visibleCount} remaining)`}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>

                    {/* Available Talent */}
                    <TabsContent value="chefs" className="mt-0">
                      {loadingChefs ? (
                        <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(i => <ChefCardSkeleton key={i} />)}</div>
                      ) : filteredChefs.length === 0 ? (
                        <EmptyState isAr={isAr} type="chefs" onClear={clearAllFilters} />
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {filteredChefs.map((chef) => <AvailableChefCard key={chef.user_id} chef={chef} isAr={isAr} />)}
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
                        <p className="text-[12px] text-muted-foreground">{isAr ? "احصل على إشعار فوري" : "Get notified instantly"}</p>
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
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

                {/* Salary Insights */}
                {salaryInsights && (
                  <Card className="rounded-2xl border-border/15">
                    <CardContent className="p-5 space-y-3">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-[hsl(var(--chart-4))]" />
                        {isAr ? "نظرة على الرواتب" : "Salary Insights"}
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] text-muted-foreground">{isAr ? "الأدنى" : "Min"}</span>
                          <span className="text-xs font-bold tabular-nums">{salaryInsights.min.toLocaleString()}</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted/30 overflow-hidden">
                          <div className="absolute inset-y-0 start-0 bg-gradient-to-r from-[hsl(var(--chart-2))] to-[hsl(var(--chart-4))] rounded-full" style={{ width: "100%" }} />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-0.5 bg-foreground rounded-full"
                            style={{ left: `${((salaryInsights.median - salaryInsights.min) / (salaryInsights.max - salaryInsights.min)) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] text-muted-foreground">{isAr ? "الأعلى" : "Max"}</span>
                          <span className="text-xs font-bold tabular-nums">{salaryInsights.max.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-border/10">
                          <Target className="h-3 w-3 text-primary" />
                          <span className="text-[12px] text-muted-foreground">{isAr ? "المتوسط" : "Median"}:</span>
                          <span className="text-xs font-bold text-primary tabular-nums">{salaryInsights.median.toLocaleString()}</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground/50 text-center">
                          {isAr ? `بناءً على ${salaryInsights.count} وظيفة` : `Based on ${salaryInsights.count} jobs`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                      {stats.urgentCount > 0 && <StatRow icon={Flame} label={isAr ? "عاجلة" : "Urgent"} value={stats.urgentCount} accent />}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Hiring Companies */}
                {topCompanies.length > 0 && (
                  <Card className="rounded-2xl border-border/15">
                    <CardContent className="p-5 space-y-3">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-[hsl(var(--chart-4))]" />
                        {isAr ? "أكثر الشركات توظيفاً" : "Top Hiring"}
                      </h4>
                      <div className="space-y-2">
                        {topCompanies.map((c, i) => (
                          <div key={c.name} className="flex items-center gap-2.5 group">
                            <span className="text-[12px] font-bold text-muted-foreground/40 w-3 tabular-nums">{i + 1}</span>
                            <Avatar className="h-7 w-7 rounded-lg shrink-0 border border-border/10">
                              {c.logo && <AvatarImage src={c.logo} alt={c.name} />}
                              <AvatarFallback className="rounded-lg text-[12px] bg-primary/5 text-primary font-bold">{c.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold truncate group-hover:text-primary transition-colors">
                                {isAr ? c.nameAr : c.name}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-[12px] px-1.5 h-4 tabular-nums shrink-0">{c.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Saved Jobs */}
                {savedJobs.size > 0 && (
                  <Card className="rounded-2xl border-[hsl(var(--warning))]/20 bg-[hsl(var(--warning))]/[0.03]">
                    <CardContent className="p-5 space-y-3">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <Bookmark className="h-3.5 w-3.5 text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" />
                        {isAr ? "الوظائف المحفوظة" : "Saved Jobs"}
                      </h4>
                      <p className="text-[12px] text-muted-foreground">
                        {savedJobs.size} {isAr ? "وظيفة محفوظة" : "jobs saved"}
                      </p>
                      <Button variant="outline" size="sm" className="w-full rounded-xl text-[12px] h-7" onClick={() => {
                        setSavedJobs(new Set());
                        localStorage.removeItem("saved-jobs");
                        toast(isAr ? "تم مسح الوظائف المحفوظة" : "Saved jobs cleared");
                      }}>
                        {isAr ? "مسح المحفوظات" : "Clear Saved"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Popular cities */}
                {cities.length > 0 && (
                  <Card className="rounded-2xl border-border/15">
                    <CardContent className="p-5 space-y-3">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[hsl(var(--chart-2))]" />
                        {isAr ? "المدن المتاحة" : "Popular Cities"}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {cities.slice(0, 8).map(({ city, count }) => (
                          <button
                            key={city}
                            onClick={() => setCityFilter(city === cityFilter ? "all" : city)}
                            className={cn(
                              "text-[12px] px-2.5 py-1 rounded-lg border transition-colors",
                              cityFilter === city
                                ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                                : "border-border/20 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                            )}
                          >
                            {city} <span className="opacity-50">({count})</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Employer CTA */}
                <Card className="rounded-2xl border-border/15 bg-gradient-to-br from-muted/20 to-muted/5">
                  <CardContent className="p-5 space-y-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
                      <Building2 className="h-6 w-6 text-primary/60" />
                    </div>
                    <h4 className="text-xs font-bold">{isAr ? "هل أنت صاحب عمل؟" : "Are you an employer?"}</h4>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      {isAr ? "انشر وظيفتك ووصل لأفضل المواهب في مجال الطهي والضيافة" : "Post your job and reach top culinary & hospitality talent"}
                    </p>
                    <Link to="/company-login" className="block">
                      <Button size="sm" className="w-full rounded-xl text-xs gap-1 font-semibold">
                        {isAr ? "انشر وظيفة" : "Post a Job"} <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Keyboard shortcuts hint */}
                <div className="text-center px-4 py-3">
                  <p className="text-[12px] text-muted-foreground/40 flex items-center justify-center gap-2">
                    <kbd className="h-4 px-1 rounded border border-border/20 bg-muted/20 text-[12px] font-mono inline-flex items-center">/</kbd>
                    {isAr ? "للبحث السريع" : "Quick search"}
                    <kbd className="h-4 px-1 rounded border border-border/20 bg-muted/20 text-[12px] font-mono inline-flex items-center">Esc</kbd>
                    {isAr ? "للإغلاق" : "Close"}
                  </p>
                </div>
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

function StatRow({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3 w-3" />{label}
      </span>
      <span className={cn("text-xs font-bold tabular-nums", accent && "text-primary")}>{value}</span>
    </div>
  );
}

function JobCardSkeleton({ viewMode }: { viewMode: "list" | "grid" }) {
  return (
    <div className="rounded-2xl border border-border/10 bg-card p-5 animate-pulse">
      <div className={cn(viewMode === "grid" ? "space-y-3" : "flex gap-4")}>
        <div className={cn("rounded-xl bg-muted/20 shrink-0", viewMode === "grid" ? "h-12 w-12" : "h-14 w-14")} />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-muted/20 rounded-lg w-3/4" />
          <div className="h-3 bg-muted/15 rounded-lg w-1/2" />
          <div className="flex gap-2">
            <div className="h-5 bg-muted/15 rounded-lg w-20" />
            <div className="h-5 bg-muted/15 rounded-lg w-16" />
          </div>
          <div className="h-3 bg-muted/10 rounded-lg w-full" />
          <div className="flex gap-3">
            <div className="h-3 bg-muted/10 rounded w-12" />
            <div className="h-3 bg-muted/10 rounded w-12" />
            <div className="h-3 bg-muted/10 rounded w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChefCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/10 bg-card p-5 animate-pulse space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 rounded-xl bg-muted/20" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted/20 rounded-lg w-2/3" />
          <div className="h-3 bg-muted/15 rounded-lg w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-muted/10 rounded-lg w-full" />
      <div className="flex gap-2">
        <div className="h-4 bg-muted/10 rounded w-16" />
        <div className="h-4 bg-muted/10 rounded w-16" />
      </div>
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
  const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / MS_PER_DAY);
  const isNew = daysAgo <= 3;
  const isUrgent = job.application_deadline && (new Date(job.application_deadline).getTime() - Date.now()) < MS_PER_WEEK && new Date(job.application_deadline) > new Date();

  return (
    <Link to={`/jobs/${job.id}`} className="block">
      <Card className={cn(
        "rounded-2xl border-border/15 hover:shadow-xl transition-all duration-300 group relative overflow-hidden",
        job.is_featured && "ring-1 ring-primary/20 bg-primary/[0.02]",
        isUrgent && "border-destructive/20"
      )}>
        {/* Featured glow */}
        {job.is_featured && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
        )}

        {/* Top badges */}
        <div className="absolute top-0 end-0 flex items-center gap-1 p-3 z-10">
          {job.is_featured && (
            <Badge className="bg-primary text-primary-foreground text-[12px] font-bold px-2 h-5 rounded-lg gap-0.5">
              <Megaphone className="h-2.5 w-2.5" />{isAr ? "مميزة" : "Featured"}
            </Badge>
          )}
          {isNew && !job.is_featured && (
            <Badge className="bg-[hsl(var(--chart-2))] text-primary-foreground text-[12px] font-bold px-2 h-5 rounded-lg">{isAr ? "جديدة" : "New"}</Badge>
          )}
          {isUrgent && (
            <Badge variant="destructive" className="text-[12px] font-bold px-2 h-5 rounded-lg gap-0.5">
              <AlertCircle className="h-2.5 w-2.5" />{isAr ? "عاجل" : "Urgent"}
            </Badge>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={(e) => onToggleSave(job.id, e)}
          className={cn(
            "absolute top-3 start-3 z-10 p-1.5 rounded-lg backdrop-blur-sm border transition-all",
            isSaved
              ? "bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/20"
              : "bg-card/80 border-border/10 hover:bg-card"
          )}
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
                    <span className="text-[12px] text-muted-foreground font-normal"> / {isAr ? "شهرياً" : "mo"}</span>
                  </span>
                )}
                <Badge variant="secondary" className="text-[12px] rounded-lg">{isAr ? typeLabel.ar : typeLabel.en}</Badge>
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
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground/40">
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{job.applications_count || 0}</span>
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{job.views_count || 0}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{daysAgo === 0 ? (isAr ? "اليوم" : "Today") : `${daysAgo}d`}</span>
                </div>
                <Button size="sm" className="rounded-xl text-[12px] h-7 px-3 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAr ? "تفاصيل" : "View"} <ArrowRight className="h-3 w-3 ms-1" />
                </Button>
              </div>

              {job.application_deadline && (
                <div className={cn("text-[12px] flex items-center gap-1", isUrgent ? "text-destructive font-medium" : "text-muted-foreground/50")}>
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

          <div className="flex flex-wrap gap-2 text-[12px] text-muted-foreground/60">
            {chef.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{chef.city}</span>}
            {chef.years_of_experience && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{chef.years_of_experience} {isAr ? "سنة" : "yrs"}</span>}
            {expLabel && <Badge variant="outline" className="text-[12px] px-1.5 py-0 h-4">{expLabel}</Badge>}
            {chef.willing_to_relocate && (
              <Badge variant="outline" className="text-[12px] px-1.5 py-0 h-4 border-[hsl(var(--chart-2))]/20 text-[hsl(var(--chart-2))]">
                <Globe className="h-2 w-2 me-0.5" />{isAr ? "انتقال" : "Relocate"}
              </Badge>
            )}
          </div>

          {(chef.preferred_job_types || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(chef.preferred_job_types as string[]).slice(0, 3).map((t: string) => (
                <Badge key={t} variant="secondary" className="text-[12px] px-1.5 py-0 h-4">
                  {isAr ? (JOB_TYPE_LABELS[t]?.ar || t) : (JOB_TYPE_LABELS[t]?.en || t)}
                </Badge>
              ))}
            </div>
          )}

          {note && (
            <p className="text-[12px] text-muted-foreground/50 line-clamp-2 italic border-s-2 border-[hsl(var(--chart-2))]/20 ps-2">"{note}"</p>
          )}

          <Button variant="outline" size="sm" className="w-full rounded-xl text-[12px] h-7 font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
            {isAr ? "عرض الملف" : "View Profile"} <ArrowRight className="h-3 w-3 ms-1" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
});
