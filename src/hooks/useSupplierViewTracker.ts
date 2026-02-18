import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSupplierViewTracker(companyId: string | undefined) {
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (!companyId || tracked.current) return;
    tracked.current = true;

    const sessionId = sessionStorage.getItem("supplier_session") || crypto.randomUUID();
    sessionStorage.setItem("supplier_session", sessionId);

    supabase
      .from("supplier_profile_views")
      .insert({
        company_id: companyId,
        viewer_id: user?.id || null,
        session_id: sessionId,
        referrer: document.referrer || null,
      })
      .then(() => {}); // fire and forget
  }, [companyId, user?.id]);
}
