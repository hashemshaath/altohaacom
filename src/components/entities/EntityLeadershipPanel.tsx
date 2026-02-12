import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ChefSearchSelector } from "@/components/admin/ChefSearchSelector";
import { Plus, Trash2, Crown, User, GripVertical } from "lucide-react";

const positionTypes = [
  { value: "president", en: "President", ar: "الرئيس" },
  { value: "vice_president", en: "Vice President", ar: "نائب الرئيس" },
  { value: "secretary_general", en: "Secretary General", ar: "الأمين العام" },
  { value: "treasurer", en: "Treasurer", ar: "أمين الصندوق" },
  { value: "board_member", en: "Board Member", ar: "عضو مجلس إدارة" },
  { value: "honorary_president", en: "Honorary President", ar: "الرئيس الفخري" },
  { value: "honorary_member", en: "Honorary Member", ar: "عضو فخري" },
  { value: "advisor", en: "Advisor", ar: "مستشار" },
  { value: "director", en: "Director", ar: "مدير" },
  { value: "deputy_director", en: "Deputy Director", ar: "نائب المدير" },
  { value: "coordinator", en: "Coordinator", ar: "منسق" },
  { value: "spokesperson", en: "Spokesperson", ar: "المتحدث الرسمي" },
  { value: "member", en: "Member", ar: "عضو" },
];

const positionIcons: Record<string, typeof Crown> = {
  president: Crown,
  vice_president: Crown,
  honorary_president: Crown,
};

interface Props {
  entityId: string;
}

export function EntityLeadershipPanel({ entityId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedUserNameAr, setSelectedUserNameAr] = useState("");
  const [positionType, setPositionType] = useState("member");
  const [customTitle, setCustomTitle] = useState("");
  const [customTitleAr, setCustomTitleAr] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: positions, isLoading } = useQuery({
    queryKey: ["entity-positions", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_positions" as any)
        .select("*, profiles:user_id(id, full_name, full_name_ar, avatar_url, experience_level)")
        .eq("entity_id", entityId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error("Select a chef");
      const { error } = await supabase.from("entity_positions" as any).insert({
        entity_id: entityId,
        user_id: selectedUserId,
        position_type: positionType,
        position_title: customTitle || null,
        position_title_ar: customTitleAr || null,
        start_date: startDate || null,
        is_active: isActive,
        sort_order: (positions?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-positions", entityId] });
      toast({ title: isAr ? "تمت إضافة المنصب" : "Position added" });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entity_positions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-positions", entityId] });
      toast({ title: isAr ? "تم حذف المنصب" : "Position removed" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("entity_positions" as any).update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entity-positions", entityId] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setSelectedUserId("");
    setSelectedUserName("");
    setSelectedUserNameAr("");
    setPositionType("member");
    setCustomTitle("");
    setCustomTitleAr("");
    setStartDate("");
    setIsActive(true);
  };

  const getPositionLabel = (type: string) => {
    const p = positionTypes.find(pt => pt.value === type);
    return p ? (isAr ? p.ar : p.en) : type;
  };

  const getPositionColor = (type: string) => {
    if (type === "president" || type === "honorary_president") return "bg-chart-4/20 text-chart-4";
    if (type === "vice_president" || type === "deputy_director") return "bg-primary/20 text-primary";
    if (type === "secretary_general") return "bg-chart-3/20 text-chart-3";
    if (type === "honorary_member" || type === "advisor") return "bg-chart-5/20 text-chart-5";
    return "bg-secondary text-secondary-foreground";
  };

  // Group positions by category
  const executivePositions = positions?.filter(p => ["president", "vice_president", "secretary_general", "treasurer", "director", "deputy_director"].includes(p.position_type)) || [];
  const honoraryPositions = positions?.filter(p => ["honorary_president", "honorary_member", "advisor", "spokesperson"].includes(p.position_type)) || [];
  const boardMembers = positions?.filter(p => ["board_member", "coordinator", "member"].includes(p.position_type)) || [];

  const renderGroup = (title: string, items: typeof positions, icon: React.ReactNode) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
          {icon} {title}
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map(pos => {
            const profile = pos.profiles as any;
            const displayName = isAr && profile?.full_name_ar ? profile.full_name_ar : profile?.full_name || "—";
            return (
              <Card key={pos.id} className={`transition-all hover:shadow-sm ${!pos.is_active ? "opacity-50" : ""}`}>
                <CardContent className="flex items-center gap-3 p-3">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge className={`text-[10px] h-5 ${getPositionColor(pos.position_type)}`}>
                        {pos.position_title ? (isAr && pos.position_title_ar ? pos.position_title_ar : pos.position_title) : getPositionLabel(pos.position_type)}
                      </Badge>
                      {!pos.is_active && <Badge variant="outline" className="text-[10px] h-5">{isAr ? "غير نشط" : "Inactive"}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={pos.is_active ?? true}
                      onCheckedChange={v => toggleActiveMutation.mutate({ id: pos.id, active: v })}
                      className="scale-75"
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(pos.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {positions?.length || 0} {isAr ? "منصب" : "positions"}
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="me-1 h-3.5 w-3.5" />
          {isAr ? "إضافة منصب" : "Add Position"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-4 bg-muted/30">
          <div>
            <Label>{isAr ? "البحث عن شيف" : "Search Chef"} *</Label>
            <ChefSearchSelector
              value={selectedUserId}
              valueName={isAr ? selectedUserNameAr || selectedUserName : selectedUserName}
              onChange={(id, name, nameAr) => {
                setSelectedUserId(id);
                setSelectedUserName(name);
                setSelectedUserNameAr(nameAr);
              }}
              onClear={() => {
                setSelectedUserId("");
                setSelectedUserName("");
                setSelectedUserNameAr("");
              }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{isAr ? "نوع المنصب" : "Position Type"} *</Label>
              <Select value={positionType} onValueChange={setPositionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {positionTypes.map(pt => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {isAr ? pt.ar : pt.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "تاريخ البدء" : "Start Date"}</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{isAr ? "مسمى مخصص (EN)" : "Custom Title (EN)"}</Label>
              <Input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder={isAr ? "اختياري" : "Optional"} />
            </div>
            <div>
              <Label>{isAr ? "مسمى مخصص (AR)" : "Custom Title (AR)"}</Label>
              <Input value={customTitleAr} onChange={e => setCustomTitleAr(e.target.value)} dir="rtl" placeholder={isAr ? "اختياري" : "Optional"} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>{isAr ? "نشط" : "Active"}</Label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={!selectedUserId || addMutation.isPending}>
              {addMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "إضافة" : "Add")}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{isAr ? "جاري التحميل..." : "Loading..."}</p>
      ) : positions && positions.length > 0 ? (
        <div className="space-y-5">
          {renderGroup(isAr ? "المناصب التنفيذية" : "Executive Positions", executivePositions, <Crown className="h-4 w-4" />)}
          {honoraryPositions.length > 0 && <Separator />}
          {renderGroup(isAr ? "المناصب الفخرية والاستشارية" : "Honorary & Advisory", honoraryPositions, <User className="h-4 w-4" />)}
          {boardMembers.length > 0 && <Separator />}
          {renderGroup(isAr ? "أعضاء مجلس الإدارة" : "Board Members", boardMembers, <GripVertical className="h-4 w-4" />)}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Crown className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لم يتم تعيين أي مناصب بعد" : "No positions assigned yet"}</p>
        </div>
      )}
    </div>
  );
}
