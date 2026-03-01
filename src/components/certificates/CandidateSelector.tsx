import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CertificatePreview } from "./CertificatePreview";
import { defaultDesign } from "./types";
import {
  Sparkles, Trophy, Users, FileText, Eye, Loader2, CheckCircle, AlertCircle,
} from "lucide-react";

interface CandidateResult {
  registrationId: string;
  participantId: string;
  dishName: string | null;
  name: string;
  email: string;
  score: number;
  rank: number;
  categoryName?: string;
}

interface CandidateSelectorProps {
  competitions: Array<{ id: string; title: string; title_ar: string | null; status: string; competition_end: string | null; venue: string | null; venue_ar: string | null }>;
  templates: Array<{ id: string; name: string; name_ar: string | null; type: string; is_active: boolean }>;
}

export function CandidateSelector({ competitions, templates }: CandidateSelectorProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCompetitionId, setSelectedCompetitionId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewCandidate, setPreviewCandidate] = useState<CandidateResult | null>(null);
  const [issueParticipation, setIssueParticipation] = useState(true);
  const [issueWinners, setIssueWinners] = useState(true);

  const competition = competitions.find(c => c.id === selectedCompetitionId);

   // Fetch candidates
   const { data: candidates = [], isLoading: loadingCandidates } = useQuery({
     queryKey: ["cert-candidates", selectedCompetitionId],
     queryFn: async () => {
       if (!selectedCompetitionId) return [];
       const { data: registrations } = await supabase
         .from("competition_registrations")
         .select("id, participant_id, dish_name, category_id, entry_type, team_name, team_name_ar, organization_name, organization_name_ar")
         .eq("competition_id", selectedCompetitionId)
         .eq("status", "approved");
       if (!registrations?.length) return [];

       const { data: criteria } = await supabase.from("judging_criteria").select("id, weight, max_score").eq("competition_id", selectedCompetitionId);
       const regIds = registrations.map(r => r.id);
       const { data: scores } = await supabase.from("competition_scores").select("registration_id, criteria_id, score").in("registration_id", regIds);
       
       // Fetch profiles only for individual entries
       const individualRegIds = registrations.filter(r => r.entry_type === 'individual' || !r.entry_type).map(r => r.participant_id);
       let profileMap = new Map<string, any>();
       if (individualRegIds.length > 0) {
         const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", individualRegIds);
         profiles?.forEach(p => profileMap.set(p.user_id, p));
       }

       // Get categories
       const catIds = [...new Set(registrations.map(r => r.category_id).filter(Boolean))];
       let categories: Record<string, string> = {};
       if (catIds.length) {
         const { data: cats } = await supabase.from("competition_categories").select("id, name, name_ar").in("id", catIds);
         cats?.forEach(c => { categories[c.id] = language === "ar" && c.name_ar ? c.name_ar : c.name; });
       }

       return registrations.map(reg => {
         const regScores = scores?.filter(s => s.registration_id === reg.id) || [];
         const profile = profileMap.get(reg.participant_id);
         const displayName = reg.entry_type === 'team'
           ? (language === "ar" && reg.team_name_ar ? reg.team_name_ar : reg.team_name)
           : reg.entry_type === 'organization'
           ? (language === "ar" && reg.organization_name_ar ? reg.organization_name_ar : reg.organization_name)
           : profile?.full_name || profile?.username || "Unknown";
         
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
           name: displayName,
           email: "",
           score: totalWeight > 0 ? totalScore / totalWeight : 0,
           rank: 0,
           categoryName: reg.category_id ? categories[reg.category_id] || "" : "",
         } as CandidateResult;
       }).sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
    },
    enabled: !!selectedCompetitionId,
  });

  // Check existing certificates
  const { data: existingCerts = [] } = useQuery({
    queryKey: ["existing-certs-check", selectedCompetitionId],
    queryFn: async () => {
      if (!selectedCompetitionId) return [];
      const { data } = await supabase.from("certificates").select("recipient_id, type").eq("competition_id", selectedCompetitionId);
      return data || [];
    },
    enabled: !!selectedCompetitionId,
  });

  const existingSet = useMemo(() => new Set(existingCerts.map(c => `${c.recipient_id}-${c.type}`)), [existingCerts]);

  // Select all / none
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(candidates.map(c => c.participantId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCandidates = candidates.filter(c => selectedIds.has(c.participantId));
  const allSelected = candidates.length > 0 && selectedIds.size === candidates.length;

   // Issue mutation
   const issueMutation = useMutation({
     mutationFn: async () => {
       if (!selectedCandidates.length || !competition) throw new Error("No candidates selected");

       let templateId = templates.find(t => t.type === "participation")?.id;
       if (!templateId) {
         const { data: newT, error } = await supabase.from("certificate_templates").insert({
           name: "Auto Template", name_ar: "قالب تلقائي", type: "participation",
           title_text: "Certificate", body_template: "Participated in {{event_name}}.",
           body_template_ar: "شارك في {{event_name}}.", is_active: true,
         }).select("id").single();
         if (error) throw error;
         templateId = newT.id;
       }

       const certs: any[] = [];
       for (const r of selectedCandidates) {
         const isWinner = r.rank <= 3;
         const winType = r.rank === 1 ? "winner_gold" : r.rank === 2 ? "winner_silver" : "winner_bronze";
         const rankLabel = r.rank === 1 ? "Gold" : r.rank === 2 ? "Silver" : "Bronze";
         const rankLabelAr = r.rank === 1 ? "ذهبي" : r.rank === 2 ? "فضي" : "برونزي";

         if (issueWinners && isWinner && !existingSet.has(`${r.participantId}-${winType}`)) {
           certs.push({
             template_id: templateId, type: winType, competition_id: selectedCompetitionId,
             recipient_id: r.participantId, recipient_name: r.name, recipient_email: r.email,
             achievement: `${rankLabel} Winner - ${competition.title}`,
             achievement_ar: `فائز ${rankLabelAr} - ${competition.title_ar || competition.title}`,
             event_name: competition.title, event_name_ar: competition.title_ar,
             event_date: competition.competition_end?.split("T")[0],
             event_location: competition.venue, event_location_ar: competition.venue_ar,
             verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(),
             status: "draft", issued_by: user?.id,
           });
         }
         if (issueParticipation && !existingSet.has(`${r.participantId}-participation`)) {
           certs.push({
             template_id: templateId, type: "participation", competition_id: selectedCompetitionId,
             recipient_id: r.participantId, recipient_name: r.name, recipient_email: r.email,
             achievement: `Participant - ${competition.title}`,
             achievement_ar: `مشارك - ${competition.title_ar || competition.title}`,
             event_name: competition.title, event_name_ar: competition.title_ar,
             event_date: competition.competition_end?.split("T")[0],
             event_location: competition.venue, event_location_ar: competition.venue_ar,
             verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(),
             status: "draft", issued_by: user?.id,
           });
         }
       }

       if (certs.length === 0) throw new Error(language === "ar" ? "جميع الشهادات صادرة بالفعل" : "All certificates already issued for selected candidates");

       const { error } = await supabase.from("certificates").insert(certs);
       if (error) throw error;
       return certs.length;
     },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["existing-certs-check"] });
      toast({
        title: language === "ar" ? "تم الإنشاء" : "Created",
        description: language === "ar" ? `تم إنشاء ${count} شهادة كمسودة. تحتاج اعتماد رئيس المسابقة.` : `Created ${count} certificates as drafts. Requires competition manager approval.`,
      });
      setSelectedIds(new Set());
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const winnerCount = selectedCandidates.filter(c => c.rank <= 3).length;

  return (
    <div className="space-y-4">
      {/* Competition Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {language === "ar" ? "إصدار تلقائي من المسابقة" : "Auto-Issue from Competition"}
          </CardTitle>
          <CardDescription>
            {language === "ar"
              ? "اختر مسابقة ثم حدد المرشحين لإنشاء الشهادات. تحتاج اعتماد رئيس المسابقة."
              : "Select a competition, then choose candidates to generate certificates. Requires competition manager approval."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedCompetitionId} onValueChange={v => { setSelectedCompetitionId(v); setSelectedIds(new Set()); setPreviewCandidate(null); }}>
            <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر مسابقة..." : "Choose competition..."} /></SelectTrigger>
            <SelectContent>
              {competitions.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5" />
                    {language === "ar" && c.title_ar ? c.title_ar : c.title}
                    <Badge variant="outline" className="text-[10px] ms-1">{c.status}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Candidates List */}
      {selectedCompetitionId && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                {language === "ar" ? "قائمة المرشحين" : "Eligible Candidates"}
                <Badge variant="secondary" className="ms-2">{candidates.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="issue-winners" checked={issueWinners} onCheckedChange={v => setIssueWinners(!!v)} />
                  <label htmlFor="issue-winners" className="text-xs cursor-pointer">{language === "ar" ? "شهادات فائزين" : "Winner certs"}</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="issue-participation" checked={issueParticipation} onCheckedChange={v => setIssueParticipation(!!v)} />
                  <label htmlFor="issue-participation" className="text-xs cursor-pointer">{language === "ar" ? "شهادات مشاركة" : "Participation certs"}</label>
                </div>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="rounded-xl border p-2 text-center">
                <Trophy className="mx-auto mb-1 h-4 w-4 text-chart-4" />
                <p className="text-sm font-bold">{candidates.filter(r => r.rank <= 3).length}</p>
                <p className="text-[10px] text-muted-foreground">{language === "ar" ? "فائزين" : "Winners"}</p>
              </div>
              <div className="rounded-xl border p-2 text-center">
                <Users className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-sm font-bold">{candidates.length}</p>
                <p className="text-[10px] text-muted-foreground">{language === "ar" ? "مشاركين" : "Participants"}</p>
              </div>
              <div className="rounded-xl border p-2 text-center">
                <CheckCircle className="mx-auto mb-1 h-4 w-4 text-chart-5" />
                <p className="text-sm font-bold">{selectedIds.size}</p>
                <p className="text-[10px] text-muted-foreground">{language === "ar" ? "محددين" : "Selected"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCandidates ? (
              <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>{language === "ar" ? "لا توجد نتائج" : "No approved participants found"}</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[350px] border rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                        </TableHead>
                        <TableHead>{language === "ar" ? "الترتيب" : "Rank"}</TableHead>
                        <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                        <TableHead>{language === "ar" ? "الفئة" : "Category"}</TableHead>
                        <TableHead>{language === "ar" ? "الدرجة" : "Score"}</TableHead>
                        <TableHead>{language === "ar" ? "الشهادات" : "Certificates"}</TableHead>
                        <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{language === "ar" ? "معاينة" : "Preview"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map(c => {
                        const alreadyIssued = existingSet.has(`${c.participantId}-participation`) || (c.rank <= 3 && existingSet.has(`${c.participantId}-${c.rank === 1 ? "winner_gold" : c.rank === 2 ? "winner_silver" : "winner_bronze"}`));
                        return (
                          <TableRow key={c.registrationId} className={alreadyIssued ? "opacity-60" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(c.participantId)}
                                onCheckedChange={() => toggleSelect(c.participantId)}
                                disabled={alreadyIssued}
                              />
                            </TableCell>
                            <TableCell>
                              {c.rank <= 3 ? (
                                <Badge className={c.rank === 1 ? "bg-chart-4 text-chart-4-foreground" : c.rank === 2 ? "bg-muted-foreground text-background" : "bg-chart-3 text-chart-3-foreground"}>
                                  #{c.rank}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">#{c.rank}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-xs">{c.categoryName || "—"}</TableCell>
                            <TableCell>{c.score.toFixed(1)}%</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Badge variant="outline" className="text-[10px]">{language === "ar" ? "مشاركة" : "Participation"}</Badge>
                                {c.rank <= 3 && (
                                  <Badge className={`text-[10px] ${c.rank === 1 ? "bg-chart-4 text-chart-4-foreground" : c.rank === 2 ? "bg-muted-foreground text-background" : "bg-chart-3 text-chart-3-foreground"}`}>
                                    {c.rank === 1 ? (language === "ar" ? "ذهبي" : "Gold") : c.rank === 2 ? (language === "ar" ? "فضي" : "Silver") : (language === "ar" ? "برونزي" : "Bronze")}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {alreadyIssued ? (
                                <Badge className="bg-chart-5/20 text-chart-5 text-[10px]">
                                  <CheckCircle className="h-3 w-3 me-1" />
                                  {language === "ar" ? "صادرة" : "Issued"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">{language === "ar" ? "جديدة" : "New"}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewCandidate(c)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Already issued warning */}
                {existingCerts.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 rounded-xl bg-chart-4/10 p-3 text-sm text-chart-4">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {language === "ar"
                      ? `${existingCerts.length} شهادة صادرة بالفعل. لن يتم تكرارها.`
                      : `${existingCerts.length} certificates already issued. Duplicates will be skipped.`}
                  </div>
                )}

                {/* Issue button */}
                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => issueMutation.mutate()}
                    disabled={selectedIds.size === 0 || issueMutation.isPending}
                  >
                    {issueMutation.isPending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Sparkles className="h-4 w-4 me-2" />}
                    {language === "ar"
                      ? `إنشاء شهادات لـ ${selectedIds.size} مرشح (مسودة - تحتاج اعتماد)`
                      : `Generate Certificates for ${selectedIds.size} Candidates (Draft - Needs Approval)`}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {language === "ar"
                      ? "سيتم إنشاء الشهادات كمسودة. يجب اعتمادها من رئيس المسابقة قبل الإصدار."
                      : "Certificates are created as drafts. Competition manager must approve before issuance."}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Panel */}
      {previewCandidate && competition && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                {language === "ar" ? "معاينة الشهادة" : "Certificate Preview"} — {previewCandidate.name}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewCandidate(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto bg-muted/30 rounded-xl p-4 flex items-center justify-center">
              <CertificatePreview
                design={defaultDesign}
                zoom={50}
                previewData={{
                  recipientName: previewCandidate.name,
                  eventName: competition.title,
                  eventLocation: competition.venue || "",
                  eventDate: competition.competition_end?.split("T")[0] || "",
                  achievement: previewCandidate.rank <= 3
                    ? `${previewCandidate.rank === 1 ? "Gold" : previewCandidate.rank === 2 ? "Silver" : "Bronze"} Winner`
                    : "Participant",
                  certificateNumber: `CERT-PREVIEW-${previewCandidate.rank}`,
                  verificationCode: "PREVIEW",
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
