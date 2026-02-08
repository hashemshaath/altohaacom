import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

export default function MembershipManagement() {
  const { t } = useLanguage();

  const tiers = [
    {
      tier: "basic",
      price: "Free",
      color: "border-gray-200",
      features: [
        "Create profile",
        "Join community",
        "Follow chefs",
        "Join public groups",
        "View competitions",
      ],
    },
    {
      tier: "professionalTier",
      price: "$19/month",
      color: "border-primary",
      featured: true,
      features: [
        "All Basic features",
        "Verified badge",
        "Priority support",
        "Create private groups",
        "Advanced analytics",
        "Early competition access",
      ],
    },
    {
      tier: "enterprise",
      price: "$99/month",
      color: "border-purple-500",
      features: [
        "All Professional features",
        "Custom branding",
        "API access",
        "Dedicated account manager",
        "White-label options",
        "Unlimited team members",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">{t("membershipControl")}</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((item) => (
          <Card key={item.tier} className={`relative ${item.color} ${item.featured ? "ring-2 ring-primary" : ""}`}>
            {item.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">
                  <Star className="mr-1 h-3 w-3" /> Popular
                </Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{t(item.tier as any)}</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground">
                {item.price}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membership Statistics</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Stripe integration will be set up to enable automatic payments, upgrades, and renewals.
        </CardContent>
      </Card>
    </div>
  );
}
