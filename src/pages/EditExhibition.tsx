import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Landmark } from "lucide-react";
import { ExhibitionBasicInfoStep } from "@/components/exhibitions/wizard/BasicInfoStep";
import { ExhibitionDatesLocationStep } from "@/components/exhibitions/wizard/DatesLocationStep";
import { ExhibitionOrganizerTicketsStep } from "@/components/exhibitions/wizard/OrganizerTicketsStep";
import type { ExhibitionFormData } from "@/components/exhibitions/wizard/types";

export default function EditExhibition() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [data, setData] = useState<ExhibitionFormData | null>(null);

  const updateData = useCallback((updates: Partial<ExhibitionFormData>) => {
    setData((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const { data: exhibition, isLoading } = useQuery({
    queryKey: ["exhibition", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, description, description_ar, type, status, cover_image_url, start_date, end_date, registration_deadline, venue_name, venue_name_ar, venue_address, venue_address_ar, city, city_ar, country, country_ar, latitude, longitude, organizer_id, max_capacity, ticket_price, currency, is_free, contact_email, contact_phone, website_url, tags, created_at, updated_at")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Populate form when exhibition loads
  useEffect(() => {
    if (exhibition) {
      setData({
        title: exhibition.title,
        titleAr: exhibition.title_ar || "",
        description: exhibition.description || "",
        descriptionAr: exhibition.description_ar || "",
        type: exhibition.type,
        coverImageUrl: exhibition.cover_image_url || "",
        startDate: exhibition.start_date ? exhibition.start_date.slice(0, 16) : "",
        endDate: exhibition.end_date ? exhibition.end_date.slice(0, 16) : "",
        registrationDeadline: exhibition.registration_deadline
          ? exhibition.registration_deadline.slice(0, 16)
          : "",
        isVirtual: exhibition.is_virtual || false,
        virtualLink: exhibition.virtual_link || "",
        venue: exhibition.venue || "",
        venueAr: exhibition.venue_ar || "",
        city: exhibition.city || "",
        country: exhibition.country || "",
        mapUrl: exhibition.map_url || "",
        organizerId: (exhibition as any).organizer_id || "",
        organizerName: exhibition.organizer_name || "",
        organizerNameAr: exhibition.organizer_name_ar || "",
        organizerEmail: exhibition.organizer_email || "",
        organizerPhone: exhibition.organizer_phone || "",
        organizerWebsite: exhibition.organizer_website || "",
        registrationUrl: exhibition.registration_url || "",
        websiteUrl: exhibition.website_url || "",
        isFree: exhibition.is_free || false,
        ticketPrice: exhibition.ticket_price || "",
        ticketPriceAr: exhibition.ticket_price_ar || "",
        maxAttendees: exhibition.max_attendees?.toString() || "",
        tags: (exhibition.tags || []).join(", "),
        targetAudience: (exhibition.target_audience || []).join(", "),
        isFeatured: exhibition.is_featured || false,
        seriesId: (exhibition as any).series_id || "",
        editionYear: (exhibition as any).edition_year?.toString() || "",
      });
    }
  }, [exhibition]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user || !exhibition || !data) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("exhibitions")
        .update({
          title: data.title,
          title_ar: data.titleAr || null,
          description: data.description || null,
          description_ar: data.descriptionAr || null,
          type: data.type as any,
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
          organizer_id: data.organizerId || null,
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
          tags: data.tags
            ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
          target_audience: data.targetAudience
            ? data.targetAudience.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
          series_id: data.seriesId || null,
          edition_year: data.editionYear ? parseInt(data.editionYear) : null,
        } as any)
        .eq("id", exhibition.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition", slug] });
      queryClient.invalidateQueries({ queryKey: ["exhibitions"] });
      toast({
        title: isAr ? "تم حفظ التغييرات!" : "Changes saved!",
      });
      navigate(`/exhibitions/${slug}`);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !data.title.trim() || !data.startDate || !data.endDate) {
      toast({
        variant: "destructive",
        title: isAr ? "حقول مطلوبة" : "Required fields",
        description: isAr
          ? "يرجى ملء العنوان والتواريخ"
          : "Please fill in the title and dates",
      });
      return;
    }
    updateMutation.mutate();
  };

  const isCreator = user && exhibition && exhibition.created_by === user.id;

  if (isLoading || (exhibition && !data)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!exhibition || !isCreator || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
            <Landmark className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-semibold">
            {!exhibition
              ? isAr ? "الفعالية غير موجودة" : "Event not found"
              : isAr ? "ليس لديك صلاحية تعديل هذه الفعالية" : "You don't have permission to edit this event"}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/exhibitions")}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {isAr ? "العودة للفعاليات" : "Back to Events"}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/exhibitions/${slug}`)} className="mb-4">
          <ArrowLeft className="me-2 h-4 w-4" />
          {isAr ? "العودة للفعالية" : "Back to Event"}
        </Button>

        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl">
                {isAr ? "تعديل الفعالية" : "Edit Event"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAr ? "قم بتحديث تفاصيل الفعالية" : "Update the event details"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="info" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">
                  {isAr ? "المعلومات" : "Info"}
                </TabsTrigger>
                <TabsTrigger value="dates">
                  {isAr ? "التاريخ والموقع" : "Dates & Location"}
                </TabsTrigger>
                <TabsTrigger value="details">
                  {isAr ? "المنظم والتذاكر" : "Organizer & Tickets"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <ExhibitionBasicInfoStep data={data} onChange={updateData} />
              </TabsContent>
              <TabsContent value="dates">
                <ExhibitionDatesLocationStep data={data} onChange={updateData} />
              </TabsContent>
              <TabsContent value="details">
                <ExhibitionOrganizerTicketsStep data={data} onChange={updateData} />
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/exhibitions/${slug}`)}
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="me-2 h-4 w-4" />
                )}
                {isAr ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
