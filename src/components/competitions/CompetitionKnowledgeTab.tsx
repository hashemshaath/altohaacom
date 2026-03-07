import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Globe, FileText, Save, Loader2, Plus, Trash2, Link,
  Scale, Eye, EyeOff, Sparkles, X, Image
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RubricTemplatesPanel } from "./RubricTemplatesPanel";
import { ReferenceGalleryPanel } from "./ReferenceGalleryPanel";
import { JudgeAIAssistant } from "@/components/knowledge/JudgeAIAssistant";

type ResourceType = "link" | "file" | "document" | "image" | "video" | "law" | "scraped_content";

interface CompetitionKnowledgeTabProps {
  competitionId: string;
  isOrganizer: boolean;
}

export function CompetitionKnowledgeTab({ competitionId, isOrganizer }: CompetitionKnowledgeTabProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAddResource, setShowAddResource] = useState(false);
  const [showScrape, setShowScrape] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [editRules, setEditRules] = useState(false);
  const [rulesSummary, setRulesSummary] = useState("");
  const [rulesSummaryAr, setRulesSummaryAr] = useState("");
  const [scoringNotes, setScoringNotes] = useState("");
  const [scoringNotesAr, setScoringNotesAr] = useState("");

  const [resourceForm, setResourceForm] = useState({
    title: "", title_ar: "", description: "", description_ar: "",
    resource_type: "document" as ResourceType, url: "",
    tags: "", is_judge_resource: true,
  });

  // Fetch competition details for rules
  const { data: competition } = useQuery({
    queryKey: ["competition-knowledge", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("rules_summary, rules_summary_ar, scoring_notes, scoring_notes_ar, title, title_ar")
        .eq("id", competitionId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch competition-specific resources
  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ["competition-resources", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_resources")
        .select("id, title, title_ar, description, description_ar, resource_type, file_url, url, file_type, file_size, tags, is_judge_resource, is_published, category_id, competition_id, view_count, added_by, created_at")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch competition criteria
  const { data: criteria } = useQuery({
    queryKey: ["competition-criteria-knowledge", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judging_criteria")
        .select("id, competition_id, name, name_ar, description, description_ar, max_score, weight, sort_order")
        .eq("competition_id", competitionId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Initialize edit form when competition loads
  const startEditRules = () => {
    setRulesSummary(competition?.rules_summary || "");
    setRulesSummaryAr(competition?.rules_summary_ar || "");
    setScoringNotes(competition?.scoring_notes || "");
    setScoringNotesAr(competition?.scoring_notes_ar || "");
    setEditRules(true);
  };

  // Save rules summary
  const saveRulesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("competitions")
        .update({
          rules_summary: rulesSummary || null,
          rules_summary_ar: rulesSummaryAr || null,
          scoring_notes: scoringNotes || null,
          scoring_notes_ar: scoringNotesAr || null,
        })
        .eq("id", competitionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-knowledge", competitionId] });
      setEditRules(false);
      toast({ title: language === "ar" ? "تم الحفظ" : "Rules saved" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  // Add resource
  const addResourceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("knowledge_resources").insert({
        title: resourceForm.title,
        title_ar: resourceForm.title_ar || null,
        description: resourceForm.description || null,
        description_ar: resourceForm.description_ar || null,
        resource_type: resourceForm.resource_type,
        url: resourceForm.url || null,
        tags: resourceForm.tags ? resourceForm.tags.split(",").map(t => t.trim()) : [],
        is_published: true,
        is_judge_resource: resourceForm.is_judge_resource,
        competition_id: competitionId,
        added_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-resources", competitionId] });
      setShowAddResource(false);
      setResourceForm({
        title: "", title_ar: "", description: "", description_ar: "",
        resource_type: "document", url: "", tags: "", is_judge_resource: true,
      });
      toast({ title: language === "ar" ? "تمت الإضافة" : "Resource added" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  // Delete resource
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-resources", competitionId] });
      toast({ title: language === "ar" ? "تم الحذف" : "Deleted" });
    },
  });

  // Scrape URL
  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firecrawl-scrape`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url: scrapeUrl, options: { formats: ["markdown"] } }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Scraping failed");

      const markdown = data.data?.markdown || data.markdown || "";
      const title = data.data?.metadata?.title || data.metadata?.title || scrapeUrl;
      const { error } = await supabase.from("knowledge_resources").insert({
        title,
        description: (data.data?.metadata?.description || data.metadata?.description || "").slice(0, 500),
        resource_type: "scraped_content",
        url: scrapeUrl,
        scraped_content: markdown,
        is_published: true,
        is_judge_resource: true,
        competition_id: competitionId,
        added_by: user?.id,
        tags: ["scraped"],
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["competition-resources", competitionId] });
      setScrapeUrl("");
      setShowScrape(false);
      toast({ title: language === "ar" ? "تم استخراج المحتوى" : "Content scraped successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Scrape failed", description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setIsScraping(false);
    }
  };

  // AI Summarize rules from resources
  const handleAISummarize = async () => {
    setIsSummarizing(true);
    try {
      const allContent = (resources || [])
        .map(r => r.scraped_content || r.description || "")
        .filter(Boolean)
        .join("\n\n---\n\n");

      const criteriaText = (criteria || [])
        .map(c => `${c.name}: ${c.description || ""} (Max: ${c.max_score}, Weight: ${c.weight})`)
        .join("\n");

      const prompt = language === "ar"
        ? `بناءً على المعلومات التالية، قم بإنشاء ملخص شامل لقواعد ومعايير التحكيم لهذه المسابقة:\n\nالمعايير:\n${criteriaText}\n\nالمحتوى:\n${allContent}\n\nقدم ملخصاً واضحاً ومنظماً.`
        : `Based on the following information, create a comprehensive summary of the rules and judging criteria for this competition:\n\nCriteria:\n${criteriaText}\n\nContent:\n${allContent}\n\nProvide a clear, structured summary.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/judge-ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            question: prompt,
            competition_id: competitionId,
            language,
          }),
        }
      );

      if (!response.ok) throw new Error("AI summarization failed");

      // Read streamed response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let summary = "";

      if (reader) {
        let textBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) summary += content;
            } catch { /* skip */ }
          }
        }
      }

      if (summary) {
        setRulesSummary(summary);
        setEditRules(true);
        toast({ title: language === "ar" ? "تم إنشاء الملخص" : "Summary generated — review and save" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Failed to summarize" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const resourceTypeIcon = (type: string) => {
    switch (type) {
      case "link": return <Link className="h-4 w-4" />;
      case "scraped_content": return <Globe className="h-4 w-4" />;
      case "image": return <Image className="h-4 w-4" />;
      case "law": return <Scale className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Rules Summary Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {language === "ar" ? "ملخص القواعد والتعليمات" : "Rules & Instructions Summary"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? "القواعد والتعليمات الخاصة بهذه المسابقة"
                  : "Competition-specific rules, instructions, and scoring guidelines"}
              </CardDescription>
            </div>
            {isOrganizer && !editRules && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleAISummarize} disabled={isSummarizing}>
                  {isSummarizing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}
                  {language === "ar" ? "تلخيص بالذكاء الاصطناعي" : "AI Summarize"}
                </Button>
                <Button size="sm" onClick={startEditRules}>
                   <Save className="me-2 h-4 w-4" />
                  {language === "ar" ? "تعديل" : "Edit"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editRules ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "ملخص القواعد (إنجليزي)" : "Rules Summary (English)"}</Label>
                  <Textarea value={rulesSummary} onChange={e => setRulesSummary(e.target.value)} rows={8} placeholder="Competition rules and instructions..." />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "ملخص القواعد (عربي)" : "Rules Summary (Arabic)"}</Label>
                  <Textarea dir="rtl" value={rulesSummaryAr} onChange={e => setRulesSummaryAr(e.target.value)} rows={8} placeholder="قواعد وتعليمات المسابقة..." />
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "ملاحظات التقييم (إنجليزي)" : "Scoring Notes (English)"}</Label>
                  <Textarea value={scoringNotes} onChange={e => setScoringNotes(e.target.value)} rows={6} placeholder="Scoring guidelines and notes..." />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "ملاحظات التقييم (عربي)" : "Scoring Notes (Arabic)"}</Label>
                  <Textarea dir="rtl" value={scoringNotesAr} onChange={e => setScoringNotesAr(e.target.value)} rows={6} placeholder="إرشادات وملاحظات التقييم..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditRules(false)}>
                  <X className="me-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={() => saveRulesMutation.mutate()} disabled={saveRulesMutation.isPending}>
                  <Save className="me-2 h-4 w-4" /> {language === "ar" ? "حفظ" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {competition?.rules_summary || competition?.rules_summary_ar ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">
                    {language === "ar" && competition.rules_summary_ar
                      ? competition.rules_summary_ar
                      : competition?.rules_summary || (language === "ar" ? "لم يتم إضافة ملخص بعد" : "No summary added yet")}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {language === "ar"
                    ? "لم يتم إضافة ملخص للقواعد بعد. يمكنك إضافة موارد ثم استخدام الذكاء الاصطناعي لإنشاء ملخص تلقائي."
                    : "No rules summary yet. Add resources below, then use AI Summarize to auto-generate."}
                </p>
              )}
              {(competition?.scoring_notes || competition?.scoring_notes_ar) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">
                      {language === "ar" ? "ملاحظات التقييم" : "Scoring Notes"}
                    </h4>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {language === "ar" && competition.scoring_notes_ar
                        ? competition.scoring_notes_ar
                        : competition?.scoring_notes}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Judging Criteria Quick View */}
      {criteria && criteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5" />
              {language === "ar" ? "معايير التحكيم" : "Judging Criteria"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {criteria.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium text-sm">
                      {language === "ar" && c.name_ar ? c.name_ar : c.name}
                    </p>
                    {(c.description || c.description_ar) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {language === "ar" && c.description_ar ? c.description_ar : c.description}
                      </p>
                    )}
                  </div>
                  <div className="text-end shrink-0 ms-2">
                    <Badge variant="secondary">{c.max_score} pts</Badge>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === "ar" ? `وزن: ${c.weight}` : `Weight: ${c.weight}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competition Resources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              {language === "ar" ? "الموارد والمستندات" : "Resources & Documents"}
            </CardTitle>
            {isOrganizer && !showAddResource && !showScrape && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowScrape(true)}>
                   <Globe className="me-2 h-4 w-4" />
                  {language === "ar" ? "استخراج من رابط" : "Scrape URL"}
                </Button>
                <Button size="sm" onClick={() => setShowAddResource(true)}>
                  <Plus className="me-2 h-4 w-4" />
                  {language === "ar" ? "إضافة" : "Add"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scrape URL Form */}
          {showScrape && (
            <div className="rounded-xl border p-4 space-y-3">
              <Label>{language === "ar" ? "رابط لاستخراج المحتوى" : "URL to scrape"}</Label>
              <Input
                value={scrapeUrl}
                onChange={e => setScrapeUrl(e.target.value)}
                placeholder="https://example.com/competition-rules"
                disabled={isScraping}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowScrape(false); setScrapeUrl(""); }} disabled={isScraping}>
                  <X className="me-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleScrape} disabled={!scrapeUrl.trim() || isScraping}>
                  {isScraping ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Globe className="me-2 h-4 w-4" />}
                  {isScraping ? (language === "ar" ? "جاري..." : "Scraping...") : (language === "ar" ? "استخراج" : "Scrape")}
                </Button>
              </div>
            </div>
          )}

          {/* Add Resource Form */}
          {showAddResource && (
            <div className="rounded-xl border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input value={resourceForm.title} onChange={e => setResourceForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Title (Arabic)</Label>
                  <Input dir="rtl" value={resourceForm.title_ar} onChange={e => setResourceForm(f => ({ ...f, title_ar: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{language === "ar" ? "النوع" : "Type"}</Label>
                  <Select value={resourceForm.resource_type} onValueChange={v => setResourceForm(f => ({ ...f, resource_type: v as ResourceType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="law">Law / Regulation</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">URL</Label>
                  <Input value={resourceForm.url} onChange={e => setResourceForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "ar" ? "الوصف" : "Description"}</Label>
                <Textarea value={resourceForm.description} onChange={e => setResourceForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={resourceForm.is_judge_resource} onCheckedChange={v => setResourceForm(f => ({ ...f, is_judge_resource: v }))} />
                  <Label className="text-xs">{language === "ar" ? "مرجع للحكام" : "Judge Resource"}</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddResource(false)}>
                  <X className="me-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button size="sm" onClick={() => addResourceMutation.mutate()} disabled={!resourceForm.title || addResourceMutation.isPending}>
                  <Save className="me-2 h-4 w-4" /> {language === "ar" ? "حفظ" : "Save"}
                </Button>
              </div>
            </div>
          )}

          {/* Resources List */}
          {loadingResources ? (
            <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : resources && resources.length > 0 ? (
            <div className="space-y-2">
              {resources.map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10">
                      {resourceTypeIcon(r.resource_type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {language === "ar" && r.title_ar ? r.title_ar : r.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.resource_type}</Badge>
                        {r.is_judge_resource && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {language === "ar" ? "للحكام" : "Judge"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOrganizer && (
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => deleteResourceMutation.mutate(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              {language === "ar"
                ? "لم تتم إضافة أي موارد لهذه المسابقة بعد"
                : "No resources added for this competition yet"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rubric Templates */}
      <RubricTemplatesPanel competitionId={competitionId} isAdmin={isOrganizer} />

      {/* Reference Gallery */}
      <ReferenceGalleryPanel competitionId={competitionId} isAdmin={isOrganizer} isJudge={false} />

      {/* Judge AI Assistant */}
      <JudgeAIAssistant competitionId={competitionId} className="h-[600px]" />
    </div>
  );
}
