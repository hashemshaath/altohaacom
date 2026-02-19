import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = Record<string, Record<string, any>>;

const SiteSettingsContext = createContext<SiteSettings>({});

export function useSiteSettingsContext() {
  return useContext(SiteSettingsContext);
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: settings = {} } = useQuery({
    queryKey: ["site-settings-global"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value");
      const map: SiteSettings = {};
      (data || []).forEach((row: any) => {
        map[row.key] = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
      });
      return map;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
