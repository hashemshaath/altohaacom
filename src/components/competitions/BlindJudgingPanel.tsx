import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { EyeOff, RefreshCw, Copy, Shield } from "lucide-react";

interface Props {
  competitionId: string;
  isOrganizer: boolean;
  blindJudgingEnabled?: boolean;
  blindCodePrefix?: string;
}

export function BlindJudgingPanel({ competitionId, isOrganizer, blindJudgingEnabled = false, blindCodePrefix = "ENTRY" }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(blindJudgingEnabled);
  const [prefix, setPrefix] = useState(blindCodePrefix);

  const { data: blindCodes, isLoading } = useQuery({
    queryKey: ["blind-codes", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blind_judging_codes")
        .select("*, competition_registrations:registration_id(participant_id, dish_name, profiles:participant_id(full_name, full_name_ar))")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
    enabled: isOrganizer,
  });

  const toggleBlindJudging = useMutation({
    mutationFn: async (newEnabled: boolean) => {
      const { error } = await supabase
        .from("competitions")
        .update({ blind_judging_enabled: newEnabled, blind_code_prefix: prefix })
        .eq("id", competitionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition", competitionId] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const generateCodes = useMutation({
    mutationFn: async () => {
      // Get all approved registrations
      const { data: regs, error: regError } = await supabase
        .from("competition_registrations")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("status", "approved");
      if (regError) throw regError;
      if (!regs?.length) throw new Error("No approved registrations");

      // Generate unique codes for registrations that don't have one
      const existingRegIds = new Set(blindCodes?.map(c => c.registration_id) || []);
      const newCodes = regs
        .filter(r => !existingRegIds.has(r.id))
        .map((reg, idx) => ({
          competition_id: competitionId,
          registration_id: reg.id,
          blind_code: `${prefix}-${String(idx + 1 + (blindCodes?.length || 0)).padStart(3, "0")}`,
        }));

      if (newCodes.length === 0) throw new Error("All registrations already have codes");

      const { error } = await supabase.from("blind_judging_codes").insert(newCodes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blind-codes", competitionId] });
      toast({ title: isAr ? "تم إنشاء الأكواد" : "Codes generated" });
    },
    onError: (err: any) => toast({ title: err.message || "Error", variant: "destructive" }),
  });

  if (!isOrganizer) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <EyeOff className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{isAr ? "التحكيم الأعمى" : "Blind Judging"}</h3>
            <p className="text-xs text-muted-foreground">{isAr ? "إخفاء هوية المتسابقين عن الحكام" : "Hide participant identity from judges"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="blind-toggle" className="text-xs text-muted-foreground">
            {enabled ? (isAr ? "مفعّل" : "Enabled") : (isAr ? "معطّل" : "Disabled")}
          </Label>
          <Switch
            id="blind-toggle"
            checked={enabled}
            onCheckedChange={(checked) => {
              setEnabled(checked);
              toggleBlindJudging.mutate(checked);
            }}
          />
        </div>
      </div>

      {enabled && (
        <>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {isAr ? "عند التفعيل، لن يرى الحكام أسماء المتسابقين — فقط أكواد مجهولة" : "When enabled, judges see anonymous codes instead of participant names"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs">{isAr ? "بادئة الكود" : "Code Prefix"}</Label>
                  <Input
                    value={prefix}
                    onChange={e => setPrefix(e.target.value.toUpperCase())}
                    placeholder="ENTRY"
                    className="h-9 font-mono text-sm uppercase"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => generateCodes.mutate()}
                  disabled={generateCodes.isPending}
                  className="mt-5"
                >
                  <RefreshCw className={`me-1.5 h-3.5 w-3.5 ${generateCodes.isPending ? "animate-spin" : ""}`} />
                  {isAr ? "إنشاء الأكواد" : "Generate Codes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : blindCodes && blindCodes.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {blindCodes.length} {isAr ? "كود" : "codes"}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {blindCodes.map(code => {
                    const reg = code.competition_registrations as any;
                    const profile = reg?.profiles;
                    const name = isAr ? profile?.full_name_ar || profile?.full_name : profile?.full_name;
                    return (
                      <div key={code.id} className="flex items-center justify-between rounded-xl border border-border/60 p-2.5 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 bg-primary/5 border-primary/20">
                            {code.blind_code}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{name || "—"}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(code.blind_code);
                            toast({ title: isAr ? "تم النسخ" : "Copied" });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="py-8 text-center">
                <p className="text-xs text-muted-foreground">{isAr ? "لم يتم إنشاء أكواد بعد" : "No codes generated yet"}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
