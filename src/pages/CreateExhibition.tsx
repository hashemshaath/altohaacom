import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Save, Loader2, Landmark } from "lucide-react";
import { ExhibitionStepIndicator } from "@/components/exhibitions/wizard/ExhibitionStepIndicator";
import { ExhibitionBasicInfoStep } from "@/components/exhibitions/wizard/BasicInfoStep";
import { ExhibitionDatesLocationStep } from "@/components/exhibitions/wizard/DatesLocationStep";
import { ExhibitionOrganizerTicketsStep } from "@/components/exhibitions/wizard/OrganizerTicketsStep";
import { ExhibitionReviewStep } from "@/components/exhibitions/wizard/ReviewStep";
import { initialExhibitionData } from "@/components/exhibitions/wizard/types";
import type { ExhibitionFormData } from "@/components/exhibitions/wizard/types";
import { EventCreationGate } from "@/components/permissions/EventCreationGate";

export default function CreateExhibition() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ExhibitionFormData>(initialExhibitionData);

  const updateData = useCallback((updates: Partial<ExhibitionFormData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = () => {
    if (step === 1) return data.title.trim() !== "";
    if (step === 2) return data.startDate !== "" && data.endDate !== "";
    return true;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const slug =
        data.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") || `event-${Date.now()}`;

      const { data: exhibition, error } = await supabase
        .from("exhibitions")
        .insert({
          title: data.title,
          title_ar: data.titleAr || null,
          slug,
          description: data.description || null,
          description_ar: data.descriptionAr || null,
          type: data.type as any,
          status: "draft" as any,
          start_date: data.startDate,
          end_date: data.endDate,
          registration_deadline: data.registrationDeadline || null,
          is_virtual: data.isVirtual,
          virtual_link: data.isVirtual ? data.virtualLink || null : null,
          venue: data.isVirtual ? null : data.venue || null,
          venue_ar: data.isVirtual ? null : data.venueAr || null,
          city: data.isVirtual ? null : data.city || null,
          country: data.isVirtual ? null : data.country || null,
          map_url: data.mapUrl || null,
          cover_image_url: data.coverImageUrl || null,
          organizer_name: data.organizerName || null,
          organizer_name_ar: data.organizerNameAr || null,
          organizer_email: data.organizerEmail || null,
          organizer_phone: data.organizerPhone || null,
          organizer_website: data.organizerWebsite || null,
          registration_url: data.registrationUrl || null,
          website_url: data.websiteUrl || null,
          is_free: data.isFree,
          ticket_price: data.isFree ? null : data.ticketPrice || null,
          ticket_price_ar: data.isFree ? null : data.ticketPriceAr || null,
          max_attendees: data.maxAttendees ? parseInt(data.maxAttendees) : null,
          is_featured: data.isFeatured,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          target_audience: data.targetAudience
            ? data.targetAudience.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return exhibition;
    },
    onSuccess: (exhibition) => {
      toast({
        title: isAr ? "تم إنشاء الفعالية!" : "Exhibition created!",
        description: isAr ? "تم حفظ الفعالية كمسودة." : "Your event has been saved as a draft.",
      });
      navigate(`/exhibitions/${exhibition.slug}`);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <EventCreationGate eventType="exhibition">
        <Button variant="ghost" size="sm" onClick={() => navigate("/exhibitions")} className="mb-4">
          <ArrowLeft className="me-2 h-4 w-4" />
          {isAr ? "العودة للفعاليات" : "Back to Events"}
        </Button>

        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl">
                {isAr ? "إنشاء فعالية جديدة" : "Create New Event"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAr ? "أدخل التفاصيل لإنشاء فعالية جديدة" : "Fill in the details to create a new event"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <ExhibitionStepIndicator currentStep={step} />
          </div>

          {step === 1 && <ExhibitionBasicInfoStep data={data} onChange={updateData} />}
          {step === 2 && <ExhibitionDatesLocationStep data={data} onChange={updateData} />}
          {step === 3 && <ExhibitionOrganizerTicketsStep data={data} onChange={updateData} />}
          {step === 4 && <ExhibitionReviewStep data={data} />}

          <div className="mt-8 flex items-center justify-between rounded-xl border bg-card p-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {isAr ? "السابق" : "Previous"}
            </Button>

            <span className="text-sm text-muted-foreground">
              {step} / 4
            </span>

            {step < 4 ? (
              <Button size="lg" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2">
                {isAr ? "التالي" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !data.title.trim()}
                className="gap-2"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isAr ? "إنشاء الفعالية" : "Create Event"}
              </Button>
            )}
          </div>
        </div>
        </EventCreationGate>
      </main>
      <Footer />
    </div>
  );
}
