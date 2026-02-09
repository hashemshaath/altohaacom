import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PhoneVerificationState {
  phone: string;
  isVerified: boolean;
  verifiedAt: Date | null;
}

export function usePhoneVerification() {
  const [state, setState] = useState<PhoneVerificationState>({
    phone: "",
    isVerified: false,
    verifiedAt: null,
  });

  const setVerified = (phone: string) => {
    setState({
      phone,
      isVerified: true,
      verifiedAt: new Date(),
    });
  };

  const reset = () => {
    setState({
      phone: "",
      isVerified: false,
      verifiedAt: null,
    });
  };

  const savePhoneToProfile = async (userId: string, phone: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ phone })
      .eq("user_id", userId);
    
    return { error };
  };

  return {
    ...state,
    setVerified,
    reset,
    savePhoneToProfile,
  };
}
