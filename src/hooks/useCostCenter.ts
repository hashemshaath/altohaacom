import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notifications";

// ─── Types ──────────────────────────────────

export type CostModuleType = "competition" | "chefs_table" | "exhibition" | "event" | "project" | "other";
export type CostEstimateStatus = "draft" | "pending_approval" | "approved" | "rejected" | "invoiced" | "cancelled";
export type CostItemCategory =
  | "personnel" | "equipment" | "venue" | "travel" | "accommodation"
  | "catering" | "materials" | "logistics" | "marketing" | "insurance"
  | "permits" | "miscellaneous";

export interface CostEstimate {
  id: string;
  estimate_number: string;
  module_type: CostModuleType;
  module_id: string | null;
  module_title: string | null;
  module_title_ar: string | null;
  company_id: string | null;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  status: CostEstimateStatus;
  prepared_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  valid_until: string | null;
  invoice_id: string | null;
  notes: string | null;
  notes_ar: string | null;
  internal_notes: string | null;
  version: number;
  parent_estimate_id: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CostEstimateItem {
  id: string;
  estimate_id: string;
  category: CostItemCategory;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  quantity: number;
  unit: string | null;
  unit_ar: string | null;
  unit_price: number;
  total_price: number;
  person_id: string | null;
  person_role: string | null;
  cost_profile_id: string | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

export interface CostApprovalLog {
  id: string;
  estimate_id: string;
  action: string;
  performed_by: string;
  comments: string | null;
  comments_ar: string | null;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
}

export interface CostTemplate {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  module_type: CostModuleType;
  items: Array<{
    category: CostItemCategory;
    title: string;
    title_ar?: string;
    unit?: string;
    unit_price: number;
    default_quantity: number;
  }>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Category Metadata ─────────────────────

export const COST_ITEM_CATEGORIES: Record<CostItemCategory, { en: string; ar: string; icon: string }> = {
  personnel:     { en: "Personnel",     ar: "الأفراد",      icon: "Users" },
  equipment:     { en: "Equipment",     ar: "المعدات",      icon: "Wrench" },
  venue:         { en: "Venue",         ar: "المكان",       icon: "MapPin" },
  travel:        { en: "Travel",        ar: "السفر",        icon: "Plane" },
  accommodation: { en: "Accommodation", ar: "الإقامة",      icon: "Hotel" },
  catering:      { en: "Catering",      ar: "الضيافة",      icon: "UtensilsCrossed" },
  materials:     { en: "Materials",     ar: "المواد",       icon: "Package" },
  logistics:     { en: "Logistics",     ar: "اللوجستيات",   icon: "Truck" },
  marketing:     { en: "Marketing",     ar: "التسويق",      icon: "Megaphone" },
  insurance:     { en: "Insurance",     ar: "التأمين",      icon: "Shield" },
  permits:       { en: "Permits",       ar: "التراخيص",     icon: "FileCheck" },
  miscellaneous: { en: "Miscellaneous", ar: "متنوعات",      icon: "MoreHorizontal" },
};

export const MODULE_TYPES: Record<CostModuleType, { en: string; ar: string }> = {
  competition:  { en: "Competition",   ar: "مسابقة" },
  chefs_table:  { en: "Chef's Table",  ar: "طاولة الشيف" },
  exhibition:   { en: "Exhibition",    ar: "معرض" },
  event:        { en: "Event",         ar: "فعالية" },
  project:      { en: "Project",       ar: "مشروع" },
  other:        { en: "Other",         ar: "أخرى" },
};

export const ESTIMATE_STATUS_CONFIG: Record<CostEstimateStatus, { en: string; ar: string; color: string }> = {
  draft:            { en: "Draft",            ar: "مسودة",        color: "bg-muted text-muted-foreground" },
  pending_approval: { en: "Pending Approval", ar: "بانتظار الموافقة", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  approved:         { en: "Approved",         ar: "معتمد",         color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
  rejected:         { en: "Rejected",         ar: "مرفوض",         color: "bg-destructive/10 text-destructive border-destructive/20" },
  invoiced:         { en: "Invoiced",         ar: "تمت الفوترة",   color: "bg-primary/10 text-primary border-primary/20" },
  cancelled:        { en: "Cancelled",        ar: "ملغى",          color: "bg-muted text-muted-foreground" },
};

// ─── Queries ────────────────────────────────

export function useCostEstimates(filters?: { moduleType?: string; status?: string }) {
  return useQuery({
    queryKey: ["cost-estimates", filters],
    queryFn: async () => {
      let query = supabase
        .from("cost_estimates" as any)
        .select("id, estimate_number, module_type, module_id, module_title, module_title_ar, company_id, title, title_ar, description, description_ar, subtotal, tax_rate, tax_amount, discount_amount, total_amount, currency, status, prepared_by, approved_by, approved_at, rejection_reason, valid_until, invoice_id, notes, notes_ar, internal_notes, version, parent_estimate_id, tags, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (filters?.moduleType && filters.moduleType !== "all") {
        query = query.eq("module_type", filters.moduleType);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as CostEstimate[];
    },
  });
}

export function useCostEstimate(id: string | undefined) {
  return useQuery({
    queryKey: ["cost-estimate", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_estimates" as any)
        .select("id, estimate_number, module_type, module_id, module_title, module_title_ar, company_id, title, title_ar, description, description_ar, subtotal, tax_rate, tax_amount, discount_amount, total_amount, currency, status, prepared_by, approved_by, approved_at, rejection_reason, valid_until, invoice_id, notes, notes_ar, internal_notes, version, parent_estimate_id, tags, created_at, updated_at")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as CostEstimate;
    },
    enabled: !!id,
  });
}

export function useCostEstimateItems(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["cost-estimate-items", estimateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_estimate_items" as any)
        .select("*")
        .eq("estimate_id", estimateId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as CostEstimateItem[];
    },
    enabled: !!estimateId,
  });
}

export function useCostApprovalLog(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["cost-approval-log", estimateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_approval_log" as any)
        .select("*")
        .eq("estimate_id", estimateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CostApprovalLog[];
    },
    enabled: !!estimateId,
  });
}

export function useCostTemplates(moduleType?: CostModuleType) {
  return useQuery({
    queryKey: ["cost-templates", moduleType],
    queryFn: async () => {
      let query = supabase
        .from("cost_templates" as any)
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (moduleType) {
        query = query.eq("module_type", moduleType);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as CostTemplate[];
    },
  });
}

// ─── Mutations ──────────────────────────────

export function useCreateCostEstimate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (estimate: Partial<CostEstimate>) => {
      const { data, error } = await supabase
        .from("cost_estimates" as any)
        .insert({ ...estimate, prepared_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CostEstimate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-estimates"] });
    },
  });
}

export function useUpdateCostEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CostEstimate> & { id: string }) => {
      const { data, error } = await supabase
        .from("cost_estimates" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CostEstimate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cost-estimates"] });
      queryClient.invalidateQueries({ queryKey: ["cost-estimate", data.id] });
    },
  });
}

export function useSaveCostEstimateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Partial<CostEstimateItem>) => {
      const totalPrice = (item.quantity || 1) * (item.unit_price || 0);
      const payload = { ...item, total_price: totalPrice };
      if (item.id) {
        const { id, ...rest } = payload;
        const { data, error } = await supabase
          .from("cost_estimate_items" as any)
          .update(rest as any)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as CostEstimateItem;
      } else {
        const { id, ...rest } = payload;
        const { data, error } = await supabase
          .from("cost_estimate_items" as any)
          .insert(rest as any)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as CostEstimateItem;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["cost-estimate-items", vars.estimate_id] });
      queryClient.invalidateQueries({ queryKey: ["cost-estimates"] });
    },
  });
}

