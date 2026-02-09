import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Header } from "@/components/Header";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Check if profile is already completed
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-completion", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (profile?.profile_completed) {
      navigate("/dashboard");
    }
  }, [loading, user, profile, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      <main className="container py-8">
        <OnboardingWizard />
      </main>
    </div>
  );
}
