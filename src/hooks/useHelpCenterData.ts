import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_LIMIT_LARGE } from "@/lib/constants";

interface FAQ {
  id: string;
  question: string;
  question_ar: string | null;
  answer: string;
  answer_ar: string | null;
  category: string;
  is_featured: boolean;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  title_ar: string | null;
  content: string;
  content_ar: string | null;
  category: string;
  tags: string[];
}

async function fetchHelpData() {
  const [faqsRes, articlesRes] = await Promise.all([
    supabase.from("faqs").select("id, question, question_ar, answer, answer_ar, category, sort_order, is_featured").order("sort_order").limit(QUERY_LIMIT_LARGE),
    supabase.from("knowledge_articles").select("id, title, title_ar, content, content_ar, category, status, tags, view_count, helpful_count, created_at, updated_at").eq("status", "published").order("created_at", { ascending: false }).limit(QUERY_LIMIT_LARGE),
  ]);
  return {
    faqs: (faqsRes.data || []) as FAQ[],
    articles: (articlesRes.data || []) as KnowledgeArticle[],
  };
}

export function useHelpCenterData() {
  return useQuery({
    queryKey: ["help-center"],
    queryFn: fetchHelpData,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
