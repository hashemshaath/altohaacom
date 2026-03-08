import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, MoreHorizontal, Trash2, Send, Share2, UserPlus, ClipboardList,
  Package, ShieldCheck, UtensilsCrossed, Flame, Lightbulb, Droplets, MapPin
} from "lucide-react";
import { RequirementListItems } from "./RequirementListItems";
import { SponsorshipRequestPanel } from "./SponsorshipRequestPanel";
import { ORDER_CATEGORIES } from "./order-center/OrderCenterCategories";

const LIST_CATEGORIES = ORDER_CATEGORIES.map(c => ({
  value: c.value,
  label: c.label,
  labelAr: c.labelAr,
  icon: c.icon,
}));

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/20 text-primary",
  review: "bg-chart-4/20 text-chart-4",
  approved: "bg-chart-5/20 text-chart-5",
  sent_to_sponsors: "bg-chart-3/20 text-chart-3",
};

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export const RequirementsListPanel = memo(function RequirementsListPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newList, setNewList] = useState({ title: "", title_ar: "", description: "", category: "general" });

  const { data: lists, isLoading } = useQuery({
    queryKey: ["requirement-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, competition_id, title, title_ar, description, category, status, created_by, created_at")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createListMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("requirement_lists").insert({
        competition_id: competitionId,
        title: newList.title,
        title_ar: newList.title_ar || null,
        description: newList.description || null,
        category: newList.category,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-lists", competitionId] });
      setShowCreateDialog(false);
      setNewList({ title: "", title_ar: "", description: "", category: "general" });
      toast({ title: language === "ar" ? "تم إنشاء القائمة" : "List created" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("requirement_lists").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-lists", competitionId] });
      toast({ title: language === "ar" ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("requirement_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-lists", competitionId] });
      if (selectedListId) setSelectedListId(null);
      toast({ title: language === "ar" ? "تم حذف القائمة" : "List deleted" });
    },
  });

  const selectedList = lists?.find((l) => l.id === selectedListId);

  if (selectedList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedListId(null)}>
              ← {language === "ar" ? "رجوع" : "Back"}
            </Button>
            <h3 className="text-lg font-semibold">
              {language === "ar" && selectedList.title_ar ? selectedList.title_ar : selectedList.title}
            </h3>
            <Badge className={STATUS_COLORS[selectedList.status] || ""}>
              {selectedList.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">{language === "ar" ? "العناصر" : "Items"}</TabsTrigger>
            <TabsTrigger value="sponsors">{language === "ar" ? "طلبات الرعاية" : "Sponsor Requests"}</TabsTrigger>
          </TabsList>
          <TabsContent value="items" className="mt-4">
            <RequirementListItems listId={selectedList.id} competitionId={competitionId} listCategory={selectedList.category} />
          </TabsContent>
          <TabsContent value="sponsors" className="mt-4">
            <SponsorshipRequestPanel listId={selectedList.id} competitionId={competitionId} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {language === "ar" ? "قوائم المتطلبات والتجهيزات" : "Requirements & Setup Lists"}
        </h3>
        {isOrganizer && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="me-2 h-4 w-4" />{language === "ar" ? "قائمة جديدة" : "New List"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "ar" ? "إنشاء قائمة متطلبات" : "Create Requirement List"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{language === "ar" ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                  <Input value={newList.title} onChange={(e) => setNewList({ ...newList, title: e.target.value })} />
                </div>
                <div>
                  <Label>{language === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                  <Input value={newList.title_ar} onChange={(e) => setNewList({ ...newList, title_ar: e.target.value })} dir="rtl" />
                </div>
                <div>
                  <Label>{language === "ar" ? "الفئة" : "Category"}</Label>
                  <Select value={newList.category} onValueChange={(v) => setNewList({ ...newList, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIST_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {language === "ar" ? c.labelAr : c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === "ar" ? "الوصف" : "Description"}</Label>
                  <Textarea value={newList.description} onChange={(e) => setNewList({ ...newList, description: e.target.value })} />
                </div>
                <Button onClick={() => createListMutation.mutate()} disabled={!newList.title || createListMutation.isPending} className="w-full">
                  {language === "ar" ? "إنشاء" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !lists?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{language === "ar" ? "لا توجد قوائم متطلبات بعد" : "No requirement lists yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => {
            const catInfo = LIST_CATEGORIES.find((c) => c.value === list.category);
            const CatIcon = catInfo?.icon || ClipboardList;
            return (
              <Card key={list.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedListId(list.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CatIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">
                        {language === "ar" && list.title_ar ? list.title_ar : list.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Badge className={STATUS_COLORS[list.status] || ""} variant="outline">
                        {list.status.replace(/_/g, " ")}
                      </Badge>
                      {isOrganizer && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: list.id, status: "in_progress" })}>
                              {language === "ar" ? "قيد العمل" : "In Progress"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: list.id, status: "review" })}>
                              {language === "ar" ? "مراجعة" : "Review"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: list.id, status: "approved" })}>
                              {language === "ar" ? "موافق عليها" : "Approved"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => { if (confirm(language === "ar" ? "حذف هذه القائمة؟" : "Delete this list?")) deleteListMutation.mutate(list.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="me-2 h-4 w-4" /> {language === "ar" ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? catInfo?.labelAr : catInfo?.label}
                  </p>
                  {list.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{list.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
