import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useApplyAsMentor, useMentorshipPrograms, useMyMentorApplication } from "@/hooks/useMentorship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { HandHeart, Send, CheckCircle, Clock, X } from "lucide-react";

const EXPERTISE_OPTIONS = [
  "French Cuisine", "Italian Cuisine", "Asian Cuisine", "Middle Eastern Cuisine",
  "Pastry & Baking", "Molecular Gastronomy", "Farm-to-Table", "Vegan/Plant-Based",
  "Competition Prep", "Kitchen Management", "Food Photography", "Menu Design",
];

export default function MentorApply() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAr = language === "ar";
  const { data: existingApp, isLoading: appLoading } = useMyMentorApplication();
  const { data: programs = [] } = useMentorshipPrograms("active");
  const applyMutation = useApplyAsMentor();

  const [bio, setBio] = useState("");
  const [years, setYears] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [programId, setProgramId] = useState("");

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
    if (!bio || expertise.length === 0 || !years) {
      toast({ variant: "destructive", title: isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields" });
      return;
    }
    applyMutation.mutate(
      { bio, expertise, years_experience: parseInt(years), program_id: programId || undefined },
      {
        onSuccess: () => {
          toast({ title: isAr ? "تم تقديم الطلب بنجاح" : "Application submitted successfully" });
          navigate("/mentorship");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: isAr ? "فشل التقديم" : "Submission failed", description: err.message });
        },
      }
    );
  };

  const toggleExpertise = (item: string) => {
    setExpertise(prev => prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]);
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
            {programs.length > 0 && (
              <div className="space-y-2">
                <Label>{isAr ? "البرنامج (اختياري)" : "Program (optional)"}</Label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? "اختر برنامج" : "Select a program"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map(p => (
                      <SelectItem key={p.id} value={p.id}>{isAr ? p.title_ar || p.title : p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{isAr ? "سنوات الخبرة" : "Years of Experience"} *</Label>
              <Input type="number" min="1" value={years} onChange={e => setYears(e.target.value)} placeholder="e.g. 10" />
            </div>

            <div className="space-y-2">
              <Label>{isAr ? "مجالات الخبرة" : "Areas of Expertise"} *</Label>
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
            </div>

            <div className="space-y-2">
              <Label>{isAr ? "نبذة عنك" : "About You"} *</Label>
              <Textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={isAr ? "اكتب نبذة عن خبرتك وما يمكنك تقديمه..." : "Tell us about your experience and what you can offer..."}
                rows={5}
              />
            </div>

            <Button onClick={handleSubmit} disabled={applyMutation.isPending} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {applyMutation.isPending ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "تقديم الطلب" : "Submit Application")}
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
