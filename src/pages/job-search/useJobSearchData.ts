import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MS_PER_DAY, MS_PER_WEEK } from "@/lib/constants";
import { ChefHat, Cake, Utensils, Coffee, Soup, Salad, Award, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const JOB_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  full_time: { en: "Full-time", ar: "دوام كامل" },
  part_time: { en: "Part-time", ar: "دوام جزئي" },
  freelance: { en: "Freelance", ar: "عمل حر" },
  contract: { en: "Contract", ar: "عقد مؤقت" },
  consulting: { en: "Consulting", ar: "استشارات" },
};

export const EXP_LEVELS: Record<string, { en: string; ar: string }> = {
  beginner: { en: "Entry Level", ar: "مبتدئ" },
  intermediate: { en: "Mid Level", ar: "متوسط" },
  advanced: { en: "Senior", ar: "متقدم" },
  expert: { en: "Expert", ar: "خبير" },
};

export const CULINARY_CATEGORIES: { key: string; icon: LucideIcon; en: string; ar: string }[] = [
  { key: "chef", icon: ChefHat, en: "Head Chef", ar: "رئيس طهاة" },
  { key: "pastry", icon: Cake, en: "Pastry & Bakery", ar: "حلويات ومخابز" },
  { key: "restaurant", icon: Utensils, en: "Restaurants", ar: "مطاعم" },
  { key: "cafe", icon: Coffee, en: "Cafés & Coffee", ar: "مقاهي وقهوة" },
  { key: "catering", icon: Soup, en: "Catering", ar: "تموين وضيافة" },
  { key: "nutrition", icon: Salad, en: "Nutrition", ar: "تغذية" },
  { key: "consulting", icon: Award, en: "Consulting", ar: "استشارات" },
  { key: "training", icon: GraduationCap, en: "Training", ar: "تدريب" },
];

export const SALARY_RANGES = [
  { key: "0-3000", en: "Up to 3,000", ar: "حتى 3,000" },
  { key: "3000-5000", en: "3,000 – 5,000", ar: "3,000 – 5,000" },
  { key: "5000-8000", en: "5,000 – 8,000", ar: "5,000 – 8,000" },
  { key: "8000+", en: "8,000+", ar: "8,000+" },
];

export const ITEMS_PER_PAGE = 12;

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem("job-recent-searches") || "[]").slice(0, 5); } catch { return []; }
}
function addRecentSearch(q: string) {
  if (!q.trim()) return;
  const list = getRecentSearches().filter(s => s !== q);
  list.unshift(q);
  try { localStorage.setItem("job-recent-searches", JSON.stringify(list.slice(0, 5))); } catch {}
}

