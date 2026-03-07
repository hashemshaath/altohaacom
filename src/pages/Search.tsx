import { useState, useEffect, lazy, Suspense, createContext, useContext } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Search as SearchIcon,
  Calendar,
  MapPin,
  Globe,
  User,
  FileText,
  Trophy,
  Filter,
  X,
  CheckCircle2,
  Clock,
  Trash2,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Building2,
  UtensilsCrossed,
  Star,
  Ticket,
  Bookmark,
} from "lucide-react";
import { format } from "date-fns";
import { useGlobalSearch, type SearchFilters } from "@/hooks/useGlobalSearch";
import { getRecentSearches, addRecentSearch, clearRecentSearches, addSavedSearch, getSavedSearches, removeSavedSearch } from "@/lib/recentSearches";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { HighlightText } from "@/components/search/HighlightText";
import { VoiceSearchButton } from "@/components/search/VoiceSearchButton";
import type { Database } from "@/integrations/supabase/types";

const AISearchPanel = lazy(() => import("@/components/search/AISearchPanel").then(m => ({ default: m.AISearchPanel })));

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

const statusLabelsEn: Record<CompetitionStatus, string> = {
  pending: "Pending",
  draft: "Draft",
  upcoming: "Upcoming",
  registration_open: "Registration Open",
  registration_closed: "Registration Closed",
  in_progress: "In Progress",
  judging: "Judging",
  completed: "Completed",
  cancelled: "Cancelled",
};

const SearchQueryContext = createContext("");
function useSearchQuery() { return useContext(SearchQueryContext); }