export function useDeleteCostEstimateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estimateId }: { id: string; estimateId: string }) => {
      const { error } = await supabase
        .from("cost_estimate_items" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return estimateId;
    },
    onSuccess: (estimateId) => {
      queryClient.invalidateQueries({ queryKey: ["cost-estimate-items", estimateId] });
    },
  });
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ estimateId, comments }: { estimateId: string; comments?: string }) => {
      const { data: est } = await supabase.from("cost_estimates" as any).select("estimate_number, title").eq("id", estimateId).single();
      await supabase
        .from("cost_estimates" as any)
        .update({ status: "pending_approval" } as any)
        .eq("id", estimateId);
      await supabase
        .from("cost_approval_log" as any)
        .insert({
          estimate_id: estimateId,
          action: "submitted",
          performed_by: user?.id,
          comments,
          previous_status: "draft",
          new_status: "pending_approval",
        } as any);
      // Notify admins
      const { data: admins } = await supabase.from("user_roles" as any).select("user_id").eq("role", "supervisor");
      if (admins && est) {
        for (const a of (admins as any[])) {
          sendNotification({
            userId: a.user_id,
            title: `Cost Estimate Submitted: ${(est as any).estimate_number}`,
            titleAr: `تم تقديم تقدير تكلفة: ${(est as any).estimate_number}`,
            body: `"${(est as any).title}" needs your approval`,
            bodyAr: `"${(est as any).title}" يحتاج موافقتك`,
            type: "info",
            link: "/admin/cost-center",
            channels: ["in_app"],
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-estimates"] });
      queryClient.invalidateQueries({ queryKey: ["cost-approval-log"] });
    },
  });
}

export function useDuplicateCostEstimate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data: source, error: srcErr } = await supabase
        .from("cost_estimates" as any).select("*").eq("id", sourceId).single();
      if (srcErr) throw srcErr;
      const src = source as unknown as CostEstimate;

      const { data: items, error: itemsErr } = await supabase
        .from("cost_estimate_items" as any).select("*").eq("estimate_id", sourceId).order("sort_order");
      if (itemsErr) throw itemsErr;

      const { id, estimate_number, created_at, updated_at, status, approved_by, approved_at, rejection_reason, invoice_id, ...rest } = src;
      const { data: newEst, error: newErr } = await supabase
        .from("cost_estimates" as any)
        .insert({ ...rest, title: `${src.title} (Copy)`, status: "draft", prepared_by: user?.id, version: (src.version || 1) + 1, parent_estimate_id: sourceId } as any)
        .select().single();
      if (newErr) throw newErr;

      const lineItems = (items || []) as unknown as CostEstimateItem[];
      for (const item of lineItems) {
        const { id: _, estimate_id: __, created_at: ___, ...itemRest } = item;
        await supabase.from("cost_estimate_items" as any).insert({ ...itemRest, estimate_id: (newEst as any).id } as any);
      }
      return newEst as unknown as CostEstimate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-estimates"] });
    },
  });
}

