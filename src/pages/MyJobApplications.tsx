import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase, Clock, CheckCircle2, XCircle, Eye, ChevronRight,
  Building2, MapPin, FileText, Inbox, LucideIcon } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; color: string; icon: LucideIcon }> = {
  pending: { labelEn: "Under Review", labelAr: "قيد المراجعة", color: "bg-chart-4/10 text-chart-4 border-chart-4/20", icon: Clock },
  reviewed: { labelEn: "Reviewed", labelAr: "تمت المراجعة", color: "bg-primary/10 text-primary border-primary/20", icon: Eye },
  shortlisted: { labelEn: "Shortlisted", labelAr: "في القائمة المختصرة", color: "bg-chart-2/10 text-chart-2 border-chart-2/20", icon: CheckCircle2 },
  accepted: { labelEn: "Accepted", labelAr: "مقبول", color: "bg-chart-2/10 text-chart-2 border-chart-2/20", icon: CheckCircle2 },
  rejected: { labelEn: "Not Selected", labelAr: "لم يُختر", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

export default function MyJobApplications() {
  const { user } = useAuth();
  const isAr = useIsAr();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["my-job-applications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("id, status, cover_letter, created_at, job_id, job_postings(id, title, title_ar, job_type, location, location_ar, companies(name, name_ar, logo_url))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        status: string;
        cover_letter: string | null;
        created_at: string;
        job_id: string;
        job_postings: {
          id: string;
          title: string;
          title_ar: string | null;
          job_type: string;
          location: string | null;
          location_ar: string | null;
          companies: { name: string; name_ar: string | null; logo_url: string | null } | null;
        } | null;
      }>;
    },
    enabled: !!user,
  });

  const stats = applications?.reduce(
    (acc, app) => {
      acc.total++;
      if (app.status === "pending") acc.pending++;
      else if (app.status === "shortlisted" || app.status === "accepted") acc.shortlisted++;
      else if (app.status === "rejected") acc.rejected++;
      return acc;
    },
    { total: 0, pending: 0, shortlisted: 0, rejected: 0 }
  ) || { total: 0, pending: 0, shortlisted: 0, rejected: 0 };

  return (
    <PageShell title={isAr ? "طلبات التوظيف" : "My Applications"} description="Track your job applications">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Stats Strip */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { label: isAr ? "إجمالي" : "Total", value: stats.total, color: "text-foreground", bg: "bg-muted/10" },
            { label: isAr ? "قيد المراجعة" : "Pending", value: stats.pending, color: "text-chart-4", bg: "bg-chart-4/10" },
            { label: isAr ? "مختصرة" : "Shortlisted", value: stats.shortlisted, color: "text-chart-2", bg: "bg-chart-2/10" },
            { label: isAr ? "مرفوضة" : "Declined", value: stats.rejected, color: "text-destructive", bg: "bg-destructive/10" },
          ].map((s) => (
            <Card key={s.label} className="rounded-xl border-border/15">
              <CardContent className="p-3 text-center">
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground/60">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : !applications?.length ? (
          <Card className="rounded-2xl border-border/15">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <Inbox className="h-12 w-12 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد طلبات بعد" : "No applications yet"}</p>
              <Link to="/jobs">
                <Button variant="outline" className="rounded-xl text-xs gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {isAr ? "تصفح الوظائف" : "Browse Jobs"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const job = app.job_postings;
              const company = job?.companies;
              const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const title = isAr ? (job?.title_ar || job?.title) : job?.title;
              const location = isAr ? (job?.location_ar || job?.location) : job?.location;
              const companyName = isAr ? (company?.name_ar || company?.name) : company?.name;

              return (
                <Link key={app.id} to={`/jobs/${app.job_id}`}>
                  <Card className="rounded-xl border-border/15 hover:shadow-md hover:border-border/30 transition-all group active:scale-[0.99]">
                    <CardContent className="p-4 flex items-center gap-3.5">
                      <Avatar className="h-12 w-12 rounded-xl shrink-0 border border-border/10">
                        {company?.logo_url ? <AvatarImage src={company.logo_url} /> : null}
                        <AvatarFallback className="rounded-xl bg-primary/5 text-primary text-sm font-bold">
                          {(company?.name || "?")[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[12px] text-muted-foreground/60">
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {companyName}
                          </span>
                          {location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className={`rounded-lg text-[11px] px-2 py-0.5 gap-1 border ${statusCfg.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {isAr ? statusCfg.labelAr : statusCfg.labelEn}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground/40">
                            {format(new Date(app.created_at), "MMM d, yyyy")}
                          </span>
                          {app.cover_letter && (
                            <FileText className="h-3 w-3 text-muted-foreground/30" aria-label={isAr ? "رسالة تعريفية مرفقة" : "Cover letter attached"} />
                          )}
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-colors shrink-0 rtl:rotate-180" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
