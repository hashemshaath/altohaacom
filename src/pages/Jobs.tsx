import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenToWorkBadge } from "@/components/profile/OpenToWorkBadge";
import { Briefcase, Search, MapPin, Building2, Clock, Users, ChefHat, Filter, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const JOB_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  full_time: { en: "Full-time", ar: "دوام كامل" },
  part_time: { en: "Part-time", ar: "دوام جزئي" },
  freelance: { en: "Freelance", ar: "عمل حر" },
  contract: { en: "Contract", ar: "عقد مؤقت" },
  consulting: { en: "Consulting", ar: "استشارات" },
};

export default function Jobs() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [tab, setTab] = useState("postings");

  // Fetch active job postings
  const { data: jobPostings = [], isLoading: loadingPostings } = useQuery({
    queryKey: ["job-postings", jobTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("job_postings")
        .select("*, companies(name, name_ar, logo_url, slug)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      
      if (jobTypeFilter !== "all") {
        query = query.eq("job_type", jobTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch available chefs (open to work, public visibility)
  const { data: availableChefs = [], isLoading: loadingChefs } = useQuery({
    queryKey: ["available-chefs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, specialization, specialization_ar, job_title, job_title_ar, country_code, city, years_of_experience, experience_level, work_availability_note, work_availability_note_ar, preferred_job_types, preferred_work_locations, willing_to_relocate")
        .eq("is_open_to_work", true)
        .eq("job_availability_visibility", "public")
        .eq("account_type", "professional")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const filteredPostings = useMemo(() => {
    if (!search.trim()) return jobPostings;
    const q = search.toLowerCase();
    return jobPostings.filter((j: any) =>
      j.title?.toLowerCase().includes(q) ||
      j.title_ar?.includes(q) ||
      (j.companies as any)?.name?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q)
    );
  }, [jobPostings, search]);

  const filteredChefs = useMemo(() => {
    if (!search.trim()) return availableChefs;
    const q = search.toLowerCase();
    return availableChefs.filter((c: any) =>
      c.full_name?.toLowerCase().includes(q) ||
      c.full_name_ar?.includes(q) ||
      c.specialization?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  }, [availableChefs, search]);

  return (
    <PageShell title={isAr ? "فرص العمل" : "Job Board"} description="Browse culinary job opportunities and available talent">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-chart-2" />
            {isAr ? "فرص العمل والتوظيف" : "Jobs & Talent"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? "تصفح فرص العمل والطهاة المتاحين للتوظيف" : "Browse job postings and available chefs"}
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              className="ps-9 rounded-xl border-border/20"
              placeholder={isAr ? "ابحث عن وظائف أو طهاة..." : "Search jobs or chefs..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-border/20">
              <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground/50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
              {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="postings" className="gap-1.5 rounded-lg">
              <Building2 className="h-3.5 w-3.5" />
              {isAr ? "الوظائف" : "Job Postings"}
              {filteredPostings.length > 0 && <Badge variant="secondary" className="ms-1 text-[10px] px-1.5">{filteredPostings.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="chefs" className="gap-1.5 rounded-lg">
              <ChefHat className="h-3.5 w-3.5" />
              {isAr ? "طهاة متاحون" : "Available Chefs"}
              {filteredChefs.length > 0 && <Badge variant="secondary" className="ms-1 text-[10px] px-1.5">{filteredChefs.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Job Postings Tab */}
          <TabsContent value="postings" className="mt-4 space-y-3">
            {loadingPostings ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Card key={i} className="rounded-2xl h-32 animate-pulse bg-muted/10" />)}
              </div>
            ) : filteredPostings.length === 0 ? (
              <Card className="rounded-2xl border-border/20">
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">{isAr ? "لا توجد وظائف حالياً" : "No job postings yet"}</p>
                </CardContent>
              </Card>
            ) : (
              filteredPostings.map((job: any) => (
                <JobPostingCard key={job.id} job={job} isAr={isAr} />
              ))
            )}
          </TabsContent>

          {/* Available Chefs Tab */}
          <TabsContent value="chefs" className="mt-4">
            {loadingChefs ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1,2,3,4].map(i => <Card key={i} className="rounded-2xl h-40 animate-pulse bg-muted/10" />)}
              </div>
            ) : filteredChefs.length === 0 ? (
              <Card className="rounded-2xl border-border/20">
                <CardContent className="py-12 text-center">
                  <ChefHat className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">{isAr ? "لا يوجد طهاة متاحون حالياً" : "No available chefs at the moment"}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredChefs.map((chef: any) => (
                  <AvailableChefCard key={chef.user_id} chef={chef} isAr={isAr} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}

const JobPostingCard = memo(function JobPostingCard({ job, isAr }: { job: any; isAr: boolean }) {
  const company = job.companies;
  const title = isAr ? (job.title_ar || job.title) : job.title;
  const location = isAr ? (job.location_ar || job.location) : job.location;
  const typeLabel = JOB_TYPE_LABELS[job.job_type] || { en: job.job_type, ar: job.job_type };

  return (
    <Card className="rounded-2xl border-border/20 hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex gap-4">
          {company?.logo_url && (
            <Avatar className="h-12 w-12 rounded-xl shrink-0">
              <AvatarImage src={company.logo_url} alt={company.name} />
              <AvatarFallback className="rounded-xl bg-muted/20">{company.name?.[0]}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? (company?.name_ar || company?.name) : company?.name}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {isAr ? typeLabel.ar : typeLabel.en}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground/70">
              {location && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>
              )}
              {job.is_salary_visible && job.salary_min && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {job.salary_min.toLocaleString()}{job.salary_max ? `-${job.salary_max.toLocaleString()}` : "+"} {job.salary_currency}
                </span>
              )}
              {job.application_deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isAr ? "آخر موعد:" : "Deadline:"} {format(new Date(job.application_deadline), "MMM d, yyyy")}
                </span>
              )}
            </div>
            {job.description && (
              <p className="text-xs text-muted-foreground/60 line-clamp-2">
                {isAr ? (job.description_ar || job.description) : job.description}
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <Users className="h-2.5 w-2.5" />
                {job.applications_count || 0} {isAr ? "متقدم" : "applicants"}
              </span>
              <Link to={`/jobs/${job.id}`}>
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 px-3">
                  {isAr ? "التفاصيل" : "View Details"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const AvailableChefCard = memo(function AvailableChefCard({ chef, isAr }: { chef: any; isAr: boolean }) {
  const name = isAr ? (chef.full_name_ar || chef.full_name) : (chef.full_name || chef.full_name_ar);
  const spec = isAr ? (chef.specialization_ar || chef.specialization) : (chef.specialization || chef.specialization_ar);
  const jobTitle = isAr ? (chef.job_title_ar || chef.job_title) : (chef.job_title || chef.job_title_ar);
  const note = isAr ? (chef.work_availability_note_ar || chef.work_availability_note) : (chef.work_availability_note || chef.work_availability_note_ar);

  return (
    <Link to={`/${chef.username || chef.user_id}`}>
      <Card className="rounded-2xl border-border/20 hover:shadow-md transition-all duration-300 group h-full">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 rounded-xl shrink-0">
              <AvatarImage src={chef.avatar_url} alt={name || ""} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary">{name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{name}</h3>
                <OpenToWorkBadge isAr={isAr} size="sm" />
              </div>
              {jobTitle && <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>}
            </div>
          </div>
          {spec && <p className="text-xs text-muted-foreground/70">{spec}</p>}
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground/60">
            {chef.city && (
              <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{chef.city}</span>
            )}
            {chef.years_of_experience && (
              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{chef.years_of_experience} {isAr ? "سنة" : "yrs"}</span>
            )}
            {chef.willing_to_relocate && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{isAr ? "مستعد للانتقال" : "Open to relocate"}</Badge>
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
          {note && <p className="text-[10px] text-muted-foreground/50 line-clamp-1 italic">"{note}"</p>}
        </CardContent>
      </Card>
    </Link>
  );
});
