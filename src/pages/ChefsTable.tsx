import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
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

export default function ChefsTable() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { user } = useAuth();
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
      <ChefsTableCTA isAr={isAr} user={user} onRequestClick={handleRequest} />
    </PageShell>
  );
}
