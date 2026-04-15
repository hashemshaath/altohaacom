import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/usePWA";
import { cacheItems, getCachedItems, getCachedItem, clearStore } from "@/lib/offlineCache";
import { toast } from "@/hooks/use-toast";

const JUDGING_SYNC_KEY = "altoha_judging_last_sync";

export interface CachedJudgingData {
  id: string; // competition_id
  competition: {
    id: string;
    title: string;
    title_ar: string | null;
    status: string;
    competition_start: string | null;
    venue: string | null;
    venue_ar: string | null;
    cover_image_url: string | null;
  };
  registrations: Array<{
    id: string;
    participant_id: string | null;
    dish_name: string | null;
    dish_description: string | null;
    dish_image_url: string | null;
    entry_type: string | null;
    team_name: string | null;
    team_name_ar: string | null;
    category_id: string | null;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
      specialization: string | null;
    };
    category?: {
      name: string;
      name_ar: string | null;
    };
  }>;
  criteria: Array<{
    id: string;
    name: string;
    name_ar: string | null;
    weight: number | null;
    max_score: number | null;
    description: string | null;
    description_ar: string | null;
  }>;
  existingScores: Array<{
    id: string;
    registration_id: string;
    criteria_id: string;
    score: number;
    notes: string | null;
    flag_status: string | null;
    detailed_feedback: string | null;
  }>;
  _cachedAt?: number;
}

export interface OfflineScore {
  id: string; // unique key: `${registrationId}_${judgeId}`
  competitionId: string;
  registrationId: string;
  judgeId: string;
  scores: Record<string, number>;
  notes: Record<string, string>;
  flagStatus: Record<string, string>;
  detailedFeedback: Record<string, string>;
  savedAt: number;
  synced: boolean;
}

/**
 * Hook for offline judging support.
 * - Downloads and caches assigned competition data (registrations, criteria, existing scores)
 * - Saves scores locally when offline
 * - Syncs pending scores when back online
 */
