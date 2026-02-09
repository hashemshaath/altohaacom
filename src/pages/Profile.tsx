import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Edit, Save } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ExperienceLevel = Database["public"]["Enums"]["experience_level"];
type AppRole = Database["public"]["Enums"]["app_role"];

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    specialization: "",
    experience_level: "beginner" as ExperienceLevel,
    location: "",
    phone: "",
    website: "",
    instagram: "",
    twitter: "",
    facebook: "",
    linkedin: "",
    youtube: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setForm({
          full_name: profileRes.data.full_name || "",
          bio: profileRes.data.bio || "",
          specialization: profileRes.data.specialization || "",
          experience_level: profileRes.data.experience_level || "beginner",
          location: profileRes.data.location || "",
          phone: profileRes.data.phone || "",
          website: profileRes.data.website || "",
          instagram: profileRes.data.instagram || "",
          twitter: profileRes.data.twitter || "",
          facebook: profileRes.data.facebook || "",
          linkedin: profileRes.data.linkedin || "",
          youtube: profileRes.data.youtube || "",
        });
      }
      if (rolesRes.data) {
        setRoles(rolesRes.data.map((r) => r.role));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        ...form,
        profile_completed: true,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Profile updated successfully." });
      setEditing(false);
      // Refresh profile
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) setProfile(data);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">{t("loading")}</p>
        </main>
      </div>
    );
  }

  const showCompletePrompt = profile && !profile.profile_completed && !editing;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-6 md:py-8">
        {showCompletePrompt && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">{t("completeProfile")}</h3>
                <p className="text-sm text-muted-foreground">{t("completeProfileDesc")}</p>
              </div>
              <Button onClick={() => setEditing(true)} size="sm" className="w-full sm:w-auto">
                <Edit className="mr-1.5 h-4 w-4" />
                {t("editProfile")}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile card */}
          <Card className="md:col-span-1">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 md:h-24 md:w-24">
                <User className="h-10 w-10 text-primary md:h-12 md:w-12" />
              </div>
              <h2 className="mb-1 font-serif text-xl font-bold">
                {profile?.full_name || user?.email}
              </h2>
              {profile?.username && (
                <p className="mb-2 text-sm text-muted-foreground">@{profile.username}</p>
              )}
              <div className="mb-2 flex flex-wrap justify-center gap-1">
                {roles.map((r) => (
                  <Badge key={r} variant="secondary" className="capitalize">
                    {t(r as any)}
                  </Badge>
                ))}
              </div>
              {profile?.experience_level && (
                <Badge variant="outline" className="capitalize">
                  {t(profile.experience_level as any)}
                </Badge>
              )}
              {profile?.specialization && (
                <p className="mt-2 text-sm text-muted-foreground">{profile.specialization}</p>
              )}
              {profile?.location && (
                <p className="text-sm text-muted-foreground">📍 {profile.location}</p>
              )}
              {profile?.account_number && (
                <Badge variant="outline" className="mt-2 font-mono text-xs">
                  {profile.account_number}
                </Badge>
              )}
              {!editing && (
                <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="mt-4 w-full sm:w-auto">
                  <Edit className="mr-1.5 h-4 w-4" />
                  {t("editProfile")}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Details / Edit form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif">
                {editing ? t("editProfile") : t("myProfile")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("fullName")}</Label>
                      <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("specialization")}</Label>
                      <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder={t("specialization")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("experienceLevel")}</Label>
                      <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v as ExperienceLevel })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">{t("beginner")}</SelectItem>
                          <SelectItem value="amateur">{t("amateur")}</SelectItem>
                          <SelectItem value="professional">{t("professional")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("location")}</Label>
                      <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t("location")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("phone")}</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("website")}</Label>
                      <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("bio")}</Label>
                    <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder={t("bio")} />
                  </div>
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-muted-foreground">{t("socialMedia")}</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input placeholder="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                      <Input placeholder="Twitter / X" value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
                      <Input placeholder="Facebook" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
                      <Input placeholder="LinkedIn" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
                      <Input placeholder="YouTube" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => setEditing(false)} className="w-full sm:w-auto">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                      <Save className="mr-1.5 h-4 w-4" />
                      {saving ? t("saving") : t("saveProfile")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile?.bio && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">{t("bio")}</h4>
                      <p className="mt-1">{profile.bio}</p>
                    </div>
                  )}
                  {(profile?.instagram || profile?.twitter || profile?.facebook || profile?.linkedin || profile?.youtube) && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">{t("socialMedia")}</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.instagram && <Badge variant="outline">IG: {profile.instagram}</Badge>}
                        {profile.twitter && <Badge variant="outline">X: {profile.twitter}</Badge>}
                        {profile.facebook && <Badge variant="outline">FB: {profile.facebook}</Badge>}
                        {profile.linkedin && <Badge variant="outline">LI: {profile.linkedin}</Badge>}
                        {profile.youtube && <Badge variant="outline">YT: {profile.youtube}</Badge>}
                      </div>
                    </div>
                  )}
                  {!profile?.bio && !profile?.instagram && (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="mb-3 rounded-full bg-muted p-3">
                        <Edit className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="mb-3 text-sm text-muted-foreground">{t("completeProfileDesc")}</p>
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        <Edit className="mr-1.5 h-4 w-4" />
                        {t("editProfile")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
