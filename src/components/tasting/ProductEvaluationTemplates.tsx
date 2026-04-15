import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Beef, Coffee, Wheat, Milk, Candy, Droplets, Flame, Salad,
  Snowflake, Package, FlaskConical, Star, LucideIcon } from "lucide-react";

export interface ProductTemplate {
  id: string;
  name: string;
  name_ar: string;
  icon: LucideIcon;
  color: string;
  criteria: Array<{
    name: string;
    name_ar: string;
    description: string;
    description_ar: string;
    max_score: number;
    weight: number;
    stage: string;
  }>;
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    id: "meat",
    name: "Meat & Poultry",
    name_ar: "اللحوم والدواجن",
    icon: Beef,
    color: "text-chart-1 bg-chart-1/10",
    criteria: [
      { name: "Color & Appearance", name_ar: "اللون والمظهر", description: "Visual freshness indicators", description_ar: "مؤشرات الطازجة البصرية", max_score: 10, weight: 15, stage: "visual" },
      { name: "Texture & Marbling", name_ar: "القوام والتعريق", description: "Fat distribution and firmness", description_ar: "توزيع الدهون والصلابة", max_score: 10, weight: 15, stage: "visual" },
      { name: "Aroma (Raw)", name_ar: "الرائحة (خام)", description: "Raw meat smell assessment", description_ar: "تقييم رائحة اللحم الخام", max_score: 10, weight: 10, stage: "technical" },
      { name: "Cooking Response", name_ar: "الاستجابة للطهي", description: "Shrinkage, moisture retention", description_ar: "الانكماش واحتفاظ الرطوبة", max_score: 10, weight: 15, stage: "technical" },
      { name: "Tenderness", name_ar: "الطراوة", description: "Bite and chew quality", description_ar: "جودة القضم والمضغ", max_score: 10, weight: 15, stage: "technical" },
      { name: "Flavor Profile", name_ar: "نكهة اللحم", description: "Depth and richness of flavor", description_ar: "عمق وغنى النكهة", max_score: 10, weight: 20, stage: "performance" },
      { name: "Overall Impression", name_ar: "الانطباع العام", description: "Overall quality verdict", description_ar: "الحكم الشامل على الجودة", max_score: 10, weight: 10, stage: "performance" },
    ],
  },
  {
    id: "coffee",
    name: "Coffee & Tea",
    name_ar: "القهوة والشاي",
    icon: Coffee,
    color: "text-chart-3 bg-chart-3/10",
    criteria: [
      { name: "Fragrance / Aroma", name_ar: "العطر / الرائحة", description: "Dry and wet aroma assessment", description_ar: "تقييم الرائحة الجافة والرطبة", max_score: 10, weight: 15, stage: "visual" },
      { name: "Flavor", name_ar: "النكهة", description: "Taste notes and complexity", description_ar: "ملاحظات الطعم والتعقيد", max_score: 10, weight: 20, stage: "technical" },
      { name: "Aftertaste", name_ar: "الطعم اللاحق", description: "Length and quality of finish", description_ar: "طول وجودة الطعم النهائي", max_score: 10, weight: 10, stage: "technical" },
      { name: "Acidity", name_ar: "الحموضة", description: "Brightness and liveliness", description_ar: "الحيوية والإشراق", max_score: 10, weight: 15, stage: "technical" },
      { name: "Body", name_ar: "القوام", description: "Mouthfeel and weight", description_ar: "الإحساس في الفم والكثافة", max_score: 10, weight: 15, stage: "technical" },
      { name: "Balance", name_ar: "التوازن", description: "Harmony between elements", description_ar: "الانسجام بين العناصر", max_score: 10, weight: 15, stage: "performance" },
      { name: "Overall", name_ar: "التقييم الشامل", description: "Holistic quality assessment", description_ar: "تقييم الجودة الشامل", max_score: 10, weight: 10, stage: "performance" },
    ],
  },
  {
    id: "bakery",
    name: "Bakery & Pastry",
    name_ar: "المخبوزات والحلويات",
    icon: Wheat,
    color: "text-chart-4 bg-chart-4/10",
    criteria: [
      { name: "Appearance & Shape", name_ar: "المظهر والشكل", description: "Visual presentation and uniformity", description_ar: "العرض البصري والتناسق", max_score: 10, weight: 15, stage: "visual" },
      { name: "Crust Quality", name_ar: "جودة القشرة", description: "Color, crunch, thickness", description_ar: "اللون والقرمشة والسمك", max_score: 10, weight: 10, stage: "visual" },
      { name: "Crumb Structure", name_ar: "بنية اللب", description: "Internal texture and air pockets", description_ar: "القوام الداخلي وجيوب الهواء", max_score: 10, weight: 15, stage: "technical" },
      { name: "Moisture Level", name_ar: "مستوى الرطوبة", description: "Appropriate moisture balance", description_ar: "توازن الرطوبة المناسب", max_score: 10, weight: 10, stage: "technical" },
      { name: "Aroma", name_ar: "الرائحة", description: "Freshness and baking aroma", description_ar: "نضارة ورائحة الخَبز", max_score: 10, weight: 10, stage: "technical" },
      { name: "Taste & Flavor", name_ar: "الطعم والنكهة", description: "Sweetness balance, depth", description_ar: "توازن الحلاوة والعمق", max_score: 10, weight: 25, stage: "performance" },
      { name: "Overall Quality", name_ar: "الجودة الشاملة", description: "Professional grade assessment", description_ar: "تقييم المستوى الاحترافي", max_score: 10, weight: 15, stage: "performance" },
    ],
  },
  {
    id: "dairy",
    name: "Dairy Products",
    name_ar: "منتجات الألبان",
    icon: Milk,
    color: "text-chart-5 bg-chart-5/10",
    criteria: [
      { name: "Appearance", name_ar: "المظهر", description: "Color, sheen, consistency", description_ar: "اللون واللمعان والتماسك", max_score: 10, weight: 10, stage: "visual" },
      { name: "Texture", name_ar: "القوام", description: "Smoothness, creaminess", description_ar: "النعومة والكريمية", max_score: 10, weight: 20, stage: "visual" },
      { name: "Aroma", name_ar: "الرائحة", description: "Freshness, fermentation notes", description_ar: "النضارة وملاحظات التخمير", max_score: 10, weight: 15, stage: "technical" },
      { name: "Taste", name_ar: "الطعم", description: "Flavor profile and richness", description_ar: "ملف النكهة والغنى", max_score: 10, weight: 25, stage: "technical" },
      { name: "Aftertaste", name_ar: "الطعم اللاحق", description: "Clean finish assessment", description_ar: "تقييم نظافة الطعم النهائي", max_score: 10, weight: 10, stage: "technical" },
      { name: "Freshness", name_ar: "الطازجة", description: "Age and freshness indicators", description_ar: "مؤشرات العمر والطازجة", max_score: 10, weight: 10, stage: "performance" },
      { name: "Overall", name_ar: "التقييم الشامل", description: "Professional verdict", description_ar: "الحكم الاحترافي", max_score: 10, weight: 10, stage: "performance" },
    ],
  },
  {
    id: "spices",
    name: "Spices & Seasonings",
    name_ar: "التوابل والبهارات",
    icon: FlaskConical,
    color: "text-primary bg-primary/10",
    criteria: [
      { name: "Color Intensity", name_ar: "شدة اللون", description: "Vibrancy and purity of color", description_ar: "حيوية ونقاء اللون", max_score: 10, weight: 15, stage: "visual" },
      { name: "Aroma Strength", name_ar: "قوة الرائحة", description: "Potency and complexity", description_ar: "القوة والتعقيد", max_score: 10, weight: 25, stage: "technical" },
      { name: "Flavor Impact", name_ar: "تأثير النكهة", description: "Taste and heat profile", description_ar: "ملف الطعم والحرارة", max_score: 10, weight: 25, stage: "technical" },
      { name: "Purity", name_ar: "النقاء", description: "Absence of adulterants", description_ar: "خلو من الملوثات", max_score: 10, weight: 15, stage: "technical" },
      { name: "Grind Consistency", name_ar: "تناسق الطحن", description: "Particle uniformity", description_ar: "تناسق الجزيئات", max_score: 10, weight: 10, stage: "visual" },
      { name: "Overall Quality", name_ar: "الجودة الشاملة", description: "Professional grade", description_ar: "التصنيف الاحترافي", max_score: 10, weight: 10, stage: "performance" },
    ],
  },
  {
    id: "beverages",
    name: "Beverages & Juices",
    name_ar: "المشروبات والعصائر",
    icon: Droplets,
    color: "text-chart-2 bg-chart-2/10",
    criteria: [
      { name: "Color & Clarity", name_ar: "اللون والصفاء", description: "Visual appeal and transparency", description_ar: "الجاذبية البصرية والشفافية", max_score: 10, weight: 10, stage: "visual" },
      { name: "Aroma", name_ar: "الرائحة", description: "Fragrance intensity and quality", description_ar: "شدة وجودة العطر", max_score: 10, weight: 15, stage: "visual" },
      { name: "Sweetness Balance", name_ar: "توازن الحلاوة", description: "Sugar-acid balance", description_ar: "توازن السكر والحموضة", max_score: 10, weight: 20, stage: "technical" },
      { name: "Flavor Complexity", name_ar: "تعقيد النكهة", description: "Depth and layers", description_ar: "العمق والطبقات", max_score: 10, weight: 20, stage: "technical" },
      { name: "Mouthfeel", name_ar: "الإحساس بالفم", description: "Body and carbonation", description_ar: "الكثافة والفوران", max_score: 10, weight: 15, stage: "technical" },
      { name: "Freshness", name_ar: "الانتعاش", description: "Refreshing quality", description_ar: "جودة الانتعاش", max_score: 10, weight: 10, stage: "performance" },
      { name: "Overall", name_ar: "التقييم الشامل", description: "Overall verdict", description_ar: "الحكم الشامل", max_score: 10, weight: 10, stage: "performance" },
    ],
  },
  {
    id: "frozen",
    name: "Frozen Foods",
    name_ar: "الأطعمة المجمدة",
    icon: Snowflake,
    color: "text-chart-1 bg-chart-1/10",
    criteria: [
      { name: "Packaging Integrity", name_ar: "سلامة التغليف", description: "Seal and frost condition", description_ar: "حالة الختم والتجميد", max_score: 10, weight: 10, stage: "visual" },
      { name: "Appearance (Thawed)", name_ar: "المظهر (بعد الذوبان)", description: "Post-thaw visual quality", description_ar: "الجودة البصرية بعد الذوبان", max_score: 10, weight: 10, stage: "visual" },
      { name: "Texture Retention", name_ar: "احتفاظ القوام", description: "Texture after cooking", description_ar: "القوام بعد الطهي", max_score: 10, weight: 20, stage: "technical" },
      { name: "Flavor Preservation", name_ar: "حفظ النكهة", description: "Taste vs fresh equivalent", description_ar: "المقارنة بالمنتج الطازج", max_score: 10, weight: 25, stage: "technical" },
      { name: "Cooking Convenience", name_ar: "سهولة التحضير", description: "Preparation simplicity", description_ar: "بساطة التحضير", max_score: 10, weight: 15, stage: "performance" },
      { name: "Overall Value", name_ar: "القيمة الشاملة", description: "Quality-to-price assessment", description_ar: "تقييم الجودة مقابل السعر", max_score: 10, weight: 20, stage: "performance" },
    ],
  },
  {
    id: "sauces",
    name: "Sauces & Condiments",
    name_ar: "الصلصات والتوابل",
    icon: Flame,
    color: "text-destructive bg-destructive/10",
    criteria: [
      { name: "Color & Consistency", name_ar: "اللون والقوام", description: "Visual thickness and hue", description_ar: "السمك واللون البصري", max_score: 10, weight: 15, stage: "visual" },
      { name: "Aroma", name_ar: "الرائحة", description: "Fragrance complexity", description_ar: "تعقيد الرائحة", max_score: 10, weight: 15, stage: "visual" },
      { name: "Flavor Balance", name_ar: "توازن النكهة", description: "Sweet, salty, sour, umami", description_ar: "الحلو والمالح والحامض والأومامي", max_score: 10, weight: 25, stage: "technical" },
      { name: "Heat Level", name_ar: "مستوى الحرارة", description: "Spiciness appropriateness", description_ar: "ملاءمة مستوى الحرارة", max_score: 10, weight: 10, stage: "technical" },
      { name: "Versatility", name_ar: "التنوع", description: "Pairing potential", description_ar: "إمكانية الاقتران", max_score: 10, weight: 15, stage: "performance" },
      { name: "Overall", name_ar: "التقييم الشامل", description: "Professional assessment", description_ar: "التقييم الاحترافي", max_score: 10, weight: 20, stage: "performance" },
    ],
  },
];

interface Props {
  onSelect: (template: ProductTemplate) => void;
}

export const ProductEvaluationTemplates = memo(function ProductEvaluationTemplates({ onSelect }: Props) {
  const isAr = useIsAr();

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold">{isAr ? "نماذج التقييم حسب نوع المنتج" : "Evaluation Templates by Product Type"}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? "اختر نموذج تقييم جاهز يناسب طبيعة المنتج" : "Select a pre-built evaluation template tailored to your product"}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCT_TEMPLATES.map(t => {
          const Icon = t.icon;
          return (
            <Card
              key={t.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/50"
              onClick={() => onSelect(t)}
            >
              <CardContent className="p-4 text-center">
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.color} transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold">{isAr ? t.name_ar : t.name}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Badge variant="secondary" className="text-[0.625rem]">{t.criteria.length} {isAr ? "معيار" : "criteria"}</Badge>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full text-xs gap-1">
                  <Star className="h-3 w-3" />
                  {isAr ? "تطبيق النموذج" : "Apply Template"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});
