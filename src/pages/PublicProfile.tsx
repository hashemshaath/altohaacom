import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CompetitionHistory } from "@/components/profile/CompetitionHistory";
import { MessageButton } from "@/components/profile/MessageButton";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { 
  User, 
  MapPin, 
  Globe, 
  Award,
  BadgeCheck,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  ChefHat,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { t } = useLanguage();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username?.toLowerCase())
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!username,
  });

  const { data: roles } = useQuery({
    queryKey: ["publicProfileRoles", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile!.user_id);
      return data?.map(r => r.role) as AppRole[] || [];
    },
    enabled: !!profile?.user_id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <User className="h-16 w-16 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-bold">User not found</h1>
          <p className="text-muted-foreground">
            The profile you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild variant="outline">
            <a href="/">Go Home</a>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const socialLinks = [
    { icon: Instagram, value: profile.instagram, label: "Instagram" },
    { icon: Twitter, value: profile.twitter, label: "Twitter" },
    { icon: Facebook, value: profile.facebook, label: "Facebook" },
    { icon: Linkedin, value: profile.linkedin, label: "LinkedIn" },
    { icon: Youtube, value: profile.youtube, label: "YouTube" },
    { icon: Globe, value: profile.website, label: "Website" },
  ].filter(s => s.value);

  const getMembershipColor = (tier: string | null) => {
    const colors: Record<string, string> = {
      basic: "bg-muted text-muted-foreground",
      professional: "bg-primary/10 text-primary",
      enterprise: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    };
    return colors[tier || "basic"] || colors.basic;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {(profile.full_name || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="mt-4 flex items-center gap-2">
                    <h1 className="font-serif text-2xl font-bold">
                      {profile.full_name || "Unnamed Chef"}
                    </h1>
                    {profile.is_verified && (
                      <BadgeCheck className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <p className="text-muted-foreground">@{profile.username}</p>

                  {/* Account Number & Membership */}
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {profile.account_number && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {profile.account_number}
                      </Badge>
                    )}
                    {profile.membership_tier && (
                      <Badge className={getMembershipColor(profile.membership_tier)}>
                        {profile.membership_tier === "professional" 
                          ? t("professionalTier") 
                          : t(profile.membership_tier as any)}
                      </Badge>
                    )}
                  </div>

                  {/* Roles */}
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {roles?.map((role) => (
                      <Badge key={role} variant="secondary" className="capitalize">
                        {t(role as any)}
                      </Badge>
                    ))}
                  </div>

                  {/* Specialization */}
                  {profile.specialization && (
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <ChefHat className="h-4 w-4 text-primary" />
                      <span className="font-medium">{profile.specialization}</span>
                    </div>
                  )}

                  {/* Experience & Location */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                    {profile.experience_level && (
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span className="capitalize">{t(profile.experience_level as any)}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="mt-6 rounded-lg bg-muted/50 p-4">
                    <p className="text-center text-sm">{profile.bio}</p>
                  </div>
                )}

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {socialLinks.map((link) => (
                      <Button
                        key={link.label}
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={link.value?.startsWith("http") ? link.value : `https://${link.value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </a>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Message Button */}
                <div className="mt-6 flex justify-center">
                  <MessageButton userId={profile.user_id} variant="default" />
                </div>

                {/* Member Since */}
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {t("memberSince")}: {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Competition History */}
          <div className="lg:col-span-2 space-y-6">
            <UserBadgesDisplay userId={profile.user_id} />
            <CompetitionHistory userId={profile.user_id} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
