import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Save, User, Shield, Plane, Heart, Briefcase } from "lucide-react";

interface Props {
  userId: string;
  isAdmin?: boolean;
}

export default function JudgeProfileForm({ userId, isAdmin }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["judge-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: baseProfile } = useQuery({
    queryKey: ["base-profile", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      return data;
    },
  });

  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        judge_title: profile.judge_title || "",
        judge_title_ar: profile.judge_title_ar || "",
        judge_category: profile.judge_category || "",
        judge_level: profile.judge_level || "",
        nationality: profile.nationality || "",
        second_nationality: profile.second_nationality || "",
        country_of_residence: profile.country_of_residence || "",
        full_name_ar: profile.full_name_ar || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        marital_status: profile.marital_status || "",
        spouse_name: profile.spouse_name || "",
        spouse_name_ar: profile.spouse_name_ar || "",
        spouse_phone: profile.spouse_phone || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        blood_type: profile.blood_type || "",
        passport_number: profile.passport_number || "",
        passport_country: profile.passport_country || "",
        passport_issue_date: profile.passport_issue_date || "",
        passport_expiry_date: profile.passport_expiry_date || "",
        national_id: profile.national_id || "",
        current_position: profile.current_position || "",
        current_employer: profile.current_employer || "",
        years_of_experience: profile.years_of_experience || "",
        culinary_specialties: (profile.culinary_specialties || []).join(", "),
        certifications: (profile.certifications || []).join(", "),
        languages_spoken: (profile.languages_spoken || []).join(", "),
        education: profile.education || "",
        education_ar: profile.education_ar || "",
        dietary_restrictions: profile.dietary_restrictions || "",
        allergies: profile.allergies || "",
        medical_notes: profile.medical_notes || "",
        shirt_size: profile.shirt_size || "",
        preferred_airline: profile.preferred_airline || "",
        frequent_flyer_number: profile.frequent_flyer_number || "",
        travel_notes: profile.travel_notes || "",
        notes: profile.notes || "",
        internal_notes: profile.internal_notes || "",
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId,
        judge_title: form.judge_title || null,
        judge_title_ar: form.judge_title_ar || null,
        judge_category: form.judge_category || null,
        judge_level: form.judge_level || null,
        nationality: form.nationality || null,
        second_nationality: form.second_nationality || null,
        country_of_residence: form.country_of_residence || null,
        full_name_ar: form.full_name_ar || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        marital_status: form.marital_status || null,
        spouse_name: form.spouse_name || null,
        spouse_name_ar: form.spouse_name_ar || null,
        spouse_phone: form.spouse_phone || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        blood_type: form.blood_type || null,
        passport_number: form.passport_number || null,
        passport_country: form.passport_country || null,
        passport_issue_date: form.passport_issue_date || null,
        passport_expiry_date: form.passport_expiry_date || null,
        national_id: form.national_id || null,
        current_position: form.current_position || null,
        current_employer: form.current_employer || null,
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : null,
        culinary_specialties: form.culinary_specialties ? form.culinary_specialties.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        certifications: form.certifications ? form.certifications.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        languages_spoken: form.languages_spoken ? form.languages_spoken.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        education: form.education || null,
        education_ar: form.education_ar || null,
        dietary_restrictions: form.dietary_restrictions || null,
        allergies: form.allergies || null,
        medical_notes: form.medical_notes || null,
        shirt_size: form.shirt_size || null,
        preferred_airline: form.preferred_airline || null,
        frequent_flyer_number: form.frequent_flyer_number || null,
        travel_notes: form.travel_notes || null,
        notes: form.notes || null,
        internal_notes: isAdmin ? (form.internal_notes || null) : undefined,
      };

      if (profile) {
        const { error } = await supabase.from("judge_profiles").update(payload).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("judge_profiles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-judges"] });
      toast({ title: isAr ? "تم حفظ الملف" : "Profile saved" });
    },
    onError: (err: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  if (isLoading) return <p className="text-muted-foreground py-8 text-center">{isAr ? "جاري التحميل..." : "Loading..."}</p>;

  return (
    <div className="space-y-6">
      {/* Classification & Title */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            {isAr ? "التصنيف واللقب" : "Classification & Title"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{isAr ? "اللقب (EN)" : "Judge Title (EN)"}</Label><Input value={form.judge_title || ""} onChange={e => update("judge_title", e.target.value)} placeholder="e.g. Senior International Judge" /></div>
            <div><Label>{isAr ? "اللقب (AR)" : "Judge Title (AR)"}</Label><Input value={form.judge_title_ar || ""} onChange={e => update("judge_title_ar", e.target.value)} dir="rtl" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>{isAr ? "التخصص" : "Category"}</Label>
              <Select value={form.judge_category || ""} onValueChange={v => update("judge_category", v)}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="culinary">{isAr ? "طهي" : "Culinary"}</SelectItem>
                  <SelectItem value="pastry">{isAr ? "حلويات" : "Pastry"}</SelectItem>
                  <SelectItem value="beverage">{isAr ? "مشروبات" : "Beverage"}</SelectItem>
                  <SelectItem value="table_art">{isAr ? "فن الطاولة" : "Table Art"}</SelectItem>
                  <SelectItem value="multi">{isAr ? "متعدد" : "Multi-discipline"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "المستوى" : "Level"}</Label>
              <Select value={form.judge_level || ""} onValueChange={v => update("judge_level", v)}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">{isAr ? "وطني" : "National"}</SelectItem>
                  <SelectItem value="international">{isAr ? "دولي" : "International"}</SelectItem>
                  <SelectItem value="master">{isAr ? "ماستر" : "Master"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{isAr ? "سنوات الخبرة" : "Years of Experience"}</Label><Input type="number" value={form.years_of_experience || ""} onChange={e => update("years_of_experience", e.target.value)} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>{isAr ? "الجنسية" : "Nationality"}</Label><Input value={form.nationality || ""} onChange={e => update("nationality", e.target.value)} /></div>
            <div><Label>{isAr ? "الجنسية الثانية" : "Second Nationality"}</Label><Input value={form.second_nationality || ""} onChange={e => update("second_nationality", e.target.value)} /></div>
            <div><Label>{isAr ? "بلد الإقامة" : "Country of Residence"}</Label><Input value={form.country_of_residence || ""} onChange={e => update("country_of_residence", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            {isAr ? "المعلومات الشخصية" : "Personal Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{isAr ? "الاسم الكامل (AR)" : "Full Name (AR)"}</Label><Input value={form.full_name_ar || ""} onChange={e => update("full_name_ar", e.target.value)} dir="rtl" /></div>
            <div><Label>{isAr ? "تاريخ الميلاد" : "Date of Birth"}</Label><Input type="date" value={form.date_of_birth || ""} onChange={e => update("date_of_birth", e.target.value)} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>{isAr ? "الجنس" : "Gender"}</Label>
              <Select value={form.gender || ""} onValueChange={v => update("gender", v)}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{isAr ? "ذكر" : "Male"}</SelectItem>
                  <SelectItem value="female">{isAr ? "أنثى" : "Female"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "الحالة الاجتماعية" : "Marital Status"}</Label>
              <Select value={form.marital_status || ""} onValueChange={v => update("marital_status", v)}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{isAr ? "أعزب" : "Single"}</SelectItem>
                  <SelectItem value="married">{isAr ? "متزوج" : "Married"}</SelectItem>
                  <SelectItem value="divorced">{isAr ? "مطلق" : "Divorced"}</SelectItem>
                  <SelectItem value="widowed">{isAr ? "أرمل" : "Widowed"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "فصيلة الدم" : "Blood Type"}</Label>
              <Select value={form.blood_type || ""} onValueChange={v => update("blood_type", v)}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                    <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <h4 className="font-semibold text-sm">{isAr ? "معلومات الزوج/الزوجة" : "Spouse Information"}</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>{isAr ? "اسم الزوج/الزوجة (EN)" : "Spouse Name (EN)"}</Label><Input value={form.spouse_name || ""} onChange={e => update("spouse_name", e.target.value)} /></div>
            <div><Label>{isAr ? "اسم الزوج/الزوجة (AR)" : "Spouse Name (AR)"}</Label><Input value={form.spouse_name_ar || ""} onChange={e => update("spouse_name_ar", e.target.value)} dir="rtl" /></div>
            <div><Label>{isAr ? "هاتف الزوج/الزوجة" : "Spouse Phone"}</Label><Input value={form.spouse_phone || ""} onChange={e => update("spouse_phone", e.target.value)} /></div>
          </div>

          <Separator />
          <h4 className="font-semibold text-sm">{isAr ? "جهة الاتصال في حالات الطوارئ" : "Emergency Contact"}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{isAr ? "الاسم" : "Name"}</Label><Input value={form.emergency_contact_name || ""} onChange={e => update("emergency_contact_name", e.target.value)} /></div>
            <div><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={form.emergency_contact_phone || ""} onChange={e => update("emergency_contact_phone", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Passport & ID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            {isAr ? "جواز السفر والهوية" : "Passport & ID"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><Label>{isAr ? "رقم الجواز" : "Passport Number"}</Label><Input value={form.passport_number || ""} onChange={e => update("passport_number", e.target.value)} /></div>
            <div><Label>{isAr ? "بلد الإصدار" : "Passport Country"}</Label><Input value={form.passport_country || ""} onChange={e => update("passport_country", e.target.value)} /></div>
            <div><Label>{isAr ? "رقم الهوية الوطنية" : "National ID"}</Label><Input value={form.national_id || ""} onChange={e => update("national_id", e.target.value)} /></div>
            <div><Label>{isAr ? "تاريخ الإصدار" : "Passport Issue Date"}</Label><Input type="date" value={form.passport_issue_date || ""} onChange={e => update("passport_issue_date", e.target.value)} /></div>
            <div><Label>{isAr ? "تاريخ الانتهاء" : "Passport Expiry Date"}</Label><Input type="date" value={form.passport_expiry_date || ""} onChange={e => update("passport_expiry_date", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-primary" />
            {isAr ? "المعلومات المهنية" : "Professional Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{isAr ? "المنصب الحالي" : "Current Position"}</Label><Input value={form.current_position || ""} onChange={e => update("current_position", e.target.value)} /></div>
            <div><Label>{isAr ? "جهة العمل" : "Current Employer"}</Label><Input value={form.current_employer || ""} onChange={e => update("current_employer", e.target.value)} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{isAr ? "التعليم (EN)" : "Education (EN)"}</Label><Textarea value={form.education || ""} onChange={e => update("education", e.target.value)} rows={2} /></div>
            <div><Label>{isAr ? "التعليم (AR)" : "Education (AR)"}</Label><Textarea value={form.education_ar || ""} onChange={e => update("education_ar", e.target.value)} rows={2} dir="rtl" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>{isAr ? "تخصصات الطهي (مفصولة بفواصل)" : "Culinary Specialties (comma-separated)"}</Label><Input value={form.culinary_specialties || ""} onChange={e => update("culinary_specialties", e.target.value)} /></div>
            <div><Label>{isAr ? "الشهادات المهنية" : "Certifications"}</Label><Input value={form.certifications || ""} onChange={e => update("certifications", e.target.value)} /></div>
            <div><Label>{isAr ? "اللغات" : "Languages Spoken"}</Label><Input value={form.languages_spoken || ""} onChange={e => update("languages_spoken", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Health & Dietary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" />
            {isAr ? "الصحة والنظام الغذائي" : "Health & Dietary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>{isAr ? "القيود الغذائية" : "Dietary Restrictions"}</Label><Input value={form.dietary_restrictions || ""} onChange={e => update("dietary_restrictions", e.target.value)} /></div>
            <div><Label>{isAr ? "الحساسية" : "Allergies"}</Label><Input value={form.allergies || ""} onChange={e => update("allergies", e.target.value)} /></div>
            <div><Label>{isAr ? "ملاحظات طبية" : "Medical Notes"}</Label><Input value={form.medical_notes || ""} onChange={e => update("medical_notes", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Travel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plane className="h-5 w-5 text-primary" />
            {isAr ? "معلومات السفر" : "Travel Preferences"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label>{isAr ? "مقاس القميص" : "Shirt Size"}</Label><Input value={form.shirt_size || ""} onChange={e => update("shirt_size", e.target.value)} /></div>
            <div><Label>{isAr ? "شركة الطيران المفضلة" : "Preferred Airline"}</Label><Input value={form.preferred_airline || ""} onChange={e => update("preferred_airline", e.target.value)} /></div>
            <div><Label>{isAr ? "رقم المسافر الدائم" : "Frequent Flyer #"}</Label><Input value={form.frequent_flyer_number || ""} onChange={e => update("frequent_flyer_number", e.target.value)} /></div>
            <div><Label>{isAr ? "ملاحظات السفر" : "Travel Notes"}</Label><Input value={form.travel_notes || ""} onChange={e => update("travel_notes", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div><Label>{isAr ? "ملاحظات عامة" : "General Notes"}</Label><Textarea value={form.notes || ""} onChange={e => update("notes", e.target.value)} rows={3} /></div>
          {isAdmin && (
            <div><Label>{isAr ? "ملاحظات داخلية (للإدارة فقط)" : "Internal Notes (Admin Only)"}</Label><Textarea value={form.internal_notes || ""} onChange={e => update("internal_notes", e.target.value)} rows={3} className="border-destructive/30" /></div>
          )}
        </CardContent>
      </Card>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg">
        <Save className="me-2 h-4 w-4" />
        {saveMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الملف" : "Save Profile")}
      </Button>
    </div>
  );
}
