import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, Crown, Zap } from "lucide-react";

const BENEFITS = [
  { key: "profile", en: "Create Profile", ar: "إنشاء ملف شخصي", basic: true, pro: true, ent: true },
  { key: "community", en: "Join Community", ar: "الانضمام للمجتمع", basic: true, pro: true, ent: true },
  { key: "follow", en: "Follow Chefs", ar: "متابعة الطهاة", basic: true, pro: true, ent: true },
  { key: "groups", en: "Join Public Groups", ar: "الانضمام للمجموعات العامة", basic: true, pro: true, ent: true },
  { key: "view_comps", en: "View Competitions", ar: "عرض المسابقات", basic: true, pro: true, ent: true },
  { key: "verified", en: "Verified Badge", ar: "شارة التوثيق", basic: false, pro: true, ent: true },
  { key: "priority", en: "Priority Support", ar: "دعم ذو أولوية", basic: false, pro: true, ent: true },
  { key: "private_groups", en: "Create Private Groups", ar: "إنشاء مجموعات خاصة", basic: false, pro: true, ent: true },
  { key: "analytics", en: "Advanced Analytics", ar: "تحليلات متقدمة", basic: false, pro: true, ent: true },
  { key: "early_access", en: "Early Competition Access", ar: "وصول مبكر للمسابقات", basic: false, pro: true, ent: true },
  { key: "masterclass", en: "Premium Masterclasses", ar: "دروس متقدمة حصرية", basic: false, pro: true, ent: true },
  { key: "certificates", en: "Digital Certificates", ar: "شهادات رقمية", basic: false, pro: true, ent: true },
  { key: "branding", en: "Custom Branding", ar: "علامة تجارية مخصصة", basic: false, pro: false, ent: true },
  { key: "api", en: "API Access", ar: "وصول API", basic: false, pro: false, ent: true },
  { key: "manager", en: "Dedicated Account Manager", ar: "مدير حساب مخصص", basic: false, pro: false, ent: true },
  { key: "whitelabel", en: "White-Label Options", ar: "خيارات العلامة البيضاء", basic: false, pro: false, ent: true },
  { key: "team", en: "Unlimited Team Members", ar: "أعضاء فريق غير محدودين", basic: false, pro: false, ent: true },
  { key: "exhibitions", en: "Exhibition Priority Booking", ar: "أولوية حجز المعارض", basic: false, pro: false, ent: true },
];

export default function MembershipBenefitsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const tiers = [
    { key: "basic", icon: Zap, label: isAr ? "الأساسي" : "Basic", price: isAr ? "مجاني" : "Free", color: "text-muted-foreground" },
    { key: "pro", icon: Star, label: isAr ? "الاحترافي" : "Professional", price: "19 SAR/" + (isAr ? "شهر" : "mo"), color: "text-primary", featured: true },
    { key: "ent", icon: Crown, label: isAr ? "المؤسسي" : "Enterprise", price: "99 SAR/" + (isAr ? "شهر" : "mo"), color: "text-chart-2" },
  ];

  return (
    <div className="space-y-6">
      {/* Tier Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => {
          const benefitCount = BENEFITS.filter(b => b[tier.key as keyof typeof b]).length;
          return (
            <Card key={tier.key} className={tier.featured ? "ring-2 ring-primary relative" : ""}>
              {tier.featured && (
                <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                  <Badge className="bg-primary"><Star className="me-1 h-3 w-3" />{isAr ? "الأكثر شعبية" : "Popular"}</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <tier.icon className={`h-8 w-8 mx-auto mb-2 ${tier.color}`} />
                <CardTitle className="text-lg">{tier.label}</CardTitle>
                <p className="text-2xl font-bold">{tier.price}</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  {benefitCount} {isAr ? "ميزة" : "features"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Benefits Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "مقارنة المميزات" : "Benefits Comparison"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-start py-3 pe-4 text-sm font-medium text-muted-foreground">{isAr ? "الميزة" : "Feature"}</th>
                  {tiers.map((tier) => (
                    <th key={tier.key} className="text-center py-3 px-4 text-sm font-medium">
                      <span className={tier.color}>{tier.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENEFITS.map((benefit) => (
                  <tr key={benefit.key} className="border-b last:border-0">
                    <td className="py-3 pe-4 text-sm">{isAr ? benefit.ar : benefit.en}</td>
                    {["basic", "pro", "ent"].map((tier) => (
                      <td key={tier} className="text-center py-3 px-4">
                        {benefit[tier as keyof typeof benefit] ? (
                          <Check className="h-4 w-4 text-primary mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
