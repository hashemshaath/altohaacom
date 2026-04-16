import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useChefsTableSessions } from "@/hooks/useChefsTable";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell } from "@/components/PageShell";
import { ChefsTableHero } from "@/components/chefs-table/ChefsTableHero";
import { ChefsTableBenefits } from "@/components/chefs-table/ChefsTableBenefits";
import { ChefsTableCategories } from "@/components/chefs-table/ChefsTableCategories";
import { ChefsTableHowItWorks } from "@/components/chefs-table/ChefsTableHowItWorks";
import { ChefsTableTestimonials } from "@/components/chefs-table/ChefsTableTestimonials";
import { ChefsTableCTA } from "@/components/chefs-table/ChefsTableCTA";
import { ChefsTableClients } from "@/components/chefs-table/ChefsTableClients";
import { ChefsTableSessionsList } from "@/components/chefs-table/ChefsTableSessionsList";
import { ChefsTablePricing } from "@/components/chefs-table/ChefsTablePricing";
import { ChefsTableFAQ } from "@/components/chefs-table/ChefsTableFAQ";
import { ChefsTableSuccessMetrics } from "@/components/chefs-table/ChefsTableSuccessMetrics";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function ChefsTable() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAr = useIsAr();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: sessions, isLoading } = useChefsTableSessions();

  const filtered = useMemo(() => sessions?.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.title.toLowerCase().includes(q) || s.product_name.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  }), [sessions, search, statusFilter]);

  const publishedSessions = useMemo(() => filtered?.filter(s => s.is_published || s.organizer_id === user?.id), [filtered, user?.id]);

  const handleRequest = () => navigate("/chefs-table/request");

  return (
    <PageShell
      title={isAr ? "طاولة الشيف — تقييم المنتجات الغذائية" : "Chef's Table — Food Product Evaluation"}
      description={isAr ? "خدمة تقييم المنتجات الغذائية من قبل طهاة محترفين" : "Professional food product evaluation by expert chefs"}
      seoProps={{ keywords: isAr ? "تقييم منتجات غذائية, طاولة الشيف, تقييم طعام, مراجعة أغذية" : "food product evaluation, chefs table, food review, product assessment, chef tasting" }}
      container={false}
      padding="none"
    >
      <ChefsTableHero isAr={isAr} user={user} onRequestClick={handleRequest} />
      <ChefsTableBenefits isAr={isAr} />
      <ChefsTableCategories isAr={isAr} />
      <ChefsTableHowItWorks isAr={isAr} />
      <ChefsTableSuccessMetrics isAr={isAr} />
      <ChefsTableClients isAr={isAr} />
      <ChefsTablePricing isAr={isAr} onRequestClick={handleRequest} />
      <ChefsTableTestimonials isAr={isAr} />
      <ChefsTableSessionsList
        isAr={isAr}
        sessions={publishedSessions}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onSessionClick={(id) => navigate(`/chefs-table/${id}`)}
      />
      <ChefsTableFAQ isAr={isAr} />
      <ChefsTableCTA isAr={isAr} user={user} onRequestClick={handleRequest} />
    </PageShell>
  );
}
