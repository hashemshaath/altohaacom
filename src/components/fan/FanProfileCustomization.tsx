import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CUISINE_OPTIONS = [
  { en: "Italian", ar: "إيطالي" },
  { en: "French", ar: "فرنسي" },
  { en: "Japanese", ar: "ياباني" },
  { en: "Middle Eastern", ar: "شرق أوسطي" },
  { en: "Indian", ar: "هندي" },
  { en: "Chinese", ar: "صيني" },
  { en: "Mexican", ar: "مكسيكي" },
  { en: "Thai", ar: "تايلاندي" },
  { en: "Korean", ar: "كوري" },
  { en: "Mediterranean", ar: "متوسطي" },
  { en: "American", ar: "أمريكي" },
  { en: "Turkish", ar: "تركي" },
];

const INTEREST_OPTIONS = [
  { en: "Baking", ar: "الخبز" },
  { en: "Grilling", ar: "الشوي" },
  { en: "Pastry", ar: "الحلويات" },
  { en: "Vegan Cooking", ar: "الطبخ النباتي" },
  { en: "Fine Dining", ar: "المطاعم الراقية" },
  { en: "Street Food", ar: "طعام الشارع" },
  { en: "Food Photography", ar: "تصوير الطعام" },
  { en: "Competitions", ar: "المسابقات" },
  { en: "Healthy Eating", ar: "الأكل الصحي" },
  { en: "Fermentation", ar: "التخمير" },
];

export function FanProfileCustomization() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["fan-profile-customization", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("bio, interests, favorite_cuisines")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const [bio, setBio] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setBio(profile.bio || "");
    setSelectedCuisines((profile as any).favorite_cuisines || []);
    setSelectedInterests((profile as any).interests || []);
    setInitialized(true);
  }

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          bio,
          interests: selectedInterests,
          favorite_cuisines: selectedCuisines,
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["fan-profile-customization"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-profile"] });
      toast({ title: isAr ? "✅ تم الحفظ بنجاح" : "✅ Profile updated!" });
    } catch {
      toast({ title: isAr ? "حدث خطأ" : "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="h-48 rounded-xl bg-muted/50 animate-pulse" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
          </div>
          {isAr ? "تخصيص ملفك" : "Customize Your Profile"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bio */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            {isAr ? "نبذة عنك" : "About You"}
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={isAr ? "أخبرنا عن نفسك وشغفك بالطعام..." : "Tell us about yourself and your food passion..."}
            className="resize-none text-sm"
            rows={3}
            maxLength={300}
          />
          <p className="text-[10px] text-muted-foreground mt-1 text-end">{bio.length}/300</p>
        </div>

        {/* Favorite Cuisines */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            {isAr ? "المطابخ المفضلة" : "Favorite Cuisines"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CUISINE_OPTIONS.map((c) => {
              const selected = selectedCuisines.includes(c.en);
              return (
                <Badge
                  key={c.en}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer text-[11px] transition-all hover:scale-105"
                  onClick={() => toggleItem(selectedCuisines, setSelectedCuisines, c.en)}
                >
                  {isAr ? c.ar : c.en}
                  {selected && <X className="h-3 w-3 ms-1" />}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            {isAr ? "اهتماماتك" : "Your Interests"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_OPTIONS.map((i) => {
              const selected = selectedInterests.includes(i.en);
              return (
                <Badge
                  key={i.en}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer text-[11px] transition-all hover:scale-105"
                  onClick={() => toggleItem(selectedInterests, setSelectedInterests, i.en)}
                >
                  {isAr ? i.ar : i.en}
                  {selected && <X className="h-3 w-3 ms-1" />}
                </Badge>
              );
            })}
          </div>
        </div>

        <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isAr ? "حفظ التغييرات" : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
