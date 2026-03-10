import { useState, memo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, MapPin, DollarSign, Clock, Building2, Users, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const JOB_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  full_time: { en: "Full-time", ar: "دوام كامل" },
  part_time: { en: "Part-time", ar: "دوام جزئي" },
  freelance: { en: "Freelance", ar: "عمل حر" },
  contract: { en: "Contract", ar: "عقد مؤقت" },
  consulting: { en: "Consulting", ar: "استشارات" },
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

  if (isLoading) {
    return (
      <PageShell title="Loading...">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-muted/10 animate-pulse rounded-xl" />
          <div className="h-64 bg-muted/10 animate-pulse rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  if (!job) {
    return (
      <PageShell title="Not Found">
        <div className="text-center py-20">
          <p className="text-muted-foreground">{isAr ? "الوظيفة غير موجودة" : "Job posting not found"}</p>
          <Link to="/jobs"><Button variant="outline" className="mt-4 rounded-xl">{isAr ? "العودة" : "Back to Jobs"}</Button></Link>
        </div>
      </PageShell>
    );
  }

  const company = job.companies as any;
  const title = isAr ? (job.title_ar || job.title) : job.title;
  const desc = isAr ? (job.description_ar || job.description) : job.description;
  const location = isAr ? (job.location_ar || job.location) : job.location;
  const reqs = isAr ? (job.requirements_ar || job.requirements) : job.requirements;
  const benefits = isAr ? (job.benefits_ar || job.benefits) : job.benefits;
  const typeLabel = JOB_TYPE_LABELS[job.job_type] || { en: job.job_type, ar: job.job_type };

  return (
    <PageShell title={title || "Job Detail"}>
      <div className="max-w-3xl mx-auto space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")} className="rounded-xl gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          {isAr ? "العودة للوظائف" : "Back to Jobs"}
        </Button>

        {/* Main Card */}
        <Card className="rounded-2xl border-border/20">
          <CardContent className="p-6 space-y-5">
            {/* Header */}
            <div className="flex gap-4">
              {company?.logo_url && (
                <Avatar className="h-14 w-14 rounded-xl shrink-0">
                  <AvatarImage src={company.logo_url} />
                  <AvatarFallback className="rounded-xl bg-muted/20">{company.name?.[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <h1 className="text-xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {isAr ? (company?.name_ar || company?.name) : company?.name}
                </p>
              </div>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{isAr ? typeLabel.ar : typeLabel.en}</Badge>
              {location && <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{location}</Badge>}
              {job.experience_level && <Badge variant="outline">{job.experience_level}</Badge>}
              {job.is_salary_visible && job.salary_min && (
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  {job.salary_min.toLocaleString()}{job.salary_max ? `-${job.salary_max.toLocaleString()}` : "+"} {job.salary_currency}
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="font-semibold text-sm">{isAr ? "الوصف" : "Description"}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{desc}</p>
            </div>

            {/* Requirements */}
            {reqs && (
              <div className="space-y-2">
                <h2 className="font-semibold text-sm">{isAr ? "المتطلبات" : "Requirements"}</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reqs}</p>
              </div>
            )}

            {/* Benefits */}
            {benefits && (
              <div className="space-y-2">
                <h2 className="font-semibold text-sm">{isAr ? "المزايا" : "Benefits"}</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{benefits}</p>
              </div>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground/60 pt-2 border-t border-border/10">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{isAr ? "نُشرت:" : "Posted:"} {format(new Date(job.created_at), "MMM d, yyyy")}</span>
              {job.application_deadline && (
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{isAr ? "آخر موعد:" : "Deadline:"} {format(new Date(job.application_deadline), "MMM d, yyyy")}</span>
              )}
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applications_count || 0} {isAr ? "متقدم" : "applicants"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Apply Section */}
        {user && (
          <Card className="rounded-2xl border-border/20">
            <CardContent className="p-6">
              {existingApplication ? (
                <div className="flex items-center gap-3 text-chart-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold">{isAr ? "تم تقديم طلبك" : "Application Submitted"}</p>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "الحالة:" : "Status:"} {existingApplication.status}
                      {" • "}
                      {format(new Date(existingApplication.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ) : showApplyForm ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">{isAr ? "رسالة تعريفية (اختياري)" : "Cover Letter (optional)"}</Label>
                    <Textarea
                      className="rounded-xl border-border/20 min-h-[100px]"
                      placeholder={isAr ? "اكتب رسالة تعريفية..." : "Write a cover letter..."}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => apply.mutate()} disabled={apply.isPending} className="rounded-xl gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      {apply.isPending ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "تقديم الطلب" : "Submit Application")}
                    </Button>
                    <Button variant="outline" onClick={() => setShowApplyForm(false)} className="rounded-xl">
                      {isAr ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowApplyForm(true)} className="rounded-xl gap-1.5" size="lg">
                  <Briefcase className="h-4 w-4" />
                  {isAr ? "التقديم على الوظيفة" : "Apply for this Job"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card className="rounded-2xl border-border/20">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">{isAr ? "سجّل دخولك للتقديم" : "Sign in to apply"}</p>
              <Link to="/login"><Button className="rounded-xl">{isAr ? "تسجيل الدخول" : "Sign In"}</Button></Link>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
