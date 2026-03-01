import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAwardPoints } from "@/hooks/useAwardPoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Upload, X, Loader2, ArrowLeft, UserPlus, Users, Building2, Plus, Trash2, DollarSign, Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  max_participants: number | null;
}

interface TeamMember {
  member_name: string;
  member_name_ar: string;
  role_in_team: string;
  job_title: string;
  email: string;
  user_id?: string;
  avatar_url?: string;
  is_captain: boolean;
}

interface RegistrationFormProps {
  competitionId: string;
  competitionTitle: string;
  categories: Category[];
  onCancel: () => void;
  onSuccess: () => void;
}

const ENTRY_TYPE_CONFIG = {
  individual: { icon: UserPlus, labelEn: "Individual", labelAr: "فردي" },
  team: { icon: Users, labelEn: "Team / Group", labelAr: "فريق / مجموعة" },
  organization: { icon: Building2, labelEn: "Organization", labelAr: "منظمة / جهة" },
};

const ORG_TYPES = [
  { value: "hotel", label: "Hotel", labelAr: "فندق" },
  { value: "restaurant", label: "Restaurant", labelAr: "مطعم" },
  { value: "institution", label: "Institution", labelAr: "مؤسسة" },
  { value: "university", label: "University", labelAr: "جامعة" },
  { value: "culinary_school", label: "Culinary School", labelAr: "مدرسة طبخ" },
  { value: "other", label: "Other", labelAr: "أخرى" },
];

