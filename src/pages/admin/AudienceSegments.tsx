import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SegmentBroadcastDialog } from "@/components/crm/SegmentBroadcastDialog";
import { supabase } from "@/integrations/supabase/client";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  Plus,
  Users,
  Globe,
  Shield,
  Activity,
  Calendar,
  Trash2,
  Edit,
  Send,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminWidgetSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

interface Segment {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  filters: {
    roles?: string[];
    countries?: string[];
    has_competed?: boolean;
    has_judged?: boolean;
    registered_after?: string;
    registered_before?: string;
    is_verified?: boolean;
  };
  estimated_reach: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

const AVAILABLE_ROLES = [
  { value: "chef", en: "Chef", ar: "طاهٍ" },
  { value: "judge", en: "Judge", ar: "حكم" },
  { value: "organizer", en: "Organizer", ar: "منظم" },
  { value: "supervisor", en: "Supervisor", ar: "مشرف" },
  { value: "student", en: "Student", ar: "طالب" },
  { value: "mentor", en: "Mentor", ar: "مرشد" },
];

export default function AudienceSegments() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [broadcastSegment, setBroadcastSegment] = useState<Segment | null>(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [hasCompeted, setHasCompeted] = useState(false);
  const [hasJudged, setHasJudged] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [registeredAfter, setRegisteredAfter] = useState("");

  // Fetch segments
  const { data: segments = [], isLoading } = useQuery({
    queryKey: ["audienceSegments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audience_segments")
        .select("id, name, name_ar, description, description_ar, filters, estimated_reach, is_active, last_used_at, created_by, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Segment[];
    },
  });

  const bulkSegments = useAdminBulkActions(segments);

  const { exportCSV: exportSegmentsCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (s: Segment) => isAr && s.name_ar ? s.name_ar : s.name },
      { header: isAr ? "الوصف" : "Description", accessor: (s: Segment) => s.description || "" },
      { header: isAr ? "الوصول المقدر" : "Est. Reach", accessor: (s: Segment) => s.estimated_reach },
      { header: isAr ? "نشط" : "Active", accessor: (s: Segment) => s.is_active ? "Yes" : "No" },
      { header: isAr ? "التاريخ" : "Created", accessor: (s: Segment) => format(new Date(s.created_at), "yyyy-MM-dd") },
    ],
    filename: "audience-segments",
  });

  const bulkDeleteSegments = async () => {
    for (const id of bulkSegments.selected) {
      await deleteSegment.mutateAsync(id);
    }
    bulkSegments.clearSelection();
  };

  // Fetch countries for filter
  const { data: countries = [] } = useQuery({
    queryKey: ["countriesList"],
    queryFn: async () => {
      const { data } = await supabase
        .from("countries")
        .select("code, name, name_ar")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  // Estimate reach
  const estimateReach = async (filters: any): Promise<number> => {
    const { count } = await supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true }) as { count: number | null };
    return count || 0;
  };

  // Create segment
  const createSegment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const filters: any = {};
      if (selectedRoles.length > 0) filters.roles = selectedRoles;
      if (selectedCountries.length > 0) filters.countries = selectedCountries;
      if (hasCompeted) filters.has_competed = true;
      if (hasJudged) filters.has_judged = true;
      if (isVerified) filters.is_verified = true;
      if (registeredAfter) filters.registered_after = registeredAfter;

      const reach = await estimateReach(filters);

      const { error } = await supabase.from("audience_segments").insert({
        name,
        name_ar: nameAr || null,
        description: description || null,
        filters,
        estimated_reach: reach,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audienceSegments"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: isAr ? "تم إنشاء الشريحة" : "Segment created" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Delete segment
  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("audience_segments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audienceSegments"] });
      toast({ title: isAr ? "تم حذف الشريحة" : "Segment deleted" });
    },
  });

  const resetForm = () => {
    setName("");
    setNameAr("");
    setDescription("");
    setSelectedRoles([]);
    setSelectedCountries([]);
    setHasCompeted(false);
    setHasJudged(false);
    setIsVerified(false);
    setRegisteredAfter("");
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Target}
        title={isAr ? "شرائح الجمهور" : "Audience Segments"}
        description={isAr ? "إنشاء شرائح مستهدفة للإشعارات والحملات" : "Create targeted segments for notifications & campaigns"}
        actions={
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {isAr ? "شريحة جديدة" : "New Segment"}
          </Button>
        }
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isAr ? "إنشاء شريحة جمهور" : "Create Audience Segment"}</DialogTitle>
              <DialogDescription>
                {isAr ? "حدد معايير الاستهداف لهذه الشريحة" : "Define targeting criteria for this segment"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={isAr ? "اسم الشريحة (EN)" : "Segment Name"} value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder={isAr ? "الاسم بالعربي" : "Arabic Name"} value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" />
              </div>
              <Textarea placeholder={isAr ? "الوصف..." : "Description..."} value={description} onChange={e => setDescription(e.target.value)} rows={2} />

              <Separator />

              {/* Roles Filter */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {isAr ? "الأدوار" : "Roles"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ROLES.map(role => (
                    <Button
                      key={role.value}
                      variant={selectedRoles.includes(role.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRole(role.value)}
                    >
                      {isAr ? role.ar : role.en}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Countries Filter */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  {isAr ? "الدول" : "Countries"}
                </h4>
                <Select onValueChange={v => {
                  if (!selectedCountries.includes(v)) setSelectedCountries(prev => [...prev, v]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? "اختر دولة..." : "Select country..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {isAr ? c.name_ar || c.name : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCountries.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedCountries.map(code => (
                      <Badge
                        key={code}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setSelectedCountries(prev => prev.filter(c => c !== code))}
                      >
                        {code} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity Filter */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  {isAr ? "النشاط" : "Activity & Engagement"}
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={hasCompeted} onCheckedChange={v => setHasCompeted(!!v)} />
                    {isAr ? "شارك في مسابقة" : "Has competed"}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={hasJudged} onCheckedChange={v => setHasJudged(!!v)} />
                    {isAr ? "حكّم في مسابقة" : "Has judged"}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={isVerified} onCheckedChange={v => setIsVerified(!!v)} />
                    {isAr ? "حساب موثق" : "Verified account"}
                  </label>
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {isAr ? "تاريخ التسجيل" : "Registration Date"}
                </h4>
                <Input
                  type="date"
                  value={registeredAfter}
                  onChange={e => setRegisteredAfter(e.target.value)}
                  placeholder={isAr ? "مسجل بعد..." : "Registered after..."}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createSegment.mutate()}
                disabled={!name.trim() || createSegment.isPending}
              >
                {createSegment.isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء الشريحة" : "Create Segment")}
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>

      <BulkActionBar
        count={bulkSegments.count}
        onClear={bulkSegments.clearSelection}
        onExport={() => exportSegmentsCSV(bulkSegments.selectedItems)}
        onDelete={bulkDeleteSegments}
      />

      {/* Segments Grid */}
      {isLoading ? (
        <AdminWidgetSkeleton rows={4} />
      ) : segments.length === 0 ? (
        <AdminEmptyState
          icon={Target}
          title="No segments yet"
          titleAr="لا توجد شرائح"
          description="Create a segment to target specific user groups"
          descriptionAr="أنشئ شريحة لاستهداف مجموعة معينة من المستخدمين"
          actionLabel="New Segment"
          actionLabelAr="شريحة جديدة"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map(segment => {
            const filters = segment.filters || {};
            const filterCount = Object.keys(filters).filter(k => {
              const v = (filters as any)[k];
              return v && (Array.isArray(v) ? v.length > 0 : true);
            }).length;

            return (
              <Card key={segment.id} className={`transition-all hover:shadow-md hover:-translate-y-0.5 ${bulkSegments.isSelected(segment.id) ? "ring-1 ring-primary/30" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={bulkSegments.isSelected(segment.id)}
                        onCheckedChange={() => bulkSegments.toggleOne(segment.id)}
                      />
                      <CardTitle className="text-base">
                        {isAr && segment.name_ar ? segment.name_ar : segment.name}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteSegment.mutate(segment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {segment.description && (
                    <p className="text-xs text-muted-foreground">{segment.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary" />
                      <AnimatedCounter value={segment.estimated_reach} className="text-lg font-bold" format />
                      <span className="text-xs text-muted-foreground">{isAr ? "مستخدم" : "users"}</span>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Filter className="h-3 w-3" />
                      {filterCount} {isAr ? "فلتر" : "filters"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {filters.roles?.map((r: string) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        <Shield className="me-0.5 h-2.5 w-2.5" />{r}
                      </Badge>
                    ))}
                    {filters.countries?.map((c: string) => (
                      <Badge key={c} variant="secondary" className="text-[10px]">
                        <Globe className="me-0.5 h-2.5 w-2.5" />{c}
                      </Badge>
                    ))}
                    {filters.is_verified && (
                      <Badge variant="secondary" className="text-[10px]">✓ {isAr ? "موثق" : "Verified"}</Badge>
                    )}
                    {filters.has_competed && (
                      <Badge variant="secondary" className="text-[10px]">{isAr ? "مشارك" : "Competed"}</Badge>
                    )}
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(segment.created_at), "MMM d, yyyy")}
                    </span>
                    <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => setBroadcastSegment(segment)}>
                      <Send className="h-3 w-3" />
                      {isAr ? "إرسال إشعار" : "Send Notification"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Broadcast Dialog */}
      {broadcastSegment && (
        <SegmentBroadcastDialog
          open={!!broadcastSegment}
          onOpenChange={(open) => !open && setBroadcastSegment(null)}
          segmentName={isAr && broadcastSegment.name_ar ? broadcastSegment.name_ar : broadcastSegment.name}
          segmentId={broadcastSegment.id}
          estimatedReach={broadcastSegment.estimated_reach}
          filters={broadcastSegment.filters}
        />
      )}
    </div>
  );
}
