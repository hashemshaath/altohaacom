import { memo } from "react";
import { Building2, Award, Globe, Sparkles } from "lucide-react";

interface Props {
  isAr: boolean;
}

const CLIENTS = [
  { name: "Al-Marai", name_ar: "المراعي", sector_en: "Dairy", sector_ar: "ألبان", color: "bg-chart-5/10 text-chart-5" },
  { name: "Albaik", name_ar: "البيك", sector_en: "F&B Chain", sector_ar: "سلسلة مطاعم", color: "bg-chart-4/10 text-chart-4" },
  { name: "Savola", name_ar: "صافولا", sector_en: "Food Industries", sector_ar: "صناعات غذائية", color: "bg-primary/10 text-primary" },
  { name: "Nadec", name_ar: "نادك", sector_en: "Dairy & Juice", sector_ar: "ألبان وعصائر", color: "bg-chart-3/10 text-chart-3" },
  { name: "Americana", name_ar: "أمريكانا", sector_en: "Food Group", sector_ar: "مجموعة غذائية", color: "bg-chart-1/10 text-chart-1" },
  { name: "Halwani Bros", name_ar: "الحلواني إخوان", sector_en: "Processed Food", sector_ar: "أغذية مصنّعة", color: "bg-chart-2/10 text-chart-2" },
  { name: "Sunbulah", name_ar: "السنبلة", sector_en: "Frozen Foods", sector_ar: "أغذية مجمدة", color: "bg-chart-4/10 text-chart-4" },
  { name: "Saudia Dairy", name_ar: "السعودية للألبان", sector_en: "Dairy", sector_ar: "ألبان", color: "bg-chart-5/10 text-chart-5" },
];

const TRUST_STATS = [
  { icon: Building2, num: "200+", en: "Partner Companies", ar: "شركة شريكة" },
  { icon: Globe, num: "12", en: "Countries", ar: "دولة" },
  { icon: Award, num: "15+", en: "Industries", ar: "قطاع صناعي" },
];

export const ChefsTableClients = memo(function ChefsTableClients({ isAr }: Props) {
  return (
    <section className="bg-muted/30">
      <div className="container py-16 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {isAr ? "عملاؤنا" : "Our Clients"}
          </div>
          <h2 className="text-2xl md:text-3xl font-black">
            {isAr ? "موثوق من قبل أبرز الشركات" : "Trusted by Leading Companies"}
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            {isAr
              ? "نفخر بخدمة نخبة من أكبر الشركات الغذائية في المنطقة والعالم"
              : "We proudly serve top-tier food companies across the region and beyond"}
          </p>
        </div>

        {/* Client Grid */}
        <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {CLIENTS.map((client, i) => (
            <div
              key={i}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-background p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${client.color} transition-transform duration-300 group-hover:scale-110`}>
                <span className="text-xl font-black">{(isAr ? client.name_ar : client.name).charAt(0)}</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">{isAr ? client.name_ar : client.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? client.sector_ar : client.sector_en}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Stats */}
        <div className="mx-auto max-w-3xl grid grid-cols-3 gap-4">
          {TRUST_STATS.map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-background p-5 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-black tabular-nums">{stat.num}</span>
              <span className="text-xs text-muted-foreground font-medium">{isAr ? stat.ar : stat.en}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