export function useOfflineJudging() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [cachedCompetitions, setCachedCompetitions] = useState<CachedJudgingData[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = useCallback(async () => {
    const data = await getCachedItems<CachedJudgingData>("judging_data");
    setCachedCompetitions(data);
    const scores = await getCachedItems<OfflineScore>("offline_scores");
    setPendingCount(scores.filter(s => !s.synced).length);
  }, []);

  /** Download all assigned competition data for offline use */
  const downloadJudgingData = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    setIsSyncing(true);

    try {
      // Get judge assignments
      const { data: assignments } = await supabase
        .from("competition_judges")
        .select("competition_id")
        .eq("judge_id", user.id);

      if (!assignments?.length) {
        setIsSyncing(false);
        return;
      }

      const compIds = assignments.map(a => a.competition_id);

      // Fetch all data in parallel
      const [compRes, regRes, criteriaRes, scoresRes] = await Promise.all([
        supabase
          .from("competitions")
          .select("id, title, title_ar, status, competition_start, venue, venue_ar, cover_image_url")
          .in("id", compIds)
          .in("status", ["registration_open", "in_progress", "upcoming"]),
        supabase
          .from("competition_registrations")
          .select("id, participant_id, dish_name, dish_description, dish_image_url, entry_type, team_name, team_name_ar, category_id, competition_id, profiles:participant_id(full_name, avatar_url, specialization), competition_categories:category_id(name, name_ar)")
          .in("competition_id", compIds)
          .eq("status", "approved"),
        supabase
          .from("judging_criteria")
          .select("id, name, name_ar, weight, max_score, description, description_ar, competition_id")
          .in("competition_id", compIds),
        supabase
          .from("competition_scores")
          .select("id, registration_id, criteria_id, score, notes, flag_status, detailed_feedback")
          .eq("judge_id", user.id),
      ]);

      const competitions = compRes.data || [];
      const registrations = regRes.data || [];
      const criteria = criteriaRes.data || [];
      const existingScores = scoresRes.data || [];

      // Group by competition
      const judgingDataItems: CachedJudgingData[] = competitions.map((comp) => ({
        id: comp.id,
        competition: comp,
        registrations: registrations
          .filter((r) => r.competition_id === comp.id)
          .map((r) => ({
            ...r,
            profile: r.profiles || undefined,
            category: r.competition_categories || undefined,
          })),
        criteria: criteria.filter((c) => c.competition_id === comp.id),
        existingScores: existingScores.filter((s) =>
          registrations.some((r) => r.id === s.registration_id && r.competition_id === comp.id)
        ),
      }));

      await cacheItems("judging_data", judgingDataItems);
      try { localStorage.setItem(JUDGING_SYNC_KEY, Date.now().toString()); } catch { /* restricted */ }

      setCachedCompetitions(judgingDataItems);

      toast({
        title: "✅ Judging data downloaded",
        description: `${judgingDataItems.length} competition(s) cached for offline use.`,
      });
    } catch (err: unknown) {
      console.error("Failed to download judging data:", err);
      toast({
        title: "Download failed",
        description: "Could not cache judging data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  /** Save scores locally (works offline) */
  const saveScoreOffline = useCallback(async (
    competitionId: string,
    registrationId: string,
    scoreData: {
      scores: Record<string, number>;
      notes: Record<string, string>;
      flagStatus: Record<string, string>;
      detailedFeedback: Record<string, string>;
    }
  ) => {
    if (!user) return;

    const offlineScore: OfflineScore = {
      id: `${registrationId}_${user.id}`,
      competitionId,
      registrationId,
      judgeId: user.id,
      scores: scoreData.scores,
      notes: scoreData.notes,
      flagStatus: scoreData.flagStatus,
      detailedFeedback: scoreData.detailedFeedback,
      savedAt: Date.now(),
      synced: false,
    };

    await cacheItems("offline_scores", [offlineScore]);
    await loadCachedData();

    toast({
      title: "💾 Scores saved locally",
      description: isOnline
        ? "Scores saved. They will sync automatically."
        : "Scores saved offline. They'll sync when you're back online.",
    });
  }, [user, isOnline, loadCachedData]);

  /** Sync all pending offline scores to the server */
  const syncPendingScores = useCallback(async () => {
    if (!user || !navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const pendingScores = await getCachedItems<OfflineScore>("offline_scores");
      const unsynced = pendingScores.filter(s => !s.synced);

      if (unsynced.length === 0) {
        syncingRef.current = false;
        setIsSyncing(false);
        return;
      }

      let succeeded = 0;

      for (const offlineScore of unsynced) {
        try {
          // Get criteria for this competition
          const cached = await getCachedItem<CachedJudgingData>("judging_data", offlineScore.competitionId);
          const criteriaIds = cached?.criteria.map(c => c.id) || Object.keys(offlineScore.scores);

          const scoreRows = criteriaIds
            .filter(critId => offlineScore.scores[critId] !== undefined)
            .map(critId => ({
              registration_id: offlineScore.registrationId,
              judge_id: offlineScore.judgeId,
              criteria_id: critId,
              score: offlineScore.scores[critId] || 0,
              notes: offlineScore.notes[critId] || null,
              flag_status: offlineScore.flagStatus[critId] || null,
              flag_reason: offlineScore.flagStatus[critId] ? offlineScore.notes[critId] || null : null,
              detailed_feedback: offlineScore.detailedFeedback[critId] || null,
            }));

          // Delete existing then insert
          await supabase
            .from("competition_scores")
            .delete()
            .eq("registration_id", offlineScore.registrationId)
            .eq("judge_id", offlineScore.judgeId);

          const { error } = await supabase
            .from("competition_scores")
            .insert(scoreRows);

          if (!error) {
            // Mark as synced
            await cacheItems("offline_scores", [{ ...offlineScore, synced: true }]);
            succeeded++;
          }
        } catch {
          // Individual sync failed, will retry next time
        }
      }

      // Clean up synced scores
      const remaining = await getCachedItems<OfflineScore>("offline_scores");
      const stillUnsynced = remaining.filter(s => !s.synced);
      await clearStore("offline_scores");
      if (stillUnsynced.length > 0) {
        await cacheItems("offline_scores", stillUnsynced);
      }

      await loadCachedData();

      if (succeeded > 0) {
        toast({
          title: `✅ ${succeeded} score${succeeded > 1 ? "s" : ""} synced`,
          description: "Your offline scores have been submitted successfully.",
        });
      }
    } catch (err: unknown) {
      console.error("Score sync failed:", err);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [user, loadCachedData]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && user) {
      syncPendingScores();
    }
  }, [isOnline, user, syncPendingScores]);

  /** Get cached data for a specific competition */
  const getCachedCompetition = useCallback(async (competitionId: string) => {
    return getCachedItem<CachedJudgingData>("judging_data", competitionId);
  }, []);

  /** Get offline score for a specific registration */
  const getOfflineScore = useCallback(async (registrationId: string) => {
    if (!user) return null;
    return getCachedItem<OfflineScore>("offline_scores", `${registrationId}_${user.id}`);
  }, [user]);

  const lastSync = useMemo(() => { try { return localStorage.getItem(JUDGING_SYNC_KEY); } catch { return null; } }, [pendingCount]);

  return {
    cachedCompetitions,
    pendingCount,
    isSyncing,
    isOnline,
    lastSync: lastSync ? parseInt(lastSync) : null,
    downloadJudgingData,
    saveScoreOffline,
    syncPendingScores,
    getCachedCompetition,
    getOfflineScore,
    loadCachedData,
  };
}
