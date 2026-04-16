import { ROUTES } from "@/config/routes";
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Crown, Star, Shield, Check, ArrowUpCircle, Calendar, AlertTriangle,
  RefreshCw, Clock, Loader2, Printer, RotateCw, Eye, EyeOff,
  Award, Gift, ChevronDown, HelpCircle, Headphones, Zap, Users,
  Globe, Newspaper, ShoppingBag, BarChart3, MessageSquare, BookOpen, Percent, Bell,
  Download, XCircle, Sparkles, TrendingUp,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import { BenefitsUsageTracker } from "./BenefitsUsageTracker";
import { MembershipHistory } from "./MembershipHistory";
import { SubscriptionDetailsCard } from "./SubscriptionDetailsCard";
import { MembershipInvoicesSection } from "./MembershipInvoicesSection";
import { useMembershipTab } from "./useMembershipTab";

const benefits = [
  { icon: Zap, label: "Priority Support" },
  { icon: Users, label: "Networking Events" },
  { icon: Globe, label: "Global Directory" },
  { icon: Newspaper, label: "Industry Insights" },
  { icon: ShoppingBag, label: "Exclusive Deals" },
  { icon: BarChart3, label: "Analytics Dashboard" },
  { icon: MessageSquare, label: "Direct Messaging" },
  { icon: BookOpen, label: "Learning Resources" },
  { icon: Percent, label: "Partner Discounts" },
  { icon: Headphones, label: "24/7 Concierge" },
];

const tiers = [
  {
    id: "basic", name: "Basic", icon: Star, price: "Free", yearlyPrice: null, savings: null, featured: false,
    features: ["Basic profile", "Community access", "Event listings", "Newsletter"],
  },
  {
    id: "professional", name: "Professional", icon: Crown, price: "19 SAR/mo", yearlyPrice: "190 SAR/yr", savings: "Save 17%", featured: true,
    features: ["Priority support", "Analytics dashboard", "Direct messaging", "Exclusive deals", "Learning resources", "Networking events"],
  },
  {
    id: "enterprise", name: "Enterprise", icon: Shield, price: "99 SAR/mo", yearlyPrice: "990 SAR/yr", savings: "Save 17%", featured: false,
    features: ["All Professional features", "24/7 concierge", "Custom branding", "API access", "Team management", "Dedicated account manager"],
  },
];

const faqs = [
  { q: "How do I upgrade my membership?", a: "Click on the desired plan above and follow the payment process. Your upgrade takes effect immediately." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel your membership at any time. You'll continue to have access until the end of your billing period." },
  { q: "What happens when my trial ends?", a: "Your account will revert to the Basic plan. You can upgrade anytime to keep your premium features." },
  { q: "Is there a refund policy?", a: "We offer a 14-day refund window from the date of purchase or renewal." },
];

const cancelReasons = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_using", label: "Not using enough" },
  { value: "missing_features", label: "Missing features" },
  { value: "switching", label: "Switching to competitor" },
  { value: "other", label: "Other" },
];

interface UnifiedMembershipTabProps {
  profile: any;
  userId: string;
  onMembershipChange?: () => void;
}

