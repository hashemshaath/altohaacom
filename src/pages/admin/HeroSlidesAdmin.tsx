import { lazy } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { Layers } from "lucide-react";

const HeroSlideAdmin = lazy(() =>
  import("@/components/admin/hero/HeroSlideAdmin").then(m => ({ default: m.HeroSlideAdmin }))
);

export default function HeroSlidesAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Layers}
        title={isAr ? "شرائح القسم الرئيسي" : "Hero Slides"}
        description={isAr
          ? "إدارة شرائح القسم الرئيسي مع القوالب والتصميمات الاحترافية"
          : "Manage hero slides with professional templates, dimensions, and full design control"}
      />
      <HeroSlideAdmin />
    </div>
  );
}
