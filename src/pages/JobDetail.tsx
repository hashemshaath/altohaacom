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
  CheckCircle2, Share2, Eye, Award, Star, Globe, ChefHat, ArrowRight, Sparkles, Heart
} from "lucide-react";
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
        .select("id, title, title_ar, job_type, location, companies(name, name_ar, logo_url)")
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
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: job?.title || "Job", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
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
  const daysAgo = Math.floor((Date.now() - new Date(job.created_at!).getTime()) / 86400000);
  const expLabel = job.experience_level ? (isAr ? EXP_LEVELS[job.experience_level]?.ar : EXP_LEVELS[job.experience_level]?.en) : null;

  return (
    <div className="min-h-screen bg-muted/5">
      {/* Top Bar */}
      <div className="bg-background border-b border-border/10 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")} className="rounded-xl gap-1.5 text-muted-foreground text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            {isAr ? "العودة للوظائف" : "Back to Jobs"}
          </Button>
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

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-lg gap-1"><Briefcase className="h-3 w-3" />{isAr ? typeLabel.ar : typeLabel.en}</Badge>
                  {location && <Badge variant="outline" className="rounded-lg gap-1"><MapPin className="h-3 w-3" />{location}</Badge>}
                  {expLabel && <Badge variant="outline" className="rounded-lg gap-1"><Award className="h-3 w-3" />{expLabel}</Badge>}
                  {job.is_salary_visible && job.salary_min && (
                    <Badge variant="outline" className="rounded-lg gap-1">
                      <DollarSign className="h-3 w-3" />
                      {job.salary_min.toLocaleString()}{job.salary_max ? `–${job.salary_max.toLocaleString()}` : "+"} {job.salary_currency}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground/50">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{daysAgo === 0 ? (isAr ? "نُشرت اليوم" : "Posted today") : `${isAr ? "نُشرت قبل" : "Posted"} ${daysAgo} ${isAr ? "يوم" : "days ago"}`}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applications_count || 0} {isAr ? "متقدم" : "applicants"}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{job.views_count || 0} {isAr ? "مشاهدة" : "views"}</span>
                </div>
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
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{desc}</p>
                </div>

                {reqs && (
                  <>
                    <Separator className="bg-border/10" />
                    <div className="space-y-3">
                      <h2 className="font-bold text-sm flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-chart-2" />
                        {isAr ? "المتطلبات" : "Requirements"}
                      </h2>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{reqs}</p>
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
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{benefits}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm">{isAr ? "وظائف مشابهة" : "Similar Jobs"}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {relatedJobs.map((rj: any) => (
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
                            <p className="text-[10px] text-muted-foreground truncate">
                              {isAr ? ((rj.companies as any)?.name_ar || (rj.companies as any)?.name) : (rj.companies as any)?.name}
                            </p>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                        </div>
                      </Card>
                    </Link>
                  ))}
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
                        <p className="text-[10px] text-muted-foreground mt-1">
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
                      />
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
                      <p className="text-[10px] text-center text-muted-foreground/50">
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
                      <p className="text-sm font-semibold">{isAr ? (company?.name_ar || company?.name) : company?.name}</p>
                      {company?.slug && (
                        <Link to={`/companies/${company.slug}`} className="text-[10px] text-primary hover:underline">
                          {isAr ? "عرض الصفحة" : "View Page"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {job.application_deadline && (
                  <>
                    <Separator className="bg-border/10" />
                    <div className="flex items-center gap-2 text-xs text-destructive/70">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{isAr ? "آخر موعد للتقديم:" : "Application deadline:"} <strong>{format(new Date(job.application_deadline), "MMM d, yyyy")}</strong></span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card className="rounded-2xl border-border/15">
              <CardContent className="p-4 space-y-2">
                <Button variant="ghost" size="sm" onClick={handleShare} className="w-full justify-start rounded-xl text-xs gap-2">
                  <Share2 className="h-3.5 w-3.5" /> {isAr ? "مشاركة الوظيفة" : "Share this job"}
                </Button>
                <Link to="/jobs" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl text-xs gap-2">
                    <Briefcase className="h-3.5 w-3.5" /> {isAr ? "تصفح جميع الوظائف" : "Browse all jobs"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
