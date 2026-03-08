import { memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserPlus, Check, Calendar, MapPin, Star, Clock } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format } from "date-fns";

interface ChefRegistration {
  id: string;
  chef_id: string;
  session_id: string | null;
  specialties: string[];
  availability_start: string | null;
  availability_end: string | null;
  preferred_city: string | null;
  experience_years: number | null;
  motivation: string | null;
  status: string;
  matched_at: string | null;
  created_at: string;
  profile?: { full_name: string; specialization: string; country_code: string; avatar_url: string | null };
}

export const ChefsTableChefRegistrations = memo(function ChefsTableChefRegistrations() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["chef-evaluation-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_evaluation_registrations" as any)
        .select("id, chef_id, session_id, specialties, availability_start, availability_end, preferred_city, experience_years, motivation, status, matched_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      const regs = (data || []) as unknown as ChefRegistration[];
      
      // Fetch profiles for all chef_ids
      if (regs.length) {
        const chefIds = [...new Set(regs.map(r => r.chef_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, specialization, country_code, avatar_url")
          .in("user_id", chefIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        regs.forEach(r => {
          const p = profileMap.get(r.chef_id);
          if (p) r.profile = p as any;
        });
      }
      
      return regs;
    },
  });

  const matchMutation = useMutation({
    mutationFn: async ({ regId, sessionId }: { regId: string; sessionId?: string }) => {
      const { error } = await supabase
        .from("chef_evaluation_registrations" as any)
        .update({ status: "matched", matched_at: new Date().toISOString(), session_id: sessionId || null } as any)
        .eq("id", regId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chef-evaluation-registrations"] });
      toast.success(isAr ? "تم المطابقة" : "Chef matched");
    },
  });

  const available = registrations.filter(r => r.status === "available");
  const matched = registrations.filter(r => r.status === "matched");

  const statusColors: Record<string, string> = {
    available: "bg-chart-5/10 text-chart-5 border-chart-5/20",
    matched: "bg-primary/10 text-primary border-primary/20",
    unavailable: "bg-muted text-muted-foreground border-border",
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <AnimatedCounter value={available.length} className="text-3xl font-black tabular-nums text-chart-5" />
            <p className="text-xs text-muted-foreground">{isAr ? "متاح" : "Available"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <AnimatedCounter value={matched.length} className="text-3xl font-black tabular-nums text-primary" />
            <p className="text-xs text-muted-foreground">{isAr ? "تم المطابقة" : "Matched"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <AnimatedCounter value={registrations.length} className="text-3xl font-black tabular-nums" />
            <p className="text-xs text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</p>
          </CardContent>
        </Card>
      </div>

      {registrations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/20" />
            <p className="mt-4 font-semibold">{isAr ? "لا توجد تسجيلات بعد" : "No chef registrations yet"}</p>
            <p className="text-sm text-muted-foreground mt-1">{isAr ? "سيتمكن الطهاة من التسجيل لجلسات التقييم" : "Chefs can register interest for evaluation sessions"}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold text-[11px] uppercase">{isAr ? "الشيف" : "Chef"}</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">{isAr ? "التخصصات" : "Specialties"}</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">{isAr ? "التوفر" : "Availability"}</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">{isAr ? "الخبرة" : "Experience"}</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map(reg => (
                <TableRow key={reg.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        {reg.profile?.avatar_url ? (
                          <img src={reg.profile.avatar_url} className="h-8 w-8 rounded-full object-cover" alt="" loading="lazy" />
                        ) : (
                          <UserPlus className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{reg.profile?.full_name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{reg.profile?.specialization || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(reg.specialties || []).slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-[8px]">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {reg.availability_start && reg.availability_end ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(reg.availability_start), "MMM d")} – {format(new Date(reg.availability_end), "MMM d")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{isAr ? "مرن" : "Flexible"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {reg.experience_years ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 text-chart-4" />{reg.experience_years} {isAr ? "سنة" : "yrs"}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${statusColors[reg.status] || statusColors.available}`}>
                      {reg.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {reg.status === "available" && (
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-[10px]" onClick={() => matchMutation.mutate({ regId: reg.id })}>
                        <Check className="h-3 w-3" />{isAr ? "مطابقة" : "Match"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
});
