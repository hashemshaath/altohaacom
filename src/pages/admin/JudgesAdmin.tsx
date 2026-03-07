import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Search, Gavel, Pencil, Trash2, Plus, Eye, FileText, Building2, MapPin, Users, Upload, Download, Calendar } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { format } from "date-fns";
import JudgeProfileForm from "@/components/judges/JudgeProfileForm";
import JudgeDocumentsPanel from "@/components/judges/JudgeDocumentsPanel";
import JudgeMembershipsPanel from "@/components/judges/JudgeMembershipsPanel";
import JudgeVisitLogsPanel from "@/components/judges/JudgeVisitLogsPanel";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

export default function JudgesAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  // Fetch all judges (users with judge role) + their extended profiles
  const { data: judges, isLoading } = useQuery({
    queryKey: ["admin-judges"],
    queryFn: async () => {
      // Get all judge role users
      const { data: judgeRoles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "judge");
      if (rolesErr) throw rolesErr;
      if (!judgeRoles?.length) return [];

      const judgeUserIds = judgeRoles.map(r => r.user_id);

      // Get profiles
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, email, phone, country_code, specialization, account_status")
        .in("user_id", judgeUserIds);
      if (profErr) throw profErr;

      // Get judge extended profiles
      const { data: judgeProfiles, error: jpErr } = await supabase
        .from("judge_profiles")
        .select("*")
        .in("user_id", judgeUserIds);
      if (jpErr) throw jpErr;

      // Get document counts
      const { data: docCounts } = await supabase
        .from("judge_documents")
        .select("user_id")
        .in("user_id", judgeUserIds);

      // Get membership counts
      const { data: memberCounts } = await supabase
        .from("judge_memberships")
        .select("user_id")
        .in("user_id", judgeUserIds);

      // Get visit log counts
      const { data: visitCounts } = await supabase
        .from("judge_visit_logs")
        .select("user_id")
        .in("user_id", judgeUserIds);

      return profiles?.map(p => {
        const jp = judgeProfiles?.find(j => j.user_id === p.user_id);
        const docs = docCounts?.filter(d => d.user_id === p.user_id).length || 0;
        const memberships = memberCounts?.filter(m => m.user_id === p.user_id).length || 0;
        const visits = visitCounts?.filter(v => v.user_id === p.user_id).length || 0;
        return { ...p, judgeProfile: jp, docCount: docs, membershipCount: memberships, visitCount: visits };
      }) || [];
    },
  });

  // Map judges to have `id` for useAdminBulkActions (needs { id: string })
  const judgesWithId = (judges || []).map(j => ({ ...j, id: j.user_id }));

  const filtered = judgesWithId.filter(j => {
    const name = (j.full_name || "").toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
      (j.judgeProfile?.nationality || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.account_number || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === "all" || j.judgeProfile?.judge_category === filterCategory;
    const matchesLevel = filterLevel === "all" || j.judgeProfile?.judge_level === filterLevel;
    return matchesSearch && matchesCat && matchesLevel;
  });

  const bulk = useAdminBulkActions(filtered || []);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الرقم" : "Account #", accessor: (r: any) => r.account_number || "" },
      { header: isAr ? "الاسم" : "Name", accessor: (r: any) => r.full_name || "" },
      { header: isAr ? "المستوى" : "Level", accessor: (r: any) => r.judgeProfile?.judge_level || "" },
      { header: isAr ? "التخصص" : "Specialty", accessor: (r: any) => r.judgeProfile?.judge_category || "" },
      { header: isAr ? "الجنسية" : "Nationality", accessor: (r: any) => r.judgeProfile?.nationality || r.location || "" },
      { header: isAr ? "المستندات" : "Docs", accessor: (r: any) => r.docCount },
      { header: isAr ? "العضويات" : "Memberships", accessor: (r: any) => r.membershipCount },
      { header: isAr ? "المشاركات" : "Participations", accessor: (r: any) => r.visitCount },
    ],
    filename: "judges",
  });

  const stats = {
    total: judges?.length || 0,
    international: judges?.filter(j => j.judgeProfile?.judge_level === "international").length || 0,
    national: judges?.filter(j => j.judgeProfile?.judge_level === "national").length || 0,
    withProfile: judges?.filter(j => j.judgeProfile).length || 0,
  };

  // If a judge is selected, show their full profile management
  if (selectedJudgeId) {
    const selectedJudge = judges?.find(j => j.user_id === selectedJudgeId);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedJudgeId(null)}>
            ← {isAr ? "العودة" : "Back"}
          </Button>
          <h1 className="text-2xl font-bold">
            {selectedJudge?.full_name || (isAr ? "ملف القاضي" : "Judge Profile")}
          </h1>
          {selectedJudge?.account_number && (
            <Badge variant="outline" className="font-mono">{selectedJudge.account_number}</Badge>
          )}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile">{isAr ? "الملف الشخصي" : "Profile & Classification"}</TabsTrigger>
            <TabsTrigger value="documents">
              {isAr ? "المستندات" : "Documents"} ({selectedJudge?.docCount || 0})
            </TabsTrigger>
            <TabsTrigger value="memberships">
              {isAr ? "العضويات" : "Memberships"} ({selectedJudge?.membershipCount || 0})
            </TabsTrigger>
            <TabsTrigger value="visits">
              {isAr ? "سجل الزيارات" : "Visit & Participation Log"} ({selectedJudge?.visitCount || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <JudgeProfileForm userId={selectedJudgeId} isAdmin />
          </TabsContent>

          <TabsContent value="documents">
            <JudgeDocumentsPanel userId={selectedJudgeId} isAdmin />
          </TabsContent>

          <TabsContent value="memberships">
            <JudgeMembershipsPanel userId={selectedJudgeId} isAdmin />
          </TabsContent>

          <TabsContent value="visits">
            <JudgeVisitLogsPanel userId={selectedJudgeId} isAdmin />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Gavel}
        title={isAr ? "إدارة المحكّمين" : "Judges Management"}
        description={isAr ? "ملفات المحكّمين الشاملة، التصنيف، المستندات، والسجلات" : "Comprehensive judge profiles, classification, documents & records"}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: isAr ? "إجمالي المحكّمين" : "Total Judges", value: stats.total },
          { label: isAr ? "دوليين" : "International", value: stats.international },
          { label: isAr ? "وطنيين" : "National", value: stats.national },
          { label: isAr ? "ملفات مكتملة" : "With Extended Profile", value: stats.withProfile },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث بالاسم أو الجنسية أو الرقم..." : "Search by name, nationality, or number..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع التخصصات" : "All Specialties"}</SelectItem>
            <SelectItem value="culinary">{isAr ? "طهي" : "Culinary"}</SelectItem>
            <SelectItem value="pastry">{isAr ? "حلويات" : "Pastry"}</SelectItem>
            <SelectItem value="beverage">{isAr ? "مشروبات" : "Beverage"}</SelectItem>
            <SelectItem value="table_art">{isAr ? "فن الطاولة" : "Table Art"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع المستويات" : "All Levels"}</SelectItem>
            <SelectItem value="national">{isAr ? "وطني" : "National"}</SelectItem>
            <SelectItem value="international">{isAr ? "دولي" : "International"}</SelectItem>
            <SelectItem value="master">{isAr ? "ماستر" : "Master"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clearSelection}
        onExport={() => exportCSV(bulk.selectedItems)}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                </TableHead>
                <TableHead>{isAr ? "الرقم" : "#"}</TableHead>
                <TableHead>{isAr ? "المحكّم" : "Judge"}</TableHead>
                <TableHead>{isAr ? "التصنيف" : "Classification"}</TableHead>
                <TableHead>{isAr ? "الجنسية" : "Nationality"}</TableHead>
                <TableHead>{isAr ? "التخصص" : "Specialty"}</TableHead>
                <TableHead>{isAr ? "المستندات" : "Docs"}</TableHead>
                <TableHead>{isAr ? "العضويات" : "Memberships"}</TableHead>
                <TableHead>{isAr ? "المشاركات" : "Participations"}</TableHead>
                <TableHead className="text-end">{isAr ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8">{isAr ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">{isAr ? "لا يوجد محكّمين" : "No judges found"}</TableCell></TableRow>
              ) : (
                filtered?.map(judge => (
                  <TableRow key={judge.user_id} className={`cursor-pointer hover:bg-muted/50 ${bulk.isSelected(judge.id) ? "bg-primary/5" : ""}`} onClick={() => setSelectedJudgeId(judge.user_id)}>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={bulk.isSelected(judge.id)} onCheckedChange={() => bulk.toggleOne(judge.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{judge.account_number || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Gavel className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{judge.full_name || "—"}</p>
                          {judge.judgeProfile?.judge_title && (
                            <p className="text-xs text-muted-foreground">{judge.judgeProfile.judge_title}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {judge.judgeProfile?.judge_level ? (
                        <Badge variant={judge.judgeProfile.judge_level === "international" ? "default" : "secondary"}>
                          {judge.judgeProfile.judge_level}
                        </Badge>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{judge.judgeProfile?.nationality || judge.location || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {judge.judgeProfile?.judge_category ? (
                        <Badge variant="outline">{judge.judgeProfile.judge_category}</Badge>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <FileText className="h-3 w-3" /> {judge.docCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Building2 className="h-3 w-3" /> {judge.membershipCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" /> {judge.visitCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedJudgeId(judge.user_id); }}>
                          <Eye className="h-4 w-4 me-1" /> {isAr ? "عرض" : "View"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
