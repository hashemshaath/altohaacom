import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useVerificationStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["verification-status", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_verified, verification_level, verified_at, verification_badge")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });
}

export function useMyVerificationRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-verification-requests", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_requests")
        .select("id, user_id, entity_type, verification_level, applicant_name, applicant_name_ar, applicant_role, applicant_position, documents, status, ai_analysis, ai_risk_score, ai_flags, ai_reviewed_at, reviewed_by, reviewed_at, reviewer_notes, rejection_reason, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllVerificationRequests() {
  return useQuery({
    queryKey: ["all-verification-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_requests")
        .select("id, user_id, company_id, culinary_entity_id, entity_type, verification_level, applicant_name, applicant_name_ar, applicant_role, applicant_position, documents, status, ai_analysis, ai_risk_score, ai_flags, ai_reviewed_at, reviewed_by, reviewed_at, reviewer_notes, rejection_reason, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      entity_type: string;
      verification_level: string;
      applicant_name: string;
      applicant_name_ar?: string;
      applicant_role?: string;
      applicant_position?: string;
      documents?: any[];
    }) => {
      const { data, error } = await supabase
        .from("verification_requests")
        .insert({
          user_id: user!.id,
          entity_type: payload.entity_type,
          verification_level: payload.verification_level,
          applicant_name: payload.applicant_name,
          applicant_name_ar: payload.applicant_name_ar,
          applicant_role: payload.applicant_role,
          applicant_position: payload.applicant_position,
          documents: payload.documents || [],
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-verification-requests"] });
      toast({ title: "Verification request submitted" });
      // Notify admins about new verification request
      import("@/lib/notificationTriggers").then(({ notifyAdminVerificationRequest }) => {
        notifyAdminVerificationRequest({
          userName: variables.applicant_name,
          verificationType: variables.verification_level,
          userId: user!.id,
        });
      });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });
}

export function useRunAIVerification() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      request_id: string;
      document_url?: string;
      document_type: string;
      applicant_name: string;
      entity_type: string;
      verification_level: string;
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-verify-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limit exceeded");
        if (response.status === 402) throw new Error("Service unavailable");
        throw new Error("AI verification failed");
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Update the verification request with AI results
      const { error } = await supabase
        .from("verification_requests")
        .update({
          ai_analysis: result.analysis,
          ai_risk_score: result.analysis.risk_score,
          ai_flags: result.analysis.flags,
          ai_reviewed_at: new Date().toISOString(),
          status: "ai_review",
        })
        .eq("id", payload.request_id);

      if (error) throw error;
      return result.analysis;
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "AI Error", description: err.message });
    },
  });
}

export function useReviewVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      request_id: string;
      action: "approved" | "rejected";
      notes?: string;
      rejection_reason?: string;
    }) => {
      const updateData: any = {
        status: payload.action,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: payload.notes,
      };

      if (payload.action === "rejected") {
        updateData.rejection_reason = payload.rejection_reason;
      }

      const { data: request, error: fetchErr } = await supabase
        .from("verification_requests")
        .select("user_id, company_id, culinary_entity_id, entity_type, verification_level")
        .eq("id", payload.request_id)
        .single();

      if (fetchErr) throw fetchErr;

      const { error } = await supabase
        .from("verification_requests")
        .update(updateData)
        .eq("id", payload.request_id);

      if (error) throw error;

      // If approved, update the target entity's verified status
      if (payload.action === "approved" && request) {
        if (request.entity_type === "user" && request.user_id) {
          await supabase
            .from("profiles")
            .update({
              is_verified: true,
              verification_level: request.verification_level,
              verified_at: new Date().toISOString(),
              verification_badge: request.verification_level,
            })
            .eq("user_id", request.user_id);
        } else if (request.entity_type === "company" && request.company_id) {
          await supabase
            .from("companies")
            .update({
              is_verified: true,
              verification_level: request.verification_level,
              verified_at: new Date().toISOString(),
            })
            .eq("id", request.company_id);
        } else if (request.entity_type === "culinary_entity" && request.culinary_entity_id) {
          await supabase
            .from("culinary_entities")
            .update({
              is_verified: true,
              verification_level: request.verification_level,
              verified_at: new Date().toISOString(),
            })
            .eq("id", request.culinary_entity_id);
        }
      }

      // Log audit
      await supabase.from("verification_audit_log").insert({
        request_id: payload.request_id,
        action: payload.action,
        action_by: user!.id,
        details: { notes: payload.notes, rejection_reason: payload.rejection_reason },
      });

      return payload.action;
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["all-verification-requests"] });
      toast({ title: action === "approved" ? "Verification approved ✓" : "Verification rejected" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });
}