export default function Search() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const {
    filters,
    updateFilter,
    resetFilters,
    results,
    totalResults,
    isLoading,
  } = useGlobalSearch();

  // Read URL params on mount and when they change
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const type = (searchParams.get("type") || searchParams.get("tab") || "all") as SearchFilters["type"];
    if (query) {
      updateFilter("query", query);
      addRecentSearch(query);
      setRecentSearches(getRecentSearches());
    }
    if (type && type !== "all") updateFilter("type", type);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.type !== "all") params.set("type", filters.type);
    setSearchParams(params, { replace: true });
  }, [filters.query, filters.type]);

  const handleSearch = (value: string) => {
    updateFilter("query", value);
    setShowSuggestions(value.length >= 1);
    if (value.trim().length >= 2) {
      addRecentSearch(value.trim());
      setRecentSearches(getRecentSearches());
    }
  };

  const handleSuggestionSelect = (term: string) => {
    updateFilter("query", term);
    setShowSuggestions(false);
    addRecentSearch(term);
    setRecentSearches(getRecentSearches());
  };

  const handleSaveSearch = () => {
    if (filters.query.trim()) {
      addSavedSearch(filters.query.trim());
    }
  };

  const handleRecentClick = (term: string) => {
    updateFilter("query", term);
    addRecentSearch(term);
    setRecentSearches(getRecentSearches());
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const getStatusLabel = (status: CompetitionStatus): string => {
    const labels: Record<CompetitionStatus, string> = {
      pending: t("pending"),
      draft: t("draft"),
      upcoming: t("upcoming"),
      registration_open: t("registrationOpen"),
      registration_closed: t("registrationClosed"),
      in_progress: t("inProgress"),
      judging: t("judging"),
      completed: t("completed"),
      cancelled: t("cancelled"),
    };
    return labels[status];
  };

  // Flatten all results into a unified list for "all" tab (Google-style)
  const allItems: { type: string; data: any }[] = [];
  if (filters.type === "all" || filters.type === "competitions") {
    results.competitions.forEach((c) => allItems.push({ type: "competition", data: c }));
  }
  if (filters.type === "all" || filters.type === "articles") {
    results.articles.forEach((a) => allItems.push({ type: "article", data: a }));
  }
  if (filters.type === "all" || filters.type === "members") {
    results.members.forEach((m) => allItems.push({ type: "member", data: m }));
  }
  if (filters.type === "all" || filters.type === "posts") {
    results.posts.forEach((p) => allItems.push({ type: "post", data: p }));
  }
  if (filters.type === "all" || filters.type === "recipes") {
    results.recipes.forEach((r) => allItems.push({ type: "recipe", data: r }));
  }
  if (filters.type === "all" || filters.type === "exhibitions") {
    results.exhibitions.forEach((e) => allItems.push({ type: "exhibition", data: e }));
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Search bar — sticky top, Google-style */}
        <div className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md">
          <div className="container max-w-3xl py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <SearchIcon className="absolute start-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder={isAr ? "ابحث عن مسابقات، طهاة، مقالات، معارض..." : "Search competitions, chefs, articles, exhibitions..."}
                  value={filters.query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="ps-11 pe-20 h-11 rounded-full border-border/80 bg-muted/30 text-base shadow-sm focus-visible:bg-background focus-visible:shadow-md"
                  autoFocus
                />
                <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {filters.query && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-7 w-7 rounded-full"
                        onClick={handleSaveSearch}
                        title={isAr ? "حفظ البحث" : "Save search"}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-7 w-7 rounded-full"
                        onClick={() => handleSearch("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <SearchSuggestions
                  query={filters.query}
                  isOpen={showSuggestions}
                  onSelect={handleSuggestionSelect}
                  onClose={() => setShowSuggestions(false)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                type="button"
                className="h-11 w-11 rounded-full shrink-0"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <VoiceSearchButton onResult={(text) => handleSearch(text)} />
            </form>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <p className="text-[10px] text-muted-foreground">
                {isAr ? "اضغط" : "Press"}{" "}
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-mono">⌘K</kbd>{" "}
                {isAr ? "للبحث السريع من أي مكان" : "for quick search anywhere"}
              </p>
            </div>

            {/* Tabs — horizontal pills like Google */}
            <Tabs
              value={filters.type}
              onValueChange={(v) => updateFilter("type", v as SearchFilters["type"])}
              className="mt-3"
            >
              <TabsList className="h-auto bg-transparent p-0 gap-1">
                 {[
                   { value: "all", icon: SearchIcon, label: isAr ? "الكل" : "All", count: totalResults },
                   { value: "competitions", icon: Trophy, label: isAr ? "المسابقات" : "Competitions", count: results.competitions.length },
                   { value: "exhibitions", icon: Ticket, label: isAr ? "المعارض" : "Exhibitions", count: results.exhibitions.length },
                   { value: "articles", icon: FileText, label: isAr ? "المقالات" : "Articles", count: results.articles.length },
                   { value: "members", icon: User, label: isAr ? "الأعضاء" : "Members", count: results.members.length },
                   { value: "entities", icon: Building2, label: isAr ? "الجهات" : "Organizations", count: results.entities.length },
                   { value: "recipes", icon: UtensilsCrossed, label: isAr ? "الوصفات" : "Recipes", count: results.recipes.length },
                   { value: "posts", icon: MessageSquare, label: isAr ? "المنشورات" : "Posts", count: results.posts.length },
                 ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-full px-3.5 py-1.5 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-1.5"
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {filters.query && (
                      <span className="text-[10px] opacity-70">({tab.count})</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-b border-border/40 bg-muted/20">
            <div className="container max-w-3xl py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{isAr ? "تصفية" : "Filters"}</h3>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={resetFilters}>
                  {isAr ? "إعادة تعيين" : "Reset"}
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(filters.type === "all" || filters.type === "competitions") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "حالة المسابقة" : "Status"}</Label>
                    <Select value={filters.competitionStatus || "all"} onValueChange={(v) => updateFilter("competitionStatus", v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                        <SelectItem value="upcoming">{t("upcoming")}</SelectItem>
                        <SelectItem value="registration_open">{t("registrationOpen")}</SelectItem>
                        <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                        <SelectItem value="completed">{t("completed")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(filters.type === "all" || filters.type === "competitions") && (
                  <div className="flex items-end gap-2 pb-0.5">
                    <Checkbox id="virtual" checked={filters.isVirtual === true} onCheckedChange={(c) => updateFilter("isVirtual", c ? true : null)} />
                    <Label htmlFor="virtual" className="text-xs cursor-pointer">{isAr ? "افتراضي فقط" : "Virtual only"}</Label>
                  </div>
                )}
                {(filters.type === "all" || filters.type === "articles") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "نوع المقال" : "Article type"}</Label>
                    <Select value={filters.articleType || "all"} onValueChange={(v) => updateFilter("articleType", v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                        <SelectItem value="news">{isAr ? "أخبار" : "News"}</SelectItem>
                        <SelectItem value="blog">{isAr ? "مدونة" : "Blog"}</SelectItem>
                        <SelectItem value="exhibition">{isAr ? "معارض" : "Exhibition"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(filters.type === "all" || filters.type === "members") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "مستوى الخبرة" : "Experience"}</Label>
                    <Select value={filters.experienceLevel || "all"} onValueChange={(v) => updateFilter("experienceLevel", v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                        <SelectItem value="beginner">{t("beginner")}</SelectItem>
                        <SelectItem value="amateur">{t("amateur")}</SelectItem>
                        <SelectItem value="professional">{t("professional")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results area */}
        <div className="container max-w-3xl py-6 pb-24 md:pb-6">
          {/* AI Search Panel */}
          {filters.query && filters.query.trim().length >= 2 && (
            <div className="mb-5">
              <Suspense fallback={null}>
                <AISearchPanel query={filters.query} />
              </Suspense>
            </div>
          )}

          {/* Results count */}
          {filters.query && !isLoading && (
            <p className="text-xs text-muted-foreground mb-5">
              {isAr
                ? `حوالي ${totalResults} نتيجة`
                : `About ${totalResults} results`}
            </p>
          )}

          {isLoading ? (
            <GoogleSkeleton />
          ) : !filters.query ? (
            <RecentSearchesPanel
              recentSearches={recentSearches}
              onRecentClick={handleRecentClick}
              onClear={handleClearRecent}
              isAr={isAr}
            />
          ) : totalResults === 0 ? (
            <EmptySearch isAr={isAr} query={filters.query} />
          ) : (
            <div className="space-y-6">
              {/* ALL tab — unified list */}
              {filters.type === "all" && (
                <>
                  {results.competitions.length > 0 && (
                    <ResultSection
                      icon={<Trophy className="h-4 w-4" />}
                      title={isAr ? "المسابقات" : "Competitions"}
                      count={results.competitions.length}
                      onViewAll={() => updateFilter("type", "competitions")}
                      isAr={isAr}
                    >
                      {results.competitions.slice(0, 5).map((c) => (
                        <CompetitionRow key={c.id} data={c} isAr={isAr} getStatusLabel={getStatusLabel} />
                      ))}
                    </ResultSection>
                  )}
                  {results.articles.length > 0 && (
                    <ResultSection
                      icon={<FileText className="h-4 w-4" />}
                      title={isAr ? "المقالات" : "Articles"}
                      count={results.articles.length}
                      onViewAll={() => updateFilter("type", "articles")}
                      isAr={isAr}
                    >
                      {results.articles.slice(0, 5).map((a) => (
                        <ArticleRow key={a.id} data={a} isAr={isAr} />
                      ))}
                    </ResultSection>
                  )}
                  {results.members.length > 0 && (
                    <ResultSection
                      icon={<User className="h-4 w-4" />}
                      title={isAr ? "الأعضاء" : "Members"}
                      count={results.members.length}
                      onViewAll={() => updateFilter("type", "members")}
                      isAr={isAr}
                    >
                      {results.members.slice(0, 5).map((m) => (
                        <MemberRow key={m.id} data={m} isAr={isAr} />
                      ))}
                    </ResultSection>
                  )}
                  {results.entities.length > 0 && (
                    <ResultSection
                      icon={<Building2 className="h-4 w-4" />}
                      title={isAr ? "الجهات والمؤسسات" : "Organizations"}
                      count={results.entities.length}
                      onViewAll={() => updateFilter("type", "entities")}
                      isAr={isAr}
                    >
                      {results.entities.slice(0, 5).map((e) => (
                        <EntityRow key={`${e.source}-${e.id}`} data={e} isAr={isAr} />
                      ))}
                    </ResultSection>
                  )}
                  {results.posts.length > 0 && (
                    <ResultSection
                      icon={<MessageSquare className="h-4 w-4" />}
                      title={isAr ? "المنشورات" : "Posts"}
                      count={results.posts.length}
                      onViewAll={() => updateFilter("type", "posts")}
                      isAr={isAr}
                    >
                      {results.posts.slice(0, 5).map((p) => (
                        <PostRow key={p.id} data={p} isAr={isAr} />
                      ))}
                    </ResultSection>
                  )}
                  {results.recipes.length > 0 && (
                    <ResultSection
                      icon={<UtensilsCrossed className="h-4 w-4" />}
                      title={isAr ? "الوصفات" : "Recipes"}
                      count={results.recipes.length}
                      onViewAll={() => updateFilter("type", "recipes")}
                      isAr={isAr}
                    >
                      {results.recipes.slice(0, 5).map((r) => (
                        <RecipeRow key={r.id} data={r} isAr={isAr} />
                      ))}
                    </ResultSection>
                   )}
                  {results.exhibitions.length > 0 && (
                    <ResultSection
                      icon={<Ticket className="h-4 w-4" />}
                      title={isAr ? "المعارض والفعاليات" : "Exhibitions & Events"}
                      count={results.exhibitions.length}
                      onViewAll={() => updateFilter("type", "exhibitions")}
                      isAr={isAr}
                    >
                      {results.exhibitions.slice(0, 5).map((e) => (
                        <ExhibitionRow key={e.id} data={e} isAr={isAr} />
                      ))}
                    </ResultSection>
                  )}
                </>
              )}

              {/* Individual tabs */}
              {filters.type === "competitions" &&
                results.competitions.map((c) => (
                  <CompetitionRow key={c.id} data={c} isAr={isAr} getStatusLabel={getStatusLabel} />
                ))}
              {filters.type === "exhibitions" &&
                results.exhibitions.map((e) => (
                  <ExhibitionRow key={e.id} data={e} isAr={isAr} />
                ))}
              {filters.type === "articles" &&
                results.articles.map((a) => (
                  <ArticleRow key={a.id} data={a} isAr={isAr} />
                ))}
              {filters.type === "members" &&
                results.members.map((m) => (
                  <MemberRow key={m.id} data={m} isAr={isAr} />
                ))}
              {filters.type === "entities" &&
                results.entities.map((e) => (
                  <EntityRow key={`${e.source}-${e.id}`} data={e} isAr={isAr} />
                ))}
              {filters.type === "recipes" &&
                results.recipes.map((r) => (
                  <RecipeRow key={r.id} data={r} isAr={isAr} />
                ))}
              {filters.type === "posts" &&
                results.posts.map((p) => (
                  <PostRow key={p.id} data={p} isAr={isAr} />
                ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ──────────────── Result Section (grouped heading) ──────────────── */
function ResultSection({
  icon,
  title,
  count,
  onViewAll,
  isAr,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  onViewAll: () => void;
  isAr: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
          <span className="text-xs font-normal text-muted-foreground">({count})</span>
        </div>
        {count > 5 && (
          <button onClick={onViewAll} className="text-xs text-primary hover:underline font-medium">
            {isAr ? "عرض الكل" : "View all"} →
          </button>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

/* ──────────────── Competition Row ──────────────── */
function CompetitionRow({
  data,
  isAr,
  getStatusLabel,
}: {
  data: any;
  isAr: boolean;
  getStatusLabel: (s: CompetitionStatus) => string;
}) {
  const title = isAr && data.title_ar ? data.title_ar : data.title;
  const desc = isAr && data.description_ar ? data.description_ar : data.description;
  const venue = isAr && data.venue_ar ? data.venue_ar : data.venue;
  const location = [venue, data.city, data.country].filter(Boolean).join(" · ");

  return (
    <Link
      to={`/competitions/${data.id}`}
      className="group block rounded-xl px-4 py-3 -mx-2 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-xl bg-primary/10 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
          {data.cover_image_url ? (
            <img src={data.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Trophy className="h-4.5 w-4.5 text-primary/60" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            <Trophy className="h-3 w-3" />
            <span>{isAr ? "مسابقة" : "Competition"}</span>
            <span className="mx-0.5">›</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 font-normal">
              {getStatusLabel(data.status)}
            </Badge>
          </div>
          {/* Title */}
          <h3 className="text-base font-medium text-primary group-hover:underline line-clamp-1">
            {title}
          </h3>
          {/* Snippet */}
          {desc && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {desc}
            </p>
          )}
          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground/80">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(data.competition_start), "MMM d, yyyy")}
            </span>
            {data.is_virtual ? (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {isAr ? "افتراضي" : "Virtual"}
              </span>
            ) : location ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{location}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ──────────────── Article Row ──────────────── */
function ArticleRow({ data, isAr }: { data: any; isAr: boolean }) {
  const title = isAr && data.title_ar ? data.title_ar : data.title;
  const excerpt = isAr && data.excerpt_ar ? data.excerpt_ar : data.excerpt;

  return (
    <Link
      to={`/news/${data.slug}`}
      className="group block rounded-xl px-4 py-3 -mx-2 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/30 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
          {data.featured_image_url ? (
            <img src={data.featured_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <FileText className="h-4.5 w-4.5 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            <FileText className="h-3 w-3" />
            <span>{isAr ? "مقال" : "Article"}</span>
            <span className="mx-0.5">›</span>
            <span className="capitalize">{data.type}</span>
          </div>
          <h3 className="text-base font-medium text-primary group-hover:underline line-clamp-1">
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {excerpt}
            </p>
          )}
          {data.published_at && (
            <p className="text-xs text-muted-foreground/70 mt-1.5">
              {format(new Date(data.published_at), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ──────────────── Member Row ──────────────── */
function MemberRow({ data, isAr }: { data: any; isAr: boolean }) {
  const displayName = isAr
    ? data.display_name_ar || data.full_name_ar || data.display_name || data.full_name || data.username || "?"
    : data.display_name || data.full_name || data.display_name_ar || data.full_name_ar || data.username || "?";
  const spec = isAr ? (data.specialization_ar || data.specialization) : (data.specialization || data.specialization_ar);
  const bio = isAr ? (data.bio_ar || data.bio) : (data.bio || data.bio_ar);
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Link
      to={`/${data.username || data.user_id}`}
      className="group block rounded-xl px-4 py-3 -mx-2 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0 mt-0.5">
          <AvatarImage src={data.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            <User className="h-3 w-3" />
            <span>{isAr ? "عضو" : "Member"}</span>
            {data.username && (
              <>
                <span className="mx-0.5">›</span>
                <span>@{data.username}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-medium text-primary group-hover:underline line-clamp-1">
              {displayName}
            </h3>
            {data.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
          </div>
          {(spec || bio) && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {spec && <span className="font-medium">{spec}</span>}
              {spec && bio && " — "}
              {bio}
            </p>
          )}
          {data.location && (
            <p className="text-xs text-muted-foreground/70 mt-1.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {data.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ──────────────── Post Row ──────────────── */
function PostRow({ data, isAr }: { data: any; isAr: boolean }) {
  return (
    <Link
      to="/community"
      className="group block rounded-xl px-4 py-3 -mx-2 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0 mt-0.5">
          <AvatarImage src={data.author_avatar || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {(data.author_name || "C")[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            <MessageSquare className="h-3 w-3" />
            <span>{isAr ? "منشور" : "Post"}</span>
            {data.author_username && (
              <>
                <span className="mx-0.5">›</span>
                <span>@{data.author_username}</span>
              </>
            )}
          </div>
          <h3 className="text-sm font-medium text-foreground line-clamp-1">
            {data.author_name || (isAr ? "طاهٍ" : "Chef")}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mt-0.5 leading-relaxed whitespace-pre-wrap">
            {data.content}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1.5">
            {format(new Date(data.created_at), "MMM d, yyyy")}
          </p>
        </div>
        {data.image_url && (
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
            <img src={data.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </Link>
  );
}

/* ──────────────── Recipe Row ──────────────── */
function RecipeRow({ data, isAr }: { data: any; isAr: boolean }) {
  const title = isAr && data.title_ar ? data.title_ar : data.title;
  const desc = isAr && data.description_ar ? data.description_ar : data.description;
  const totalTime = (data.prep_time || 0) + (data.cook_time || 0);

  return (
    <Link
      to={`/recipes/${data.slug || data.id}`}
      className="group block rounded-xl px-4 py-3 -mx-2 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-accent/30 shrink-0 overflow-hidden mt-0.5">
          {data.image_url ? (
            <img src={data.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            <UtensilsCrossed className="h-3 w-3" />
            <span>{isAr ? "وصفة" : "Recipe"}</span>
          </div>
          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
          {desc && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{desc}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground/70">
            {totalTime > 0 && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {totalTime} {isAr ? "دقيقة" : "min"}
              </span>
            )}
            {data.average_rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-chart-4" />
                {data.average_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ──────────────── Exhibition Row ──────────────── */
function ExhibitionRow({ data, isAr }: { data: any; isAr: boolean }) {
  const title = isAr && data.title_ar ? data.title_ar : data.title;
  const desc = isAr && data.description_ar ? data.description_ar : data.description;
  const venue = isAr && data.venue_ar ? data.venue_ar : data.venue;
  const location = [venue, data.city, data.country].filter(Boolean).join(" · ");
  return (
    <Link to={`/exhibitions/${data.slug || data.id}`} className="group block rounded-xl px-4 py-3 -mx-2 transition-colors hover:bg-accent/40">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-chart-5/10 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
          {data.cover_image_url ? <img src={data.cover_image_url} alt="" className="w-full h-full object-cover" /> : <Ticket className="h-4 w-4 text-chart-5/60" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            <Ticket className="h-3 w-3" /><span>{isAr ? "معرض" : "Exhibition"}</span>
          </div>
          <h3 className="text-base font-medium text-primary group-hover:underline line-clamp-1">{title}</h3>
          {desc && <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{desc}</p>}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground/80">
            {data.start_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(data.start_date), "MMM d, yyyy")}</span>}
            {location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span className="truncate max-w-[200px]">{location}</span></span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ──────────────── Entity Row ──────────────── */
function EntityRow({ data, isAr }: { data: any; isAr: boolean }) {
  const name = isAr && data.name_ar ? data.name_ar : data.name;
  const desc = isAr && data.description_ar ? data.description_ar : data.description;
  const location = [data.city, data.country].filter(Boolean).join(" · ");
  const linkPath = data.source === "establishment" ? `/establishments/${data.id}` : `/entities/${data.id}`;

  return (
    <Link
      to={linkPath}
      className="group block rounded-xl px-4 py-3 -mx-2 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/30 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
          {data.logo_url ? (
            <img src={data.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="h-4.5 w-4.5 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            <Building2 className="h-3 w-3" />
            <span>{isAr ? "جهة" : "Organization"}</span>
            {data.type && (
              <>
                <span className="mx-0.5">›</span>
                <span className="capitalize">{data.type}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-medium text-primary group-hover:underline line-clamp-1">
              {name}
            </h3>
            {data.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
          </div>
          {desc && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {desc}
            </p>
          )}
          {location && (
            <p className="text-xs text-muted-foreground/70 mt-1.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ──────────────── Skeleton ──────────────── */
function GoogleSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-start gap-3 px-2">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────── Empty State ──────────────── */
function EmptySearch({ isAr, query }: { isAr: boolean; query: string }) {
  return (
    <div className="py-16 text-center">
      <SearchIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
      <p className="text-foreground font-medium mb-1">
        {isAr ? `لا توجد نتائج لـ "${query}"` : `No results for "${query}"`}
      </p>
      <p className="text-sm text-muted-foreground">
        {isAr
          ? "حاول استخدام كلمات مختلفة أو تحقق من التهجئة"
          : "Try different keywords or check spelling"}
      </p>
    </div>
  );
}

/* ──────────────── Recent Searches ──────────────── */
function RecentSearchesPanel({
  recentSearches,
  onRecentClick,
  onClear,
  isAr,
}: {
  recentSearches: string[];
  onRecentClick: (term: string) => void;
  onClear: () => void;
  isAr: boolean;
}) {
  if (recentSearches.length === 0) {
    return (
      <div className="py-16 text-center">
        <SearchIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">
          {isAr ? "ابدأ البحث..." : "Start searching..."}
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {isAr ? "عمليات البحث الأخيرة" : "Recent searches"}
        </h3>
        <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={onClear}>
          <Trash2 className="h-3 w-3 me-1" />
          {isAr ? "مسح" : "Clear"}
        </Button>
      </div>
      <div className="space-y-1">
        {recentSearches.map((term) => (
          <button
            key={term}
            onClick={() => onRecentClick(term)}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm text-start hover:bg-accent/40 transition-colors group"
          >
            <Clock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            <span className="flex-1 truncate">{term}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
