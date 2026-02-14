import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSendInvitation } from "@/hooks/useReferral";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy, Mail, MessageCircle, Share2, Send, Loader2, QrCode, Smartphone, Link2
} from "lucide-react";

interface ReferralShareSheetProps {
  referralLink: string;
  referralCode: string;
  referralCodeId: string;
  compact?: boolean;
}

export function ReferralShareSheet({ referralLink, referralCode, referralCodeId, compact }: ReferralShareSheetProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const sendInvitation = useSendInvitation();
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [showQR, setShowQR] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
  };

  const getMessage = () =>
    isAr
      ? `انضم إلى منصة ألطهاة! سجل الآن واحصل على نقاط إضافية: ${referralLink}`
      : `Join Altohaa! Sign up now and earn bonus points: ${referralLink}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(getMessage())}`, "_blank");
    sendInvitation.mutate({ channel: "whatsapp", referralCodeId });
  };

  const shareTwitter = () => {
    const text = isAr ? "انضم إلى ألطهاة - المنصة الأولى للطهاة المحترفين" : "Join Altohaa - The #1 platform for professional chefs";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, "_blank");
    sendInvitation.mutate({ channel: "twitter", referralCodeId });
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
    sendInvitation.mutate({ channel: "facebook", referralCodeId });
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, "_blank");
    sendInvitation.mutate({ channel: "linkedin", referralCodeId });
  };

  const shareSMS = () => {
    const body = encodeURIComponent(getMessage());
    window.open(`sms:?body=${body}`, "_self");
    sendInvitation.mutate({ channel: "sms", referralCodeId });
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(getMessage())}`, "_blank");
    sendInvitation.mutate({ channel: "telegram", referralCodeId });
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({
        title: isAr ? "انضم إلى ألطهاة" : "Join Altohaa",
        text: getMessage(),
        url: referralLink,
      });
      sendInvitation.mutate({ channel: "native_share", referralCodeId });
    } else {
      copyLink();
    }
  };

  const sendEmailInvite = () => {
    if (!inviteEmail) return;
    sendInvitation.mutate(
      { email: inviteEmail, channel: "email", referralCodeId },
      { onSuccess: () => setInviteEmail("") }
    );
  };

  const sendSMSInvite = () => {
    if (!invitePhone) return;
    sendInvitation.mutate(
      { phone: invitePhone, channel: "sms", referralCodeId },
      { onSuccess: () => setInvitePhone("") }
    );
  };

  const channels = [
    { id: "whatsapp", icon: MessageCircle, label: "WhatsApp", color: "text-chart-2", onClick: shareWhatsApp },
    { id: "telegram", icon: Send, label: "Telegram", color: "text-chart-4", onClick: shareTelegram },
    { id: "sms", icon: Smartphone, label: "SMS", color: "text-chart-3", onClick: shareSMS },
    {
      id: "twitter", label: "X",
      customIcon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
      onClick: shareTwitter,
    },
    {
      id: "facebook", label: "Facebook",
      customIcon: <svg className="h-5 w-5 text-chart-1" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
      onClick: shareFacebook,
    },
    {
      id: "linkedin", label: "LinkedIn",
      customIcon: <svg className="h-5 w-5 text-chart-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
      onClick: shareLinkedIn,
    },
    { id: "native", icon: Share2, label: isAr ? "المزيد" : "More", color: "text-primary", onClick: shareNative },
  ];

  return (
    <div className="space-y-4">
      {/* Referral Link */}
      <div className="flex gap-2">
        <Input value={referralLink} readOnly className="font-mono text-sm" dir="ltr" />
        <Button onClick={copyLink} variant="outline" className="shrink-0 gap-1.5">
          <Copy className="h-4 w-4" />
          {isAr ? "نسخ" : "Copy"}
        </Button>
      </div>

      {/* Share Channels */}
      <div className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-7"}`}>
        {channels.map((ch) => (
          <Button
            key={ch.id}
            onClick={ch.onClick}
            variant="outline"
            className={`gap-1.5 ${compact ? "h-10 text-xs" : "h-12"}`}
            size={compact ? "sm" : "default"}
          >
            {ch.customIcon || (ch.icon && <ch.icon className={`h-4 w-4 ${ch.color || ""}`} />)}
            {!compact && <span className="hidden sm:inline">{ch.label}</span>}
          </Button>
        ))}
      </div>

      {/* QR Code */}
      <div className="flex gap-2">
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 flex-1">
              <QrCode className="h-4 w-4" />
              {isAr ? "رمز QR" : "QR Code"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-center">{isAr ? "امسح للتسجيل" : "Scan to Sign Up"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-2xl border-4 border-primary/20 p-4 bg-white">
                <QRCodeSVG value={referralLink} size={200} level="H" />
              </div>
              <Badge variant="outline" className="font-mono text-sm px-4 py-1.5">
                {referralCode}
              </Badge>
              <p className="text-xs text-muted-foreground text-center">
                {isAr ? "شارك هذا الرمز ليتمكن الآخرون من التسجيل مباشرة" : "Share this QR code for instant sign-up"}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Email & SMS Invites */}
      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="text-sm"
            />
            <Button onClick={sendEmailInvite} disabled={!inviteEmail || sendInvitation.isPending} size="sm" className="shrink-0 gap-1">
              {sendInvitation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              {isAr ? "إرسال" : "Send"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              type="tel"
              placeholder={isAr ? "رقم الهاتف" : "Phone number"}
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              className="text-sm"
              dir="ltr"
            />
            <Button onClick={sendSMSInvite} disabled={!invitePhone || sendInvitation.isPending} size="sm" className="shrink-0 gap-1">
              {sendInvitation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Smartphone className="h-3.5 w-3.5" />}
              {isAr ? "إرسال" : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
