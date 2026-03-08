import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Send, Inbox, ArrowLeft, Copy, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { en: string; ar: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { en: "Pending", ar: "في الانتظار", variant: "secondary" },
  redeemed: { en: "Redeemed", ar: "تم الاسترداد", variant: "default" },
  expired: { en: "Expired", ar: "منتهي", variant: "destructive" },
  cancelled: { en: "Cancelled", ar: "ملغي", variant: "outline" },
};

const TIER_NAMES: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "الأساسي" },
  professional: { en: "Professional", ar: "الاحترافي" },
  enterprise: { en: "Enterprise", ar: "المؤسسي" },
};

function GiftCard({ gift, type, isAr }: { gift: any; type: "sent" | "received"; isAr: boolean }) {
  const status = STATUS_MAP[gift.status] || STATUS_MAP.pending;
  const tierName = TIER_NAMES[gift.tier]?.[isAr ? "ar" : "en"] || gift.tier;

  const copyCode = () => {
    navigator.clipboard.writeText(gift.gift_code);
    toast.success(isAr ? "تم نسخ الكود" : "Code copied!");
  };

  const copyRedeemLink = () => {
    const link = `${window.location.origin}/membership/redeem?code=${gift.gift_code}`;
    navigator.clipboard.writeText(link);
    toast.success(isAr ? "تم نسخ رابط الاسترداد" : "Redeem link copied!");
  };

  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              gift.status === "redeemed" ? "bg-primary/10" : "bg-muted"
            }`}>
              {gift.status === "redeemed" ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : gift.status === "pending" ? (
                <Clock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize text-xs">{tierName}</Badge>
                <Badge variant={status.variant} className="text-[10px]">
                  {isAr ? status.ar : status.en}
                </Badge>
              </div>
              {type === "sent" && gift.recipient_email && (
                <p className="text-sm text-muted-foreground truncate">
                  {isAr ? "إلى:" : "To:"} {gift.recipient_email}
                </p>
              )}
              {gift.recipient_name && (
                <p className="text-sm font-medium truncate">{gift.recipient_name}</p>
              )}
              {gift.personal_message && (
                <p className="text-xs text-muted-foreground italic line-clamp-2">"{gift.personal_message}"</p>
              )}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{new Date(gift.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}</span>
                {gift.amount > 0 && (
                  <span className="font-medium">{gift.amount} {isAr ? "ر.س" : "SAR"}</span>
                )}
                {gift.duration_months && (
                  <span>{gift.duration_months} {isAr ? "شهر" : "mo"}</span>
                )}
              </div>
              {gift.redeemed_at && (
                <p className="text-[11px] text-primary">
                  {isAr ? "تم الاسترداد:" : "Redeemed:"} {new Date(gift.redeemed_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                </p>
              )}
            </div>
          </div>

          {type === "sent" && gift.status === "pending" && (
            <div className="flex flex-col gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyCode} title={isAr ? "نسخ الكود" : "Copy code"}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyRedeemLink} title={isAr ? "نسخ الرابط" : "Copy link"}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {type === "sent" && gift.status === "pending" && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-2">
              <Gift className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono text-[11px] select-all">{gift.gift_code}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MembershipGiftsHistory() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: sentGifts = [], isLoading: loadingSent } = useQuery({
    queryKey: ["membership-gifts-sent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_gifts")
        .select("id, sender_id, recipient_email, recipient_id, recipient_name, tier, billing_cycle, duration_months, amount, currency, gift_code, message, message_ar, status, payment_status, payment_reference, purchased_at, expires_at, redeemed_at, redeemed_by, created_at, updated_at")
        .eq("sender_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: receivedGifts = [], isLoading: loadingReceived } = useQuery({
    queryKey: ["membership-gifts-received", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_gifts")
        .select("id, sender_id, recipient_email, recipient_id, recipient_name, tier, billing_cycle, duration_months, amount, currency, gift_code, message, message_ar, status, payment_status, payment_reference, purchased_at, expires_at, redeemed_at, redeemed_by, created_at, updated_at")
        .eq("recipient_email", user!.email)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const sentPending = sentGifts.filter((g: any) => g.status === "pending").length;
  const sentRedeemed = sentGifts.filter((g: any) => g.status === "redeemed").length;

  return (
    <div className="container max-w-3xl py-6 sm:py-10 space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/membership">
            <Button variant="ghost" size="icon">
              <ArrowLeft className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              {isAr ? "هدايا العضوية" : "Membership Gifts"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? "تتبع الهدايا المرسلة والمستلمة" : "Track sent and received gifts"}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/membership/gift")} className="gap-2">
          <Gift className="h-4 w-4" />
          {isAr ? "إرسال هدية" : "Send Gift"}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{sentGifts.length}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "مرسلة" : "Sent"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{sentRedeemed}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "تم استردادها" : "Redeemed"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{receivedGifts.length}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "مستلمة" : "Received"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sent" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="sent" className="flex-1 gap-1.5">
            <Send className="h-4 w-4" />
            {isAr ? "مرسلة" : "Sent"} ({sentGifts.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="flex-1 gap-1.5">
            <Inbox className="h-4 w-4" />
            {isAr ? "مستلمة" : "Received"} ({receivedGifts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="space-y-3">
          {loadingSent ? (
            <p className="text-center text-muted-foreground py-12">{isAr ? "جاري التحميل..." : "Loading..."}</p>
          ) : sentGifts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <Send className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">{isAr ? "لم ترسل أي هدايا بعد" : "No gifts sent yet"}</p>
                <Button variant="outline" onClick={() => navigate("/membership/gift")}>
                  {isAr ? "إرسال هدية الآن" : "Send a Gift Now"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            sentGifts.map((gift: any) => <GiftCard key={gift.id} gift={gift} type="sent" isAr={isAr} />)
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-3">
          {loadingReceived ? (
            <p className="text-center text-muted-foreground py-12">{isAr ? "جاري التحميل..." : "Loading..."}</p>
          ) : receivedGifts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">{isAr ? "لم تستلم أي هدايا بعد" : "No gifts received yet"}</p>
              </CardContent>
            </Card>
          ) : (
            receivedGifts.map((gift: any) => <GiftCard key={gift.id} gift={gift} type="received" isAr={isAr} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
