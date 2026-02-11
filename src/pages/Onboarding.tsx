import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
      navigate("/login");
    }
    if (profile?.profile_completed) {
      navigate("/dashboard");
    }
  }, [loading, user, profile, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10">
          <div className="mx-auto max-w-2xl space-y-6">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-80 w-full rounded-xl" />
            <div className="flex justify-between">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title="Complete Your Profile" description="Set up your Altohaa profile" />
      <Header />
      <main className="container flex-1 py-8 md:py-10">
        <OnboardingWizard />
      </main>
      <Footer />
    </div>
  );
}
