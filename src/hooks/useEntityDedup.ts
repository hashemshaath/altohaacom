import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DupRecord {
  id: string;
  name: string;
  name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  city?: string | null;
  country?: string | null;
  table_name: string;
  identifier?: string | null;
  status?: string | null;
  logo_url?: string | null;
}

export interface DupCandidate {
  record: DupRecord;
  score: number;
  reasons: string[];
  table_name: string;
}

export interface DupGroup {
  primary: DupRecord;
  matches: DupCandidate[];
}

interface UseEntityDedupOptions {
  tables?: string[];
  excludeId?: string;
}

export function useEntityDedup(options: UseEntityDedupOptions = {}) {
  const [checking, setChecking] = useState(false);
  const [duplicates, setDuplicates] = useState<DupCandidate[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanGroups, setScanGroups] = useState<DupGroup[]>([]);
  const [merging, setMerging] = useState(false);

  const checkEntity = useCallback(async (entity: {
    name?: string;
    name_ar?: string;
    email?: string;
    phone?: string;
    website?: string;
    city?: string;
    country?: string;
  }) => {
    if (!entity.name && !entity.email) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("entity-dedup", {
        body: {
          mode: "check",
          entity,
          tables: options.tables,
          exclude_id: options.excludeId,
        },
      });
      if (error) throw error;
      setDuplicates(data?.duplicates || []);
    } catch (err) {
      console.error("Dedup check failed:", err);
      setDuplicates([]);
    } finally {
      setChecking(false);
    }
  }, [options.tables, options.excludeId]);

  const batchScan = useCallback(async (table: string, crossTables?: string[]) => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("entity-dedup", {
        body: {
          mode: "batch_scan",
          table,
          cross_tables: crossTables || [],
        },
      });
      if (error) throw error;
      setScanGroups(data?.groups || []);
      return data?.groups || [];
    } catch (err) {
      console.error("Batch scan failed:", err);
      setScanGroups([]);
      return [];
    } finally {
      setScanning(false);
    }
  }, []);

  const mergeEntities = useCallback(async (
    primaryId: string,
    mergeIds: string[],
    table: string
  ) => {
    setMerging(true);
    try {
      const { data, error } = await supabase.functions.invoke("entity-dedup", {
        body: { mode: "merge", primary_id: primaryId, merge_ids: mergeIds, table },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Merge failed:", err);
      throw err;
    } finally {
      setMerging(false);
    }
  }, []);

  const clearDuplicates = useCallback(() => {
    setDuplicates([]);
    setScanGroups([]);
  }, []);

  return {
    checking, duplicates, checkEntity, clearDuplicates,
    scanning, scanGroups, batchScan,
    merging, mergeEntities,
  };
}
