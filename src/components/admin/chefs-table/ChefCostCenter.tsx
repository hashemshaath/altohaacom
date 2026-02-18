import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCountries } from "@/hooks/useCountries";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  DollarSign, Plus, Save, Edit2, Trash2, Calculator, Search,
  Plane, Hotel, CreditCard, Globe, Calendar, MapPin, User,
  FileText, History, Eye, ChevronDown, X,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────
interface ChefCostProfile {
  id: string;
  chef_id: string;
  country_code: string | null;
  city: string | null;
  visa_required: boolean;
  visa_fee: number;
  visa_currency: string;
  visa_valid_until: string | null;
  visa_type: string | null;
  flight_cost_estimate: number;
  local_transport_cost: number;
  transport_currency: string;
  transport_notes: string | null;
  hotel_cost_per_night: number;
  accommodation_currency: string;
  preferred_hotel: string | null;
  preferred_hotel_ar: string | null;
  daily_allowance: number;
  evaluation_fee: number;
  fee_currency: string;
  estimated_total_cost: number;
  estimated_days: number;
  notes: string | null;
  notes_ar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface ChefTravelRecord {
  id: string;
  chef_id: string;
  session_id: string | null;
  destination_country_code: string | null;
  destination_city: string | null;
  travel_date: string | null;
  return_date: string | null;
  flight_cost: number;
  hotel_cost: number;
  hotel_name: string | null;
  hotel_nights: number;
  local_transport_cost: number;
  visa_cost: number;
  daily_allowance_total: number;
  other_costs: number;
  total_cost: number;
  currency: string;
  visa_number: string | null;
  visa_issued_date: string | null;
  visa_expiry_date: string | null;
  visa_type: string | null;
  notes: string | null;
  notes_ar: string | null;
  created_at: string;
}

// ─── Hooks ──────────────────────────────────
function useChefCostProfiles() {
  return useQuery({
    queryKey: ["chef-cost-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_cost_profiles" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ChefCostProfile[];
    },
  });
}

function useChefTravelRecords(chefId?: string) {
  return useQuery({
    queryKey: ["chef-travel-records", chefId],
    queryFn: async () => {
      let query = supabase
        .from("chef_travel_records" as any)
        .select("*")
        .order("travel_date", { ascending: false });
      if (chefId) query = query.eq("chef_id", chefId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ChefTravelRecord[];
    },
  });
}

function useChefProfiles() {
  return useQuery({
    queryKey: ["chef-profiles-for-cost"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, country_code, city, avatar_url")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Helper: Calculate estimated total ──────
function calcEstimatedTotal(p: Partial<ChefCostProfile>) {
  const days = p.estimated_days || 1;
  return (
    (p.visa_fee || 0) +
    (p.flight_cost_estimate || 0) +
    (p.local_transport_cost || 0) +
    (p.hotel_cost_per_night || 0) * days +
    (p.daily_allowance || 0) * days +
    (p.evaluation_fee || 0)
  );
}

// ─── Main Component ─────────────────────────
export function ChefCostCenter() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: countries = [] } = useCountries();
  const { data: profiles = [] } = useChefProfiles();
  const { data: costProfiles = [], isLoading: profilesLoading } = useChefCostProfiles();
  const { data: travelRecords = [], isLoading: recordsLoading } = useChefTravelRecords();

  const [activeSubTab, setActiveSubTab] = useState("profiles");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<ChefCostProfile> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTravel, setEditingTravel] = useState<Partial<ChefTravelRecord> | null>(null);
  const [isCreatingTravel, setIsCreatingTravel] = useState(false);
  const [selectedChefId, setSelectedChefId] = useState<string | null>(null);

  const getChefName = (chefId: string) => {
    const p = profiles.find(pr => pr.user_id === chefId);
    return p ? (isAr && p.full_name_ar ? p.full_name_ar : p.full_name || "—") : chefId.slice(0, 8);
  };

  const getCountryName = (code: string | null) => {
    if (!code) return "—";
    const c = countries.find(ct => ct.code === code);
    return c ? (isAr && c.name_ar ? c.name_ar : c.name) : code;
  };

  // Filtered
  const filteredProfiles = useMemo(() => {
    const q = search.toLowerCase();
    return costProfiles.filter(cp => {
      const name = getChefName(cp.chef_id).toLowerCase();
      return name.includes(q) || (cp.city || "").toLowerCase().includes(q);
    });
  }, [costProfiles, search, profiles]);

  const filteredRecords = useMemo(() => {
    let list = travelRecords;
    if (selectedChefId) list = list.filter(r => r.chef_id === selectedChefId);
    return list;
  }, [travelRecords, selectedChefId]);

  // ─── Cost Profile Mutations ───────────────
  const saveCostProfile = useMutation({
    mutationFn: async (profile: Partial<ChefCostProfile>) => {
      const estimated = calcEstimatedTotal(profile);
      const payload = { ...profile, estimated_total_cost: estimated, created_by: user?.id };
      if (profile.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("chef_cost_profiles" as any).update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("chef_cost_profiles" as any).insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chef-cost-profiles"] });
      toast.success(isAr ? "تم الحفظ" : "Saved");
      setEditing(null);
      setIsCreating(false);
    },
    onError: () => toast.error(isAr ? "حدث خطأ" : "Error saving"),
  });

  const deleteCostProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chef_cost_profiles" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chef-cost-profiles"] });
      toast.success(isAr ? "تم الحذف" : "Deleted");
    },
  });

  // ─── Travel Record Mutations ──────────────
  const saveTravelRecord = useMutation({
    mutationFn: async (record: Partial<ChefTravelRecord>) => {
      const total = (record.flight_cost || 0) + (record.hotel_cost || 0) + (record.local_transport_cost || 0) + (record.visa_cost || 0) + (record.daily_allowance_total || 0) + (record.other_costs || 0);
      const payload = { ...record, total_cost: total, created_by: user?.id };
      if (record.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("chef_travel_records" as any).update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("chef_travel_records" as any).insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chef-travel-records"] });
      toast.success(isAr ? "تم الحفظ" : "Saved");
      setEditingTravel(null);
      setIsCreatingTravel(false);
    },
    onError: () => toast.error(isAr ? "حدث خطأ" : "Error saving"),
  });

  const deleteTravelRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chef_travel_records" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chef-travel-records"] });
      toast.success(isAr ? "تم الحذف" : "Deleted");
    },
  });

  // ─── Cost Profile Form ────────────────────
  if (editing) {
    const est = calcEstimatedTotal(editing);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {isCreating ? (isAr ? "إنشاء ملف تكلفة شيف" : "Create Chef Cost Profile") : (isAr ? "تعديل ملف التكلفة" : "Edit Cost Profile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Chef Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{isAr ? "الشيف" : "Chef"}</Label>
              <Select value={editing.chef_id || ""} onValueChange={v => setEditing(p => ({ ...p!, chef_id: v }))}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر شيف" : "Select chef"} /></SelectTrigger>
                <SelectContent>
                  {profiles.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {isAr && p.full_name_ar ? p.full_name_ar : p.full_name || p.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "البلد" : "Country"}</Label>
              <Select value={editing.country_code || ""} onValueChange={v => setEditing(p => ({ ...p!, country_code: v }))}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر البلد" : "Select country"} /></SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c.code} value={c.code}>{isAr && c.name_ar ? c.name_ar : c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "المدينة" : "City"}</Label>
              <Input value={editing.city || ""} onChange={e => setEditing(p => ({ ...p!, city: e.target.value }))} />
            </div>
          </div>

          <Separator />

          {/* Visa Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
              <CreditCard className="h-3.5 w-3.5" />{isAr ? "التأشيرة" : "Visa"}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={editing.visa_required ?? false} onCheckedChange={v => setEditing(p => ({ ...p!, visa_required: v }))} />
                <Label className="text-sm">{isAr ? "مطلوبة" : "Required"}</Label>
              </div>
              <div>
                <Label>{isAr ? "رسوم التأشيرة" : "Visa Fee"}</Label>
                <Input type="number" value={editing.visa_fee || 0} onChange={e => setEditing(p => ({ ...p!, visa_fee: +e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "نوع التأشيرة" : "Visa Type"}</Label>
                <Input value={editing.visa_type || ""} onChange={e => setEditing(p => ({ ...p!, visa_type: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "صالحة حتى" : "Valid Until"}</Label>
                <Input type="date" value={editing.visa_valid_until || ""} onChange={e => setEditing(p => ({ ...p!, visa_valid_until: e.target.value }))} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Transportation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
              <Plane className="h-3.5 w-3.5" />{isAr ? "النقل" : "Transportation"}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>{isAr ? "تكلفة الطيران المقدرة" : "Flight Cost Estimate"}</Label>
                <Input type="number" value={editing.flight_cost_estimate || 0} onChange={e => setEditing(p => ({ ...p!, flight_cost_estimate: +e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "النقل المحلي" : "Local Transport"}</Label>
                <Input type="number" value={editing.local_transport_cost || 0} onChange={e => setEditing(p => ({ ...p!, local_transport_cost: +e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "ملاحظات النقل" : "Transport Notes"}</Label>
                <Input value={editing.transport_notes || ""} onChange={e => setEditing(p => ({ ...p!, transport_notes: e.target.value }))} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Accommodation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
              <Hotel className="h-3.5 w-3.5" />{isAr ? "الإقامة" : "Accommodation"}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>{isAr ? "تكلفة الفندق / ليلة" : "Hotel Cost / Night"}</Label>
                <Input type="number" value={editing.hotel_cost_per_night || 0} onChange={e => setEditing(p => ({ ...p!, hotel_cost_per_night: +e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "الفندق المفضل" : "Preferred Hotel"}</Label>
                <Input value={editing.preferred_hotel || ""} onChange={e => setEditing(p => ({ ...p!, preferred_hotel: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "عدد الأيام المقدرة" : "Estimated Days"}</Label>
                <Input type="number" min={1} value={editing.estimated_days || 1} onChange={e => setEditing(p => ({ ...p!, estimated_days: +e.target.value }))} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Fees */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
              <DollarSign className="h-3.5 w-3.5" />{isAr ? "الأتعاب والبدلات" : "Fees & Allowances"}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>{isAr ? "البدل اليومي" : "Daily Allowance"}</Label>
                <Input type="number" value={editing.daily_allowance || 0} onChange={e => setEditing(p => ({ ...p!, daily_allowance: +e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "أتعاب التقييم" : "Evaluation Fee"}</Label>
                <Input type="number" value={editing.evaluation_fee || 0} onChange={e => setEditing(p => ({ ...p!, evaluation_fee: +e.target.value }))} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{isAr ? "ملاحظات (EN)" : "Notes (EN)"}</Label>
              <Textarea value={editing.notes || ""} onChange={e => setEditing(p => ({ ...p!, notes: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>{isAr ? "ملاحظات (AR)" : "Notes (AR)"}</Label>
              <Textarea value={editing.notes_ar || ""} onChange={e => setEditing(p => ({ ...p!, notes_ar: e.target.value }))} rows={2} dir="rtl" />
            </div>
          </div>

          {/* Total Estimate */}
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
              {isAr ? "التكلفة المقدرة الإجمالية" : "Estimated Total Cost"}
            </p>
            <p className="text-4xl font-black tabular-nums text-primary">{est.toLocaleString()} <span className="text-base">SAR</span></p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {isAr ? `لمدة ${editing.estimated_days || 1} أيام` : `For ${editing.estimated_days || 1} day(s)`}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEditing(null); setIsCreating(false); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveCostProfile.mutate(editing)} disabled={!editing.chef_id} className="gap-1.5">
              <Save className="h-4 w-4" />{isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Travel Record Form ───────────────────
  if (editingTravel) {
    const total = (editingTravel.flight_cost || 0) + (editingTravel.hotel_cost || 0) + (editingTravel.local_transport_cost || 0) + (editingTravel.visa_cost || 0) + (editingTravel.daily_allowance_total || 0) + (editingTravel.other_costs || 0);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            {isCreatingTravel ? (isAr ? "إضافة سجل سفر" : "Add Travel Record") : (isAr ? "تعديل سجل السفر" : "Edit Travel Record")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{isAr ? "الشيف" : "Chef"}</Label>
              <Select value={editingTravel.chef_id || ""} onValueChange={v => setEditingTravel(p => ({ ...p!, chef_id: v }))}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر شيف" : "Select chef"} /></SelectTrigger>
                <SelectContent>
                  {profiles.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {isAr && p.full_name_ar ? p.full_name_ar : p.full_name || p.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "بلد الوجهة" : "Destination Country"}</Label>
              <Select value={editingTravel.destination_country_code || ""} onValueChange={v => setEditingTravel(p => ({ ...p!, destination_country_code: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c.code} value={c.code}>{isAr && c.name_ar ? c.name_ar : c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "المدينة" : "City"}</Label>
              <Input value={editingTravel.destination_city || ""} onChange={e => setEditingTravel(p => ({ ...p!, destination_city: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>{isAr ? "تاريخ السفر" : "Travel Date"}</Label>
              <Input type="date" value={editingTravel.travel_date || ""} onChange={e => setEditingTravel(p => ({ ...p!, travel_date: e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "تاريخ العودة" : "Return Date"}</Label>
              <Input type="date" value={editingTravel.return_date || ""} onChange={e => setEditingTravel(p => ({ ...p!, return_date: e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "اسم الفندق" : "Hotel Name"}</Label>
              <Input value={editingTravel.hotel_name || ""} onChange={e => setEditingTravel(p => ({ ...p!, hotel_name: e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "عدد الليالي" : "Hotel Nights"}</Label>
              <Input type="number" min={0} value={editingTravel.hotel_nights || 0} onChange={e => setEditingTravel(p => ({ ...p!, hotel_nights: +e.target.value }))} />
            </div>
          </div>

          <Separator />
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{isAr ? "التكاليف الفعلية" : "Actual Costs (SAR)"}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>{isAr ? "الطيران" : "Flight"}</Label>
              <Input type="number" value={editingTravel.flight_cost || 0} onChange={e => setEditingTravel(p => ({ ...p!, flight_cost: +e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "الفندق" : "Hotel"}</Label>
              <Input type="number" value={editingTravel.hotel_cost || 0} onChange={e => setEditingTravel(p => ({ ...p!, hotel_cost: +e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "النقل المحلي" : "Local Transport"}</Label>
              <Input type="number" value={editingTravel.local_transport_cost || 0} onChange={e => setEditingTravel(p => ({ ...p!, local_transport_cost: +e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "التأشيرة" : "Visa"}</Label>
              <Input type="number" value={editingTravel.visa_cost || 0} onChange={e => setEditingTravel(p => ({ ...p!, visa_cost: +e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "إجمالي البدلات" : "Daily Allowance Total"}</Label>
              <Input type="number" value={editingTravel.daily_allowance_total || 0} onChange={e => setEditingTravel(p => ({ ...p!, daily_allowance_total: +e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "أخرى" : "Other"}</Label>
              <Input type="number" value={editingTravel.other_costs || 0} onChange={e => setEditingTravel(p => ({ ...p!, other_costs: +e.target.value }))} />
            </div>
          </div>

          {/* Visa Details */}
          <Separator />
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{isAr ? "بيانات التأشيرة" : "Visa Details"}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>{isAr ? "رقم التأشيرة" : "Visa Number"}</Label>
              <Input value={editingTravel.visa_number || ""} onChange={e => setEditingTravel(p => ({ ...p!, visa_number: e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "نوع التأشيرة" : "Visa Type"}</Label>
              <Input value={editingTravel.visa_type || ""} onChange={e => setEditingTravel(p => ({ ...p!, visa_type: e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "تاريخ الإصدار" : "Issued Date"}</Label>
              <Input type="date" value={editingTravel.visa_issued_date || ""} onChange={e => setEditingTravel(p => ({ ...p!, visa_issued_date: e.target.value }))} />
            </div>
            <div>
              <Label>{isAr ? "تاريخ الانتهاء" : "Expiry Date"}</Label>
              <Input type="date" value={editingTravel.visa_expiry_date || ""} onChange={e => setEditingTravel(p => ({ ...p!, visa_expiry_date: e.target.value }))} />
            </div>
          </div>

          {/* Total */}
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
              {isAr ? "إجمالي التكلفة الفعلية" : "Actual Total Cost"}
            </p>
            <p className="text-4xl font-black tabular-nums text-primary">{total.toLocaleString()} <span className="text-base">SAR</span></p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEditingTravel(null); setIsCreatingTravel(false); }}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => saveTravelRecord.mutate(editingTravel)} disabled={!editingTravel.chef_id} className="gap-1.5">
              <Save className="h-4 w-4" />{isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Summary Stats ────────────────────────
  const totalEstimated = costProfiles.reduce((sum, cp) => sum + (cp.estimated_total_cost || 0), 0);
  const totalActual = travelRecords.reduce((sum, tr) => sum + (tr.total_cost || 0), 0);
  const avgPerChef = costProfiles.length > 0 ? totalEstimated / costProfiles.length : 0;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? "ملفات التكلفة" : "Cost Profiles", value: costProfiles.length, icon: User, color: "text-primary" },
          { label: isAr ? "متوسط التكلفة / شيف" : "Avg Cost / Chef", value: `${avgPerChef.toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR`, icon: Calculator, color: "text-chart-4" },
          { label: isAr ? "إجمالي مقدر" : "Total Estimated", value: `${totalEstimated.toLocaleString()} SAR`, icon: DollarSign, color: "text-chart-5" },
          { label: isAr ? "إجمالي فعلي" : "Total Actual", value: `${totalActual.toLocaleString()} SAR`, icon: History, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-lg font-black tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="profiles" className="gap-1.5">
              <Calculator className="h-3.5 w-3.5" />
              {isAr ? "ملفات التكلفة" : "Cost Profiles"}
            </TabsTrigger>
            <TabsTrigger value="travel" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              {isAr ? "سجلات السفر" : "Travel Records"}
            </TabsTrigger>
          </TabsList>

          {activeSubTab === "profiles" && (
            <Button size="sm" className="gap-1.5" onClick={() => {
              setEditing({ visa_required: false, visa_fee: 0, flight_cost_estimate: 0, local_transport_cost: 0, hotel_cost_per_night: 0, daily_allowance: 0, evaluation_fee: 0, estimated_days: 3, is_active: true });
              setIsCreating(true);
            }}>
              <Plus className="h-3.5 w-3.5" />{isAr ? "ملف جديد" : "New Profile"}
            </Button>
          )}
          {activeSubTab === "travel" && (
            <Button size="sm" className="gap-1.5" onClick={() => {
              setEditingTravel({ flight_cost: 0, hotel_cost: 0, local_transport_cost: 0, visa_cost: 0, daily_allowance_total: 0, other_costs: 0, hotel_nights: 0, currency: "SAR" });
              setIsCreatingTravel(true);
            }}>
              <Plus className="h-3.5 w-3.5" />{isAr ? "سجل جديد" : "New Record"}
            </Button>
          )}
        </div>

        {/* ─── Cost Profiles Tab ──────────── */}
        <TabsContent value="profiles" className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
          </div>

          {profilesLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : filteredProfiles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calculator className="mx-auto h-10 w-10 text-muted-foreground/20" />
                <p className="mt-3 font-semibold text-sm">{isAr ? "لا توجد ملفات تكلفة" : "No cost profiles yet"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredProfiles.map(cp => (
                <Card key={cp.id} className="border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-sm">{getChefName(cp.chef_id)}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3" />{getCountryName(cp.country_code)} • {cp.city || "—"}
                        </p>
                      </div>
                      {cp.visa_required && (
                        <Badge variant="outline" className="text-[8px]">
                          {isAr ? "تأشيرة مطلوبة" : "Visa Required"}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div className="rounded bg-muted/50 p-2">
                        <p className="text-xs font-bold tabular-nums">{cp.flight_cost_estimate.toLocaleString()}</p>
                        <p className="text-[8px] text-muted-foreground">{isAr ? "طيران" : "Flight"}</p>
                      </div>
                      <div className="rounded bg-muted/50 p-2">
                        <p className="text-xs font-bold tabular-nums">{cp.hotel_cost_per_night.toLocaleString()}/n</p>
                        <p className="text-[8px] text-muted-foreground">{isAr ? "فندق" : "Hotel"}</p>
                      </div>
                      <div className="rounded bg-muted/50 p-2">
                        <p className="text-xs font-bold tabular-nums">{cp.evaluation_fee.toLocaleString()}</p>
                        <p className="text-[8px] text-muted-foreground">{isAr ? "أتعاب" : "Fee"}</p>
                      </div>
                    </div>

                    {cp.visa_valid_until && (
                      <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {isAr ? "التأشيرة صالحة حتى:" : "Visa valid until:"} {format(new Date(cp.visa_valid_until), "MMM d, yyyy")}
                      </p>
                    )}

                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3 text-center mb-3">
                      <p className="text-[9px] text-primary font-bold uppercase">{isAr ? "الإجمالي المقدر" : "Est. Total"} ({cp.estimated_days}d)</p>
                      <p className="text-xl font-black tabular-nums text-primary">{cp.estimated_total_cost.toLocaleString()} SAR</p>
                    </div>

                    <div className="flex gap-1.5 border-t border-border/30 pt-3">
                      <Button size="sm" variant="outline" className="flex-1 gap-1 h-7 text-[10px]" onClick={() => setEditing(cp)}>
                        <Edit2 className="h-3 w-3" />{isAr ? "تعديل" : "Edit"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-[10px]" onClick={() => { setSelectedChefId(cp.chef_id); setActiveSubTab("travel"); }}>
                        <History className="h-3 w-3" />{isAr ? "السجلات" : "Records"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive hover:text-destructive" onClick={() => deleteCostProfile.mutate(cp.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Travel Records Tab ─────────── */}
        <TabsContent value="travel" className="space-y-3">
          <div className="flex items-center gap-3">
            <Select value={selectedChefId || "all"} onValueChange={v => setSelectedChefId(v === "all" ? null : v)}>
              <SelectTrigger className="w-60"><SelectValue placeholder={isAr ? "جميع الطهاة" : "All Chefs"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الطهاة" : "All Chefs"}</SelectItem>
                {profiles.map(p => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {isAr && p.full_name_ar ? p.full_name_ar : p.full_name || p.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ms-auto">{filteredRecords.length} {isAr ? "سجل" : "records"}</span>
          </div>

          {recordsLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : filteredRecords.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <History className="mx-auto h-10 w-10 text-muted-foreground/20" />
                <p className="mt-3 font-semibold text-sm">{isAr ? "لا توجد سجلات سفر" : "No travel records yet"}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold text-[11px] uppercase">{isAr ? "الشيف" : "Chef"}</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase">{isAr ? "الوجهة" : "Destination"}</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase">{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase">{isAr ? "الفندق" : "Hotel"}</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase">{isAr ? "التأشيرة" : "Visa"}</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase text-end">{isAr ? "الإجمالي" : "Total"}</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map(rec => (
                    <TableRow key={rec.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">{getChefName(rec.chef_id)}</TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {getCountryName(rec.destination_country_code)} {rec.destination_city ? `• ${rec.destination_city}` : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {rec.travel_date ? format(new Date(rec.travel_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rec.hotel_name || "—"} {rec.hotel_nights ? `(${rec.hotel_nights}n)` : ""}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rec.visa_type || "—"}
                        {rec.visa_expiry_date && (
                          <span className="block text-[10px] text-muted-foreground">
                            {isAr ? "ينتهي:" : "exp:"} {format(new Date(rec.visa_expiry_date), "MMM yyyy")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-bold tabular-nums text-end">{rec.total_cost.toLocaleString()} SAR</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingTravel(rec)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteTravelRecord.mutate(rec.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
