import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Star, Shield, Printer, RotateCw, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface MembershipCardProps {
  profile: any;
  userId: string;
}

export function MembershipCard({ profile, userId }: MembershipCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const [showCode, setShowCode] = useState(false);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");

  const { data: card, isLoading } = useQuery({
    queryKey: ["membership-card", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_cards")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("membership_cards")
        .insert([{
          user_id: userId,
          membership_number: "",
          verification_code: "",
          card_orientation: orientation,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-card", userId] });
      toast({ title: isAr ? "تم إنشاء بطاقة العضوية!" : "Membership card created!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const toggleOrientation = async () => {
    const newOr = orientation === "horizontal" ? "vertical" : "horizontal";
    setOrientation(newOr);
    if (card) {
      await supabase.from("membership_cards").update({ card_orientation: newOr }).eq("id", card.id);
    }
  };

  const handlePrint = () => {
    if (!cardRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? "rtl" : "ltr"}">
      <head><title>${isAr ? "بطاقة العضوية" : "Membership Card"}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; font-family: system-ui, sans-serif; }
        @media print { body { background: white; } }
      </style></head>
      <body>${cardRef.current.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (!card) {
    return (
      <Card className="border-dashed border-2 border-primary/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Crown className="h-12 w-12 text-primary/40 mb-4" />
          <h3 className="text-lg font-bold mb-2">{isAr ? "بطاقة العضوية الرقمية" : "Digital Membership Card"}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {isAr ? "احصل على بطاقة عضوية رقمية احترافية مع رقم عضوية فريد ورمز تحقق مشفر" : "Get a professional digital membership card with a unique membership number and encrypted verification code"}
          </p>
          <Button onClick={() => createCardMutation.mutate()} disabled={createCardMutation.isPending} className="gap-2">
            <Crown className="h-4 w-4" />
            {isAr ? "إنشاء بطاقة العضوية" : "Generate Membership Card"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tier = profile?.membership_tier || "basic";
  const TierIcon = tier === "enterprise" ? Shield : tier === "professional" ? Crown : Star;
  const tierName = tier === "enterprise" ? (isAr ? "مؤسسي" : "Enterprise") : tier === "professional" ? (isAr ? "احترافي" : "Professional") : (isAr ? "أساسي" : "Basic");
  const genderLabel = profile?.gender === "male" ? (isAr ? "ذكر" : "Male") : profile?.gender === "female" ? (isAr ? "أنثى" : "Female") : "";
  const isTrial = card.is_trial && card.trial_ends_at && new Date(card.trial_ends_at) > new Date();
  const isExpired = card.expires_at && new Date(card.expires_at) < new Date();
  const isVertical = orientation === "vertical";

  const maskedCode = card.verification_code
    ? card.verification_code.substring(0, 4) + "••••••••" + card.verification_code.substring(card.verification_code.length - 4)
    : "";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={toggleOrientation} className="gap-1.5">
          <RotateCw className="h-3.5 w-3.5" />
          {isAr ? (isVertical ? "أفقي" : "عمودي") : (isVertical ? "Horizontal" : "Vertical")}
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
          <Printer className="h-3.5 w-3.5" />
          {isAr ? "طباعة" : "Print"}
        </Button>
        {isTrial && (
          <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/20">
            {isAr ? "فترة تجريبية - 90 يوم" : "90-Day Free Trial"}
          </Badge>
        )}
        {isExpired && (
          <Badge variant="destructive">{isAr ? "منتهية" : "Expired"}</Badge>
        )}
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className={`relative overflow-hidden rounded-2xl shadow-2xl ${
          isVertical ? "max-w-[320px] mx-auto" : "max-w-[560px]"
        }`}
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
          aspectRatio: isVertical ? "9/16" : "16/9",
        }}
      >
        {/* Gold accent lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10" style={{ background: "linear-gradient(180deg, #d4af37 0%, transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />
          <div className="absolute top-0 left-0 w-full h-px" style={{ background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />
        </div>

        <div className={`relative h-full p-5 flex ${isVertical ? "flex-col justify-between" : "flex-col justify-between"}`}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <img src="/altohaa-logo.png" alt="Altohaa" className="h-8 w-8 rounded-lg object-contain" style={{ filter: "brightness(1.5)" }} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: "#d4af37" }}>
                  {isAr ? "بطاقة العضوية" : "MEMBERSHIP CARD"}
                </p>
                <p className="text-[8px] text-gray-400">{isAr ? "منصة ألطهاء" : "Altohaa Platform"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(212, 175, 55, 0.15)", border: "1px solid rgba(212, 175, 55, 0.3)" }}>
              <TierIcon className="h-3.5 w-3.5" style={{ color: "#d4af37" }} />
              <span className="text-[10px] font-semibold" style={{ color: "#d4af37" }}>{tierName}</span>
            </div>
          </div>

          {/* Body */}
          <div className={isVertical ? "flex-1 flex flex-col justify-center space-y-4" : "space-y-3"}>
            {/* Name */}
            <div>
              <p className="text-white font-bold text-lg leading-tight">
                {isAr ? (profile?.full_name_ar || profile?.full_name || "—") : (profile?.full_name || "—")}
              </p>
              {isAr && profile?.full_name && (
                <p className="text-gray-400 text-xs mt-0.5">{profile.full_name}</p>
              )}
              {!isAr && profile?.full_name_ar && (
                <p className="text-gray-400 text-xs mt-0.5" dir="rtl">{profile.full_name_ar}</p>
              )}
            </div>

            {/* Membership Number */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">
                {isAr ? "رقم العضوية" : "MEMBERSHIP NO."}
              </p>
              <p className="text-sm font-mono font-bold tracking-wider" style={{ color: "#d4af37" }}>
                {card.membership_number}
              </p>
            </div>

            {/* Details Grid */}
            <div className={`grid ${isVertical ? "grid-cols-2" : "grid-cols-4"} gap-2`}>
              <div>
                <p className="text-[8px] uppercase tracking-wider text-gray-500">{isAr ? "الانضمام" : "JOINED"}</p>
                <p className="text-[11px] text-gray-300 font-medium">
                  {format(new Date(card.issued_at), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-wider text-gray-500">{isAr ? "الانتهاء" : "EXPIRES"}</p>
                <p className="text-[11px] text-gray-300 font-medium">
                  {format(new Date(card.expires_at), "dd/MM/yyyy")}
                </p>
              </div>
              {genderLabel && (
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-gray-500">{isAr ? "الجنس" : "GENDER"}</p>
                  <p className="text-[11px] text-gray-300 font-medium">{genderLabel}</p>
                </div>
              )}
              <div>
                <p className="text-[8px] uppercase tracking-wider text-gray-500">{isAr ? "رقم الحساب" : "ACCOUNT"}</p>
                <p className="text-[11px] text-gray-300 font-medium">{profile?.account_number || "—"}</p>
              </div>
            </div>
          </div>

          {/* Footer - Verification Code */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-wider text-gray-500 mb-0.5">
                {isAr ? "رمز التحقق" : "VERIFICATION CODE"}
              </p>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-mono text-gray-400">
                  {showCode ? card.verification_code : maskedCode}
                </p>
                <button onClick={() => setShowCode(!showCode)} className="text-gray-500 hover:text-gray-300 transition-colors">
                  {showCode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                card.card_status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                card.card_status === "suspended" ? "bg-amber-500/20 text-amber-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                {card.card_status === "active" ? (isAr ? "نشطة" : "ACTIVE") :
                 card.card_status === "suspended" ? (isAr ? "معلقة" : "SUSPENDED") :
                 (isAr ? "منتهية" : "EXPIRED")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
