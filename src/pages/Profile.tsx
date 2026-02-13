import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { User, Edit, Shield, Crown, Trophy, Award, FileText } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfilePrivacySettings } from "@/components/profile/ProfilePrivacySettings";
import { ProfileMembershipTab } from "@/components/profile/ProfileMembershipTab";
import { ProfileStatsBar } from "@/components/profile/ProfileStatsBar";
import { CompetitionHistory } from "@/components/profile/CompetitionHistory";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { ProfileActivityTimeline } from "@/components/profile/ProfileActivityTimeline";
import { ProfileCertificates } from "@/components/profile/ProfileCertificates";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

export default function Profile() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: qrCode } = useEntityQRCode("user", profile?.username || undefined, "account");

  const fetchProfile = async () => {
    if (!user) return;
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (rolesRes.data) setRoles(rolesRes.data.map((r) => r.role));
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SEOHead title="Profile" description="Your Altohaa profile" />
        <Header />
        <main className="container flex-1 py-6 md:py-8 max-w-5xl">
          <Skeleton className="h-44 w-full rounded-2xl mb-6" />
          <Skeleton className="h-10 w-80 mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: isAr ? "نظرة عامة" : "Overview", icon: User },
    { id: "edit", label: isAr ? "تعديل الملف" : "Edit Profile", icon: Edit },
    { id: "membership", label: isAr ? "العضوية" : "Membership", icon: Crown },
    { id: "privacy", label: isAr ? "الخصوصية" : "Privacy", icon: Shield },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Profile" description="Your Altohaa profile" />
      <Header />
      <main className="container flex-1 py-6 md:py-8 max-w-5xl">
        {/* Profile Header with Avatar & Cover */}
        {profile && user && (
          <ProfileHeader
            profile={profile}
            roles={roles}
            userId={user.id}
            onProfileUpdate={fetchProfile}
          />
        )}

        {/* Stats Bar */}
        {user && (
          <div className="mt-4">
            <ProfileStatsBar userId={user.id} />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-3 py-2"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Bio */}
                {(profile?.bio || profile?.bio_ar) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-primary" />
                        {isAr ? "النبذة" : "About"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" dir={isAr ? "rtl" : "ltr"}>
                        {isAr ? (profile?.bio_ar || profile?.bio) : profile?.bio}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Social Media */}
                {(profile?.instagram || profile?.twitter || profile?.facebook || profile?.linkedin || profile?.youtube || profile?.tiktok || profile?.snapchat) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{isAr ? "التواصل الاجتماعي" : "Social Media"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {profile?.instagram && <Badge variant="outline" className="text-[10px]">IG: {profile.instagram}</Badge>}
                        {profile?.twitter && <Badge variant="outline" className="text-[10px]">X: {profile.twitter}</Badge>}
                        {profile?.facebook && <Badge variant="outline" className="text-[10px]">FB: {profile.facebook}</Badge>}
                        {profile?.linkedin && <Badge variant="outline" className="text-[10px]">LI: {profile.linkedin}</Badge>}
                        {profile?.youtube && <Badge variant="outline" className="text-[10px]">YT: {profile.youtube}</Badge>}
                        {profile?.tiktok && <Badge variant="outline" className="text-[10px]">TT: {profile.tiktok}</Badge>}
                        {profile?.snapchat && <Badge variant="outline" className="text-[10px]">SC: {profile.snapchat}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Certificates */}
                {user && <ProfileCertificates userId={user.id} isOwner={true} />}

                {/* Competitions */}
                {user && <CompetitionHistory userId={user.id} />}

                {/* Badges */}
                {user && <UserBadgesDisplay userId={user.id} limit={6} />}
              </div>

              <div className="space-y-6">
                {/* QR Code */}
                {qrCode && (
                  <Card>
                    <CardContent className="pt-5 flex justify-center">
                      <QRCodeDisplay
                        code={qrCode.code}
                        label={isAr ? "رمز QR للحساب" : "My QR Code"}
                        size={140}
                        vCardData={{
                          fullName: profile?.full_name || "",
                          phone: profile?.phone || undefined,
                          website: profile?.website || undefined,
                          location: profile?.location || undefined,
                          accountNumber: profile?.account_number || undefined,
                          profileUrl: profile?.username ? `https://altohaacom.lovable.app/${profile.username}` : undefined,
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Activity Timeline */}
                {user && <ProfileActivityTimeline userId={user.id} />}
              </div>
            </div>
          </TabsContent>

          {/* Edit Profile Tab */}
          <TabsContent value="edit" className="mt-6">
            {profile && user && (
              <ProfileEditForm profile={profile} userId={user.id} onSaved={fetchProfile} />
            )}
          </TabsContent>

          {/* Membership Tab */}
          <TabsContent value="membership" className="mt-6">
            {profile && user && (
              <ProfileMembershipTab profile={profile} userId={user.id} onMembershipChange={fetchProfile} />
            )}
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="mt-6">
            {profile && user && (
              <ProfilePrivacySettings profile={profile} userId={user.id} onSaved={fetchProfile} />
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
