import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { QREntityType } from "@/lib/qrCode";
import { CODE_PREFIXES } from "@/lib/qrCode";

/** Fetch or create a QR code for a given entity */
export function useEntityQRCode(entityType: QREntityType, entityId: string | undefined, category?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["qr-code", entityType, entityId],
    queryFn: async () => {
      if (!entityId) return null;

      // Check if QR code already exists
      const { data: existing } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .maybeSingle();

      if (existing) return existing;

      // Generate a new code via DB function
      const prefix = CODE_PREFIXES[category || entityType] || "QR";
      const { data: codeResult } = await supabase.rpc("generate_qr_code", { p_prefix: prefix });
      const code = codeResult as string;

      // Insert
      const { data: newQR, error } = await supabase
        .from("qr_codes")
        .insert({
          code,
          entity_type: entityType,
          entity_id: entityId,
          category: category || entityType,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return newQR;
    },
    enabled: !!entityId,
  });
}

/** Verify a QR code (public, no auth needed) */
export function useVerifyQRCode(code: string | null) {
  return useQuery({
    queryKey: ["verify-qr", code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase.rpc("verify_qr_code", { p_code: code.toUpperCase() });
      if (error) throw error;
      if (!data || (data as any[]).length === 0) return null;
      return (data as any[])[0];
    },
    enabled: !!code,
  });
}
