import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CVImportRecord {
  id: string;
  chef_id: string;
  imported_by: string;
  status: string;
  file_name: string | null;
  input_method: string;
  sections_imported: string[];
  records_created: number;
  created_at: string;
  extracted_data: any;
}

async function fetchCVImports(isAr: boolean) {
  const { data, error } = await supabase
    .from("cv_imports")
    .select("id, chef_id, imported_by, status, file_name, input_method, sections_imported, records_created, created_at, extracted_data")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  const imports = (data || []) as CVImportRecord[];

  const chefIds = [...new Set(imports.map(d => d.chef_id))];
  let chefNames: Record<string, string> = {};
  if (chefIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, full_name_ar")
      .in("user_id", chefIds);

    if (profiles) {
      profiles.forEach(p => {
        chefNames[p.user_id] = isAr ? (p.full_name_ar || p.full_name || "—") : (p.full_name || "—");
      });
    }
  }

  return { imports, chefNames };
}

export function useCVImportHistory(isAr: boolean, refreshTrigger?: number) {
  return useQuery({
    queryKey: ["cv-import-history", isAr, refreshTrigger],
    queryFn: () => fetchCVImports(isAr),
    staleTime: 30_000,
  });
}