export function useApproveCostEstimate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ estimateId, comments }: { estimateId: string; comments?: string }) => {
      const { data: est } = await supabase.from("cost_estimates" as any).select("estimate_number, title, prepared_by").eq("id", estimateId).single();
      await supabase
        .from("cost_estimates" as any)
        .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() } as any)
        .eq("id", estimateId);
      await supabase
        .from("cost_approval_log" as any)
        .insert({
          estimate_id: estimateId, action: "approved", performed_by: user?.id,
          comments, previous_status: "pending_approval", new_status: "approved",
        } as any);
      if (est && (est as any).prepared_by) {
        sendNotification({
          userId: (est as any).prepared_by,
          title: `Estimate Approved: ${(est as any).estimate_number}`,
          titleAr: `تمت الموافقة على التقدير: ${(est as any).estimate_number}`,
          body: `"${(est as any).title}" has been approved`,
          bodyAr: `تمت الموافقة على "${(est as any).title}"`,
          type: "success", link: "/admin/cost-center", channels: ["in_app"],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-estimates"] });
      queryClient.invalidateQueries({ queryKey: ["cost-approval-log"] });
    },
  });
}

export function useRejectCostEstimate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ estimateId, reason, comments }: { estimateId: string; reason: string; comments?: string }) => {
      const { data: est } = await supabase.from("cost_estimates" as any).select("estimate_number, title, prepared_by").eq("id", estimateId).single();
      await supabase
        .from("cost_estimates" as any)
        .update({ status: "rejected", rejection_reason: reason } as any)
        .eq("id", estimateId);
      await supabase
        .from("cost_approval_log" as any)
        .insert({
          estimate_id: estimateId, action: "rejected", performed_by: user?.id,
          comments: comments || reason, previous_status: "pending_approval", new_status: "rejected",
        } as any);
      if (est && (est as any).prepared_by) {
        sendNotification({
          userId: (est as any).prepared_by,
          title: `Estimate Rejected: ${(est as any).estimate_number}`,
          titleAr: `تم رفض التقدير: ${(est as any).estimate_number}`,
          body: `"${(est as any).title}" was rejected: ${reason}`,
          bodyAr: `تم رفض "${(est as any).title}": ${reason}`,
          type: "warning", link: "/admin/cost-center", channels: ["in_app"],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-estimates"] });
      queryClient.invalidateQueries({ queryKey: ["cost-approval-log"] });
    },
  });
}

