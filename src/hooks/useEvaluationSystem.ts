import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────

export interface EvaluationDomain {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  description: string | null;
  description_ar: string | null;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface EvaluationCriteriaCategory {
  id: string;
  domain_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  product_category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface EvaluationCriterion {
  id: string;
  category_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  max_score: number;
  weight: number;
  scoring_guide: Record<string, string> | null;
  scoring_guide_ar: Record<string, string> | null;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvaluationScore {
  id: string;
  domain_slug: string;
  entity_id: string;
  evaluator_id: string;
  subject_id: string;
  criterion_id: string;
  score: number;
  notes: string | null;
  notes_ar: string | null;
  evidence_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface EvaluationReport {
  id: string;
  domain_slug: string;
  entity_id: string;
  report_number: string | null;
  title: string;
  title_ar: string | null;
  summary: string | null;
  summary_ar: string | null;
  overall_score: number | null;
  category_scores: Record<string, number>;
  evaluator_count: number;
  criteria_count: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  images: string[];
  status: string;
  generated_by: string | null;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

// ─── Queries ────────────────────────────────────

export function useEvaluationDomains() {
  return useQuery({
    queryKey: ["evaluation-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_domains" as any)
        .select("id, name, name_ar, slug, description, description_ar, icon, is_active, sort_order, created_at")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as EvaluationDomain[];
    },
  });
}

export function useEvaluationCriteriaCategories(domainId?: string, productCategory?: string) {
  return useQuery({
    queryKey: ["evaluation-criteria-categories", domainId, productCategory],
    queryFn: async () => {
      let query = supabase
        .from("evaluation_criteria_categories" as any)
        .select("id, domain_id, name, name_ar, description, description_ar, product_category, sort_order, is_active, created_at")
        .eq("is_active", true)
        .order("sort_order");
      if (domainId) query = query.eq("domain_id", domainId);
      if (productCategory) query = query.or(`product_category.eq.${productCategory},product_category.is.null`);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as EvaluationCriteriaCategory[];
    },
    enabled: !!domainId,
  });
}

export function useEvaluationCriteria(categoryId?: string) {
  return useQuery({
    queryKey: ["evaluation-criteria", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("evaluation_criteria" as any)
        .select("id, category_id, name, name_ar, description, description_ar, max_score, weight, scoring_guide, scoring_guide_ar, is_required, sort_order, is_active, created_at, updated_at")
        .eq("is_active", true)
        .order("sort_order");
      if (categoryId) query = query.eq("category_id", categoryId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as EvaluationCriterion[];
    },
  });
}

export function useEvaluationCriteriaByDomain(domainSlug: string, productCategory?: string) {
  return useQuery({
    queryKey: ["evaluation-criteria-by-domain", domainSlug, productCategory],
    queryFn: async () => {
      // Get domain
      const { data: domains } = await supabase
        .from("evaluation_domains" as any)
        .select("id")
        .eq("slug", domainSlug)
        .single();
      if (!domains) return { categories: [], criteria: [] };
      const domainId = (domains as any).id;

      // Get categories
      let catQuery = supabase
        .from("evaluation_criteria_categories" as any)
        .select("*")
        .eq("domain_id", domainId)
        .eq("is_active", true)
        .order("sort_order");
      if (productCategory) {
        catQuery = catQuery.or(`product_category.eq.${productCategory},product_category.is.null`);
      }
      const { data: categories } = await catQuery;

      const catIds = (categories || []).map((c: any) => c.id);
      if (catIds.length === 0) return { categories: categories || [], criteria: [] };

      // Get criteria for those categories
      const { data: criteria } = await supabase
        .from("evaluation_criteria" as any)
        .select("*")
        .in("category_id", catIds)
        .eq("is_active", true)
        .order("sort_order");

      return {
        categories: (categories || []) as unknown as EvaluationCriteriaCategory[],
        criteria: (criteria || []) as unknown as EvaluationCriterion[],
      };
    },
  });
}

export function useEvaluationScores(entityId?: string, domainSlug?: string) {
  return useQuery({
    queryKey: ["evaluation-scores", entityId, domainSlug],
    queryFn: async () => {
      let query = supabase
        .from("evaluation_scores" as any)
        .select("*")
        .eq("entity_id", entityId!);
      if (domainSlug) query = query.eq("domain_slug", domainSlug);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as EvaluationScore[];
    },
    enabled: !!entityId,
  });
}

export function useEvaluationReports(domainSlug?: string) {
  return useQuery({
    queryKey: ["evaluation-reports", domainSlug],
    queryFn: async () => {
      let query = supabase
        .from("evaluation_reports" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (domainSlug) query = query.eq("domain_slug", domainSlug);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as EvaluationReport[];
    },
  });
}

// ─── Mutations ──────────────────────────────────

export function useUpsertEvaluationScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (score: Partial<EvaluationScore>) => {
      const { data, error } = await supabase
        .from("evaluation_scores" as any)
        .upsert(score as any, { onConflict: "entity_id,evaluator_id,subject_id,criterion_id" })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as EvaluationScore;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-scores", vars.entity_id] });
    },
  });
}

export function useCreateCriterion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (criterion: Partial<EvaluationCriterion>) => {
      const { data, error } = await supabase
        .from("evaluation_criteria" as any)
        .insert(criterion as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as EvaluationCriterion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria-by-domain"] });
    },
  });
}

export function useUpdateCriterion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EvaluationCriterion> & { id: string }) => {
      const { data, error } = await supabase
        .from("evaluation_criteria" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as EvaluationCriterion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria-by-domain"] });
    },
  });
}

export function useDeleteCriterion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("evaluation_criteria" as any)
        .update({ is_active: false } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria-by-domain"] });
    },
  });
}

export function useCreateCriteriaCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<EvaluationCriteriaCategory>) => {
      const { data, error } = await supabase
        .from("evaluation_criteria_categories" as any)
        .insert(category as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as EvaluationCriteriaCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria-categories"] });
    },
  });
}
