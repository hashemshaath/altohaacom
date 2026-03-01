import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Gift, Star, Crown, Check, ArrowRight, ArrowLeft, Copy,
  User, Mail, Sparkles, Heart, Loader2, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIERS = [
  { id: "professional", icon: Star, color: "text-primary", bg: "bg-primary/10", monthly: 19, yearly: 190 },
  { id: "enterprise", icon: Crown, color: "text-chart-2", bg: "bg-chart-2/10", monthly: 99, yearly: 990 },
];

const TIER_NAMES: Record<string, { en: string; ar: string }> = {
  professional: { en: "Professional", ar: "الاحترافي" },
  enterprise: { en: "Enterprise", ar: "المؤسسي" },
};

const DURATION_OPTIONS = [
  { months: 1, en: "1 Month", ar: "شهر واحد" },
  { months: 3, en: "3 Months", ar: "3 أشهر" },
  { months: 6, en: "6 Months", ar: "6 أشهر" },
  { months: 12, en: "1 Year", ar: "سنة واحدة" },
];

export default function MembershipGift() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<"select" | "recipient" | "preview" | "success">("select");
  const [selectedTier, setSelectedTier] = useState("professional");
  const [duration, setDuration] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [giftCode, setGiftCode] = useState("");

  const { data: senderProfile } = useQuery({
    queryKey: ["gift-sender-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const tierConfig = TIERS.find((t) => t.id === selectedTier)!;
  const price = tierConfig.monthly * duration;
  const vat = price * 0.15;
  const total = price + vat;

  const createGift = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("membership_gifts")
        .insert({
          sender_id: user!.id,
          recipient_name: recipientName || null,
          recipient_email: recipientEmail || null,
          tier: selectedTier,
          billing_cycle: "monthly",
          duration_months: duration,
          amount: total,
          currency: "SAR",
          message: message || null,
          payment_status: "paid", // Simulated for now
          status: "pending",
        } as any)
        .select("gift_code")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGiftCode((data as any).gift_code);
      setStep("success");
      toast.success(isAr ? "تم إنشاء الهدية بنجاح! 🎁" : "Gift created successfully! 🎁");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const copyCode = () => {
    navigator.clipboard.writeText(giftCode);
    toast.success(isAr ? "تم نسخ الكود" : "Code copied!");
  };

  const copyLink = () => {
    const link = `${window.location.origin}/membership/redeem?code=${giftCode}`;
    navigator.clipboard.writeText(link);
    toast.success(isAr ? "تم نسخ الرابط" : "Link copied!");
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif">
            {isAr ? "أهدِ عضوية" : "Gift a Membership"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAr ? "أهدِ صديقًا أو زميلاً ترقية للعضوية" : "Give a friend or colleague a membership upgrade"}
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["select", "recipient", "preview", "success"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                step === s ? "bg-primary text-primary-foreground" :
                ["select", "recipient", "preview", "success"].indexOf(step) > i
                  ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select tier & duration */}
        {step === "select" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{isAr ? "اختر الخطة" : "Choose a Plan"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedTier} onValueChange={setSelectedTier} className="grid grid-cols-2 gap-3">
                  {TIERS.map((tier) => {
                    const Icon = tier.icon;
                    const name = TIER_NAMES[tier.id];
                    return (
                      <Label key={tier.id} htmlFor={`tier-${tier.id}`}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all",
                          selectedTier === tier.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        )}>
                        <RadioGroupItem value={tier.id} id={`tier-${tier.id}`} className="sr-only" />
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", tier.bg)}>
                          <Icon className={cn("h-5 w-5", tier.color)} />
                        </div>
                        <span className="font-semibold text-sm">{isAr ? name.ar : name.en}</span>
                        <span className="text-xs text-muted-foreground">
                          {tier.monthly} SAR/{isAr ? "شهر" : "mo"}
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">{isAr ? "المدة" : "Duration"}</Label>
                  <RadioGroup value={String(duration)} onValueChange={(v) => setDuration(Number(v))} className="grid grid-cols-2 gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <Label key={opt.months} htmlFor={`dur-${opt.months}`}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-3 py-2.5 cursor-pointer transition-all text-sm",
                          duration === opt.months ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        )}>
                        <RadioGroupItem value={String(opt.months)} id={`dur-${opt.months}`} className="sr-only" />
                        <span>{isAr ? opt.ar : opt.en}</span>
                        <span className="font-semibold">{tierConfig.monthly * opt.months} SAR</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" onClick={() => setStep("recipient")}>
              {isAr ? "التالي" : "Next"}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Recipient info */}
        {step === "recipient" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{isAr ? "معلومات المستلم" : "Recipient Info"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipientName" className="text-sm">{isAr ? "الاسم (اختياري)" : "Name (optional)"}</Label>
                  <div className="relative mt-1">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="recipientName" className="ps-9" placeholder={isAr ? "اسم المستلم" : "Recipient's name"}
                      value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="recipientEmail" className="text-sm">{isAr ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="recipientEmail" className="ps-9" type="email" placeholder={isAr ? "بريد المستلم" : "Recipient's email"}
                      value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message" className="text-sm">{isAr ? "رسالة شخصية (اختياري)" : "Personal message (optional)"}</Label>
                  <Textarea id="message" className="mt-1" rows={3}
                    placeholder={isAr ? "أتمنى لك عضوية مميزة..." : "Wishing you an amazing membership..."}
                    value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
                  <p className="text-[10px] text-muted-foreground mt-1 text-end">{message.length}/500</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>
                <ArrowLeft className="me-2 h-4 w-4" />
                {isAr ? "رجوع" : "Back"}
              </Button>
              <Button className="flex-1" onClick={() => setStep("preview")}>
                {isAr ? "معاينة" : "Preview"}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & confirm */}
        {step === "preview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Gift Card Preview */}
            <Card className="overflow-hidden border-2 border-primary/20">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-chart-3/10 p-6 text-center">
                <Gift className="h-10 w-10 text-primary mx-auto mb-3" />
                <h2 className="text-xl font-bold font-serif">{isAr ? "هدية عضوية" : "Membership Gift"}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? "من" : "From"} {senderProfile?.full_name || (isAr ? "صديق" : "A friend")}
                </p>
              </div>
              <CardContent className="p-5 space-y-3">
                {recipientName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{isAr ? "إلى:" : "To:"} <strong>{recipientName}</strong></span>
                  </div>
                )}
                {message && (
                  <div className="bg-muted/50 rounded-xl p-3 text-sm italic text-muted-foreground border border-border/50">
                    <Heart className="h-3 w-3 inline me-1 text-primary" />
                    "{message}"
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(() => { const Icon = tierConfig.icon; return <Icon className={cn("h-4 w-4", tierConfig.color)} />; })()}
                    <span className="font-semibold text-sm">
                      {isAr ? TIER_NAMES[selectedTier].ar : TIER_NAMES[selectedTier].en}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {DURATION_OPTIONS.find((d) => d.months === duration)?.[isAr ? "ar" : "en"]}
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isAr ? "المبلغ" : "Subtotal"}</span>
                    <span>{price.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isAr ? "ضريبة القيمة المضافة 15%" : "VAT 15%"}</span>
                    <span>{vat.toFixed(2)} SAR</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>{isAr ? "الإجمالي" : "Total"}</span>
                    <span>{total.toFixed(2)} SAR</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("recipient")}>
                <ArrowLeft className="me-2 h-4 w-4" />
                {isAr ? "رجوع" : "Back"}
              </Button>
              <Button className="flex-1" onClick={() => createGift.mutate()} disabled={createGift.isPending}>
                {createGift.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}
                {isAr ? "إنشاء الهدية" : "Create Gift"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 text-center">
            <Card className="border-primary/20">
              <CardContent className="p-8 space-y-6">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mx-auto">
                  <Check className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-serif">{isAr ? "تم إنشاء الهدية! 🎁" : "Gift Created! 🎁"}</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isAr ? "شارك كود الهدية أو الرابط مع المستلم" : "Share the gift code or link with the recipient"}
                  </p>
                </div>

                <div className="bg-muted rounded-xl p-4 space-y-3">
                  <Label className="text-xs text-muted-foreground">{isAr ? "كود الهدية" : "Gift Code"}</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-lg font-mono font-bold tracking-widest text-primary bg-background rounded-xl p-3 border">
                      {giftCode}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={copyLink}>
                  <Share2 className="me-2 h-4 w-4" />
                  {isAr ? "نسخ رابط الاسترداد" : "Copy Redemption Link"}
                </Button>

                <Separator />

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/membership")}>
                    {isAr ? "خطط العضوية" : "Membership Plans"}
                  </Button>
                  <Button className="flex-1" onClick={() => { setStep("select"); setGiftCode(""); setMessage(""); setRecipientName(""); setRecipientEmail(""); }}>
                    <Gift className="me-2 h-4 w-4" />
                    {isAr ? "إهداء آخر" : "Gift Another"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
