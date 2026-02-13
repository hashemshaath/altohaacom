import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Package, Trophy, LayoutDashboard, BookTemplate, ClipboardList,
  Search, Plus, ChevronRight, Users, Shield, Eye, CheckCircle,
  XCircle, Download, Trash2, Copy, ArrowRight,
} from "lucide-react";
import { ORDER_CATEGORIES } from "@/components/competitions/order-center/OrderCenterCategories";
import { DISH_TEMPLATES, type DishTemplate } from "@/data/dishTemplates";

// ── Access level config ──
const ACCESS_LEVELS = [
  { role: "admin", labelEn: "Admin / Supervisor", labelAr: "مدير / مشرف", permissions: ["full_control", "manage_templates", "approve_orders", "assign_items", "view_all"] },
  { role: "organizer", labelEn: "Competition Manager", labelAr: "مدير المسابقة", permissions: ["manage_own_competition", "approve_requests", "assign_items", "create_orders"] },
  { role: "chef", labelEn: "Chef / Judge", labelAr: "شيف / حكم", permissions: ["submit_requests", "view_own_items"] },
  { role: "competitor", labelEn: "Competitor / Cook", labelAr: "متسابق / طباخ", permissions: ["submit_requests", "view_assigned"] },
] as const;

const PERMISSION_LABELS: Record<string, { en: string; ar: string }> = {
  full_control: { en: "Full Control", ar: "تحكم كامل" },
  manage_templates: { en: "Manage Templates", ar: "إدارة القوالب" },
  approve_orders: { en: "Approve Orders", ar: "الموافقة على الطلبات" },
  assign_items: { en: "Assign Items", ar: "تعيين العناصر" },
  view_all: { en: "View All Orders", ar: "عرض جميع الطلبات" },
  manage_own_competition: { en: "Manage Own Competition", ar: "إدارة مسابقته" },
  approve_requests: { en: "Approve Requests", ar: "الموافقة على الطلبات" },
  create_orders: { en: "Create Orders", ar: "إنشاء طلبات" },
  submit_requests: { en: "Submit Requests", ar: "تقديم طلبات" },
  view_own_items: { en: "View Own Items", ar: "عرض عناصره" },
  view_assigned: { en: "View Assigned", ar: "عرض المخصص" },
};