export const UnifiedMembershipTab = memo(function UnifiedMembershipTab({ profile, userId, onMembershipChange }: UnifiedMembershipTabProps) {
  const d = useMembershipTab(profile, userId, onMembershipChange);
  const { isAr } = d;

  if (d.cardLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      {/* ═══════════ TRIAL CONVERSION BANNER ═══════════ */}
      {d.isTrial && !d.isPro && (
        <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/5 via-background to-primary/5 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-bold">
                {isAr ? "🎉 استمتع بفترتك التجريبية المجانية!" : "🎉 Enjoying your free trial!"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? `متبقي ${d.cardDaysLeft || 0} يوم — قم بالترقية الآن واحصل على خصم 20% على السنة الأولى`
                  : `${d.cardDaysLeft || 0} days remaining — Upgrade now & get 20% off your first year`}
              </p>
            </div>
            <Button size="sm" className="shrink-0 gap-1.5" onClick={() => d.upgradeMutation.mutate("professional")} disabled={d.upgradeMutation.isPending}>
              {d.upgradeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
              {isAr ? "ترقية الآن" : "Upgrade Now"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ DIGITAL MEMBERSHIP CARD ═══════════ */}
      {d.card && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={d.toggleOrientation} className="gap-1.5">
              <RotateCw className="h-3.5 w-3.5" />
              {isAr ? (d.isVertical ? "أفقي" : "عمودي") : (d.isVertical ? "Horizontal" : "Vertical")}
            </Button>
            <Button variant="outline" size="sm" onClick={d.handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              {isAr ? "طباعة" : "Print"}
            </Button>
            <Button variant="outline" size="sm" onClick={d.handleSaveAsImage} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {isAr ? "حفظ" : "Save"}
            </Button>
            <div className="flex gap-1 ms-auto">
              <Button
                variant={d.cardTheme === "classic" ? "default" : "outline"}
                size="sm"
                onClick={() => d.setCardTheme("classic")}
                className="gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                {isAr ? "كلاسيكي" : "Classic"}
              </Button>
              <Button
                variant={d.cardTheme === "glassy" ? "default" : "outline"}
                size="sm"
                onClick={() => d.setCardTheme("glassy")}
                className="gap-1.5"
              >
                <Globe className="h-3.5 w-3.5" />
                {isAr ? "زجاجي" : "Glassy"}
              </Button>
            </div>
          </div>
          {d.isTrial && <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/20">{isAr ? "فترة تجريبية - 90 يوم" : "90-Day Free Trial"}</Badge>}

          {/* ──── CARD ──── */}
          <div
            ref={d.cardRef}
            className={`relative overflow-hidden rounded-2xl shadow-2xl mx-auto select-none ${d.isVertical ? "max-w-[340px]" : "w-full max-w-[580px]"}`}
            style={{
              ...(d.cardTheme === "classic"
                ? { background: "linear-gradient(155deg, #1a1a2e 0%, #16213e 40%, #0f3460 80%, #1a1a2e 100%)" }
                : { background: "linear-gradient(155deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 50%, rgba(245,240,228,0.8) 100%)", backdropFilter: "blur(20px)" }
              ),
              aspectRatio: d.isVertical ? "0.6306" : "1.586",
            }}
          >
            {/* Background patterns */}
            {d.cardTheme === "classic" ? (
              <>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 12px)" }} />
                <div className="absolute top-0 start-0 end-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent 2%, #c9a84c 20%, #f5e6a3 50%, #c9a84c 80%, transparent 98%)" }} />
                <div className="absolute bottom-0 start-0 end-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent 2%, #c9a84c 20%, #f5e6a3 50%, #c9a84c 80%, transparent 98%)" }} />
                <div className="absolute top-0 start-0 w-24 h-24 opacity-15" style={{ background: "radial-gradient(circle at 0 0, #c9a84c, transparent 70%)" }} />
                <div className="absolute bottom-0 end-0 w-32 h-32 opacity-10" style={{ background: "radial-gradient(circle at 100% 100%, #c9a84c, transparent 70%)" }} />
              </>
            ) : (
              <>
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, hsl(var(--primary)) 0.5px, transparent 0)", backgroundSize: "16px 16px" }} />
                <div className="absolute top-0 start-0 end-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)" }} />
                <div className="absolute bottom-0 start-0 end-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)" }} />
                <div className="absolute -top-20 -end-20 w-48 h-48 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)" }} />
                <div className="absolute -bottom-16 -start-16 w-40 h-40 rounded-full opacity-15" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.2), transparent 70%)" }} />
              </>
            )}

            <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
              {/* ── Top Row: Logo + Tier ── */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl overflow-hidden flex items-center justify-center"
                    style={d.cardTheme === "classic"
                      ? { background: "rgba(201,168,76,0.12)", border: "1.5px solid rgba(201,168,76,0.35)" }
                      : { background: "hsl(var(--primary) / 0.08)", border: "1.5px solid hsl(var(--primary) / 0.2)" }
                    }
                  >
                    <img loading="lazy" decoding="async" src="/altoha-logo.png" alt="Altoha" className="h-9 w-9 sm:h-11 sm:w-11 object-contain" style={d.cardTheme === "classic" ? { filter: "brightness(1.8)" } : {}} />
                  </div>
                  <div>
                    <p
                      className={`text-xs sm:text-sm font-extrabold ${isAr ? "tracking-normal" : "uppercase tracking-[0.2em]"}`}
                      style={{ color: d.cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }}
                    >
                      ALTOHA
                    </p>
                    <p
                      className={`text-xs sm:text-xs font-medium ${isAr ? "tracking-normal" : "uppercase tracking-[0.12em]"}`}
                      style={{ color: d.cardTheme === "classic" ? "rgba(201,168,76,0.6)" : "hsl(var(--muted-foreground) / 0.7)" }}
                    >
                      {isAr ? "بطاقة العضوية" : "MEMBERSHIP CARD"}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                  style={d.cardTheme === "classic"
                    ? { background: "linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.08))", border: "1px solid rgba(201,168,76,0.35)" }
                    : { background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.3)" }
                  }
                >
                  <d.TierIcon className="h-4 w-4" style={{ color: d.cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }} />
                  <span className={`text-xs sm:text-xs font-bold ${isAr ? "tracking-normal leading-none" : "tracking-wide uppercase"}`} style={{ color: d.cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }}>
                    {d.tierName}
                  </span>
                </div>
              </div>

              {/* ── Center: Avatar + Name + Details ── */}
              <div className={`flex-1 flex ${d.isVertical ? "flex-col items-center justify-center gap-3" : "items-center gap-5"} my-3`}>
                <div className="shrink-0 relative">
                  {profile?.avatar_url ? (
                    <img loading="lazy"
                      src={profile.avatar_url}
                      alt={profile.full_name || ""}
                      className={`${d.isVertical ? "h-[90px] w-[90px]" : "h-[82px] w-[82px] sm:h-[92px] sm:w-[92px]"} rounded-xl object-cover`}
                      style={d.cardTheme === "classic"
                        ? { border: "3px solid rgba(201,168,76,0.55)", boxShadow: "0 6px 20px rgba(0,0,0,0.45)" }
                        : { border: "3px solid hsl(var(--primary) / 0.35)", boxShadow: "0 6px 20px hsl(var(--primary) / 0.15)" }
                      }
                    />
                  ) : (
                    <div
                      className={`${d.isVertical ? "h-[90px] w-[90px]" : "h-[82px] w-[82px] sm:h-[92px] sm:w-[92px]"} rounded-xl flex items-center justify-center`}
                      style={d.cardTheme === "classic"
                        ? { background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))", border: "3px solid rgba(201,168,76,0.4)" }
                        : { background: "hsl(var(--primary) / 0.08)", border: "3px solid hsl(var(--primary) / 0.2)" }
                      }
                    >
                      <span className="text-4xl font-bold" style={{ color: d.cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }}>{(profile?.full_name || "?")[0]}</span>
                    </div>
                  )}
                </div>

                <div className={`flex-1 min-w-0 ${d.isVertical ? "text-center" : isAr ? "text-end" : "text-start"}`}>
                  <p
                    className={`font-bold leading-tight break-words ${d.isVertical ? "text-center" : ""} ${isAr ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}
                    style={{ color: d.cardTheme === "classic" ? "#f0f0f0" : "hsl(var(--foreground))" }}
                    dir={isAr ? "rtl" : "ltr"}
                  >
                    {isAr ? (profile?.full_name_ar || profile?.full_name || "—") : (profile?.full_name || "—")}
                  </p>
                  {((isAr && profile?.full_name) || (!isAr && profile?.full_name_ar)) && (
                    <p
                      className="text-xs mt-1 break-words leading-snug"
                      style={{ color: d.cardTheme === "classic" ? "rgba(255,255,255,0.55)" : "hsl(var(--muted-foreground) / 0.8)" }}
                      dir={!isAr ? "rtl" : "ltr"}
                    >
                      {isAr ? profile.full_name : profile.full_name_ar}
                    </p>
                  )}
                  <div className="mt-3">
                    <p
                      className={`text-xs font-medium ${isAr ? "tracking-normal" : "uppercase tracking-[0.18em]"}`}
                      style={{ color: d.cardTheme === "classic" ? "rgba(201,168,76,0.6)" : "hsl(var(--muted-foreground) / 0.65)" }}
                    >
                      {isAr ? "رقم العضوية" : "MEMBERSHIP NO."}
                    </p>
                    <p className="text-base sm:text-lg font-mono font-bold tracking-[0.15em]" style={{ color: d.cardTheme === "classic" ? "#d4af5a" : "hsl(var(--primary))" }}>{d.card!.membership_number}</p>
                  </div>
                  <div className={`flex ${d.isVertical ? "justify-center" : ""} gap-5 sm:gap-7 mt-2`}>
                    <div>
                      <p
                        className={`text-xs font-medium ${isAr ? "tracking-normal" : "uppercase tracking-[0.12em]"}`}
                        style={{ color: d.cardTheme === "classic" ? "rgba(255,255,255,0.4)" : "hsl(var(--muted-foreground) / 0.55)" }}
                      >
                        {isAr ? "الانضمام" : "ISSUED"}
                      </p>
                      <p className="text-xs sm:text-xs font-semibold" style={{ color: d.cardTheme === "classic" ? "rgba(255,255,255,0.85)" : "hsl(var(--foreground) / 0.75)" }}>{format(new Date(d.card!.issued_at), "MM/yy")}</p>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-medium ${isAr ? "tracking-normal" : "uppercase tracking-[0.12em]"}`}
                        style={{ color: d.cardTheme === "classic" ? "rgba(255,255,255,0.4)" : "hsl(var(--muted-foreground) / 0.55)" }}
                      >
                        {isAr ? "الانتهاء" : "EXPIRES"}
                      </p>
                      <p className="text-xs sm:text-xs font-semibold" style={{ color: d.isCardExpired ? "#f87171" : d.showExpiryWarning ? "#fbbf24" : d.cardTheme === "classic" ? "rgba(255,255,255,0.85)" : "hsl(var(--foreground) / 0.75)" }}>
                        {d.cardExpiresDate ? format(d.cardExpiresDate, "dd/MM/yyyy") : "—"}
                      </p>
                      {d.cardDaysLeft !== null && d.cardDaysLeft <= 30 && !d.isCardExpired && (
                        <p className="text-xs font-bold mt-0.5" style={{ color: d.cardDaysLeft <= 14 ? "#f87171" : "#fbbf24" }}>
                          {d.cardDaysLeft} {isAr ? "يوم متبقي" : "days left"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bottom: Verification Code + QR ── */}
              <div className="space-y-2.5">
                <div className="h-px" style={{ background: d.cardTheme === "classic" ? "linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)" : "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }} />
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium me-1 ${isAr ? "tracking-normal" : "uppercase tracking-[0.15em]"}`}
                        style={{ color: d.cardTheme === "classic" ? "rgba(201,168,76,0.55)" : "hsl(var(--primary) / 0.55)" }}
                      >
                        {isAr ? "رمز التحقق" : "VERIFY CODE"}
                      </span>
                      {d.verificationCode.split("").map((ch, i) => (
                        <span
                          key={i}
                          className="inline-flex h-7 w-6 sm:h-8 sm:w-7 items-center justify-center rounded font-mono text-sm sm:text-base font-bold"
                          style={d.cardTheme === "classic"
                            ? { background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#d4af5a" }
                            : { background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.25)", color: "hsl(var(--primary))" }
                          }
                        >
                          {d.showCode ? ch : "•"}
                        </span>
                      ))}
                      <button onClick={() => d.setShowCode(!d.showCode)} className="ms-1 p-0.5 transition-colors" style={{ color: d.cardTheme === "classic" ? "rgba(255,255,255,0.45)" : "hsl(var(--muted-foreground) / 0.55)" }}>
                        {d.showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs tracking-[0.15em]" style={{ color: d.cardTheme === "classic" ? "rgba(255,255,255,0.45)" : "hsl(var(--muted-foreground) / 0.55)" }}>{profile?.account_number || d.card!.membership_number}</span>
                      <span
                        className={`ms-auto text-xs font-bold rounded-full px-3 py-1 whitespace-nowrap ${isAr ? "tracking-normal" : "uppercase tracking-wider"}`}
                        style={d.isCardExpired
                          ? { color: "#f87171", background: "rgba(248,113,113,0.15)" }
: d.card!.card_status === "suspended"
                          ? { color: "#fbbf24", background: "rgba(251,191,36,0.15)" }
                          : { color: d.cardTheme === "classic" ? "#6ee7b7" : "hsl(142 71% 45%)", background: d.cardTheme === "classic" ? "rgba(52,211,153,0.15)" : "hsl(142 71% 45% / 0.12)" }
                        }
                      >
                        {d.isCardExpired ? (isAr ? "منتهية" : "EXPIRED") : d.card!.card_status === "suspended" ? (isAr ? "معلقة" : "SUSPENDED") : (isAr ? "نشطة" : "ACTIVE")}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-center">
                    <div
                      className="rounded-xl p-2 sm:p-2.5"
                      style={d.cardTheme === "classic"
                        ? { background: "rgba(255,255,255,0.95)", boxShadow: "0 3px 14px rgba(0,0,0,0.35)" }
                        : { background: "hsl(var(--background))", border: "1.5px solid hsl(var(--border))", boxShadow: "0 3px 14px hsl(var(--primary) / 0.12)" }
                      }
                    >
                      <QRCodeSVG
                        value={`https://altoha.com/verify?code=${profile?.account_number || d.card!.membership_number}`}
                        size={d.isVertical ? 60 : 58}
                        level="M"
                        includeMargin={false}
                        fgColor={d.cardTheme === "classic" ? "#1a1a2e" : "hsl(25, 30%, 12%)"}
                        bgColor="transparent"
                      />
                    </div>
                    <span
                      className={`text-xs font-medium mt-1.5 ${isAr ? "tracking-normal" : "tracking-widest uppercase"}`}
                      style={{ color: d.cardTheme === "classic" ? "rgba(201,168,76,0.55)" : "hsl(var(--primary) / 0.55)" }}
                    >
                      {isAr ? "امسح للتحقق" : "SCAN TO VERIFY"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EXPIRY WARNING / RENEWAL INCENTIVE ═══════════ */}
      {(d.isCardExpired || d.showExpiryWarning) && (
        <Card className={`border-2 ${d.isCardExpired ? "border-destructive/50 bg-destructive/5" : "border-chart-4/50 bg-chart-4/5"}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${d.isCardExpired ? "bg-destructive/15" : "bg-chart-4/15"}`}>
              {d.isCardExpired ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Bell className="h-5 w-5 text-chart-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {d.isCardExpired
                  ? (isAr ? "انتهت صلاحية عضويتك" : "Your membership has expired")
                  : (isAr ? `تنتهي عضويتك خلال ${d.cardDaysLeft} يوم` : `Your membership expires in ${d.cardDaysLeft} days`)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {d.isCardExpired
                  ? (isAr ? "سيتم تخفيض مستوى عضويتك إلى أساسي. جدد الآن للحفاظ على مزاياك!" : "Your tier will drop to Basic. Renew now to keep your benefits!")
                  : (isAr ? "جدد الآن واحصل على خصم 10% على السنة القادمة!" : "Renew now and get 10% off your next year!")}
              </p>
            </div>
            <Button size="sm" className="shrink-0 gap-1.5" onClick={() => d.upgradeMutation.mutate((d.currentTier || "professional") as any)} disabled={d.upgradeMutation.isPending}>
              {d.upgradeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {isAr ? "تجديد" : "Renew"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ MEMBERSHIP STATUS ═══════════ */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/5 p-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <d.TierIcon className="h-5 w-5 text-primary" />
                {isAr ? "حالة العضوية" : "Membership Status"}
              </CardTitle>
              <Badge className={d.currentTier === "professional" ? "bg-primary/20 text-primary" : d.currentTier === "enterprise" ? "bg-chart-2/20 text-chart-2" : "bg-muted text-muted-foreground"}>
                {d.tierName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-3 text-center">
                <Calendar className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                <Badge variant={d.isExpired ? "destructive" : "default"} className="mt-1">
                  {d.isExpired ? (isAr ? "منتهية" : "Expired") : (isAr ? "نشطة" : "Active")}
                </Badge>
              </div>
              <div className="rounded-xl border bg-card p-3 text-center">
                <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "تنتهي في" : "Expires"}</p>
                <p className="mt-1 text-sm font-semibold">{d.expiresAt ? format(new Date(d.expiresAt), "d MMM yyyy", { locale: isAr ? ar : undefined }) : (isAr ? "غير محدد" : "N/A")}</p>
              </div>
              <div className="rounded-xl border bg-card p-3 text-center">
                <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "أيام متبقية" : "Days Left"}</p>
                <p className={`mt-1 text-sm font-bold ${d.daysLeft !== null && d.daysLeft < 30 ? "text-destructive" : ""}`}>{d.daysLeft !== null ? d.daysLeft : "∞"}</p>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="rounded-xl border p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">{isAr ? "اكتمال الملف الشخصي" : "Profile Completion"}</p>
                <span className="text-xs font-bold text-primary">{d.completionPercent}%</span>
              </div>
              <Progress value={d.completionPercent} className="h-2" />
            </div>

            {/* Verification */}
            <div className="rounded-xl border p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isAr ? "حالة التوثيق" : "Verification Status"}</p>
                <p className="text-xs text-muted-foreground">
                  {d.verificationStatus?.is_verified ? (isAr ? "حسابك موثق ✓" : "Your account is verified ✓") : (isAr ? "حسابك غير موثق" : "Not verified")}
                </p>
              </div>
              {!d.verificationStatus?.is_verified && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.verification}>{isAr ? "توثيق" : "Verify"}</Link>
                </Button>
              )}
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2 flex-wrap">
              {d.isExpired && (
                <Button className="gap-2" onClick={() => d.upgradeMutation.mutate((d.currentTier || "basic") as "basic" | "professional" | "enterprise")} disabled={d.upgradeMutation.isPending}>
                  {d.upgradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isAr ? "تجديد العضوية" : "Renew Membership"}
                </Button>
              )}
              {d.isPro && !d.isExpired && (
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive ms-auto" onClick={() => d.setShowCancelDialog(true)}>
                  <XCircle className="h-3.5 w-3.5" />
                  {isAr ? "إلغاء العضوية" : "Cancel Membership"}
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* ═══════════ PRO BENEFITS (if pro) ═══════════ */}
      {d.isPro && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-primary" />
              {isAr ? "مزايا عضويتك" : "Your Membership Benefits"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {benefits.map((b) => (
                <div key={b.label} className="flex items-center gap-2.5 rounded-xl border p-2.5 bg-card">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${d.tierBg}`}>
                    <b.icon className={`h-3.5 w-3.5 ${d.tierColor}`} />
                  </div>
                  <span className="text-xs font-medium">{b.label}</span>
                  <Badge variant="secondary" className="ms-auto text-xs px-1.5 py-0">{isAr ? "مفعّل" : "Active"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ SUBSCRIPTION DETAILS ═══════════ */}
      <SubscriptionDetailsCard userId={userId} profile={profile} />

      {/* ═══════════ INVOICES & PAYMENTS ═══════════ */}
      <MembershipInvoicesSection userId={userId} />
      <div>
        <h3 className="mb-4 font-semibold">{isAr ? "الخطط المتاحة" : "Available Plans"}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => {
            const isCurrentTier = tier.id === d.currentTier;
            return (
              <Card key={tier.id} className={`relative transition-all ${tier.featured ? "ring-2 ring-primary shadow-lg" : ""} ${isCurrentTier ? "bg-primary/5" : ""}`}>
                {tier.featured && (
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                    <Badge className="bg-primary"><Star className="me-1 h-3 w-3" />{isAr ? "الأكثر شعبية" : "Popular"}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <tier.icon className={`mx-auto h-8 w-8 mb-2 ${tier.id === "enterprise" ? "text-chart-2" : "text-primary"}`} />
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <p className="text-2xl font-bold">{tier.price}</p>
                  {tier.yearlyPrice && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground">{tier.yearlyPrice}</p>
                      <Badge variant="secondary" className="mt-1 text-xs bg-chart-3/15 text-chart-3 border-chart-3/20">
                        {tier.savings}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>
                    ))}
                  </ul>
                  {isCurrentTier ? (
                    <Button variant="outline" disabled className="w-full">{isAr ? "خطتك الحالية" : "Current Plan"}</Button>
                  ) : (
                    <Button
                      variant={tier.featured ? "default" : "outline"}
                      className="w-full gap-1.5"
                      disabled={d.upgradeMutation.isPending}
                      onClick={() => d.upgradeMutation.mutate(tier.id as "basic" | "professional" | "enterprise")}
                    >
                      {d.upgradeMutation.isPending && d.upgradeMutation.variables === tier.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
                      {isAr ? (tier.id === "basic" ? "تخفيض" : "ترقية") : (tier.id === "basic" ? "Downgrade" : "Upgrade")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ═══════════ HISTORY ═══════════ */}
      {d.history && d.history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "سجل العضوية" : "Membership History"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {d.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                  <div>
                    <span className="font-medium">{h.previous_tier || "—"}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium text-primary">{h.new_tier}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(h.created_at), "d MMM yyyy", { locale: isAr ? ar : undefined })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ FAQ ═══════════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-primary" />
            {isAr ? "الأسئلة الشائعة" : "FAQ"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, i) => (
            <Collapsible key={i}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border p-3 text-start text-sm font-medium hover:bg-accent/30 transition-colors group">
                {faq.q}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3 pt-1 text-sm text-muted-foreground">{faq.a}</CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* ═══════════ TERMS ═══════════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "شروط العضوية" : "Membership Terms"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• {isAr ? "يتم تجديد العضوية تلقائياً ما لم يتم إلغاؤها" : "Memberships auto-renew unless cancelled"}</p>
          <p>• {isAr ? "يمكن الإلغاء في أي وقت مع إمكانية الاسترداد خلال 14 يوم" : "Cancel anytime with 14-day refund window"}</p>
          <p>• {isAr ? "الترقية تبدأ فوراً والتخفيض يبدأ في الدورة التالية" : "Upgrades take effect immediately; downgrades at next cycle"}</p>
          <p>• {isAr ? "العضوية المؤسسية تتطلب حساب شركة موثق" : "Enterprise requires verified company account"}</p>
          <p>• {isAr ? "فترة تجريبية مجانية 90 يوم عند التسجيل" : "90-day free trial upon registration"}</p>
        </CardContent>
      </Card>

      {/* ═══════════ CANCEL DIALOG ═══════════ */}
      <Dialog open={d.showCancelDialog} onOpenChange={d.setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إلغاء العضوية" : "Cancel Membership"}</DialogTitle>
            <DialogDescription>
              {isAr ? "نأسف لرحيلك! أخبرنا بسبب الإلغاء حتى نتمكن من التحسين." : "We're sorry to see you go! Let us know why so we can improve."}
            </DialogDescription>
          </DialogHeader>

          {/* Retention offer */}
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <p className="text-sm font-bold">{isAr ? "قبل أن تذهب..." : "Before you go..."}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "ماذا لو قدمنا لك خصم 50% على الأشهر الثلاثة القادمة؟ ستحافظ على جميع مزاياك الحالية."
                : "How about 50% off for the next 3 months? You'll keep all your current benefits."}
            </p>
          </div>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">{isAr ? "سبب الإلغاء" : "Reason for cancelling"}</label>
              <Select value={d.cancelReasonType} onValueChange={d.setCancelReasonType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cancelReasons.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {d.cancelReasonType === "other" && (
              <div>
                <label className="text-sm font-medium">{isAr ? "وضح السبب" : "Please specify"}</label>
                <Textarea value={d.cancelReason} onChange={(e) => d.setCancelReason(e.target.value)} placeholder={isAr ? "أخبرنا المزيد..." : "Tell us more..."} className="mt-1" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">{isAr ? "ملاحظات إضافية (اختياري)" : "Additional feedback (optional)"}</label>
              <Textarea value={d.cancelFeedback} onChange={(e) => d.setCancelFeedback(e.target.value)} placeholder={isAr ? "كيف يمكننا التحسين؟" : "How can we improve?"} className="mt-1" />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => d.setShowCancelDialog(false)} className="sm:flex-1">
              {isAr ? "إبقاء العضوية" : "Keep Membership"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => d.cancelMutation.mutate()}
              disabled={d.cancelMutation.isPending || (d.cancelReasonType === "other" && !d.cancelReason.trim())}
              className="sm:flex-1 gap-1.5"
            >
              {d.cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {isAr ? "تأكيد الإلغاء" : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Benefits Usage Tracker */}
      <BenefitsUsageTracker />

      {/* Membership History */}
      <MembershipHistory />
    </div>
  );
});

