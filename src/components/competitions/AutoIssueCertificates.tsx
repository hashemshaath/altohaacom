import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Award, Trophy, Medal, Sparkles, Loader2, CheckCircle } from "lucide-react";

interface AutoIssueCertificatesProps {
  competitionId: string;
}

export function AutoIssueCertificates({ competitionId }: AutoIssueCertificatesProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [issueParticipation, setIssueParticipation] = useState(true);
  const [issueWinners, setIssueWinners] = useState(true);
  const [issueBadges, setIssueBadges] = useState(true);

  // Get competition info
  const { data: competition } = useQuery({
    queryKey: ["competition", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", competitionId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Get results (ranked participants)
  const { data: results } = useQuery({
    queryKey: ["competition-results-for-certs", competitionId],
    queryFn: async () => {
      const { data: registrations } = await supabase
        .from("competition_registrations")
        .select("id, participant_id, dish_name")
        .eq("competition_id", competitionId)
        .eq("status", "approved");

      if (!registrations?.length) return [];

      const { data: criteria } = await supabase
        .from("judging_criteria")
        .select("id, weight, max_score")
        .eq("competition_id", competitionId);

      const regIds = registrations.map(r => r.id);
      const { data: scores } = await supabase
        .from("competition_scores")
        .select("registration_id, criteria_id, score")
        .in("registration_id", regIds);

      const partIds = registrations.map(r => r.participant_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username")
        .in("user_id", partIds);

      return registrations.map(reg => {
        const regScores = scores?.filter(s => s.registration_id === reg.id) || [];
        const profile = profiles?.find(p => p.user_id === reg.participant_id);
        let totalScore = 0, totalWeight = 0;

        criteria?.forEach(crit => {
          const cs = regScores.filter(s => s.criteria_id === crit.id);
          if (cs.length) {
            const avg = cs.reduce((sum, s) => sum + Number(s.score), 0) / cs.length;
            totalScore += (avg / crit.max_score) * 100 * Number(crit.weight);
            totalWeight += Number(crit.weight);
          }
        });

        return {
          registrationId: reg.id,
          participantId: reg.participant_id,
          dishName: reg.dish_name,
          name: profile?.full_name || profile?.username || "Unknown",
          nameAr: profile?.full_name || "",
          email: "",
          score: totalWeight > 0 ? totalScore / totalWeight : 0,
          rank: 0,
        };
      }).sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
    },
  });

  // Check existing certificates
  const { data: existingCerts } = useQuery({
    queryKey: ["existing-certs", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("certificates")
        .select("id, recipient_id, type")
        .eq("competition_id", competitionId);
      return data || [];
    },
  });

  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!results?.length || !competition) throw new Error("No results available");

      // Get default template
      const { data: templates } = await supabase
        .from("certificate_templates")
        .select("id, type")
        .eq("is_active", true);

      const participationTemplate = templates?.find(t => t.type === "participation");
      const winnerTemplate = templates?.find(t => t.type === "winner_gold") || templates?.find(t => t.type === "appreciation");

      if (!participationTemplate && !winnerTemplate) {
        throw new Error("No certificate templates found. Please create templates first.");
      }

      const certsToInsert: any[] = [];
      const badgesToInsert: any[] = [];
      const existingRecipients = new Set(existingCerts?.map(c => `${c.recipient_id}-${c.type}`) || []);

      // Get badge definitions
      const { data: badgeDefs } = await supabase
        .from("digital_badges")
        .select("id, badge_type")
        .eq("is_active", true);

      for (const result of results) {
        const isWinner = result.rank <= 3;

        const winnerCertType = result.rank === 1 ? "winner_gold" : result.rank === 2 ? "winner_silver" : "winner_bronze";
        // Winner certificates
        if (issueWinners && isWinner && winnerTemplate && !existingRecipients.has(`${result.participantId}-${winnerCertType}`)) {
          const rankLabel = result.rank === 1 ? "Gold" : result.rank === 2 ? "Silver" : "Bronze";
          const rankLabelAr = result.rank === 1 ? "ذهبي" : result.rank === 2 ? "فضي" : "برونزي";

          certsToInsert.push({
            template_id: winnerTemplate.id,
            type: winnerCertType as any,
            competition_id: competitionId,
            recipient_id: result.participantId,
            recipient_name: result.name,
            recipient_name_ar: result.nameAr,
            recipient_email: result.email,
            achievement: `${rankLabel} Winner - ${competition.title}`,
            achievement_ar: `فائز ${rankLabelAr} - ${competition.title_ar || competition.title}`,
            event_name: competition.title,
            event_name_ar: competition.title_ar,
            event_date: competition.competition_end?.split("T")[0],
            event_location: competition.venue,
            event_location_ar: competition.venue_ar,
            certificate_number: `CERT-${Date.now()}-${result.rank}`,
            verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(),
            status: "draft",
            issued_by: user?.id,
          });
        }

        // Participation certificates
        if (issueParticipation && participationTemplate && !existingRecipients.has(`${result.participantId}-participation`)) {
          certsToInsert.push({
            template_id: participationTemplate.id,
            type: "participation",
            competition_id: competitionId,
            recipient_id: result.participantId,
            recipient_name: result.name,
            recipient_name_ar: result.nameAr,
            recipient_email: result.email,
            achievement: `Participant - ${competition.title}`,
            achievement_ar: `مشارك - ${competition.title_ar || competition.title}`,
            event_name: competition.title,
            event_name_ar: competition.title_ar,
            event_date: competition.competition_end?.split("T")[0],
            event_location: competition.venue,
            event_location_ar: competition.venue_ar,
            certificate_number: `CERT-${Date.now()}-P${result.rank}`,
            verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(),
            status: "draft",
            issued_by: user?.id,
          });
        }

        // Badges
        if (issueBadges && badgeDefs) {
          const badgeType = isWinner
            ? result.rank === 1 ? "gold_winner" : result.rank === 2 ? "silver_winner" : "bronze_winner"
            : "participant";
          const badgeDef = badgeDefs.find(b => b.badge_type === badgeType);
          if (badgeDef) {
            badgesToInsert.push({
              user_id: result.participantId,
              badge_id: badgeDef.id,
              competition_id: competitionId,
            });
          }
        }
      }

      if (certsToInsert.length > 0) {
        const { error: certError } = await supabase.from("certificates").insert(certsToInsert);
        if (certError) throw certError;
      }

      if (badgesToInsert.length > 0) {
        // Use upsert to avoid duplicates
        const { error: badgeError } = await supabase
          .from("user_badges")
          .upsert(badgesToInsert, { onConflict: "user_id,badge_id,competition_id" });
        if (badgeError) throw badgeError;
      }

      return { certs: certsToInsert.length, badges: badgesToInsert.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["existing-certs", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
      toast({
        title: language === "ar" ? "تم الإصدار بنجاح" : "Successfully Issued",
        description: language === "ar"
          ? `تم إنشاء ${data.certs} شهادة و ${data.badges} شارة`
          : `Created ${data.certs} certificates and ${data.badges} badges`,
      });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const winnerCount = results?.filter(r => r.rank <= 3).length || 0;
  const totalParticipants = results?.length || 0;
  const existingCount = existingCerts?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {language === "ar" ? "إصدار الشهادات والشارات تلقائياً" : "Auto-Issue Certificates & Badges"}
        </CardTitle>
        <CardDescription>
          {language === "ar"
            ? "إنشاء شهادات وشارات رقمية للفائزين والمشاركين تلقائياً"
            : "Automatically generate certificates and digital badges for winners and participants"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <Trophy className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
            <p className="text-lg font-bold">{winnerCount}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "فائزين" : "Winners"}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Medal className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-lg font-bold">{totalParticipants}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "مشاركين" : "Participants"}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Award className="mx-auto mb-1 h-5 w-5 text-green-500" />
            <p className="text-lg font-bold">{existingCount}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "شهادات صادرة" : "Issued"}</p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="issue-winners"
              checked={issueWinners}
              onCheckedChange={(v) => setIssueWinners(!!v)}
            />
            <label htmlFor="issue-winners" className="text-sm font-medium cursor-pointer">
              {language === "ar" ? "شهادات الفائزين (أول 3)" : "Winner certificates (Top 3)"}
            </label>
            <Badge variant="secondary" className="ml-auto">{winnerCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="issue-participation"
              checked={issueParticipation}
              onCheckedChange={(v) => setIssueParticipation(!!v)}
            />
            <label htmlFor="issue-participation" className="text-sm font-medium cursor-pointer">
              {language === "ar" ? "شهادات المشاركة" : "Participation certificates"}
            </label>
            <Badge variant="secondary" className="ml-auto">{totalParticipants}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="issue-badges"
              checked={issueBadges}
              onCheckedChange={(v) => setIssueBadges(!!v)}
            />
            <label htmlFor="issue-badges" className="text-sm font-medium cursor-pointer">
              {language === "ar" ? "شارات رقمية" : "Digital badges"}
            </label>
            <Badge variant="secondary" className="ml-auto">
              {issueBadges ? totalParticipants : 0}
            </Badge>
          </div>
        </div>

        {existingCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            {language === "ar"
              ? `يوجد ${existingCount} شهادة صادرة بالفعل. سيتم تخطي التكرارات.`
              : `${existingCount} certificates already issued. Duplicates will be skipped.`}
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => issueMutation.mutate()}
          disabled={issueMutation.isPending || totalParticipants === 0}
        >
          {issueMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {language === "ar" ? "إصدار الشهادات والشارات" : "Issue Certificates & Badges"}
        </Button>
      </CardContent>
    </Card>
  );
}
