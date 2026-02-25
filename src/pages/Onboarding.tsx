import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { PageShell } from "@/components/PageShell";
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
      <PageShell title="Loading..." footer={false}>
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Complete Your Profile" description="Set up your Altoha profile">
      <OnboardingWizard />
    </PageShell>
  );
}
