import { useState, memo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { QrCode, CheckCircle2, XCircle, Loader2, Search, User, Ticket } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export const ExhibitionTicketCheckin = memo(function ExhibitionTicketCheckin({ exhibitionId, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "found" | "not_found" | "already_checked_in">("idle");

  const searchTicket = useMutation({
    mutationFn: async (searchCode: string) => {
      const trimmed = searchCode.trim().toUpperCase();
      // Search by ticket number or QR code
      const { data, error } = await supabase
        .from("exhibition_tickets")
        .select("id, ticket_number, qr_code, status, checked_in_at, attendee_name, attendee_email, user_id")
        .eq("exhibition_id", exhibitionId)
        .or(`ticket_number.eq.${trimmed},qr_code.eq.${trimmed}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (!data) {
        setStatus("not_found");
        setResult(null);
      } else if (data.checked_in_at) {
        setStatus("already_checked_in");
        setResult(data);
      } else {
        setStatus("found");
        setResult(data);
      }
    },
    onError: () => {
      setStatus("not_found");
      setResult(null);
    },
  });

  const checkIn = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from("exhibition_tickets")
        .update({ checked_in_at: new Date().toISOString(), checked_in_by: user?.id })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-tickets"] });
      toast({ title: isAr ? "تم تسجيل الدخول بنجاح ✅" : "Check-in successful ✅" });
      setStatus("already_checked_in");
      setResult((prev: any) => prev ? { ...prev, checked_in_at: new Date().toISOString() } : prev);
    },
    onError: () => {
      toast({ title: isAr ? "فشل تسجيل الدخول" : "Check-in failed", variant: "destructive" });
    },
  });

  const handleSearch = () => {
    if (!code.trim()) return;
    searchTicket.mutate(code);
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <QrCode className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{isAr ? "تسجيل دخول الحضور" : "Attendee Check-in"}</h3>
            <p className="text-[10px] text-muted-foreground">{isAr ? "ابحث برقم التذكرة أو رمز QR" : "Search by ticket number or QR code"}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value); setStatus("idle"); }}
              placeholder={isAr ? "ETK... أو رمز QR" : "ETK... or QR code"}
              className="ps-9 h-10 rounded-xl font-mono text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={searchTicket.isPending || !code.trim()} className="rounded-xl">
            {searchTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? "بحث" : "Search")}
          </Button>
        </div>

        {/* Result */}
        {status === "not_found" && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3">
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs font-medium text-destructive">{isAr ? "التذكرة غير موجودة" : "Ticket not found"}</p>
          </div>
        )}

        {status === "already_checked_in" && result && (
          <div className="rounded-xl border border-chart-3/20 bg-chart-3/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-chart-3" />
              <p className="text-xs font-bold text-chart-3">{isAr ? "تم التسجيل مسبقاً" : "Already Checked In"}</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><User className="inline h-3 w-3 me-1" />{result.attendee_name || (isAr ? "بدون اسم" : "No name")}</p>
              <p><Ticket className="inline h-3 w-3 me-1" />{result.ticket_number}</p>
            </div>
          </div>
        )}

        {status === "found" && result && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="text-xs space-y-1">
              <p className="font-semibold"><User className="inline h-3 w-3 me-1" />{result.attendee_name || (isAr ? "بدون اسم" : "No name")}</p>
              <p className="text-muted-foreground"><Ticket className="inline h-3 w-3 me-1" />{result.ticket_number}</p>
              <Badge variant="outline" className="text-[10px]">{result.status}</Badge>
            </div>
            <Button onClick={() => checkIn.mutate(result.id)} disabled={checkIn.isPending} className="w-full rounded-xl">
              {checkIn.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-2 h-4 w-4" />}
              {isAr ? "تأكيد تسجيل الدخول" : "Confirm Check-in"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
