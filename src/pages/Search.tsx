import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { format } from "date-fns";
import { useGlobalSearch, type SearchFilters } from "@/hooks/useGlobalSearch";
import { getRecentSearches, addRecentSearch, clearRecentSearches } from "@/lib/recentSearches";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

const statusColors: Record<CompetitionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  upcoming: "bg-accent/20 text-accent",
  registration_open: "bg-primary/20 text-primary",
  registration_closed: "bg-muted text-muted-foreground",
  in_progress: "bg-chart-3/20 text-chart-3",
  judging: "bg-chart-4/20 text-chart-4",
  completed: "bg-chart-5/20 text-chart-5",
  cancelled: "bg-destructive/20 text-destructive",
};

export default function Search() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { 
    filters, 
    updateFilter, 
    resetFilters, 
    results, 
    totalResults, 
    isLoading 
  } = useGlobalSearch();

  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const type = (searchParams.get("type") as SearchFilters["type"]) || "all";
    if (query) {
      updateFilter("query", query);
      addRecentSearch(query);
      setRecentSearches(getRecentSearches());
    }
    if (type) updateFilter("type", type);
  }, []);

  // Update URL when query changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.type !== "all") params.set("type", filters.type);
    setSearchParams(params, { replace: true });
  }, [filters.query, filters.type]);

  const handleSearch = (value: string) => {
    updateFilter("query", value);
    if (value.trim().length >= 2) {
      addRecentSearch(value.trim());
      setRecentSearches(getRecentSearches());
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-8 md:py-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
                <SearchIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold md:text-3xl">{t("searchTitle")}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{t("searchSubtitle")}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-6 md:py-8">

        {/* Search Input */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={filters.query}
              onChange={(e) => handleSearch(e.target.value)}
              className="ps-10 h-12 text-lg"
              autoFocus
            />
            {filters.query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => handleSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t("filters")}</h3>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                {t("resetFilters")}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Competition Status Filter */}
              {(filters.type === "all" || filters.type === "competitions") && (
                <div className="space-y-2">
                  <Label>{t("competitionStatus")}</Label>
                  <Select
                    value={filters.competitionStatus || "all"}
                    onValueChange={(v) => updateFilter("competitionStatus", v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allStatuses")}</SelectItem>
                      <SelectItem value="upcoming">{t("upcoming")}</SelectItem>
                      <SelectItem value="registration_open">{t("registrationOpen")}</SelectItem>
                      <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                      <SelectItem value="completed">{t("completed")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Virtual Filter */}
              {(filters.type === "all" || filters.type === "competitions") && (
                <div className="flex items-center gap-2 pt-8">
                  <Checkbox
                    id="virtual"
                    checked={filters.isVirtual === true}
                    onCheckedChange={(checked) => 
                      updateFilter("isVirtual", checked ? true : null)
                    }
                  />
                  <Label htmlFor="virtual" className="cursor-pointer">
                    {t("virtualOnly")}
                  </Label>
                </div>
              )}

              {/* Article Type Filter */}
              {(filters.type === "all" || filters.type === "articles") && (
                <div className="space-y-2">
                  <Label>{t("articleType")}</Label>
                  <Select
                    value={filters.articleType || "all"}
                    onValueChange={(v) => updateFilter("articleType", v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allTypes")}</SelectItem>
                      <SelectItem value="news">{t("news")}</SelectItem>
                      <SelectItem value="blog">{t("blog")}</SelectItem>
                      <SelectItem value="exhibition">{t("exhibitions")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Experience Level Filter */}
              {(filters.type === "all" || filters.type === "members") && (
                <div className="space-y-2">
                  <Label>{t("experienceLevel")}</Label>
                  <Select
                    value={filters.experienceLevel || "all"}
                    onValueChange={(v) => updateFilter("experienceLevel", v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allLevels")}</SelectItem>
                      <SelectItem value="beginner">{t("beginner")}</SelectItem>
                      <SelectItem value="amateur">{t("amateur")}</SelectItem>
                      <SelectItem value="professional">{t("professional")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Member Role Filter */}
              {(filters.type === "all" || filters.type === "members") && (
                <div className="space-y-2">
                  <Label>{t("role")}</Label>
                  <Select
                    value={filters.memberRole || "all"}
                    onValueChange={(v) => updateFilter("memberRole", v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allRoles")}</SelectItem>
                      <SelectItem value="chef">{t("chef")}</SelectItem>
                      <SelectItem value="judge">{t("judge")}</SelectItem>
                      <SelectItem value="student">{t("student")}</SelectItem>
                      <SelectItem value="organizer">{t("organizer")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Results Tabs */}
        <Tabs 
          value={filters.type} 
          onValueChange={(v) => updateFilter("type", v as SearchFilters["type"])}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="gap-2">
              <SearchIcon className="h-4 w-4" />
              {t("all")} {filters.query && `(${totalResults})`}
            </TabsTrigger>
            <TabsTrigger value="competitions" className="gap-2">
              <Trophy className="h-4 w-4" />
              {t("competitions")} {filters.query && `(${results.competitions.length})`}
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              {t("articles")} {filters.query && `(${results.articles.length})`}
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <User className="h-4 w-4" />
              {t("members")} {filters.query && `(${results.members.length})`}
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              {language === "ar" ? "المنشورات" : "Posts"} {filters.query && `(${results.posts.length})`}
            </TabsTrigger>
          </TabsList>

          {/* All Results */}
          <TabsContent value="all">
            {isLoading ? (
              <SearchSkeleton />
            ) : !filters.query ? (
              <RecentSearchesPanel
                recentSearches={recentSearches}
                onRecentClick={handleRecentClick}
                onClear={handleClearRecent}
                language={language}
                fallbackMessage={t("enterSearchQuery")}
              />
            ) : totalResults === 0 ? (
              <EmptySearch message={t("noResultsFound")} />
            ) : (
              <div className="space-y-8">
                {/* Competitions Section */}
                {results.competitions.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        {t("competitions")}
                      </h2>
                      {results.competitions.length > 3 && (
                        <Button variant="link" onClick={() => updateFilter("type", "competitions")}>
                          {t("viewAll")}
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {results.competitions.slice(0, 3).map((comp) => (
                        <CompetitionCard 
                          key={comp.id} 
                          competition={comp} 
                          language={language}
                          getStatusLabel={getStatusLabel}
                          t={t}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Articles Section */}
                {results.articles.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {t("articles")}
                      </h2>
                      {results.articles.length > 3 && (
                        <Button variant="link" onClick={() => updateFilter("type", "articles")}>
                          {t("viewAll")}
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {results.articles.slice(0, 3).map((article) => (
                        <ArticleCard 
                          key={article.id} 
                          article={article} 
                          language={language}
                          t={t}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Members Section */}
                {results.members.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {t("members")}
                      </h2>
                      {results.members.length > 4 && (
                        <Button variant="link" onClick={() => updateFilter("type", "members")}>
                          {t("viewAll")}
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {results.members.slice(0, 4).map((member) => (
                        <MemberCard 
                          key={member.id} 
                          member={member}
                          language={language}
                          t={t}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </TabsContent>

          {/* Competitions Tab */}
          <TabsContent value="competitions">
            {isLoading ? (
              <SearchSkeleton />
            ) : results.competitions.length === 0 ? (
              <EmptySearch message={filters.query ? t("noCompetitionsFound") : t("enterSearchQuery")} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.competitions.map((comp) => (
                  <CompetitionCard 
                    key={comp.id} 
                    competition={comp} 
                    language={language}
                    getStatusLabel={getStatusLabel}
                    t={t}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            {isLoading ? (
              <SearchSkeleton />
            ) : results.articles.length === 0 ? (
              <EmptySearch message={filters.query ? t("noArticlesFound") : t("enterSearchQuery")} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.articles.map((article) => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    language={language}
                    t={t}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            {isLoading ? (
              <SearchSkeleton />
            ) : results.members.length === 0 ? (
              <EmptySearch message={filters.query ? t("noMembersFound") : t("enterSearchQuery")} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {results.members.map((member) => (
                  <MemberCard 
                    key={member.id} 
                    member={member}
                    language={language}
                    t={t}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            {isLoading ? (
              <SearchSkeleton />
            ) : results.posts.length === 0 ? (
              <EmptySearch message={filters.query ? (language === "ar" ? "لا توجد منشورات" : "No posts found") : (language === "ar" ? "ابحث عن منشورات" : "Search for posts")} />
            ) : (
              <div className="space-y-3">
                {results.posts.map((post) => (
                  <Link key={post.id} to={`/community`}>
                    <Card className="transition-all hover:shadow-md hover:border-primary/15 p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={post.author_avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{(post.author_name || "C")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">{post.author_name || "Chef"}</span>
                            {post.author_username && <span className="text-xs text-muted-foreground">@{post.author_username}</span>}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{post.content}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Component Cards
function CompetitionCard({ competition, language, getStatusLabel, t }: {
  competition: any;
  language: string;
  getStatusLabel: (status: CompetitionStatus) => string;
  t: (key: any) => string;
}) {
  const title = language === "ar" && competition.title_ar ? competition.title_ar : competition.title;
  const venue = language === "ar" && competition.venue_ar ? competition.venue_ar : competition.venue;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {competition.cover_image_url ? (
          <img
            src={competition.cover_image_url}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Trophy className="h-10 w-10 text-primary/30" />
          </div>
        )}
        <Badge className={`absolute end-2 top-2 ${statusColors[competition.status]}`}>
          {getStatusLabel(competition.status)}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <h3 className="line-clamp-1 font-semibold">{title}</h3>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(new Date(competition.competition_start), "MMM d, yyyy")}</span>
        </div>
        {competition.is_virtual ? (
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            <span>{t("virtual")}</span>
          </div>
        ) : venue && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{venue}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/competitions/${competition.id}`}>{t("viewDetails")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function ArticleCard({ article, language, t }: {
  article: any;
  language: string;
  t: (key: any) => string;
}) {
  const title = language === "ar" && article.title_ar ? article.title_ar : article.title;
  const excerpt = language === "ar" && article.excerpt_ar ? article.excerpt_ar : article.excerpt;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-accent/20 to-primary/20">
        {article.featured_image_url ? (
          <img
            src={article.featured_image_url}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-10 w-10 text-primary/30" />
          </div>
        )}
        <Badge className="absolute end-2 top-2 bg-background/80 text-foreground">
          {article.type}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <h3 className="line-clamp-1 font-semibold">{title}</h3>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
        {article.published_at && (
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(article.published_at), "MMM d, yyyy")}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/news/${article.slug}`}>{t("readMore")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function MemberCard({ member, language, t }: {
  member: any;
  language: string;
  t: (key: any) => string;
}) {
  const isAr = language === "ar";
  const displayName = isAr
    ? (member.display_name_ar || member.full_name_ar || member.display_name || member.full_name || member.username || "Unknown")
    : (member.display_name || member.full_name || member.display_name_ar || member.full_name_ar || member.username || "Unknown");
  const specialization = isAr
    ? (member.specialization_ar || member.specialization)
    : (member.specialization || member.specialization_ar);
  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Card className="group p-4 text-center transition-all hover:shadow-md">
      <div className="flex flex-col items-center">
        <Avatar className="h-16 w-16 mb-3">
          <AvatarImage src={member.avatar_url || undefined} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1 mb-1">
          <h3 className="font-semibold line-clamp-1">{displayName}</h3>
          {member.is_verified && <CheckCircle2 className="h-4 w-4 text-primary" />}
        </div>
        {member.username && (
          <p className="text-sm text-muted-foreground">@{member.username}</p>
        )}
        {specialization && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {specialization}
          </Badge>
        )}
        {member.location && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {member.location}
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" className="w-full mt-4" asChild>
        <Link to={`/${member.username || member.user_id}`}>{t("viewProfile")}</Link>
      </Button>
    </Card>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <Skeleton className="h-32 w-full" />
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptySearch({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function RecentSearchesPanel({ 
  recentSearches, 
  onRecentClick, 
  onClear, 
  language, 
  fallbackMessage 
}: { 
  recentSearches: string[]; 
  onRecentClick: (term: string) => void; 
  onClear: () => void; 
  language: string; 
  fallbackMessage: string; 
}) {
  if (recentSearches.length === 0) {
    return <EmptySearch message={fallbackMessage} />;
  }

  return (
    <div className="flex flex-col items-center py-10">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
        <Clock className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {language === "ar" ? "عمليات البحث الأخيرة" : "Recent Searches"}
        </h3>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={onClear}>
          <Trash2 className="h-3 w-3 me-1" />
          {language === "ar" ? "مسح" : "Clear"}
        </Button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {recentSearches.map((term) => (
          <Button
            key={term}
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onRecentClick(term)}
          >
            <Clock className="h-3 w-3" />
            {term}
          </Button>
        ))}
      </div>
    </div>
  );
}
