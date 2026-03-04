import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ScanLine, CheckCircle2, XCircle, Search, Users, Ticket, Clock, AlertTriangle, RefreshCw, QrCode } from "lucide-react";
import { format } from "date-fns";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionCheckinScanner({ exhibitionId, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ type: "success" | "error" | "warning"; message: string; ticket?: any } | null>(null);

  // Real-time attendance stats
  const { data: stats } = useQuery({
    queryKey: ["checkin-stats", exhibitionId],
    queryFn: async () => {
      const [total, checkedIn, recent] = await Promise.all([
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId).eq("status", "confirmed"),
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).eq("exhibition_id", exhibitionId).not("checked_in_at", "is", null),
        supabase.from("exhibition_tickets").select("id, ticket_number, attendee_name, checked_in_at").eq("exhibition_id", exhibitionId).not("checked_in_at", "is", null).order("checked_in_at", { ascending: false }).limit(5),
      ]);
      return {
        total: total.count || 0,
        checkedIn: checkedIn.count || 0,
        recent: recent.data || [],
      };
    },
    refetchInterval: 30000,
  });

  const checkinMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const trimmed = qrCode.trim().toUpperCase();
      if (!trimmed) throw new Error("empty");

      // Find ticket by QR code or ticket number
      const { data: ticket, error } = await supabase
        .from("exhibition_tickets")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .or(`qr_code.eq.${trimmed},ticket_number.eq.${trimmed}`)
        .maybeSingle();

      if (error) throw error;
      if (!ticket) throw new Error("not_found");
      if (ticket.status !== "confirmed") throw new Error("not_confirmed");
      if (ticket.checked_in_at) throw new Error("already_checked_in");

      // Perform check-in
      const { error: updateError } = await supabase
        .from("exhibition_tickets")
        .update({
          checked_in_at: new Date().toISOString(),
          checked_in_by: user?.id || null,
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;
      return ticket;
    },
    onSuccess: (ticket) => {
      setResult({
        type: "success",
        message: t(
          `✅ ${ticket.attendee_name || "Guest"} checked in successfully!`,
          `✅ تم تسجيل دخول ${ticket.attendee_name || "ضيف"} بنجاح!`
        ),
        ticket,
      });
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["checkin-stats", exhibitionId] });
      toast({ title: t("Check-in successful!", "تم تسجيل الدخول!") });
    },
    onError: (err: any) => {
      const msg = err.message;
      if (msg === "not_found") setResult({ type: "error", message: t("❌ Ticket not found", "❌ التذكرة غير موجودة") });
      else if (msg === "not_confirmed") setResult({ type: "error", message: t("❌ Ticket not confirmed", "❌ التذكرة غير مؤكدة") });
      else if (msg === "already_checked_in") setResult({ type: "warning", message: t("⚠️ Already checked in", "⚠️ تم تسجيل الدخول مسبقاً") });
      else setResult({ type: "error", message: t("❌ Check-in failed", "❌ فشل تسجيل الدخول") });
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) checkinMutation.mutate(code);
  }, [code, checkinMutation]);

  const occupancyPct = stats ? (stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0) : 0;

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/40">
          <CardContent className="p-3 text-center">
            <Ticket className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{stats?.total || 0}</p>
            <p className="text-[10px] text-muted-foreground">{t("Total Tickets", "إجمالي التذاكر")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto text-chart-3 mb-1" />
            <p className="text-lg font-bold text-chart-3">{stats?.checkedIn || 0}</p>
            <p className="text-[10px] text-muted-foreground">{t("Checked In", "تم الدخول")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto text-chart-2 mb-1" />
            <p className="text-lg font-bold text-chart-2">{occupancyPct}%</p>
            <p className="text-[10px] text-muted-foreground">{t("Occupancy", "نسبة الحضور")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Scanner Input */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            {t("Check-in Scanner", "ماسح تسجيل الدخول")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={t("Scan QR or enter ticket number...", "امسح QR أو أدخل رقم التذكرة...")}
                className="ps-10 h-11 rounded-xl text-sm font-mono"
                autoFocus
              />
            </div>
            <Button type="submit" className="h-11 px-5 rounded-xl" disabled={checkinMutation.isPending || !code.trim()}>
              {checkinMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <><Search className="h-4 w-4 me-1" /> {t("Check In", "تسجيل")}</>
              )}
            </Button>
          </form>

          {/* Result Feedback */}
          {result && (
            <div className={`mt-3 rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 ${
              result.type === "success" ? "bg-chart-3/10 border border-chart-3/20" :
              result.type === "warning" ? "bg-chart-4/10 border border-chart-4/20" :
              "bg-destructive/10 border border-destructive/20"
            }`}>
              {result.type === "success" ? <CheckCircle2 className="h-5 w-5 text-chart-3 shrink-0 mt-0.5" /> :
               result.type === "warning" ? <AlertTriangle className="h-5 w-5 text-chart-4 shrink-0 mt-0.5" /> :
               <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-semibold">{result.message}</p>
                {result.ticket && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {result.ticket.ticket_number} • {result.ticket.attendee_email || ""}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Check-ins */}
      {stats?.recent && stats.recent.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {t("Recent Check-ins", "آخر عمليات الدخول")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {stats.recent.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-chart-3" />
                  <span className="font-medium">{r.attendee_name || r.ticket_number}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {r.checked_in_at && format(new Date(r.checked_in_at), "HH:mm")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Occupancy Progress */}
      <div className="rounded-xl bg-muted/30 p-3 border border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">{t("Attendance Progress", "تقدم الحضور")}</span>
          <span className="text-xs font-bold text-primary">{stats?.checkedIn || 0}/{stats?.total || 0}</span>
        </div>
        <div className="h-3 rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-chart-3 transition-all duration-700"
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default ExhibitionCheckinScanner;
