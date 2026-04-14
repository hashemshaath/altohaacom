import { useState, memo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, MapPin, DollarSign, Clock, Building2, Users, ArrowLeft, Send,
  CheckCircle2, Share2, Eye, Award, Star, Globe, ChefHat, ArrowRight, Sparkles, Heart,
  Home, ChevronRight, Bookmark, AlertCircle, Calendar
LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { MS_PER_DAY, MS_PER_WEEK } from "@/lib/constants";

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

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*, companies(name, name_ar, logo_url, slug)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingApplication } = useQuery({
    queryKey: ["job-application-check", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("id, status, created_at")
        .eq("job_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  // Related jobs
  const { data: relatedJobs = [] } = useQuery({
    queryKey: ["related-jobs", job?.job_type, job?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_postings")
        .select("id, title, title_ar, job_type, location, salary_min, salary_max, salary_currency, is_salary_visible, created_at, companies(name, name_ar, logo_url)")
        .eq("status", "active")
        .eq("job_type", job!.job_type)
        .neq("id", job!.id)
        .limit(4);
      return data || [];
    },
    enabled: !!job?.id,
  });

  const apply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("job_applications").insert({
        job_id: id!,
        user_id: user!.id,
        cover_letter: coverLetter || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-application-check", id] });
      toast({ title: isAr ? "تم تقديم الطلب بنجاح ✓" : "Application submitted ✓" });
      setShowApplyForm(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : String(err) });
    },
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: job?.title || "Job", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).then(null, () => {});
      toast({ title: isAr ? "تم نسخ الرابط" : "Link copied" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 w-48 bg-muted/10 animate-pulse rounded-xl" />
          <div className="h-80 bg-muted/10 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/20" />
          <p className="text-muted-foreground">{isAr ? "الوظيفة غير موجودة" : "Job posting not found"}</p>
          <Link to="/jobs"><Button variant="outline" className="rounded-xl">{isAr ? "العودة" : "Back to Jobs"}</Button></Link>
        </div>
      </div>
    );
  }

  const company = job.companies as any;
  const title = isAr ? (job.title_ar || job.title) : job.title;
  const desc = isAr ? (job.description_ar || job.description) : job.description;
  const location = isAr ? (job.location_ar || job.location) : job.location;
  const reqs = isAr ? (job.requirements_ar || job.requirements) : job.requirements;
  const benefits = isAr ? (job.benefits_ar || job.benefits) : job.benefits;
  const typeLabel = JOB_TYPE_LABELS[job.job_type] || { en: job.job_type, ar: job.job_type };
  const daysAgo = Math.floor((Date.now() - new Date(job.created_at!).getTime()) / MS_PER_DAY);
  const expLabel = job.experience_level ? (isAr ? EXP_LEVELS[job.experience_level]?.ar : EXP_LEVELS[job.experience_level]?.en) : null;
  const isDeadlineSoon = job.application_deadline && (new Date(job.application_deadline).getTime() - Date.now()) < MS_PER_WEEK && new Date(job.application_deadline) > new Date();

  return (
    <div className="min-h-screen bg-muted/5">
      {/* Top Bar */}
      <div className="bg-background border-b border-border/10 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" />
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
            <Link to="/jobs" className="hover:text-primary transition-colors">{isAr ? "الوظائف" : "Jobs"}</Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{title}</span>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" />
              {isAr ? "مشاركة" : "Share"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          {/* Main Content */}
          <div className="space-y-5">
            {/* Header Card */}
            <Card className="rounded-2xl border-border/15 overflow-hidden">
              {job.is_featured && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-2 flex items-center gap-2 border-b border-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">{isAr ? "وظيفة مميزة" : "Featured Job"}</span>
                </div>
              )}
              <CardContent className="p-6 space-y-5">
                <div className="flex gap-4">
                  <Avatar className="h-16 w-16 rounded-xl shrink-0 border border-border/10">
                    {company?.logo_url ? <AvatarImage src={company.logo_url} /> : null}
                    <AvatarFallback className="rounded-xl bg-primary/5 text-primary font-bold text-lg">
                      {(company?.name || "C")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-extrabold">{title}</h1>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Link to={company?.slug ? `/companies/${company.slug}` : "#"} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {isAr ? (company?.name_ar || company?.name) : company?.name}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Salary Display - prominent like Sabbar */}
                {job.is_salary_visible && job.salary_min && (
                  <div className="bg-muted/5 rounded-xl p-4 border border-border/10">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="text-lg font-extrabold text-foreground">
                        {job.salary_min.toLocaleString()}{job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : "+"}
                      </span>
                      <span className="text-sm text-muted-foreground">{job.salary_currency || ""} / {isAr ? "شهرياً" : "month"}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-lg gap-1"><Briefcase className="h-3 w-3" />{isAr ? typeLabel.ar : typeLabel.en}</Badge>
                  {location && <Badge variant="outline" className="rounded-lg gap-1"><MapPin className="h-3 w-3" />{location}</Badge>}
                  {expLabel && <Badge variant="outline" className="rounded-lg gap-1"><Award className="h-3 w-3" />{expLabel}</Badge>}
                  {job.specialization && <Badge variant="outline" className="rounded-lg gap-1"><ChefHat className="h-3 w-3" />{job.specialization}</Badge>}
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground/50">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{daysAgo === 0 ? (isAr ? "نُشرت اليوم" : "Posted today") : isAr ? `نُشرت منذ ${daysAgo} يوم` : `Posted ${daysAgo} days ago`}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applications_count || 0} {isAr ? "متقدم" : "applicants"}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{job.views_count || 0} {isAr ? "مشاهدة" : "views"}</span>
                </div>

                {/* Deadline warning */}
                {isDeadlineSoon && (
                  <div className="flex items-center gap-2 bg-destructive/5 border border-destructive/10 rounded-xl px-4 py-2.5">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="text-xs text-destructive font-medium">
                      {isAr ? `آخر موعد للتقديم: ${format(new Date(job.application_deadline!), "d MMM yyyy")}` : `Application deadline: ${format(new Date(job.application_deadline!), "MMM d, yyyy")}`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="rounded-2xl border-border/15">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <h2 className="font-bold text-sm flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    {isAr ? "وصف الوظيفة" : "Job Description"}
                  </h2>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{desc}</div>
                </div>

                {reqs && (
                  <>
                    <Separator className="bg-border/10" />
                    <div className="space-y-3">
                      <h2 className="font-bold text-sm flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-chart-2" />
                        {isAr ? "المتطلبات" : "Requirements"}
                      </h2>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{reqs}</div>
                    </div>
                  </>
                )}

                {benefits && (
                  <>
                    <Separator className="bg-border/10" />
                    <div className="space-y-3">
                      <h2 className="font-bold text-sm flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-accent-foreground" />
                        {isAr ? "المزايا" : "Benefits"}
                      </h2>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{benefits}</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Job Summary Card */}
            <Card className="rounded-2xl border-border/15">
              <CardContent className="p-6">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  {isAr ? "ملخص الوظيفة" : "Job Summary"}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <SummaryRow icon={Briefcase} label={isAr ? "نوع الدوام" : "Job Type"} value={isAr ? typeLabel.ar : typeLabel.en} />
                  {location && <SummaryRow icon={MapPin} label={isAr ? "الموقع" : "Location"} value={location} />}
                  {expLabel && <SummaryRow icon={Award} label={isAr ? "مستوى الخبرة" : "Experience"} value={expLabel} />}
                  {job.is_salary_visible && job.salary_min && (
                    <SummaryRow icon={DollarSign} label={isAr ? "الراتب" : "Salary"} value={`${job.salary_min.toLocaleString()}${job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : "+"} ${job.salary_currency || ""}`} />
                  )}
                  {job.application_deadline && (
                    <SummaryRow icon={Calendar} label={isAr ? "آخر موعد" : "Deadline"} value={format(new Date(job.application_deadline), "MMM d, yyyy")} />
                  )}
                  <SummaryRow icon={Calendar} label={isAr ? "تاريخ النشر" : "Posted"} value={format(new Date(job.created_at!), "MMM d, yyyy")} />
                </div>
              </CardContent>
            </Card>

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm">{isAr ? "وظائف مشابهة" : "Similar Jobs"}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {relatedJobs.map((rj) => {
                    const rjDaysAgo = Math.floor((Date.now() - new Date(rj.created_at).getTime()) / MS_PER_DAY);
                    return (
                      <Link key={rj.id} to={`/jobs/${rj.id}`}>
                        <Card className="rounded-xl border-border/15 hover:shadow-md transition-all p-4 group">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-lg shrink-0 border border-border/10">
                              {(rj.companies as any)?.logo_url ? <AvatarImage src={(rj.companies as any).logo_url} /> : null}
                              <AvatarFallback className="rounded-lg bg-muted/10 text-xs">{((rj.companies as any)?.name || "?")[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                                {isAr ? (rj.title_ar || rj.title) : rj.title}
                              </p>
                              <p className="text-[12px] text-muted-foreground truncate">
                                {isAr ? ((rj.companies as any)?.name_ar || (rj.companies as any)?.name) : (rj.companies as any)?.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {rj.is_salary_visible && rj.salary_min && (
                                  <span className="text-[12px] font-bold">{rj.salary_min.toLocaleString()} {rj.salary_currency}</span>
                                )}
                                <span className="text-[12px] text-muted-foreground/40">{rjDaysAgo === 0 ? (isAr ? "اليوم" : "Today") : `${rjDaysAgo}d`}</span>
                              </div>
                            </div>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply Card */}
            <Card className="rounded-2xl border-border/15 sticky top-16">
              <CardContent className="p-5 space-y-4">
                {user ? (
                  existingApplication ? (
                    <div className="text-center space-y-3 py-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/10 mx-auto">
                        <CheckCircle2 className="h-6 w-6 text-chart-2" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-chart-2">{isAr ? "تم تقديم طلبك" : "Application Submitted"}</p>
                        <p className="text-[12px] text-muted-foreground mt-1">
                          {isAr ? "الحالة:" : "Status:"} {existingApplication.status} • {format(new Date(existingApplication.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ) : showApplyForm ? (
                    <div className="space-y-4">
                      <Label className="text-xs font-semibold">{isAr ? "رسالة تعريفية (اختياري)" : "Cover Letter (optional)"}</Label>
                      <Textarea
                        className="rounded-xl border-border/20 min-h-[120px] text-sm"
                        placeholder={isAr ? "اكتب رسالة تعريفية قصيرة..." : "Write a brief cover letter..."}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        maxLength={1000}
                      />
                      <p className="text-[12px] text-muted-foreground text-end">{coverLetter.length}/1000</p>
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => apply.mutate()} disabled={apply.isPending} className="rounded-xl gap-1.5 w-full font-bold">
                          <Send className="h-3.5 w-3.5" />
                          {apply.isPending ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "تقديم الطلب" : "Submit Application")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowApplyForm(false)} className="rounded-xl text-xs">
                          {isAr ? "إلغاء" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button onClick={() => setShowApplyForm(true)} className="rounded-xl gap-2 w-full h-11 font-bold shadow-lg shadow-primary/15">
                        <Briefcase className="h-4 w-4" />
                        {isAr ? "تقديم طلب" : "Apply Now"}
                      </Button>
                      <p className="text-[12px] text-center text-muted-foreground/50">
                        {isAr ? "ملفك الشخصي سيُرفق تلقائياً" : "Your profile will be attached automatically"}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="text-center space-y-3 py-2">
                    <ChefHat className="h-8 w-8 mx-auto text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">{isAr ? "سجّل دخولك للتقديم على هذه الوظيفة" : "Sign in to apply for this job"}</p>
                    <Link to="/login" className="block">
                      <Button className="rounded-xl w-full">{isAr ? "تسجيل الدخول" : "Sign In"}</Button>
                    </Link>
                  </div>
                )}

                <Separator className="bg-border/10" />

                {/* Company Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold">{isAr ? "عن الشركة" : "About Company"}</h4>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-lg border border-border/10">
                      {company?.logo_url ? <AvatarImage src={company.logo_url} /> : null}
                      <AvatarFallback className="rounded-lg bg-muted/10 text-xs">{(company?.name || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold">{isAr ? (company?.name_ar || company?.name) : company?.name}</p>
                      {company?.id && (
                        <Link to={`/companies/${company.id}`} className="text-[12px] text-primary hover:underline">
                          {isAr ? "عرض صفحة الشركة" : "View company page"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/10" />

                {/* Share & Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs gap-1" onClick={handleShare}>
                    <Share2 className="h-3 w-3" />
                    {isAr ? "مشاركة" : "Share"}
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs gap-1" onClick={() => navigate("/jobs")}>
                    <ArrowLeft className="h-3 w-3" />
                    {isAr ? "العودة" : "Back"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="rounded-2xl border-border/15">
              <CardContent className="p-4 space-y-3">
                <h4 className="text-xs font-bold">{isAr ? "إحصائيات سريعة" : "Quick Stats"}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3" />{isAr ? "عدد المتقدمين" : "Applicants"}</span>
                    <span className="font-bold">{job.applications_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Eye className="h-3 w-3" />{isAr ? "المشاهدات" : "Views"}</span>
                    <span className="font-bold">{job.views_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" />{isAr ? "نُشرت" : "Posted"}</span>
                    <span className="font-bold">{daysAgo === 0 ? (isAr ? "اليوم" : "Today") : isAr ? `منذ ${daysAgo} يوم` : `${daysAgo}d ago`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/10">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="text-xs font-semibold">{value}</p>
      </div>
    </div>
  );
}