export function useJobSearchData() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || null;
  const initialType = searchParams.get("type") || "all";
  const initialTab = searchParams.get("tab") || "postings";

  const [search, setSearch] = useState(initialQ);
  const [jobTypeFilter, setJobTypeFilter] = useState(initialType);
  const [cityFilter, setCityFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [salaryFilter, setSalaryFilter] = useState("all");
  const [tab, setTab] = useState(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [sortBy, setSortBy] = useState<"newest" | "salary" | "views" | "deadline">("newest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showSalaryOnly, setShowSalaryOnly] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [copiedShare, setCopiedShare] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("saved-jobs") || "[]")); } catch { return new Set(); }
  });

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchInputRef.current?.blur();
        setShowRecentSearches(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      addRecentSearch(search.trim());
      setRecentSearches(getRecentSearches());
      setShowRecentSearches(false);
      setVisibleCount(ITEMS_PER_PAGE);
    }
  }, [search]);

  const toggleSaveJob = useCallback((jobId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) { next.delete(jobId); toast(isAr ? "تمت إزالة الوظيفة" : "Job removed"); }
      else { next.add(jobId); toast(isAr ? "تم حفظ الوظيفة" : "Job saved"); }
      try { localStorage.setItem("saved-jobs", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [isAr]);

  const handleShareSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (jobTypeFilter !== "all") params.set("type", jobTypeFilter);
    if (tab !== "postings") params.set("tab", tab);
    const url = `${window.location.origin}/jobs/search${params.toString() ? `?${params}` : ""}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedShare(true);
      toast(isAr ? "تم نسخ رابط البحث" : "Search link copied");
      setTimeout(() => setCopiedShare(false), 2000);
    }, () => {});
  }, [search, selectedCategory, jobTypeFilter, tab, isAr]);

  // ─── Queries ─────────────────────────────────────────────
  const { data: jobPostings = [], isLoading: loadingPostings } = useQuery({
    queryKey: ["job-postings-search", jobTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("job_postings")
        .select("*, companies!inner(name, name_ar, logo_url)")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (jobTypeFilter !== "all") query = query.eq("job_type", jobTypeFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: availableChefs = [], isLoading: loadingChefs } = useQuery({
    queryKey: ["available-chefs-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, specialization, specialization_ar, job_title, job_title_ar, country_code, city, years_of_experience, experience_level, work_availability_note, work_availability_note_ar, preferred_job_types, preferred_work_locations, willing_to_relocate, is_verified")
        .eq("is_open_to_work", true)
        .eq("job_availability_visibility", "public")
        .eq("is_chef_visible", true)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // ─── Derived Data ────────────────────────────────────────
  const topCompanies = useMemo(() => {
    const counts: Record<string, { name: string; nameAr: string; logo: string | null; count: number }> = {};
    jobPostings.forEach((j) => {
      const c = (j as any).companies;
      if (!c?.name) return;
      const key = c.name;
      if (!counts[key]) counts[key] = { name: c.name, nameAr: c.name_ar || c.name, logo: c.logo_url, count: 0 };
      counts[key].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [jobPostings]);

  const salaryInsights = useMemo(() => {
    const salaries = jobPostings.filter((j) => j.is_salary_visible && j.salary_min).map((j) => j.salary_min as number);
    if (salaries.length < 2) return null;
    const sorted = [...salaries].sort((a, b) => a - b);
    return { min: sorted[0], max: sorted[sorted.length - 1], median: sorted[Math.floor(sorted.length / 2)], count: salaries.length };
  }, [jobPostings]);

  const stats = useMemo(() => {
    const totalJobs = jobPostings.length;
    const featuredCount = jobPostings.filter((j) => j.is_featured).length;
    const newThisWeek = jobPostings.filter((j) => Math.floor((Date.now() - new Date(j.created_at).getTime()) / MS_PER_DAY) <= 7).length;
    const urgentCount = jobPostings.filter((j) => {
      if (!j.application_deadline) return false;
      const diff = new Date(j.application_deadline).getTime() - Date.now();
      return diff > 0 && diff < MS_PER_WEEK;
    }).length;
    return { totalJobs, featuredCount, newThisWeek, totalChefs: availableChefs.length, urgentCount };
  }, [jobPostings, availableChefs]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CULINARY_CATEGORIES.forEach(c => { counts[c.key] = 0; });
    jobPostings.forEach((j) => {
      CULINARY_CATEGORIES.forEach(c => {
        if (j.specialization?.toLowerCase().includes(c.key) || j.title?.toLowerCase().includes(c.key)) counts[c.key]++;
      });
    });
    return counts;
  }, [jobPostings]);

  const cities = useMemo(() => {
    const map: Record<string, number> = {};
    jobPostings.forEach((j) => { if (j.city) map[j.city] = (map[j.city] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a).map(([city, count]) => ({ city, count }));
  }, [jobPostings]);

  const activeFilterCount = [
    jobTypeFilter !== "all" ? 1 : 0, cityFilter !== "all" ? 1 : 0,
    expFilter !== "all" ? 1 : 0, salaryFilter !== "all" ? 1 : 0,
    selectedCategory ? 1 : 0, showSalaryOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setJobTypeFilter("all"); setCityFilter("all"); setExpFilter("all");
    setSalaryFilter("all"); setSelectedCategory(null); setSearch("");
    setShowSalaryOnly(false); setVisibleCount(ITEMS_PER_PAGE);
  };

  const filteredPostings = useMemo(() => {
    let results = jobPostings;
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((j) =>
        j.title?.toLowerCase().includes(q) || j.title_ar?.includes(q) ||
        (j.companies as any)?.name?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) ||
        j.specialization?.toLowerCase().includes(q) || j.description?.toLowerCase().includes(q)
      );
    }
    if (cityFilter !== "all") results = results.filter((j) => j.city === cityFilter);
    if (expFilter !== "all") results = results.filter((j) => j.experience_level === expFilter);
    if (showSalaryOnly) results = results.filter((j) => j.is_salary_visible && j.salary_min);
    if (salaryFilter !== "all") {
      results = results.filter((j) => {
        if (!j.salary_min) return false;
        if (salaryFilter === "0-3000") return j.salary_min <= 3000;
        if (salaryFilter === "3000-5000") return j.salary_min >= 3000 && j.salary_min <= 5000;
        if (salaryFilter === "5000-8000") return j.salary_min >= 5000 && j.salary_min <= 8000;
        if (salaryFilter === "8000+") return j.salary_min >= 8000;
        return true;
      });
    }
    if (selectedCategory) {
      results = results.filter((j) =>
        j.specialization?.toLowerCase().includes(selectedCategory) || j.title?.toLowerCase().includes(selectedCategory)
      );
    }
    if (sortBy === "salary") results = [...results].sort((a, b) => (b.salary_min || 0) - (a.salary_min || 0));
    if (sortBy === "views") results = [...results].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    if (sortBy === "deadline") results = [...results].sort((a, b) => {
      if (!a.application_deadline) return 1;
      if (!b.application_deadline) return -1;
      return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime();
    });
    return results;
  }, [jobPostings, search, cityFilter, expFilter, salaryFilter, selectedCategory, sortBy, showSalaryOnly]);

  const filteredChefs = useMemo(() => {
    let results = availableChefs;
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((c) =>
        c.full_name?.toLowerCase().includes(q) || c.full_name_ar?.includes(q) ||
        c.specialization?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)
      );
    }
    if (expFilter !== "all") results = results.filter((c) => c.experience_level === expFilter);
    return results;
  }, [availableChefs, search, expFilter]);

  const paginatedPostings = filteredPostings.slice(0, visibleCount);
  const hasMoreJobs = visibleCount < filteredPostings.length;

  // Reset pagination on filter change
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [search, jobTypeFilter, cityFilter, expFilter, salaryFilter, selectedCategory, showSalaryOnly]);

  return {
    isAr, user, searchInputRef,
    // Filters
    search, setSearch, jobTypeFilter, setJobTypeFilter,
    cityFilter, setCityFilter, expFilter, setExpFilter,
    salaryFilter, setSalaryFilter, tab, setTab,
    selectedCategory, setSelectedCategory,
    sortBy, setSortBy, viewMode, setViewMode,
    showSalaryOnly, setShowSalaryOnly,
    showFiltersPanel, setShowFiltersPanel,
    recentSearches, showRecentSearches, setShowRecentSearches,
    visibleCount, setVisibleCount, copiedShare, savedJobs,
    // Handlers
    handleSearchSubmit, toggleSaveJob, handleShareSearch, clearAllFilters,
    // Data
    loadingPostings, loadingChefs,
    jobPostings, availableChefs,
    topCompanies, salaryInsights, stats, categoryCounts, cities,
    activeFilterCount,
    filteredPostings, filteredChefs,
    paginatedPostings, hasMoreJobs,
  };
}
