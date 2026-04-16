import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApplyAsMentor, useMentorshipPrograms, useMyMentorApplication } from "@/hooks/useMentorship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { HandHeart, Send, CheckCircle, Clock, X } from "lucide-react";
import { FormField, FormErrorSummary, SubmitButton } from "@/components/form";
import { useFormValidation, rules } from "@/hooks/useFormValidation";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

const EXPERTISE_OPTIONS = [
  "French Cuisine", "Italian Cuisine", "Asian Cuisine", "Middle Eastern Cuisine",
  "Pastry & Baking", "Molecular Gastronomy", "Farm-to-Table", "Vegan/Plant-Based",
  "Competition Prep", "Kitchen Management", "Food Photography", "Menu Design",
];

export default function MentorApply() {
  const navigate = useNavigate();
  const isAr = useIsAr();
  const { toast } = useToast();
  const { data: existingApp, isLoading: appLoading } = useMyMentorApplication();
  const { data: programs = [] } = useMentorshipPrograms("active");
  const applyMutation = useApplyAsMentor();

  const [bio, setBio] = useState("");
  const [years, setYears] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [programId, setProgramId] = useState("");

  const fieldConfig = useMemo(() => ({
    years: { rules: [rules.required(isAr ? "سنوات الخبرة" : "Years of experience", "سنوات الخبرة")] },
    bio: { rules: [rules.required(isAr ? "نبذة عنك" : "About you", "نبذة عنك"), rules.minLength(20)] },
  }), [isAr]);

  const { errors, errorList, onBlur, onChange, validateAll, getError } = useFormValidation({
    fields: fieldConfig,
    isAr,
  });

  if (appLoading) return null;

  if (existingApp) {
    const statusIcon = existingApp.status === "approved" ? CheckCircle :
                        existingApp.status === "rejected" ? X : Clock;
    const StatusIcon = statusIcon;
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-16">
          <Card className="max-w-lg mx-auto">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <StatusIcon className="h-12 w-12 text-primary mb-4" />
              <h2 className="text-xl font-bold">{isAr ? "طلبك مسجل" : "Application Submitted"}</h2>
              <Badge className="mt-3 capitalize">{existingApp.status}</Badge>
              <p className="mt-3 text-sm text-muted-foreground">
                {existingApp.status === "pending"
                  ? isAr ? "طلبك قيد المراجعة من الإدارة" : "Your application is being reviewed by our team"
                  : existingApp.status === "approved"
                    ? isAr ? "تمت الموافقة! ستتم مطابقتك مع متعلم قريباً" : "Approved! You'll be matched with a mentee soon"
                    : isAr ? "للأسف لم يتم قبول طلبك" : "Unfortunately your application was not accepted"}
              </p>
              <Button variant="outline" className="mt-6" onClick={() => navigate("/mentorship")}>
                {isAr ? "العودة" : "Back to Mentorship"}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = () => {
    if (!validateAll({ years, bio })) return;
    if (expertise.length === 0) {
      toast({ variant: "destructive", title: isAr ? "يرجى اختيار مجال خبرة واحد على الأقل" : "Please select at least one area of expertise" });
      return;
    }
    applyMutation.mutate(
      { bio, expertise, years_experience: parseInt(years), program_id: programId || undefined },
      {
        onSuccess: () => {
          toast({ title: isAr ? "تم تقديم الطلب بنجاح" : "Application submitted successfully" });
          navigate("/mentorship");
        },
        onError: (err: Error) => {
          toast({ variant: "destructive", title: isAr ? "فشل التقديم" : "Submission failed", description: err instanceof Error ? err.message : String(err) });
        },
      }
    );
  };

  const toggleExpertise = (item: string) => {
    setExpertise(prev => prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]);
  };

  const handleChange = (field: "years" | "bio", value: string) => {
    if (field === "years") setYears(value);
    else setBio(value);
    onChange(field);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title={isAr ? "تقدم كمرشد - الطهاة" : "Apply as Mentor - Altoha"} description="Apply to become a mentor" />
      <Header />

      <main className="flex-1 container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-primary" />
              {isAr ? "التقدم كمرشد" : "Apply as Mentor"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isAr ? "شاركنا خبرتك لمساعدة الطهاة الصاعدين" : "Share your expertise to help aspiring chefs grow"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormErrorSummary errors={errorList} />

            {programs.length > 0 && (
              <div className="space-y-2">
                <FormField label={isAr ? "البرنامج (اختياري)" : "Program (optional)"} htmlFor="program">
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger id="program">
                      <SelectValue placeholder={isAr ? "اختر برنامج" : "Select a program"} />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map(p => (
                        <SelectItem key={p.id} value={p.id}>{isAr ? p.title_ar || p.title : p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            )}

            <FormField label={isAr ? "سنوات الخبرة" : "Years of Experience"} htmlFor="years" required error={getError("years")}>
              <Input
                id="years"
                type="number"
                min="1"
                value={years}
                onChange={e => handleChange("years", e.target.value)}
                onBlur={() => onBlur("years", years)}
                state={errors.years ? "error" : "default"}
                placeholder="e.g. 10"
              />
            </FormField>

            <div className="space-y-2">
              <FormField label={isAr ? "مجالات الخبرة" : "Areas of Expertise"} required error={expertise.length === 0 && errorList.length > 0 ? (isAr ? "يرجى اختيار مجال واحد على الأقل" : "Select at least one area") : undefined}>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_OPTIONS.map(item => (
                    <Badge
                      key={item}
                      variant={expertise.includes(item) ? "default" : "outline"}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleExpertise(item)}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </FormField>
            </div>

            <FormField label={isAr ? "نبذة عنك" : "About You"} htmlFor="bio" required error={getError("bio")}>
              <Textarea
                id="bio"
                value={bio}
                onChange={e => handleChange("bio", e.target.value)}
                onBlur={() => onBlur("bio", bio)}
                state={errors.bio ? "error" : "default"}
                placeholder={isAr ? "اكتب نبذة عن خبرتك وما يمكنك تقديمه..." : "Tell us about your experience and what you can offer..."}
                rows={5}
                maxCharacters={1000}
              />
            </FormField>

            <SubmitButton
              loading={applyMutation.isPending}
              loadingText={isAr ? "جاري الإرسال..." : "Submitting..."}
              icon={<Send className="h-4 w-4" />}
              className="w-full"
              onClick={handleSubmit}
            >
              {isAr ? "تقديم الطلب" : "Submit Application"}
            </SubmitButton>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
