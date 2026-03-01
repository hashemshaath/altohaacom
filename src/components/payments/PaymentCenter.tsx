import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreditCard, Wallet, Receipt, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Crown, Zap, Star, Shield } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    nameEn: "Free",
    nameAr: "مجاني",
    priceEn: "Free",
    priceAr: "مجاني",
    price: 0,
    icon: Star,
    features: [
      { en: "Basic profile", ar: "ملف شخصي أساسي" },
      { en: "Community access", ar: "الوصول للمجتمع" },
      { en: "5 recipes/month", ar: "5 وصفات/شهر" },
    ],
  },
  {
    id: "professional",
    nameEn: "Professional",
    nameAr: "احترافي",
    priceEn: "99 SAR/month",
    priceAr: "99 ر.س/شهر",
    price: 99,
    icon: Zap,
    popular: true,
    features: [
      { en: "Verified badge", ar: "شارة التحقق" },
      { en: "Unlimited recipes", ar: "وصفات غير محدودة" },
      { en: "Priority support", ar: "دعم أولوي" },
      { en: "Analytics dashboard", ar: "لوحة التحليلات" },
    ],
  },
  {
    id: "enterprise",
    nameEn: "Enterprise",
    nameAr: "مؤسسي",
    priceEn: "299 SAR/month",
    priceAr: "299 ر.س/شهر",
    price: 299,
    icon: Crown,
    features: [
      { en: "Everything in Pro", ar: "كل مزايا الاحترافي" },
      { en: "API access", ar: "وصول API" },
      { en: "Team management", ar: "إدارة الفريق" },
      { en: "Custom branding", ar: "علامة تجارية مخصصة" },
      { en: "Dedicated support", ar: "دعم مخصص" },
    ],
  },
];

export function PaymentCenter() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("wallet");

  const { data: wallet } = useQuery({
    queryKey: ["user-wallet", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("user_wallets").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["wallet-transactions", wallet?.id],
    queryFn: async () => {
      if (!wallet?.id) return [];
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!wallet?.id,
  });

  const { data: membership } = useQuery({
    queryKey: ["user-membership", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("membership_cards").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: string) => {
    if (["credit", "deposit", "refund"].includes(type)) return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    return <ArrowUpRight className="h-4 w-4 text-destructive" />;
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet" className="gap-1">
            <Wallet className="h-4 w-4" />
            {isAr ? "المحفظة" : "Wallet"}
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-1">
            <Crown className="h-4 w-4" />
            {isAr ? "الاشتراكات" : "Plans"}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <Receipt className="h-4 w-4" />
            {isAr ? "السجل" : "History"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          {/* Wallet Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{isAr ? "الرصيد الحالي" : "Current Balance"}</p>
                  <p className="text-3xl font-bold mt-1">{wallet?.balance?.toFixed(2) || "0.00"} <span className="text-sm font-normal text-muted-foreground">SAR</span></p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "النقاط" : "Points"}</p>
                  <p className="font-semibold">{wallet?.points_balance || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "رقم المحفظة" : "Wallet ID"}</p>
                  <p className="font-mono text-sm">{wallet?.wallet_number || "—"}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="gap-1">
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  {isAr ? "إيداع" : "Deposit"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {isAr ? "سحب" : "Withdraw"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isAr ? "آخر المعاملات" : "Recent Transactions"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد معاملات" : "No transactions yet"}</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((txn: any) => (
                      <div key={txn.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        {getTypeIcon(txn.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{isAr ? (txn.description_ar || txn.description) : txn.description}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(txn.created_at), "dd MMM yyyy", { locale: isAr ? ar : enUS })}</p>
                        </div>
                        <div className="text-end">
                          <p className={`text-sm font-medium ${["credit", "deposit", "refund"].includes(txn.type) ? "text-green-600" : "text-destructive"}`}>
                            {["credit", "deposit", "refund"].includes(txn.type) ? "+" : "-"}{txn.amount} SAR
                          </p>
                          {getStatusIcon(txn.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {SUBSCRIPTION_PLANS.map(plan => {
              const Icon = plan.icon;
              const isCurrent = membership ? (membership.is_trial ? plan.id === "free" : plan.id === "professional") : plan.id === "free";
              return (
                <Card key={plan.id} className={`relative ${plan.popular ? "border-primary shadow-md" : ""} ${isCurrent ? "ring-2 ring-primary" : ""}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-2.5 start-1/2 -translate-x-1/2">{isAr ? "الأكثر شعبية" : "Most Popular"}</Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{isAr ? plan.nameAr : plan.nameEn}</CardTitle>
                    <CardDescription className="text-xl font-bold text-foreground">{isAr ? plan.priceAr : plan.priceEn}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                          {isAr ? f.ar : f.en}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={isCurrent ? "outline" : plan.popular ? "default" : "secondary"} disabled={isCurrent}>
                      {isCurrent ? (isAr ? "الخطة الحالية" : "Current Plan") : (isAr ? "اشترك الآن" : "Subscribe")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isAr ? "سجل المعاملات الكامل" : "Full Transaction History"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد معاملات" : "No transactions"}</p>
                ) : (
                  <div className="space-y-1">
                    {transactions.map((txn: any) => (
                      <div key={txn.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 border-b last:border-0">
                        {getTypeIcon(txn.type)}
                        <div className="flex-1">
                          <p className="text-sm">{isAr ? (txn.description_ar || txn.description) : txn.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">{txn.type}</Badge>
                            <span className="text-xs text-muted-foreground">{txn.transaction_number}</span>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className={`font-medium ${["credit", "deposit", "refund"].includes(txn.type) ? "text-green-600" : "text-destructive"}`}>
                            {["credit", "deposit", "refund"].includes(txn.type) ? "+" : "-"}{txn.amount} {txn.currency || "SAR"}
                          </p>
                          <p className="text-xs text-muted-foreground">{format(new Date(txn.created_at), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