export function useConvertToInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (estimateId: string) => {
      // Get estimate with items
      const { data: estimate, error: estErr } = await supabase
        .from("cost_estimates" as any)
        .select("*")
        .eq("id", estimateId)
        .single();
      if (estErr) throw estErr;
      const est = estimate as unknown as CostEstimate;

      const { data: items, error: itemsErr } = await supabase
        .from("cost_estimate_items" as any)
        .select("*")
        .eq("estimate_id", estimateId)
        .order("sort_order");
      if (itemsErr) throw itemsErr;
      const lineItems = (items || []) as unknown as CostEstimateItem[];

      // Create invoice
      const invoiceItems = lineItems.map(item => ({
        description: item.title,
        description_ar: item.title_ar,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total_price,
      }));

      const { data: invoice, error: invErr } = await supabase
        .from("invoices" as any)
        .insert({
          company_id: est.company_id,
          title: est.title,
          title_ar: est.title_ar,
          description: est.description,
          description_ar: est.description_ar,
          items: invoiceItems,
          subtotal: est.subtotal,
          tax_rate: est.tax_rate,
          tax_amount: est.tax_amount,
          discount_amount: est.discount_amount,
          amount: est.total_amount,
          currency: est.currency,
          status: "draft",
          issued_by: user?.id,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          notes: `Generated from estimate ${est.estimate_number}`,
        } as any)
        .select()
        .single();
      if (invErr) throw invErr;

      // Update estimate
      await supabase
        .from("cost_estimates" as any)
        .update({ status: "invoiced", invoice_id: (invoice as any).id } as any)
        .eq("id", estimateId);

      // Log
      await supabase
        .from("cost_approval_log" as any)
        .insert({
          estimate_id: estimateId,
          action: "invoiced",
          performed_by: user?.id,
          comments: `Invoice created: ${(invoice as any).invoice_number}`,
          previous_status: "approved",
          new_status: "invoiced",
        } as any);

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-estimates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["cost-approval-log"] });
    },
  });
}

export function useSaveCostTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: Partial<CostTemplate>) => {
      if (template.id) {
        const { id, ...rest } = template;
        const { error } = await supabase
          .from("cost_templates" as any)
          .update(rest as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { id, ...rest } = template;
        const { error } = await supabase
          .from("cost_templates" as any)
          .insert({ ...rest, created_by: user?.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-templates"] });
    },
  });
}

// ─── Recalculate Estimate Totals ────────────

export function recalcEstimateTotals(items: CostEstimateItem[], taxRate: number = 15, discount: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = Math.round(subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount - discount;
  return { subtotal, tax_amount: taxAmount, total_amount: totalAmount };
}