export default function OrderCenterAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<DishTemplate | null>(null);
  const [competitionFilter, setCompetitionFilter] = useState("all");

  // Fetch competitions for overview
  const { data: competitions = [] } = useQuery({
    queryKey: ["order-center-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, country_code, start_date")
        .in("status", ["upcoming", "registration_open", "in_progress", "judging"])
        .order("start_date", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all requirement lists across competitions
  const { data: allLists = [], isLoading: listsLoading } = useQuery({
    queryKey: ["order-center-all-lists", competitionFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("requirement_lists")
        .select("*, competitions:competition_id(id, title, title_ar)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (competitionFilter !== "all") {
        query = query.eq("competition_id", competitionFilter);
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,title_ar.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch requirement items for stats
  const { data: allItems = [] } = useQuery({
    queryKey: ["order-center-all-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("id, list_id, status, quantity, estimated_cost")
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  // Fetch templates 
  const { data: savedTemplates = [] } = useQuery({
    queryKey: ["order-center-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_templates" as any)
        .select("*")
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Apply dish template to a competition
  const applyDishTemplate = useMutation({
    mutationFn: async ({ template, competitionId }: { template: DishTemplate; competitionId: string }) => {
      // Create list
      const { data: newList, error: listError } = await supabase
        .from("requirement_lists")
        .insert({
          competition_id: competitionId,
          title: template.name,
          title_ar: template.nameAr,
          category: "food_ingredients",
          created_by: user!.id,
          description: template.description,
        })
        .select("id")
        .single();
      if (listError) throw listError;

      // Insert ingredient items
      const items = template.ingredients.map((ing, idx) => ({
        list_id: newList.id,
        custom_name: ing.name,
        custom_name_ar: ing.nameAr,
        quantity: ing.quantity,
        unit: ing.unit,
        sort_order: idx,
      }));

      const { error: itemsError } = await supabase
        .from("requirement_list_items")
        .insert(items);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-center-all-lists"] });
      queryClient.invalidateQueries({ queryKey: ["order-center-all-items"] });
      toast({ title: isAr ? "تم تطبيق القالب بنجاح" : "Template applied successfully" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // Stats
  const totalLists = allLists.length;
  const totalItems = allItems.length;
  const pendingItems = allItems.filter((i: any) => i.status === "pending" || !i.status).length;
  const fulfilledItems = allItems.filter((i: any) => i.status === "fulfilled").length;
  const totalEstCost = allItems.reduce((sum: number, i: any) => sum + (Number(i.estimated_cost) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-chart-4/5 to-chart-5/10 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-4 text-primary-foreground shadow-lg">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isAr ? "مركز إدارة الطلبات" : "Order Management Center"}</h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? "إدارة مركزية شاملة لجميع متطلبات وتجهيزات المسابقات" : "Centralized management of all competition requirements & supplies"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <LayoutDashboard className="h-3.5 w-3.5" /> {isAr ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="lists" className="gap-1.5 text-xs">
            <ClipboardList className="h-3.5 w-3.5" /> {isAr ? "قوائم المتطلبات" : "Requirement Lists"}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs">
            <BookTemplate className="h-3.5 w-3.5" /> {isAr ? "قوالب الأطباق" : "Dish Templates"}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" /> {isAr ? "الصلاحيات" : "Access Control"}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{competitions.length}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "مسابقات نشطة" : "Active Competitions"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-chart-3">{totalLists}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "قوائم متطلبات" : "Requirement Lists"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-chart-4">{pendingItems}/{totalItems}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "عناصر معلقة" : "Pending Items"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-chart-5">{totalEstCost.toLocaleString()} SAR</p>
                <p className="text-xs text-muted-foreground">{isAr ? "التكلفة التقديرية" : "Estimated Cost"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Competitions with Order Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                {isAr ? "المسابقات والطلبات" : "Competitions & Orders"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {competitions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">{isAr ? "لا توجد مسابقات نشطة" : "No active competitions"}</p>
              ) : (
                <div className="space-y-2">
                  {competitions.map((comp: any) => {
                    const compLists = allLists.filter((l: any) => l.competition_id === comp.id);
                    const compItems = allItems.filter((i: any) => compLists.some((l: any) => l.id === i.list_id));
                    const fulfilled = compItems.filter((i: any) => i.status === "fulfilled").length;
                    const pct = compItems.length > 0 ? Math.round((fulfilled / compItems.length) * 100) : 0;
                    return (
                      <div key={comp.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{isAr && comp.title_ar ? comp.title_ar : comp.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {compLists.length} {isAr ? "قوائم" : "lists"} · {compItems.length} {isAr ? "عنصر" : "items"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{pct}%</Badge>
                          <Badge variant="secondary" className="text-[10px]">{comp.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Requirement Lists ── */}
        <TabsContent value="lists" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث..." : "Search..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="ps-9 h-9"
              />
            </div>
            <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
              <SelectTrigger className="w-[200px] h-9 text-xs">
                <SelectValue placeholder={isAr ? "كل المسابقات" : "All Competitions"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                {competitions.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {isAr && c.title_ar ? c.title_ar : c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {listsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : allLists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">{isAr ? "لا توجد قوائم" : "No requirement lists found"}</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isAr ? "القائمة" : "List"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "المسابقة" : "Competition"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الفئة" : "Category"}</TableHead>
                    <TableHead className="text-xs text-center">{isAr ? "العناصر" : "Items"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLists.map((list: any) => {
                    const catDef = ORDER_CATEGORIES.find(c => c.value === list.category);
                    const listItems = allItems.filter((i: any) => i.list_id === list.id);
                    return (
                      <TableRow key={list.id}>
                        <TableCell className="text-sm font-medium">
                          {isAr && list.title_ar ? list.title_ar : list.title}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {list.competitions ? (isAr && list.competitions.title_ar ? list.competitions.title_ar : list.competitions.title) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {catDef ? (isAr ? catDef.labelAr : catDef.label) : list.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs">{listItems.length}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {list.status || (isAr ? "مسودة" : "Draft")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </TabsContent>

        {/* ── Dish Templates ── */}
        <TabsContent value="templates" className="mt-4 space-y-6">
          {selectedTemplate ? (
            <TemplateDetail
              template={selectedTemplate}
              competitions={competitions}
              isAr={isAr}
              onBack={() => setSelectedTemplate(null)}
              onApply={(competitionId) => {
                applyDishTemplate.mutate({ template: selectedTemplate, competitionId });
              }}
              isApplying={applyDishTemplate.isPending}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{isAr ? "قوالب الأطباق الجاهزة" : "Default Dish Templates"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "قوالب جاهزة بالمكونات الأساسية لكل نوع طبق" : "Pre-built templates with default ingredients for each dish type"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {DISH_TEMPLATES.map((tpl) => (
                  <Card
                    key={tpl.id}
                    className="cursor-pointer border-border/60 hover:shadow-md hover:border-primary/30 transition-all group"
                    onClick={() => setSelectedTemplate(tpl)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${tpl.color}/10`}>
                          <tpl.icon className={`h-5 w-5 text-${tpl.color}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{isAr ? tpl.nameAr : tpl.name}</h4>
                          <p className="text-[11px] text-muted-foreground">{isAr ? tpl.descriptionAr : tpl.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {tpl.ingredients.length} {isAr ? "مكون" : "ingredients"}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Saved custom templates */}
              {savedTemplates.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{isAr ? "القوالب المحفوظة" : "Saved Custom Templates"}</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {savedTemplates.map((tpl: any) => (
                        <Card key={tpl.id} className="border-border/60">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-4 w-4 text-primary" />
                              <h4 className="text-sm font-medium">{isAr && tpl.name_ar ? tpl.name_ar : tpl.name}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{(tpl.items || []).length} {isAr ? "عنصر" : "items"}</span>
                              {tpl.usage_count > 0 && (
                                <>
                                  <span>·</span>
                                  <span><Copy className="inline h-2.5 w-2.5" /> {tpl.usage_count}x</span>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Access Control ── */}
        <TabsContent value="permissions" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {isAr ? "مصفوفة الصلاحيات" : "Permission Matrix"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                {isAr
                  ? "صلاحيات الوصول لمركز الطلبات حسب دور المستخدم. يتحكم المدير والمشرف بشكل كامل، بينما يقتصر وصول الشيف والمتسابق على تقديم الطلبات ومتابعتها."
                  : "Order Center access permissions by user role. Admin and supervisor have full control, while chefs and competitors are limited to submitting requests and tracking their items."
                }
              </p>
              <div className="space-y-4">
                {ACCESS_LEVELS.map((level) => (
                  <div key={level.role} className="rounded-lg border p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{isAr ? level.labelAr : level.labelEn}</h4>
                        <p className="text-[11px] text-muted-foreground capitalize">{level.role}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {level.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-[10px]">
                          {isAr ? PERMISSION_LABELS[perm]?.ar : PERMISSION_LABELS[perm]?.en}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Template Detail View ──
function TemplateDetail({
  template, competitions, isAr, onBack, onApply, isApplying,
}: {
  template: DishTemplate;
  competitions: any[];
  isAr: boolean;
  onBack: () => void;
  onApply: (competitionId: string) => void;
  isApplying: boolean;
}) {
  const [targetCompetition, setTargetCompetition] = useState("");

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ChevronRight className={`h-3.5 w-3.5 ${isAr ? "" : "rotate-180"}`} />
        {isAr ? "العودة للقوالب" : "Back to Templates"}
      </Button>

      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-${template.color}/10`}>
          <template.icon className={`h-7 w-7 text-${template.color}`} />
        </div>
        <div>
          <h2 className="text-xl font-bold">{isAr ? template.nameAr : template.name}</h2>
          <p className="text-sm text-muted-foreground">{isAr ? template.descriptionAr : template.description}</p>
        </div>
      </div>

      {/* Apply to competition */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <Label className="text-xs mb-2 block">{isAr ? "تطبيق على مسابقة" : "Apply to Competition"}</Label>
          <div className="flex gap-2">
            <Select value={targetCompetition} onValueChange={setTargetCompetition}>
              <SelectTrigger className="h-9 text-xs flex-1">
                <SelectValue placeholder={isAr ? "اختر مسابقة..." : "Select competition..."} />
              </SelectTrigger>
              <SelectContent>
                {competitions.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {isAr && c.title_ar ? c.title_ar : c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!targetCompetition || isApplying}
              onClick={() => onApply(targetCompetition)}
              className="gap-1.5"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              {isAr ? "تطبيق" : "Apply"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {isAr ? "المكونات والمتطلبات" : "Ingredients & Requirements"} ({template.ingredients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-10">#</TableHead>
                <TableHead className="text-xs">{isAr ? "العنصر" : "Item"}</TableHead>
                <TableHead className="text-xs text-center">{isAr ? "الكمية" : "Qty"}</TableHead>
                <TableHead className="text-xs">{isAr ? "الوحدة" : "Unit"}</TableHead>
                <TableHead className="text-xs">{isAr ? "الفئة" : "Category"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.ingredients.map((ing, idx) => {
                const catDef = ORDER_CATEGORIES.find(c => c.value === ing.category);
                return (
                  <TableRow key={idx}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ing.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm">{isAr ? ing.nameAr : ing.name}</p>
                          <p className="text-[10px] text-muted-foreground">{isAr ? ing.name : ing.nameAr}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">{ing.quantity}</TableCell>
                    <TableCell className="text-xs">{ing.unit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px]">
                        {catDef ? (isAr ? catDef.labelAr : catDef.label) : ing.category}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
