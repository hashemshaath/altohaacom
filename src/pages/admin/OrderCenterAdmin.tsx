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
import { Progress } from "@/components/ui/progress";
import {
  Package, Trophy, LayoutDashboard, BookTemplate, ClipboardList,
  Search, Plus, ChevronRight, Users, Shield, Eye, CheckCircle,
  XCircle, Download, Trash2, Copy, ArrowRight, FileInput, Clock, AlertTriangle,
  Truck, PackageCheck, MapPin, CalendarClock, Database, TrendingUp,
  Layers, Star, BarChart3,
} from "lucide-react";
import { ORDER_CATEGORIES } from "@/components/competitions/order-center/OrderCenterCategories";
import { DISH_TEMPLATES, type DishTemplate } from "@/data/dishTemplates";
import { downloadCSV } from "@/lib/exportUtils";
import { notifyItemRequestReviewed, notifyItemRequestFulfilled } from "@/lib/notificationTriggers";
import { AdminCatalogManager } from "@/components/competitions/order-center/AdminCatalogManager";
import { AdminListDetailPanel } from "@/components/competitions/order-center/AdminListDetailPanel";

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

  const [competitionSearch, setCompetitionSearch] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Fetch ALL competitions (past, current, future, draft) for full admin access
  const { data: allCompetitions = [] } = useQuery({
    queryKey: ["order-center-all-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, country_code, competition_start")
        .order("competition_start", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  // Filter competitions by search query for selectors
  const filteredCompetitions = allCompetitions.filter((c: any) => {
    if (!competitionSearch) return true;
    const q = competitionSearch.toLowerCase();
    return (c.title?.toLowerCase().includes(q) || c.title_ar?.includes(competitionSearch));
  });

  // Active/future competitions for assignment
  const assignableCompetitions = allCompetitions.filter((c: any) =>
    ["draft", "upcoming", "registration_open", "in_progress", "judging"].includes(c.status)
  );

  // For backward compat
  const competitions = allCompetitions;

  // Fetch all requirement lists across competitions
  const { data: allLists = [], isLoading: listsLoading } = useQuery({
    queryKey: ["order-center-all-lists", competitionFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("requirement_lists")
        .select("*, competitions:competition_id(id, title, title_ar)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (competitionFilter === "unlinked") {
        query = query.is("competition_id", null);
      } else if (competitionFilter !== "all") {
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

  // Fetch all item requests across competitions
  const { data: allRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["order-center-all-requests", competitionFilter],
    queryFn: async () => {
      let query = supabase
        .from("order_item_requests")
        .select("*, competitions:competition_id(id, title, title_ar)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (competitionFilter !== "all") {
        query = query.eq("competition_id", competitionFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      // Fetch requester profiles separately
      if (!data?.length) return [];
      const userIds = [...new Set(data.map(r => r.requester_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", userIds as string[]);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return data.map(r => ({ ...r, profiles: profileMap.get(r.requester_id!) || null }));
    },
  });

  // Review request mutation
  const reviewRequestMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { error } = await supabase.from("order_item_requests").update({
        status,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason || null,
      }).eq("id", id);
      if (error) throw error;
      return { id, status, reason };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order-center-all-requests"] });
      toast({ title: isAr ? "تم تحديث الطلب" : "Request updated" });
      // Notify requester
      const req = allRequests.find((r: any) => r.id === variables.id);
      if (req) {
        const compTitle = req.competitions?.title || "";
        const compTitleAr = req.competitions?.title_ar || undefined;
        notifyItemRequestReviewed({
          userId: req.requester_id,
          itemName: req.item_name,
          status: variables.status as "approved" | "rejected",
          reason: variables.reason,
          competitionTitle: compTitle,
          competitionTitleAr: compTitleAr,
        });
      }
    },
  });

  // Update fulfillment mutation
  const updateFulfillment = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("order_item_requests").update(updates).eq("id", id);
      if (error) throw error;
      return { id, updates };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order-center-all-requests"] });
      toast({ title: isAr ? "تم تحديث حالة التسليم" : "Delivery status updated" });
      // Notify requester when delivered
      if (variables.updates.delivery_status === "delivered") {
        const req = allRequests.find((r: any) => r.id === variables.id);
        if (req) {
          notifyItemRequestFulfilled({
            userId: req.requester_id,
            itemName: req.item_name,
            competitionTitle: req.competitions?.title || "",
            competitionTitleAr: req.competitions?.title_ar || undefined,
          });
        }
      }
    },
  });

  // Copy list (duplicate as draft, optionally unlinked)
  const copyList = async (list: any) => {
    try {
      const { data: newList, error: listError } = await supabase
        .from("requirement_lists")
        .insert({
          competition_id: list.competition_id || null,
          title: `${list.title} (copy)`,
          title_ar: list.title_ar ? `${list.title_ar} (نسخة)` : null,
          category: list.category,
          created_by: user!.id,
          description: list.description,
          description_ar: list.description_ar,
          status: "draft",
        })
        .select("id")
        .single();
      if (listError) throw listError;

      // Copy items
      const listItems = allItems.filter((i: any) => i.list_id === list.id);
      if (listItems.length) {
        const { data: origItems } = await supabase
          .from("requirement_list_items")
          .select("*")
          .eq("list_id", list.id);
        if (origItems?.length) {
          const newItems = origItems.map((item: any, idx: number) => ({
            list_id: newList.id,
            custom_name: item.custom_name,
            custom_name_ar: item.custom_name_ar,
            item_id: item.item_id,
            quantity: item.quantity,
            unit: item.unit,
            estimated_cost: item.estimated_cost,
            sort_order: idx,
          }));
          await supabase.from("requirement_list_items").insert(newItems);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["order-center-all-lists"] });
      queryClient.invalidateQueries({ queryKey: ["order-center-all-items"] });
      toast({ title: isAr ? "تم نسخ القائمة" : "List copied" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  // Delete list
  const deleteList = async (id: string) => {
    try {
      await supabase.from("requirement_list_items").delete().eq("list_id", id);
      const { error } = await supabase.from("requirement_lists").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["order-center-all-lists"] });
      queryClient.invalidateQueries({ queryKey: ["order-center-all-items"] });
      toast({ title: isAr ? "تم حذف القائمة" : "List deleted" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

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
          <TabsTrigger value="catalog" className="gap-1.5 text-xs">
            <Database className="h-3.5 w-3.5" /> {isAr ? "كتالوج العناصر" : "Item Catalog"}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5 text-xs">
            <FileInput className="h-3.5 w-3.5" /> {isAr ? "طلبات العناصر" : "Item Requests"}
            {allRequests.filter((r: any) => r.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ms-1 h-4 text-[9px] px-1">{allRequests.filter((r: any) => r.status === "pending").length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fulfillment" className="gap-1.5 text-xs">
            <Truck className="h-3.5 w-3.5" /> {isAr ? "تتبع التسليم" : "Fulfillment"}
            {allRequests.filter((r: any) => r.status === "approved" && r.delivery_status !== "delivered").length > 0 && (
              <Badge variant="secondary" className="ms-1 h-4 text-[9px] px-1">{allRequests.filter((r: any) => r.status === "approved" && r.delivery_status !== "delivered").length}</Badge>
            )}
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
          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Card><CardContent className="p-3 text-center">
              <Trophy className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-xl font-bold">{competitions.length}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "المسابقات" : "Competitions"}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <ClipboardList className="mx-auto mb-1 h-5 w-5 text-chart-3" />
              <p className="text-xl font-bold">{totalLists}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "قوائم المتطلبات" : "Req. Lists"}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <Package className="mx-auto mb-1 h-5 w-5 text-chart-1" />
              <p className="text-xl font-bold">{totalItems}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "إجمالي العناصر" : "Total Items"}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <Clock className="mx-auto mb-1 h-5 w-5 text-chart-4" />
              <p className="text-xl font-bold">{pendingItems}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "عناصر معلقة" : "Pending"}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <CheckCircle className="mx-auto mb-1 h-5 w-5 text-chart-5" />
              <p className="text-xl font-bold">{fulfilledItems}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "تم التسليم" : "Fulfilled"}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <TrendingUp className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-xl font-bold">{totalEstCost.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "التكلفة (SAR)" : "Est. Cost (SAR)"}</p>
            </CardContent></Card>
          </div>

          {/* Progress */}
          {totalItems > 0 && (
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{isAr ? "تقدم الإنجاز الإجمالي" : "Overall Fulfillment Progress"}</p>
                  <p className="text-sm font-bold text-primary">{totalItems > 0 ? Math.round((fulfilledItems / totalItems) * 100) : 0}%</p>
                </div>
                <Progress value={totalItems > 0 ? Math.round((fulfilledItems / totalItems) * 100) : 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{fulfilledItems}/{totalItems} {isAr ? "مكتمل" : "complete"}</p>
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                {isAr ? "توزيع العناصر حسب الفئة" : "Items by Category"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {ORDER_CATEGORIES.map(cat => {
                  const CatIcon = cat.icon;
                  const count = allLists.filter((l: any) => l.category === cat.value).length;
                  if (count === 0) return null;
                  return (
                    <div key={cat.value} className="flex items-center gap-2 rounded-lg border p-2">
                      <CatIcon className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{isAr ? cat.labelAr : cat.label}</p>
                        <p className="text-[10px] text-muted-foreground">{count} {isAr ? "قائمة" : "lists"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Urgent Items */}
          {allRequests.filter((r: any) => r.priority === "urgent" && r.status === "pending").length > 0 && (
            <Card className="border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {isAr ? "طلبات عاجلة بحاجة لمراجعة" : "Urgent Requests Awaiting Review"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {allRequests.filter((r: any) => r.priority === "urgent" && r.status === "pending").slice(0, 5).map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between rounded border border-destructive/10 p-2 bg-destructive/5">
                      <div>
                        <p className="text-sm font-medium">{isAr && req.item_name_ar ? req.item_name_ar : req.item_name}</p>
                        <p className="text-[10px] text-muted-foreground">{req.profiles?.full_name || "—"} · {req.competitions?.title || "—"}</p>
                      </div>
                      <Badge variant="destructive" className="text-[9px]">{isAr ? "عاجل" : "Urgent"}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                <p className="text-center text-sm text-muted-foreground py-6">{isAr ? "لا توجد مسابقات" : "No competitions"}</p>
              ) : (
                <div className="space-y-2">
                  {competitions.slice(0, 20).map((comp: any) => {
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
          {selectedListId ? (
            <AdminListDetailPanel listId={selectedListId} onBack={() => setSelectedListId(null)} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={isAr ? "بحث..." : "Search..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-9 h-9" />
                </div>
                <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
                  <SelectTrigger className="w-[220px] h-9 text-xs">
                    <SelectValue placeholder={isAr ? "كل المسابقات" : "All Competitions"} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-2">
                      <Input placeholder={isAr ? "بحث بالاسم..." : "Search by name..."} value={competitionSearch} onChange={e => setCompetitionSearch(e.target.value)} className="h-7 text-xs" onClick={e => e.stopPropagation()} />
                    </div>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="unlinked">{isAr ? "بدون مسابقة (مسودات)" : "Unlinked (Drafts)"}</SelectItem>
                    {filteredCompetitions.map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {isAr && c.title_ar ? c.title_ar : c.title}
                        <span className="ms-1 text-[9px] text-muted-foreground">({c.status})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {listsLoading ? (
                <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
              ) : allLists.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <ClipboardList className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">{isAr ? "لا توجد قوائم" : "No requirement lists found"}</p>
                </CardContent></Card>
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
                        <TableHead className="text-xs">{isAr ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLists.map((list: any) => {
                        const catDef = ORDER_CATEGORIES.find(c => c.value === list.category);
                        const listItems = allItems.filter((i: any) => i.list_id === list.id);
                        return (
                          <TableRow key={list.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedListId(list.id)}>
                            <TableCell className="text-sm font-medium">
                              {isAr && list.title_ar ? list.title_ar : list.title}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {list.competitions ? (isAr && list.competitions.title_ar ? list.competitions.title_ar : list.competitions.title) : (
                                <Badge variant="outline" className="text-[9px] text-chart-4">{isAr ? "بدون مسابقة" : "Unlinked"}</Badge>
                              )}
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{catDef ? (isAr ? catDef.labelAr : catDef.label) : list.category}</Badge></TableCell>
                            <TableCell className="text-center text-xs">{listItems.length}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-[10px]">{list.status || (isAr ? "مسودة" : "Draft")}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button size="icon" variant="ghost" className="h-7 w-7" title={isAr ? "عرض التفاصيل" : "View details"} onClick={() => setSelectedListId(list.id)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" title={isAr ? "نسخ" : "Copy"} onClick={() => copyList(list)}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title={isAr ? "حذف" : "Delete"} onClick={() => { if (confirm(isAr ? "حذف؟" : "Delete?")) deleteList(list.id); }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Catalog ── */}
        <TabsContent value="catalog" className="mt-4">
          <AdminCatalogManager />
        </TabsContent>

        {/* ── Item Requests ── */}
        <TabsContent value="requests" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث في الطلبات..." : "Search requests..."}
                className="ps-9 h-9"
              />
            </div>
            <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
              <SelectTrigger className="w-[220px] h-9 text-xs">
                <SelectValue placeholder={isAr ? "كل المسابقات" : "All Competitions"} />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 pb-2">
                  <Input
                    placeholder={isAr ? "بحث بالاسم..." : "Search by name..."}
                    value={competitionSearch}
                    onChange={e => setCompetitionSearch(e.target.value)}
                    className="h-7 text-xs"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                {filteredCompetitions.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {isAr && c.title_ar ? c.title_ar : c.title} ({c.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allRequests.length > 0 && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                downloadCSV(
                  allRequests.map((r: any) => ({
                    item_name: r.item_name,
                    item_name_ar: r.item_name_ar || "",
                    category: r.category,
                    quantity: r.quantity,
                    unit: r.unit,
                    priority: r.priority,
                    status: r.status,
                    delivery_status: r.delivery_status || "not_started",
                    requester: r.profiles?.full_name || r.profiles?.username || "",
                    competition: r.competitions?.title || "",
                    assigned_vendor: r.assigned_vendor || "",
                    notes: r.notes || "",
                    created_at: r.created_at,
                  })),
                  "all-item-requests",
                  [
                    { key: "item_name", label: "Item" },
                    { key: "item_name_ar", label: "Item (AR)" },
                    { key: "category", label: "Category" },
                    { key: "quantity", label: "Qty" },
                    { key: "unit", label: "Unit" },
                    { key: "priority", label: "Priority" },
                    { key: "status", label: "Status" },
                    { key: "delivery_status", label: "Delivery" },
                    { key: "requester", label: "Requester" },
                    { key: "competition", label: "Competition" },
                    { key: "assigned_vendor", label: "Vendor" },
                    { key: "notes", label: "Notes" },
                    { key: "created_at", label: "Date" },
                  ]
                );
              }}>
                <Download className="h-3.5 w-3.5" />
                {isAr ? "تصدير CSV" : "Export CSV"}
              </Button>
            )}
          </div>

          {requestsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : allRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileInput className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">{isAr ? "لا توجد طلبات بعد" : "No item requests yet"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr ? "ستظهر هنا طلبات الشيفات والمتسابقين من جميع المسابقات" : "Chef and competitor requests from all competitions will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isAr ? "العنصر" : "Item"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "مقدم الطلب" : "Requester"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "المسابقة" : "Competition"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الفئة" : "Category"}</TableHead>
                    <TableHead className="text-xs text-center">{isAr ? "الكمية" : "Qty"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الأولوية" : "Priority"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRequests.map((req: any) => {
                    const catDef = ORDER_CATEGORIES.find(c => c.value === req.category);
                    const priorityColors: Record<string, string> = {
                      low: "bg-muted text-muted-foreground",
                      normal: "bg-chart-3/15 text-chart-3",
                      high: "bg-chart-4/15 text-chart-4",
                      urgent: "bg-destructive/15 text-destructive",
                    };
                    const statusColors: Record<string, string> = {
                      pending: "bg-chart-4/15 text-chart-4",
                      approved: "bg-chart-5/15 text-chart-5",
                      rejected: "bg-destructive/15 text-destructive",
                      fulfilled: "bg-primary/15 text-primary",
                    };
                    return (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{isAr && req.item_name_ar ? req.item_name_ar : req.item_name}</p>
                            {req.notes && <p className="text-[10px] text-muted-foreground line-clamp-1">{req.notes}</p>}
                            {req.rejection_reason && (
                              <p className="text-[10px] text-destructive flex items-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" /> {req.rejection_reason}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {req.profiles?.full_name || req.profiles?.username || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {req.competitions ? (isAr && req.competitions.title_ar ? req.competitions.title_ar : req.competitions.title) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px]">
                            {catDef ? (isAr ? catDef.labelAr : catDef.label) : req.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs">{req.quantity} {req.unit}</TableCell>
                        <TableCell>
                          <Badge className={`${priorityColors[req.priority] || ""} text-[9px]`} variant="outline">
                            {req.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[req.status] || ""} text-[9px]`} variant="outline">
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {req.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => reviewRequestMutation.mutate({ id: req.id, status: "approved" })}
                              >
                                <CheckCircle className="h-4 w-4 text-chart-5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => reviewRequestMutation.mutate({ id: req.id, status: "rejected", reason: "Not available" })}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </TabsContent>

        {/* ── Fulfillment Tracking ── */}
        <TabsContent value="fulfillment" className="mt-4 space-y-4">
          <FulfillmentTracker
            requests={allRequests.filter((r: any) => r.status === "approved" || r.status === "fulfilled")}
            competitions={competitions}
            isAr={isAr}
            competitionFilter={competitionFilter}
            setCompetitionFilter={setCompetitionFilter}
            onUpdateFulfillment={(id, updates) => updateFulfillment.mutate({ id, updates })}
            isPending={updateFulfillment.isPending}
          />
        </TabsContent>

        {/* ── Dish Templates ── */}
        <TabsContent value="templates" className="mt-4 space-y-6">
          {selectedTemplate ? (
            <TemplateDetail
              template={selectedTemplate}
              competitions={competitions}
              assignableCompetitions={assignableCompetitions}
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
  template, competitions, assignableCompetitions, isAr, onBack, onApply, isApplying,
}: {
  template: DishTemplate;
  competitions: any[];
  assignableCompetitions: any[];
  isAr: boolean;
  onBack: () => void;
  onApply: (competitionId: string) => void;
  isApplying: boolean;
}) {
  const [targetCompetition, setTargetCompetition] = useState("");
  const [tplCompSearch, setTplCompSearch] = useState("");

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
                <div className="px-2 pb-2">
                  <Input
                    placeholder={isAr ? "بحث بالاسم..." : "Search by name..."}
                    value={tplCompSearch}
                    onChange={e => setTplCompSearch(e.target.value)}
                    className="h-7 text-xs"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                {assignableCompetitions
                  .filter((c: any) => !tplCompSearch || c.title?.toLowerCase().includes(tplCompSearch.toLowerCase()) || c.title_ar?.includes(tplCompSearch))
                  .map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {isAr && c.title_ar ? c.title_ar : c.title} ({c.status})
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

// ── Fulfillment Tracker Component ──
const DELIVERY_STATUSES = [
  { value: "not_started", labelEn: "Not Started", labelAr: "لم يبدأ", color: "bg-muted text-muted-foreground" },
  { value: "sourcing", labelEn: "Sourcing", labelAr: "جاري التوريد", color: "bg-chart-3/15 text-chart-3" },
  { value: "ordered", labelEn: "Ordered", labelAr: "تم الطلب", color: "bg-chart-4/15 text-chart-4" },
  { value: "in_transit", labelEn: "In Transit", labelAr: "في الطريق", color: "bg-primary/15 text-primary" },
  { value: "delivered", labelEn: "Delivered", labelAr: "تم التسليم", color: "bg-chart-5/15 text-chart-5" },
];

function FulfillmentTracker({
  requests, competitions, isAr, competitionFilter, setCompetitionFilter, onUpdateFulfillment, isPending,
}: {
  requests: any[];
  competitions: any[];
  isAr: boolean;
  competitionFilter: string;
  setCompetitionFilter: (v: string) => void;
  onUpdateFulfillment: (id: string, updates: Record<string, any>) => void;
  isPending: boolean;
}): JSX.Element {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = requests.filter(r => {
    if (competitionFilter !== "all" && r.competition_id !== competitionFilter) return false;
    if (statusFilter !== "all" && r.delivery_status !== statusFilter) return false;
    return true;
  });

  const delivered = requests.filter(r => r.delivery_status === "delivered").length;
  const inTransit = requests.filter(r => r.delivery_status === "in_transit").length;
  const sourcing = requests.filter(r => r.delivery_status === "sourcing" || r.delivery_status === "ordered").length;
  const notStarted = requests.filter(r => !r.delivery_status || r.delivery_status === "not_started").length;
  const pct = requests.length > 0 ? Math.round((delivered / requests.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-chart-5">{delivered}</p>
          <p className="text-[10px] text-muted-foreground">{isAr ? "تم التسليم" : "Delivered"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-primary">{inTransit}</p>
          <p className="text-[10px] text-muted-foreground">{isAr ? "في الطريق" : "In Transit"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-chart-4">{sourcing}</p>
          <p className="text-[10px] text-muted-foreground">{isAr ? "جاري التوريد" : "Sourcing/Ordered"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-muted-foreground">{notStarted}</p>
          <p className="text-[10px] text-muted-foreground">{isAr ? "لم يبدأ" : "Not Started"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xl font-bold">{pct}%</p>
          <p className="text-[10px] text-muted-foreground">{isAr ? "نسبة الإنجاز" : "Completion"}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
          <SelectTrigger className="w-[220px] h-9 text-xs"><SelectValue placeholder={isAr ? "كل المسابقات" : "All Competitions"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            {competitions.map((c: any) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">{isAr && c.title_ar ? c.title_ar : c.title} ({c.status})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل الحالات" : "All Statuses"}</SelectItem>
            {DELIVERY_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value} className="text-xs">{isAr ? s.labelAr : s.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Truck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{isAr ? "لا توجد طلبات معتمدة للتتبع" : "No approved requests to track"}</p>
        </CardContent></Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{isAr ? "العنصر" : "Item"}</TableHead>
                <TableHead className="text-xs">{isAr ? "المسابقة" : "Competition"}</TableHead>
                <TableHead className="text-xs">{isAr ? "الكمية" : "Qty"}</TableHead>
                <TableHead className="text-xs">{isAr ? "المورد" : "Vendor"}</TableHead>
                <TableHead className="text-xs">{isAr ? "الموعد النهائي" : "Deadline"}</TableHead>
                <TableHead className="text-xs">{isAr ? "حالة التسليم" : "Delivery Status"}</TableHead>
                <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req: any) => {
                const dStatus = DELIVERY_STATUSES.find(s => s.value === (req.delivery_status || "not_started")) || DELIVERY_STATUSES[0];
                return (
                  <TableRow key={req.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{isAr && req.item_name_ar ? req.item_name_ar : req.item_name}</p>
                      {req.tracking_number && <p className="text-[10px] text-muted-foreground">#{req.tracking_number}</p>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {req.competitions ? (isAr && req.competitions.title_ar ? req.competitions.title_ar : req.competitions.title) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{req.quantity} {req.unit}</TableCell>
                    <TableCell>
                      <Input
                        placeholder={isAr ? "اسم المورد..." : "Vendor..."}
                        defaultValue={req.assigned_vendor || ""}
                        className="h-7 text-xs w-28"
                        onBlur={e => {
                          if (e.target.value !== (req.assigned_vendor || "")) {
                            onUpdateFulfillment(req.id, { assigned_vendor: e.target.value || null });
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        defaultValue={req.delivery_deadline || ""}
                        className="h-7 text-xs w-32"
                        onBlur={e => {
                          if (e.target.value !== (req.delivery_deadline || "")) {
                            onUpdateFulfillment(req.id, { delivery_deadline: e.target.value || null });
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={req.delivery_status || "not_started"}
                        onValueChange={v => {
                          const updates: Record<string, any> = { delivery_status: v };
                          if (v === "delivered") {
                            updates.delivered_at = new Date().toISOString();
                            updates.status = "fulfilled";
                          }
                          onUpdateFulfillment(req.id, updates);
                        }}
                      >
                        <SelectTrigger className="h-7 text-[10px] w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value} className="text-xs">{isAr ? s.labelAr : s.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${dStatus.color} text-[9px]`} variant="outline">
                        {isAr ? dStatus.labelAr : dStatus.labelEn}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}
