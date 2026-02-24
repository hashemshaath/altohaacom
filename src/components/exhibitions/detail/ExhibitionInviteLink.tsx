import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Link2, Copy, Check, UserPlus } from "lucide-react";

interface Props {
  exhibitionId: string;
  exhibitionSlug: string;
  isAr: boolean;
}

export function ExhibitionInviteLink({ exhibitionId, exhibitionSlug, isAr }: Props) {
  const { user } = useAuth();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const t = (en: string, ar: string) => isAr ? ar : en;

  const createInvite = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("exhibition_invites")
        .insert({ exhibition_id: exhibitionId, created_by: user.id, label: "Quick invite" })
        .select("code")
        .single();
      if (error) throw error;
      return data.code;
    },
    onSuccess: (code) => {
      const base = window.location.origin;
      setInviteUrl(`${base}/exhibitions/${exhibitionSlug}?invite=${code}`);
    },
  });

  const copyUrl = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: t("Invite link copied! 🔗", "تم نسخ رابط الدعوة! 🔗") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("Failed to copy", "فشل النسخ"), variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <Card className="border-border/60">
      <CardContent className="p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-2/10 shrink-0">
            <UserPlus className="h-4 w-4 text-chart-2" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t("Invite Friends", "دعوة أصدقاء")}</p>
            <p className="text-[10px] text-muted-foreground">{t("Create a personal invite link", "أنشئ رابط دعوة شخصي")}</p>
          </div>
        </div>

        {!inviteUrl ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 h-9 rounded-xl text-xs gap-1.5"
            onClick={() => createInvite.mutate()}
            disabled={createInvite.isPending}
          >
            <Link2 className="h-3.5 w-3.5" />
            {createInvite.isPending ? t("Creating...", "جاري الإنشاء...") : t("Generate Invite Link", "إنشاء رابط دعوة")}
          </Button>
        ) : (
          <div className="mt-3 flex gap-2">
            <Input value={inviteUrl} readOnly className="h-9 text-[10px] rounded-xl bg-muted/50 flex-1" />
            <Button size="sm" variant="outline" className="h-9 rounded-xl shrink-0" onClick={copyUrl}>
              {copied ? <Check className="h-3.5 w-3.5 text-chart-3" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
