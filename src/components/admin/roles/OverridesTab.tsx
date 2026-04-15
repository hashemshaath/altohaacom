import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { AlertTriangle, ShieldCheck, ShieldOff, XCircle, Trash2, Loader2, Info } from "lucide-react";
import { CACHE } from "@/lib/queryConfig";

interface Props {
  isAr: boolean;
  t: (en: string, ar: string) => string;
}

export default function OverridesTab({ isAr, t }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const { data: overrides = [], isLoading } = useQuery({
    queryKey: ["permissionOverrides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permission_overrides")
        .select("*, permissions(name, name_ar, code, category)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const userIds = [...new Set(data?.map(o => o.user_id) || [])];
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data.map(o => ({ ...o, profile: profileMap.get(o.user_id) }));
    },
    staleTime: CACHE.realtime.staleTime,
  });

  const deleteOverride = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_permission_overrides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setConfirmingDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["permissionOverrides"] });
      toast({ title: t("Override removed", "تم حذف الاستثناء") });
    },
  });

  const grantedCount = overrides.filter((o) => o.granted).length;
  const revokedCount = overrides.filter((o) => !o.granted).length;

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-chart-4" />
              {t("Permission Overrides", "استثناءات الصلاحيات")}
              {overrides.length > 0 && <Badge variant="destructive" className="text-[12px]">{overrides.length}</Badge>}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("Permissions individually granted or revoked from specific users", "صلاحيات مُمنوحة أو مسحوبة من مستخدمين بشكل فردي")}
            </CardDescription>
          </div>
          {overrides.length > 0 && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[12px] gap-1">
                <ShieldCheck className="h-3 w-3 text-chart-2" /> {grantedCount} {t("granted", "ممنوح")}
              </Badge>
              <Badge variant="outline" className="text-[12px] gap-1">
                <ShieldOff className="h-3 w-3 text-destructive" /> {revokedCount} {t("revoked", "محجوب")}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : overrides.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">{t("No overrides configured", "لا توجد استثناءات حالياً")}</p>
            <p className="text-xs">{t("All users follow their role permissions", "جميع المستخدمين يتبعون صلاحيات أدوارهم")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {overrides.map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-xl border border-border/40 p-3 hover:bg-muted/20 transition-colors">
                <div className={`rounded-xl p-2 shrink-0 ${o.granted ? "bg-chart-2/10" : "bg-destructive/10"}`}>
                  {o.granted ? <ShieldCheck className="h-4 w-4 text-chart-2" /> : <ShieldOff className="h-4 w-4 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {o.profile ? (isAr ? o.profile.full_name_ar || o.profile.full_name : o.profile.full_name) : t("Unknown", "غير معروف")}
                    {o.profile?.username && <span className="text-muted-foreground text-xs ms-1.5" dir="ltr">@{o.profile.username}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? o.permissions?.name_ar || o.permissions?.name : o.permissions?.name}
                    <span className="font-mono ms-1.5" dir="ltr">({o.permissions?.code})</span>
                  </p>
                  {o.reason && <p className="text-[12px] text-muted-foreground mt-0.5">{o.reason}</p>}
                  {o.expires_at && (
                    <p className="text-[12px] text-chart-4 mt-0.5">
                      {t("Expires:", "ينتهي:")} {new Date(o.expires_at).toLocaleDateString(isAr ? "ar" : "en")}
                    </p>
                  )}
                </div>
                <Badge variant={o.granted ? "default" : "destructive"} className="text-[12px] shrink-0">
                  {o.granted ? t("Granted", "ممنوح") : t("Revoked", "محجوب")}
                </Badge>
                {confirmingDeleteId === o.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="destructive" size="sm" className="h-7 text-[12px] rounded-lg gap-1"
                      onClick={() => deleteOverride.mutate(o.id)} disabled={deleteOverride.isPending}>
                      {deleteOverride.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      {t("Confirm", "تأكيد")}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[12px] rounded-lg" onClick={() => setConfirmingDeleteId(null)}>
                      {t("Cancel", "إلغاء")}
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 shrink-0"
                    onClick={() => setConfirmingDeleteId(o.id)}>
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