export function RegistrationForm({
  competitionId,
  competitionTitle,
  categories,
  onCancel,
  onSuccess,
}: RegistrationFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const awardPoints = useAwardPoints();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAr = language === "ar";

  // Fetch competition settings
  const { data: competition } = useQuery({
    queryKey: ["competition-reg-settings", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("registration_fee_type, registration_fee, registration_currency, registration_tax_rate, registration_tax_name, registration_tax_name_ar, allowed_entry_types, max_team_size, min_team_size")
        .eq("id", competitionId)
        .maybeSingle();
      return data;
    },
  });

  // User search for team members
  const [memberSearch, setMemberSearch] = useState("");
  const { data: searchResults = [] } = useQuery({
    queryKey: ["user-search-reg", memberSearch],
    queryFn: async () => {
      if (memberSearch.trim().length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, specialization, username")
        .or(`full_name.ilike.%${memberSearch}%,username.ilike.%${memberSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: memberSearch.trim().length >= 2,
  });

  const allowedTypes = (competition?.allowed_entry_types as string[]) || ["individual"];
  const isPaid = competition?.registration_fee_type === "paid" && (competition?.registration_fee || 0) > 0;
  const fee = competition?.registration_fee || 0;
  const currency = competition?.registration_currency || "SAR";
  const taxRate = competition?.registration_tax_rate || 0;
  const taxName = isAr ? (competition?.registration_tax_name_ar || "ضريبة") : (competition?.registration_tax_name || "Tax");

  const [entryType, setEntryType] = useState<string>(allowedTypes[0] || "individual");
  const [dishName, setDishName] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");

  // Team fields
  const [teamName, setTeamName] = useState("");
  const [teamNameAr, setTeamNameAr] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Organization fields
  const [orgName, setOrgName] = useState("");
  const [orgNameAr, setOrgNameAr] = useState("");
  const [orgType, setOrgType] = useState("other");

  const resetForm = () => {
    setDishName(""); setDishDescription(""); setCategoryId("");
    setImageFile(null); setImagePreview(null); setNotes("");
    setTeamName(""); setTeamNameAr(""); setTeamMembers([]);
    setOrgName(""); setOrgNameAr(""); setOrgType("other");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ variant: "destructive", title: isAr ? "نوع ملف غير صالح" : "Invalid file type" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: isAr ? "الملف كبير جداً" : "File too large" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}/${competitionId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("dish-images").upload(fileName, imageFile);
    if (uploadError) throw new Error(uploadError.message);
    const { data: urlData } = supabase.storage.from("dish-images").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const addMember = (profile?: any) => {
    const member: TeamMember = {
      member_name: profile?.full_name || "",
      member_name_ar: "",
      role_in_team: "member",
      job_title: profile?.specialization || "",
      email: "",
      user_id: profile?.user_id,
      avatar_url: profile?.avatar_url,
      is_captain: teamMembers.length === 0,
    };
    setTeamMembers([...teamMembers, member]);
    setMemberSearch("");
  };

  const updateMember = (index: number, updates: Partial<TeamMember>) => {
    setTeamMembers(teamMembers.map((m, i) => i === index ? { ...m, ...updates } : m));
  };

  const removeMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      setUploading(true);

      let dishImageUrl: string | null = null;
      if (imageFile) dishImageUrl = await uploadImage();

      const taxAmount = isPaid ? fee * taxRate / 100 : 0;
      const totalAmount = isPaid ? fee + taxAmount : 0;

      const { data: registration, error } = await supabase
        .from("competition_registrations")
        .insert({
          competition_id: competitionId,
          participant_id: user.id,
          dish_name: dishName.trim() || null,
          dish_description: dishDescription.trim() || null,
          dish_image_url: dishImageUrl,
          category_id: categoryId || null,
          status: "pending",
          entry_type: entryType,
          team_name: entryType === "team" ? teamName.trim() || null : null,
          team_name_ar: entryType === "team" ? teamNameAr.trim() || null : null,
          organization_name: entryType === "organization" ? orgName.trim() || null : null,
          organization_name_ar: entryType === "organization" ? orgNameAr.trim() || null : null,
          organization_type: entryType === "organization" ? orgType : null,
          payment_status: isPaid ? "pending" : "not_required",
          payment_amount: totalAmount,
          payment_currency: currency,
          tax_amount: taxAmount,
          tax_rate: taxRate,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Insert team members if team entry
      if (entryType === "team" && teamMembers.length > 0 && registration) {
        const { error: tmError } = await supabase
          .from("registration_team_members")
          .insert(
            teamMembers.map((m, idx) => ({
              registration_id: registration.id,
              user_id: m.user_id || null,
              member_name: m.member_name,
              member_name_ar: m.member_name_ar || null,
              role_in_team: m.role_in_team || "member",
              job_title: m.job_title || null,
              avatar_url: m.avatar_url || null,
              email: m.email || null,
              is_captain: m.is_captain,
              sort_order: idx,
            }))
          );
        if (tmError) console.error("Team members error:", tmError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registration", competitionId] });
      // Award points for competition registration
      awardPoints.mutate({ actionType: "competition_register", referenceType: "competition", referenceId: competitionId });
      
      // Track competition registration conversion
      try {
        import("@/hooks/useGoogleTracking").then(({ sendGoogleConversion, pushToDataLayer }) => {
          sendGoogleConversion("competition_registration", { event_category: "engagement", competition_id: competitionId });
          pushToDataLayer("competition_registration", { competition_id: competitionId });
        });
        supabase.from("conversion_events").insert([{
          event_name: "competition_registration",
          event_category: "engagement",
          user_id: user?.id || null,
          session_id: sessionStorage.getItem("ad_session_id") || null,
          metadata: { competition_id: competitionId } as any,
        }]).then(() => {});
      } catch {}

      toast({
        title: isAr ? "تم تقديم التسجيل!" : "Registration submitted!",
        description: isAr ? "تسجيلك في انتظار الموافقة." : "Your registration is pending approval.",
      });
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      const msg = error?.message || "";
      if (msg.includes("idx_unique_registration") || msg.includes("duplicate")) {
        toast({ variant: "destructive", title: isAr ? "أنت مسجل بالفعل" : "Already registered", description: isAr ? "لا يمكن التسجيل مرتين في نفس المسابقة والفئة" : "You cannot register twice for the same competition and category" });
      } else {
        toast({ variant: "destructive", title: isAr ? "فشل التسجيل" : "Registration failed", description: msg });
      }
    },
    onSettled: () => setUploading(false),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      toast({ variant: "destructive", title: isAr ? "اسم الطبق مطلوب" : "Dish name required" });
      return;
    }
    if (entryType === "team") {
      if (!teamName.trim()) {
        toast({ variant: "destructive", title: isAr ? "اسم الفريق مطلوب" : "Team name required" });
        return;
      }
      const minSize = competition?.min_team_size || 2;
      if (teamMembers.length < minSize) {
        toast({ variant: "destructive", title: isAr ? `يجب إضافة ${minSize} أعضاء على الأقل` : `At least ${minSize} members required` });
        return;
      }
    }
    if (entryType === "organization" && !orgName.trim()) {
      toast({ variant: "destructive", title: isAr ? "اسم المنظمة مطلوب" : "Organization name required" });
      return;
    }
    registerMutation.mutate();
  };

  return (
    <Card className="border-primary/15 shadow-xl shadow-primary/5 overflow-hidden rounded-2xl">
      <CardHeader className="border-b border-border/30 bg-gradient-to-r from-primary/[0.04] to-transparent pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl shrink-0" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">{isAr ? "التسجيل في المسابقة" : "Register for Competition"}</CardTitle>
            <CardDescription className="truncate text-xs sm:text-sm">{competitionTitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entry Type Selection */}
          {allowedTypes.length > 1 && (
            <div className="space-y-2">
              <Label>{isAr ? "نوع المشاركة" : "Entry Type"} *</Label>
              <div className="grid gap-2 grid-cols-3">
                {allowedTypes.map((type) => {
                  const config = ENTRY_TYPE_CONFIG[type as keyof typeof ENTRY_TYPE_CONFIG];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEntryType(type)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 sm:p-4 text-xs font-semibold transition-all duration-300 ${entryType === type ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10" : "border-border/40 hover:border-primary/30 hover:bg-muted/20"}`}
                    >
                      <Icon className="h-5 w-5" />
                      {isAr ? config.labelAr : config.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Team Info */}
          {entryType === "team" && (
            <div className="space-y-4 rounded-xl border border-border/30 p-4 bg-muted/10">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                {isAr ? "معلومات الفريق" : "Team Information"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "اسم الفريق" : "Team Name"} *</Label>
                  <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} disabled={uploading} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "اسم الفريق (عربي)" : "Team Name (Arabic)"}</Label>
                  <Input value={teamNameAr} onChange={(e) => setTeamNameAr(e.target.value)} dir="rtl" disabled={uploading} />
                </div>
              </div>

              {/* Search & add members */}
              <div className="space-y-2">
                <Label className="text-xs">{isAr ? "أعضاء الفريق" : "Team Members"} ({teamMembers.length}/{competition?.max_team_size || 5})</Label>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "ابحث عن عضو من النظام..." : "Search for a member..."}
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="ps-9 h-8 text-xs"
                    disabled={uploading || teamMembers.length >= (competition?.max_team_size || 5)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-xl divide-y max-h-32 overflow-y-auto">
                    {searchResults
                      .filter((r: any) => !teamMembers.some((m) => m.user_id === r.user_id))
                      .map((r: any) => (
                        <button
                          key={r.user_id}
                          type="button"
                          className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 text-xs"
                          onClick={() => addMember(r)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={r.avatar_url || ""} />
                            <AvatarFallback className="text-[8px]">{(r.full_name || "U")[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{r.full_name}</span>
                          {r.specialization && <span className="text-muted-foreground">· {r.specialization}</span>}
                        </button>
                      ))}
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" className="text-xs gap-1" onClick={() => addMember()} disabled={teamMembers.length >= (competition?.max_team_size || 5)}>
                  <Plus className="h-3 w-3" /> {isAr ? "إضافة يدوياً" : "Add Manually"}
                </Button>
              </div>

              {/* Members list */}
              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  {teamMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded border p-2 bg-background">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.avatar_url || ""} />
                        <AvatarFallback className="text-[8px]">{(member.member_name || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <Input
                        value={member.member_name}
                        onChange={(e) => updateMember(idx, { member_name: e.target.value })}
                        placeholder={isAr ? "الاسم" : "Name"}
                        className="h-7 text-xs flex-1"
                      />
                      <Input
                        value={member.job_title}
                        onChange={(e) => updateMember(idx, { job_title: e.target.value })}
                        placeholder={isAr ? "المسمى" : "Title"}
                        className="h-7 text-xs w-24"
                      />
                      {member.is_captain && <Badge variant="secondary" className="text-[9px] shrink-0">{isAr ? "قائد" : "Captain"}</Badge>}
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeMember(idx)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Organization Info */}
          {entryType === "organization" && (
            <div className="space-y-3 rounded-xl border border-border/30 p-4 bg-muted/10">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" />
                {isAr ? "معلومات المنظمة" : "Organization Information"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "اسم المنظمة" : "Organization Name"} *</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} disabled={uploading} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                  <Input value={orgNameAr} onChange={(e) => setOrgNameAr(e.target.value)} dir="rtl" disabled={uploading} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نوع المنظمة" : "Organization Type"}</Label>
                <Select value={orgType} onValueChange={setOrgType}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Dish Name */}
          <div className="space-y-2">
            <Label htmlFor="dish-name">{isAr ? "اسم الطبق" : "Dish Name"} *</Label>
            <Input
              id="dish-name" value={dishName} onChange={(e) => setDishName(e.target.value)}
              placeholder={isAr ? "مثال: شواء البحر الأبيض المتوسط" : "e.g., Mediterranean Grilled Sea Bass"}
              maxLength={100} disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">{dishName.length}/100</p>
          </div>

          {/* Dish Description */}
          <div className="space-y-2">
            <Label htmlFor="dish-description">{isAr ? "وصف الطبق" : "Dish Description"}</Label>
            <Textarea
              id="dish-description" value={dishDescription} onChange={(e) => setDishDescription(e.target.value)}
              placeholder={isAr ? "صف طبقك ومكوناته..." : "Describe your dish, ingredients..."}
              rows={3} maxLength={500} disabled={uploading}
            />
          </div>

          {/* Category Selection */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>{isAr ? "الفئة" : "Category"}</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={uploading}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر فئة (اختياري)" : "Select a category (optional)"} /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{isAr && cat.name_ar ? cat.name_ar : cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dish Image Upload */}
          <div className="space-y-2">
            <Label>{isAr ? "صورة الطبق" : "Dish Photo"}</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={uploading} />
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Dish preview" className="h-48 w-full rounded-xl object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute end-2 top-2" onClick={removeImage} disabled={uploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="flex h-36 sm:h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 mb-2">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{isAr ? "انقر لإضافة صورة" : "Click to add a photo"}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{isAr ? "الحد الأقصى 5 ميجابايت" : "Max 5MB • JPG, PNG, WebP"}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{isAr ? "ملاحظات إضافية" : "Additional Notes"}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} disabled={uploading} placeholder={isAr ? "أي ملاحظات أخرى..." : "Any additional notes..."} />
          </div>

          {/* Fee Summary */}
          {isPaid && (
            <div className="rounded-2xl border border-primary/15 bg-primary/[0.02] p-4 sm:p-5 space-y-3">
              <p className="text-sm font-bold flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                {isAr ? "ملخص الرسوم" : "Fee Summary"}
              </p>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "رسوم التسجيل" : "Registration Fee"}</span>
                  <span className="font-semibold tabular-nums">{fee} {currency}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{taxName} ({taxRate}%)</span>
                    <span className="tabular-nums">{(fee * taxRate / 100).toFixed(2)} {currency}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-border/30 pt-2 text-base">
                  <span>{isAr ? "المجموع" : "Total"}</span>
                  <span className="text-primary tabular-nums">{(fee * (1 + taxRate / 100)).toFixed(2)} {currency}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] font-medium rounded-xl">
                {isAr ? "سيتم تحصيل الرسوم بعد الموافقة" : "Fee will be collected after approval"}
              </Badge>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-5 border-t border-border/30">
            <Button type="button" variant="outline" onClick={onCancel} disabled={uploading} className="rounded-xl h-10 sm:h-9 font-semibold">
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={uploading || registerMutation.isPending} className="rounded-xl h-10 sm:h-9 font-bold shadow-md shadow-primary/15">
              {uploading || registerMutation.isPending ? (
                <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isAr ? "جاري التسجيل..." : "Registering..."}</>
              ) : (
                <><Upload className="me-2 h-4 w-4" />{isAr ? "تقديم التسجيل" : "Submit Registration"}</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Backwards-compatible dialog wrapper
interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  competitionTitle: string;
  categories: Category[];
}

export function RegistrationDialog({ open, onOpenChange, competitionId, competitionTitle, categories }: RegistrationDialogProps) {
  if (!open) return null;
  return (
    <RegistrationForm
      competitionId={competitionId}
      competitionTitle={competitionTitle}
      categories={categories}
      onCancel={() => onOpenChange(false)}
      onSuccess={() => onOpenChange(false)}
    />
  );
}
