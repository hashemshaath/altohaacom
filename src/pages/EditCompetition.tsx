import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function EditCompetition() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [competitionStart, setCompetitionStart] = useState("");
  const [competitionEnd, setCompetitionEnd] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [venue, setVenue] = useState("");
  const [venueAr, setVenueAr] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");

  // Fetch competition data
  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Populate form when data loads
  useEffect(() => {
    if (competition) {
      setTitle(competition.title);
      setTitleAr(competition.title_ar || "");
      setDescription(competition.description || "");
      setDescriptionAr(competition.description_ar || "");
      setRegistrationStart(competition.registration_start ? competition.registration_start.slice(0, 16) : "");
      setRegistrationEnd(competition.registration_end ? competition.registration_end.slice(0, 16) : "");
      setCompetitionStart(competition.competition_start.slice(0, 16));
      setCompetitionEnd(competition.competition_end.slice(0, 16));
      setIsVirtual(competition.is_virtual || false);
      setVenue(competition.venue || "");
      setVenueAr(competition.venue_ar || "");
      setCity(competition.city || "");
      setCountry(competition.country || "");
      setMaxParticipants(competition.max_participants || "");
    }
  }, [competition]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("competitions")
        .update({
          title,
          title_ar: titleAr || null,
          description: description || null,
          description_ar: descriptionAr || null,
          registration_start: registrationStart || null,
          registration_end: registrationEnd || null,
          competition_start: competitionStart,
          competition_end: competitionEnd,
          is_virtual: isVirtual,
          venue: isVirtual ? null : venue || null,
          venue_ar: isVirtual ? null : venueAr || null,
          city: isVirtual ? null : city || null,
          country: isVirtual ? null : country || null,
          max_participants: maxParticipants || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition", id] });
      toast({
        title: language === "ar" ? "تم حفظ التغييرات!" : "Changes saved!",
        description: language === "ar"
          ? "تم تحديث تفاصيل المسابقة"
          : "Competition details have been updated.",
      });
      navigate(`/competitions/${id}`);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !competitionStart || !competitionEnd) {
      toast({
        variant: "destructive",
        title: language === "ar" ? "حقول مطلوبة" : "Required fields",
        description: language === "ar"
          ? "الرجاء ملء العنوان وتواريخ المسابقة"
          : "Please fill in title and competition dates",
      });
      return;
    }
    updateMutation.mutate();
  };

  // Check if user is the organizer
  const isOrganizer = user && competition && competition.organizer_id === user.id;

  if (isLoading) {
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

  if (!competition) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8 text-center">
          <p className="text-muted-foreground">
            {language === "ar" ? "المسابقة غير موجودة" : "Competition not found"}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8 text-center">
          <p className="text-muted-foreground">
            {language === "ar"
              ? "ليس لديك صلاحية لتعديل هذه المسابقة"
              : "You don't have permission to edit this competition"}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/competitions/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "العودة للمسابقة" : "Back to Competition"}
        </Button>

        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 font-serif text-3xl font-bold">
            {language === "ar" ? "تعديل المسابقة" : "Edit Competition"}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {language === "ar"
              ? "قم بتحديث تفاصيل المسابقة"
              : "Update the competition details"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "ar" ? "المعلومات الأساسية" : "Basic Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {language === "ar" ? "العنوان (إنجليزي)" : "Title (English)"} *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">
                      {language === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}
                    </Label>
                    <Input
                      id="titleAr"
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">
                    {language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}
                  </Label>
                  <Textarea
                    id="descriptionAr"
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                    rows={4}
                    dir="rtl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "ar" ? "التواريخ والموقع" : "Dates & Location"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="regStart">
                      {language === "ar" ? "بداية التسجيل" : "Registration Start"}
                    </Label>
                    <Input
                      id="regStart"
                      type="datetime-local"
                      value={registrationStart}
                      onChange={(e) => setRegistrationStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regEnd">
                      {language === "ar" ? "نهاية التسجيل" : "Registration End"}
                    </Label>
                    <Input
                      id="regEnd"
                      type="datetime-local"
                      value={registrationEnd}
                      onChange={(e) => setRegistrationEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="compStart">
                      {language === "ar" ? "بداية المسابقة" : "Competition Start"} *
                    </Label>
                    <Input
                      id="compStart"
                      type="datetime-local"
                      value={competitionStart}
                      onChange={(e) => setCompetitionStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compEnd">
                      {language === "ar" ? "نهاية المسابقة" : "Competition End"} *
                    </Label>
                    <Input
                      id="compEnd"
                      type="datetime-local"
                      value={competitionEnd}
                      onChange={(e) => setCompetitionEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">
                      {language === "ar" ? "مسابقة افتراضية" : "Virtual Competition"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar"
                        ? "هذه المسابقة تقام عبر الإنترنت"
                        : "This competition takes place online"}
                    </p>
                  </div>
                  <Switch checked={isVirtual} onCheckedChange={setIsVirtual} />
                </div>

                {!isVirtual && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="venue">
                          {language === "ar" ? "المكان (إنجليزي)" : "Venue (English)"}
                        </Label>
                        <Input
                          id="venue"
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venueAr">
                          {language === "ar" ? "المكان (عربي)" : "Venue (Arabic)"}
                        </Label>
                        <Input
                          id="venueAr"
                          value={venueAr}
                          onChange={(e) => setVenueAr(e.target.value)}
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          {language === "ar" ? "المدينة" : "City"}
                        </Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">
                          {language === "ar" ? "الدولة" : "Country"}
                        </Label>
                        <Input
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">
                    {language === "ar" ? "الحد الأقصى للمشاركين" : "Max Participants"}
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={maxParticipants}
                    onChange={(e) =>
                      setMaxParticipants(e.target.value ? parseInt(e.target.value) : "")
                    }
                    placeholder={
                      language === "ar" ? "اتركه فارغاً للعدد غير المحدود" : "Leave empty for unlimited"
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/competitions/${id}`)}
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
