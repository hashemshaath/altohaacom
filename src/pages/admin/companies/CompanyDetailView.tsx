import { useIsAr } from "@/hooks/useIsAr";
import { useState, lazy, memo } from "react";
import { safeLazy } from "@/lib/safeLazy";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadAndGetUrl } from "@/lib/storageUrl";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { countryFlag } from "@/lib/countryFlag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, Users, Package, Send, Plus, Trash2, Save, X,
  Truck, DollarSign, Star, Image, CalendarCheck, MessageSquare, UserPlus, Building,
  Upload, File, Sparkles, ChevronLeft, CheckCircle, XCircle, Phone, Mail,
} from "lucide-react";
import { type CompanyStatus, MEDIA_CATEGORIES, getTypeLabel, getStatusLabel } from "./companiesAdminTypes";
import { QUERY_LIMIT_MEDIUM } from "@/lib/constants";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

const AdminCatalogExtended = safeLazy(() => import("@/components/admin/AdminCatalogExtended").then(m => ({ default: m.AdminCatalogExtended })));
const CompanyEditPanel = safeLazy(() => import("@/components/admin/CompanyEditPanel").then(m => ({ default: m.CompanyEditPanel })));
const CompanyClassificationsPanel = safeLazy(() => import("@/components/admin/CompanyClassificationsPanel").then(m => ({ default: m.CompanyClassificationsPanel })));
const CompanySponsorshipPanelEnhanced = safeLazy(() => import("@/components/admin/CompanySponsorshipPanelEnhanced").then(m => ({ default: m.CompanySponsorshipPanelEnhanced })));
const CompanySupplierScorecard = safeLazy(() => import("@/components/admin/CompanySupplierScorecard").then(m => ({ default: m.CompanySupplierScorecard })));

interface Props {
  companyId: string;
  onBack: () => void;
}

export const CompanyDetailView = memo(function CompanyDetailView({ companyId, onBack }: Props) {
  const isAr = useIsAr();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [companyDetailTab, setCompanyDetailTab] = useState("overview");

  // Sub-form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [mediaCategory, setMediaCategory] = useState("logo");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [workingHours, setWorkingHours] = useState<Record<string, { open: string; close: string; enabled: boolean }>>({});
  const [editingHours, setEditingHours] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Forms
  const [contactForm, setContactForm] = useState({
    name: "", name_ar: "", title: "", title_ar: "", department: "general",
    email: "", phone: "", mobile: "", whatsapp: "", is_primary: false, can_login: false,
  });
  const [branchForm, setBranchForm] = useState({
    name: "", name_ar: "", address: "", address_ar: "", city: "", country: "",
    phone: "", email: "", postal_code: "", is_headquarters: false,
    manager_name: "", manager_phone: "", manager_email: "",
  });
  const [driverForm, setDriverForm] = useState({
    name: "", name_ar: "", phone: "", vehicle_type: "", vehicle_plate: "",
    license_number: "", is_available: true,
  });
  const [invitationForm, setInvitationForm] = useState({
    title: "", title_ar: "", description: "", invitation_type: "sponsorship",
    event_date: "", expires_at: "",
  });
  const [catalogForm, setCatalogForm] = useState({
    name: "", name_ar: "", category: "", sku: "", unit_price: "", quantity: "",
    description: "", shop_product_id: "",
  });

  // ── Queries ──
  const { data: companyDetails } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name, name_ar, type, status, country_code, country, city, address, address_ar, phone, email, website, logo_url, cover_image_url, description, description_ar, company_number, tax_number, registration_number, founded_year, specializations, social_links, currency, credit_limit, payment_terms, created_at, updated_at").eq("id", companyId).single();
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["company-contacts", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_contacts").select("id, company_id, user_id, name, name_ar, role, email, phone, mobile, is_primary, can_login, title, department, created_at").eq("company_id", companyId).order("is_primary", { ascending: false }).limit(QUERY_LIMIT_MEDIUM);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["company-branches", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_branches").select("id, company_id, name, name_ar, city, address, phone, email, is_headquarters, is_active, country, manager_name, manager_phone, created_at").eq("company_id", companyId).order("is_headquarters", { ascending: false }).limit(QUERY_LIMIT_MEDIUM);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["company-orders", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_orders").select("id, company_id, order_number, title, direction, status, total_amount, currency, notes, created_at, updated_at, created_by").eq("company_id", companyId).order("created_at", { ascending: false }).limit(20);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["company-transactions", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_transactions").select("id, company_id, transaction_number, type, amount, currency, description, description_ar, invoice_id, transaction_date, created_at, created_by").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ["company-invitations", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_invitations").select("id, company_id, invitation_type, title, title_ar, description, response_notes, status, expires_at, created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ["company-evaluations", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_evaluations").select("id, company_id, evaluated_by, overall_rating, quality_rating, delivery_rating, communication_rating, value_rating, review, review_ar, is_public, created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(QUERY_LIMIT_MEDIUM);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: catalogItems = [] } = useQuery({
    queryKey: ["company-catalog", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_catalog").select("id, company_id, name, name_ar, category, description, description_ar, unit_price, currency, image_url, is_active, sku, unit, quantity_available, shop_product_id, created_at").eq("company_id", companyId).order("category").order("name").limit(QUERY_LIMIT_MEDIUM);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["company-drivers", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_drivers").select("id, company_id, name, name_ar, phone, license_number, vehicle_type, vehicle_plate, is_available, is_active, created_at").eq("company_id", companyId).order("name").limit(200);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: communications = [] } = useQuery({
    queryKey: ["company-communications", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_communications").select("id, company_id, sender_id, direction, subject, message, status, priority, tags, is_archived, is_starred, is_internal_note, parent_id, created_at, updated_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(QUERY_LIMIT_MEDIUM);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: media = [] } = useQuery({
    queryKey: ["company-media", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_media").select("id, company_id, file_url, filename, file_type, file_size, title, category, description, created_at").eq("company_id", companyId).order("category").order("created_at", { ascending: false }).limit(QUERY_LIMIT_MEDIUM);
      if (error) throw handleSupabaseError(error);
      return data;
    },
  });

  const { data: shopProducts = [] } = useQuery({
    queryKey: ["shop-products-for-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_products").select("id, title, sku").eq("is_active", true).order("title").limit(100);
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
  });

  // ── Mutations ──
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompanyStatus }) => {
      const { error } = await supabase.from("companies").update({ status }).eq("id", id);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("company_contacts").insert({
        company_id: companyId, name: contactForm.name, name_ar: contactForm.name_ar || null,
        title: contactForm.title || null, title_ar: contactForm.title_ar || null,
        department: contactForm.department, email: contactForm.email || null,
        phone: contactForm.phone || null, mobile: contactForm.mobile || null,
        whatsapp: contactForm.whatsapp || null, is_primary: contactForm.is_primary, can_login: contactForm.can_login,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-contacts", companyId] });
      setShowContactForm(false);
      setContactForm({ name: "", name_ar: "", title: "", title_ar: "", department: "general", email: "", phone: "", mobile: "", whatsapp: "", is_primary: false, can_login: false });
      toast({ title: isAr ? "تم إضافة جهة الاتصال" : "Contact added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الإضافة" : "Failed to add", description: e instanceof Error ? e.message : String(e) }),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("company_contacts").delete().eq("id", id); if (error) throw handleSupabaseError(error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["company-contacts", companyId] }); toast({ title: isAr ? "تم الحذف" : "Contact removed" }); },
  });

  const addBranchMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("company_branches").insert({
        company_id: companyId, name: branchForm.name, name_ar: branchForm.name_ar || null,
        address: branchForm.address || null, address_ar: branchForm.address_ar || null,
        city: branchForm.city || null, country: branchForm.country || null,
        phone: branchForm.phone || null, email: branchForm.email || null,
        postal_code: branchForm.postal_code || null, is_headquarters: branchForm.is_headquarters,
        manager_name: branchForm.manager_name || null, manager_phone: branchForm.manager_phone || null, manager_email: branchForm.manager_email || null,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branches", companyId] });
      setShowBranchForm(false);
      setBranchForm({ name: "", name_ar: "", address: "", address_ar: "", city: "", country: "", phone: "", email: "", postal_code: "", is_headquarters: false, manager_name: "", manager_phone: "", manager_email: "" });
      toast({ title: isAr ? "تم إضافة الفرع" : "Branch added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الإضافة" : "Failed to add", description: e instanceof Error ? e.message : String(e) }),
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("company_branches").delete().eq("id", id); if (error) throw handleSupabaseError(error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["company-branches", companyId] }); toast({ title: isAr ? "تم الحذف" : "Branch removed" }); },
  });

  const addDriverMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("company_drivers").insert({
        company_id: companyId, name: driverForm.name, name_ar: driverForm.name_ar || null,
        phone: driverForm.phone, vehicle_type: driverForm.vehicle_type || null,
        vehicle_plate: driverForm.vehicle_plate || null, license_number: driverForm.license_number || null,
        is_available: driverForm.is_available,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-drivers", companyId] });
      setShowDriverForm(false);
      setDriverForm({ name: "", name_ar: "", phone: "", vehicle_type: "", vehicle_plate: "", license_number: "", is_available: true });
      toast({ title: isAr ? "تم إضافة السائق" : "Driver added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الإضافة" : "Failed to add", description: e instanceof Error ? e.message : String(e) }),
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("company_drivers").delete().eq("id", id); if (error) throw handleSupabaseError(error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["company-drivers", companyId] }); toast({ title: isAr ? "تم الحذف" : "Driver removed" }); },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from("company_invitations").insert({
        company_id: companyId, invitation_type: invitationForm.invitation_type,
        title: invitationForm.title, title_ar: invitationForm.title_ar || null,
        description: invitationForm.description || null, event_date: invitationForm.event_date || null,
        expires_at: invitationForm.expires_at || null, status: "pending", created_by: user?.id || null,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-invitations", companyId] });
      setShowInvitationForm(false);
      setInvitationForm({ title: "", title_ar: "", description: "", invitation_type: "sponsorship", event_date: "", expires_at: "" });
      toast({ title: isAr ? "تم إرسال الدعوة" : "Invitation sent" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : String(e) }),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ parentId, message }: { parentId: string; message: string }) => {
      const parent = communications.find((c) => c.id === parentId);
      const { error } = await supabase.from("company_communications").insert({
        company_id: companyId, sender_id: (await supabase.auth.getUser()).data.user?.id || "",
        subject: `Re: ${parent?.subject || ""}`, message, direction: "incoming",
        priority: parent?.priority || "normal", parent_id: parentId, status: "unread",
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-communications"] });
      setReplyTarget(null); setReplyMessage("");
      toast({ title: isAr ? "تم إرسال الرد" : "Reply sent" });
    },
    onError: () => toast({ title: isAr ? "فشل الإرسال" : "Failed to send", variant: "destructive" }),
  });

  const saveWorkingHoursMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("companies").update({ working_hours: workingHours as any }).eq("id", companyId);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      setEditingHours(false);
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${companyId}/${mediaCategory}/${Date.now()}.${ext}`;
      const { url: fileUrl, error: uploadError } = await uploadAndGetUrl("company-media", path, file);
      if (uploadError) {
        const { error: err2 } = await supabase.storage.from("ad-creatives").upload(path, file);
        if (err2) throw err2;
        const { data: urlData } = supabase.storage.from("ad-creatives").getPublicUrl(path);
        return { url: urlData.publicUrl, file };
      }
      return { url: fileUrl, file };
    },
    onSuccess: async ({ url, file }) => {
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("company_media").insert({
        company_id: companyId, category: mediaCategory, file_url: url,
        filename: file.name, file_type: file.type, file_size: file.size, uploaded_by: user?.id || null,
      });
      queryClient.invalidateQueries({ queryKey: ["company-media", companyId] });
      toast({ title: isAr ? "تم رفع الملف" : "File uploaded" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الرفع" : "Upload failed", description: e instanceof Error ? e.message : String(e) }),
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("company_media").delete().eq("id", id); if (error) throw handleSupabaseError(error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["company-media", companyId] }); toast({ title: isAr ? "تم الحذف" : "Deleted" }); },
  });

  const addCatalogMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("company_catalog").insert({
        company_id: companyId, name: catalogForm.name, name_ar: catalogForm.name_ar || null,
        category: catalogForm.category, sku: catalogForm.sku || null,
        unit_price: catalogForm.unit_price ? Number(catalogForm.unit_price) : null,
        quantity_available: catalogForm.quantity ? Number(catalogForm.quantity) : null,
        description: catalogForm.description || null,
        shop_product_id: catalogForm.shop_product_id && catalogForm.shop_product_id !== "none" ? catalogForm.shop_product_id : null,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-catalog", companyId] });
      setShowCatalogForm(false);
      setCatalogForm({ name: "", name_ar: "", category: "", sku: "", unit_price: "", quantity: "", description: "", shop_product_id: "" });
      toast({ title: isAr ? "تم إضافة المنتج" : "Product added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الإضافة" : "Failed to add", description: e instanceof Error ? e.message : String(e) }),
  });

  const deleteCatalogMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("company_catalog").delete().eq("id", id); if (error) throw handleSupabaseError(error); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["company-catalog", companyId] }); toast({ title: isAr ? "تم الحذف" : "Deleted" }); },
  });

  const handleAITranslate = async (textAr: string, setter: (enText: string) => void) => {
    if (!textAr.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text: textAr, source_lang: "ar", target_lang: "en", optimize_seo: true },
      });
      if (error) throw handleSupabaseError(error);
      if (data?.translated) setter(data.translated);
      else toast({ variant: "destructive", title: isAr ? "لم يتم الترجمة" : "Translation failed" });
    } catch {
      toast({ variant: "destructive", title: isAr ? "خدمة الترجمة غير متاحة حالياً" : "Translation service unavailable" });
    }
    setAiLoading(false);
  };

  const AIButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={disabled || aiLoading} className="gap-1">
      <Sparkles className="h-3 w-3" />
      {aiLoading ? "..." : isAr ? "ترجمة + SEO" : "Translate + SEO"}
    </Button>
  );

  if (!companyDetails) return null;

  const companyBalance = transactions.reduce((acc, t: any) => {
    if (t.type === "payment" || t.type === "credit" || t.type === "refund") return acc + Number(t.amount);
    if (t.type === "invoice" || t.type === "debit") return acc - Number(t.amount);
    return acc + Number(t.amount);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            {companyDetails.logo_url ? (
              <img src={companyDetails.logo_url} alt={companyDetails.name} className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{isAr && companyDetails.name_ar ? companyDetails.name_ar : companyDetails.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <AdminStatusBadge status={companyDetails.status} label={getStatusLabel(companyDetails.status, isAr)} />
                <Badge variant="outline">{getTypeLabel(companyDetails.type, isAr)}</Badge>
                {companyDetails.country_code && (
                  <Badge variant="outline">{countryFlag(companyDetails.country_code)} {companyDetails.country || companyDetails.country_code}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {companyDetails.status === "pending" && (
            <Button onClick={() => updateStatusMutation.mutate({ id: companyDetails.id, status: "active" })}>
              <CheckCircle className="h-4 w-4 me-2" />{isAr ? "تفعيل" : "Activate"}
            </Button>
          )}
          {companyDetails.status === "active" && (
            <Button variant="outline" onClick={() => updateStatusMutation.mutate({ id: companyDetails.id, status: "suspended" })}>
              <XCircle className="h-4 w-4 me-2" />{isAr ? "تعليق" : "Suspend"}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-chart-5" /><div><p className="text-sm text-muted-foreground">{isAr ? "الرصيد" : "Balance"}</p><p className={`text-xl font-bold ${companyBalance >= 0 ? "text-chart-5" : "text-destructive"}`}>{companyBalance.toLocaleString()} {companyDetails.currency || "SAR"}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Package className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">{isAr ? "الطلبات" : "Orders"}</p><p className="text-xl font-bold">{orders.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><CalendarCheck className="h-8 w-8 text-chart-3" /><div><p className="text-sm text-muted-foreground">{isAr ? "الدعوات" : "Invitations"}</p><p className="text-xl font-bold">{invitations.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Star className="h-8 w-8 text-chart-4" /><div><p className="text-sm text-muted-foreground">{isAr ? "التقييم" : "Rating"}</p><p className="text-xl font-bold">{evaluations.length > 0 ? (evaluations.reduce((a, e) => a + Number(e.overall_rating || 0), 0) / evaluations.length).toFixed(1) : "-"}</p></div></div></CardContent></Card>
      </div>

      {/* Detail Tabs */}
      <Tabs value={companyDetailTab} onValueChange={setCompanyDetailTab}>
        <TabsList className="flex-wrap h-auto gap-1 rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5">
          <TabsTrigger value="overview">{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
          <TabsTrigger value="contacts">{isAr ? "جهات الاتصال" : "Contacts"}</TabsTrigger>
          <TabsTrigger value="branches">{isAr ? "الفروع" : "Branches"}</TabsTrigger>
          <TabsTrigger value="orders">{isAr ? "الطلبات" : "Orders"}</TabsTrigger>
          <TabsTrigger value="transactions">{isAr ? "الحساب" : "Account"}</TabsTrigger>
          <TabsTrigger value="invitations">{isAr ? "الدعوات" : "Invitations"}</TabsTrigger>
          <TabsTrigger value="evaluations">{isAr ? "التقييمات" : "Evaluations"}</TabsTrigger>
          <TabsTrigger value="catalog">{isAr ? "الكتالوج" : "Catalog"}</TabsTrigger>
          <TabsTrigger value="drivers">{isAr ? "السائقون" : "Drivers"}</TabsTrigger>
          <TabsTrigger value="communications">{isAr ? "التواصل" : "Communications"}</TabsTrigger>
          <TabsTrigger value="media">{isAr ? "الوسائط" : "Media"}</TabsTrigger>
          <TabsTrigger value="roles">{isAr ? "التصنيفات" : "Classifications"}</TabsTrigger>
          <TabsTrigger value="sponsorship">{isAr ? "الرعاية" : "Sponsorship"}</TabsTrigger>
          <TabsTrigger value="scorecard">{isAr ? "بطاقة الأداء" : "Scorecard"}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <CompanyEditPanel companyId={companyId} companyDetails={companyDetails as any} />
        </TabsContent>

        {/* Contacts */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isAr ? "جهات الاتصال" : "Contacts"}</h3>
            <Button onClick={() => setShowContactForm(!showContactForm)}>
              {showContactForm ? <><X className="h-4 w-4 me-2" />{isAr ? "إلغاء" : "Cancel"}</> : <><UserPlus className="h-4 w-4 me-2" />{isAr ? "إضافة جهة اتصال" : "Add Contact"}</>}
            </Button>
          </div>
          {showContactForm && (
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-base">{isAr ? "جهة اتصال جديدة" : "New Contact"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label><Input value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label><Input value={contactForm.name_ar} onChange={e => setContactForm({ ...contactForm, name_ar: e.target.value })} dir="rtl" /></div>
                  <div className="space-y-2"><Label>{isAr ? "المسمى الوظيفي (EN)" : "Title (EN)"}</Label><Input value={contactForm.title} onChange={e => setContactForm({ ...contactForm, title: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "المسمى الوظيفي (AR)" : "Title (AR)"}</Label><Input value={contactForm.title_ar} onChange={e => setContactForm({ ...contactForm, title_ar: e.target.value })} dir="rtl" /></div>
                  <div className="space-y-2">
                    <Label>{isAr ? "القسم" : "Department"} *</Label>
                    <Select value={contactForm.department} onValueChange={v => setContactForm({ ...contactForm, department: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{isAr ? "عام" : "General"}</SelectItem>
                        <SelectItem value="sales">{isAr ? "المبيعات" : "Sales"}</SelectItem>
                        <SelectItem value="finance">{isAr ? "المالية" : "Finance"}</SelectItem>
                        <SelectItem value="operations">{isAr ? "العمليات" : "Operations"}</SelectItem>
                        <SelectItem value="marketing">{isAr ? "التسويق" : "Marketing"}</SelectItem>
                        <SelectItem value="management">{isAr ? "الإدارة" : "Management"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label><Input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "الجوال" : "Mobile"}</Label><Input value={contactForm.mobile} onChange={e => setContactForm({ ...contactForm, mobile: e.target.value })} /></div>
                  <div className="space-y-2"><Label>WhatsApp</Label><Input value={contactForm.whatsapp} onChange={e => setContactForm({ ...contactForm, whatsapp: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Switch checked={contactForm.is_primary} onCheckedChange={v => setContactForm({ ...contactForm, is_primary: v })} /><Label className="cursor-pointer">{isAr ? "جهة اتصال أساسية" : "Primary contact"}</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={contactForm.can_login} onCheckedChange={v => setContactForm({ ...contactForm, can_login: v })} /><Label className="cursor-pointer">{isAr ? "يمكنه تسجيل الدخول" : "Can login"}</Label></div>
                </div>
                <Button onClick={() => addContactMutation.mutate()} disabled={!contactForm.name || !contactForm.department || addContactMutation.isPending}>
                  <Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      {contact.name_ar && <p className="text-sm text-muted-foreground" dir="rtl">{contact.name_ar}</p>}
                      <p className="text-sm text-muted-foreground">{contact.title}</p>
                      <Badge variant="outline" className="mt-1">{contact.department}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {contact.is_primary && <Badge className="bg-primary">{isAr ? "أساسي" : "Primary"}</Badge>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteContactMutation.mutate(contact.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-1 text-sm">
                    {contact.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /><span>{contact.email}</span></div>}
                    {contact.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /><span>{contact.phone}</span></div>}
                    {contact.mobile && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /><span>{contact.mobile}</span></div>}
                  </div>
                  {contact.can_login && <Badge variant="secondary" className="mt-3">{isAr ? "يمكنه تسجيل الدخول" : "Can login"}</Badge>}
                </CardContent>
              </Card>
            ))}
            {contacts.length === 0 && !showContactForm && (
              <div className="col-span-full text-center py-12 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد جهات اتصال" : "No contacts found"}</p></div>
            )}
          </div>
        </TabsContent>

        {/* Branches */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isAr ? "الفروع" : "Branches"}</h3>
            <Button onClick={() => setShowBranchForm(!showBranchForm)}>
              {showBranchForm ? <><X className="h-4 w-4 me-2" />{isAr ? "إلغاء" : "Cancel"}</> : <><Plus className="h-4 w-4 me-2" />{isAr ? "إضافة فرع" : "Add Branch"}</>}
            </Button>
          </div>
          {showBranchForm && (
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-base">{isAr ? "فرع جديد" : "New Branch"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isAr ? "اسم الفرع (EN)" : "Branch Name (EN)"} *</Label><Input value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "اسم الفرع (AR)" : "Branch Name (AR)"}</Label><Input value={branchForm.name_ar} onChange={e => setBranchForm({ ...branchForm, name_ar: e.target.value })} dir="rtl" /></div>
                  <div className="space-y-2"><Label>{isAr ? "العنوان" : "Address"}</Label><Input value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "المدينة" : "City"}</Label><Input value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "الدولة" : "Country"}</Label><Input value={branchForm.country} onChange={e => setBranchForm({ ...branchForm, country: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "البريد" : "Email"}</Label><Input type="email" value={branchForm.email} onChange={e => setBranchForm({ ...branchForm, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "اسم المدير" : "Manager Name"}</Label><Input value={branchForm.manager_name} onChange={e => setBranchForm({ ...branchForm, manager_name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "هاتف المدير" : "Manager Phone"}</Label><Input value={branchForm.manager_phone} onChange={e => setBranchForm({ ...branchForm, manager_phone: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={branchForm.is_headquarters} onCheckedChange={v => setBranchForm({ ...branchForm, is_headquarters: v })} /><Label className="cursor-pointer">{isAr ? "المقر الرئيسي" : "Headquarters"}</Label></div>
                <Button onClick={() => addBranchMutation.mutate()} disabled={!branchForm.name || addBranchMutation.isPending}><Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}</Button>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((branch) => (
              <Card key={branch.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div><p className="font-semibold">{branch.name}</p><p className="text-sm text-muted-foreground">{[branch.city, branch.country].filter(Boolean).join(", ")}</p></div>
                    <div className="flex items-center gap-1">
                      {branch.is_headquarters && <Badge className="bg-primary">{isAr ? "المقر الرئيسي" : "HQ"}</Badge>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteBranchMutation.mutate(branch.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                  {branch.address && <p className="text-sm mt-2">{branch.address}</p>}
                  {branch.manager_name && (<><Separator className="my-3" /><div><p className="text-sm text-muted-foreground">{isAr ? "مدير الفرع" : "Branch Manager"}</p><p className="font-medium">{branch.manager_name}</p>{branch.manager_phone && <p className="text-sm">{branch.manager_phone}</p>}</div></>)}
                </CardContent>
              </Card>
            ))}
            {branches.length === 0 && !showBranchForm && (<div className="col-span-full text-center py-12 text-muted-foreground"><Building className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد فروع" : "No branches found"}</p></div>)}
          </div>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders" className="space-y-4">
          <h3 className="text-lg font-semibold">{isAr ? "الطلبات" : "Orders"}</h3>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{isAr ? "رقم الطلب" : "Order #"}</TableHead>
                <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                <TableHead>{isAr ? "الاتجاه" : "Direction"}</TableHead>
                <TableHead>{isAr ? "المبلغ" : "Amount"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.order_number}</TableCell>
                    <TableCell>{o.title || "-"}</TableCell>
                    <TableCell><Badge variant={o.direction === "incoming" ? "default" : "secondary"}>{o.direction}</Badge></TableCell>
                    <TableCell>{Number(o.total_amount).toLocaleString()} {o.currency}</TableCell>
                    <TableCell><AdminStatusBadge status={o.status} label={o.status} /></TableCell>
                    <TableCell>{format(new Date(o.created_at), "yyyy-MM-dd")}</TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد طلبات" : "No orders"}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions" className="space-y-4">
          <h3 className="text-lg font-semibold">{isAr ? "كشف الحساب" : "Account Statement"}</h3>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{isAr ? "رقم المعاملة" : "Transaction #"}</TableHead>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "الوصف" : "Description"}</TableHead>
                <TableHead>{isAr ? "المبلغ" : "Amount"}</TableHead>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono">{t.transaction_number}</TableCell>
                    <TableCell><Badge variant={["payment", "credit", "refund"].includes(t.type) ? "default" : "secondary"}>{t.type}</Badge></TableCell>
                    <TableCell>{t.description || "-"}</TableCell>
                    <TableCell className={["payment", "credit", "refund"].includes(t.type) ? "text-chart-5" : "text-destructive"}>{["payment", "credit", "refund"].includes(t.type) ? "+" : "-"}{Number(t.amount).toLocaleString()} {t.currency}</TableCell>
                    <TableCell>{format(new Date(t.created_at), "yyyy-MM-dd")}</TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد معاملات" : "No transactions"}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* Invitations */}
        <TabsContent value="invitations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isAr ? "الدعوات" : "Invitations"}</h3>
            <Button onClick={() => setShowInvitationForm(!showInvitationForm)}>
              {showInvitationForm ? <><X className="h-4 w-4 me-2" />{isAr ? "إلغاء" : "Cancel"}</> : <><Send className="h-4 w-4 me-2" />{isAr ? "دعوة جديدة" : "New Invitation"}</>}
            </Button>
          </div>
          {showInvitationForm && (
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-base">{isAr ? "إرسال دعوة جديدة" : "Send New Invitation"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{isAr ? "نوع الدعوة" : "Type"}</Label>
                  <Select value={invitationForm.invitation_type} onValueChange={v => setInvitationForm({ ...invitationForm, invitation_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sponsorship">{isAr ? "رعاية" : "Sponsorship"}</SelectItem>
                      <SelectItem value="section_sponsor">{isAr ? "رعاية قسم" : "Section Sponsor"}</SelectItem>
                      <SelectItem value="exhibition_sponsor">{isAr ? "رعاية معرض" : "Exhibition Sponsor"}</SelectItem>
                      <SelectItem value="participation">{isAr ? "مشاركة" : "Participation"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><Label>{isAr ? "العنوان (EN)" : "Title (EN)"} *</Label><AIButton onClick={() => handleAITranslate(invitationForm.title_ar, v => setInvitationForm(f => ({ ...f, title: v })))} /></div>
                    <Input value={invitationForm.title} onChange={e => setInvitationForm({ ...invitationForm, title: e.target.value })} />
                  </div>
                  <div className="space-y-2"><Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label><Input value={invitationForm.title_ar} onChange={e => setInvitationForm({ ...invitationForm, title_ar: e.target.value })} dir="rtl" /></div>
                </div>
                <div className="space-y-2"><Label>{isAr ? "الوصف" : "Description"}</Label><Textarea value={invitationForm.description} onChange={e => setInvitationForm({ ...invitationForm, description: e.target.value })} rows={3} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isAr ? "تاريخ الفعالية" : "Event Date"}</Label><Input type="date" value={invitationForm.event_date} onChange={e => setInvitationForm({ ...invitationForm, event_date: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "ينتهي في" : "Expires At"}</Label><Input type="date" value={invitationForm.expires_at} onChange={e => setInvitationForm({ ...invitationForm, expires_at: e.target.value })} /></div>
                </div>
                <Button onClick={() => sendInvitationMutation.mutate()} disabled={!invitationForm.title || sendInvitationMutation.isPending}><Send className="me-2 h-4 w-4" />{isAr ? "إرسال" : "Send"}</Button>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map((inv) => (
              <Card key={inv.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div><p className="font-semibold">{isAr && inv.title_ar ? inv.title_ar : inv.title}</p><p className="text-sm text-muted-foreground">{inv.invitation_type}</p></div>
                    <Badge className={inv.status === "accepted" ? "bg-chart-5" : inv.status === "declined" ? "bg-destructive" : inv.status === "expired" ? "bg-muted-foreground" : "bg-chart-4"}>{inv.status}</Badge>
                  </div>
                  {inv.description && <p className="text-sm mt-2">{inv.description}</p>}
                  {inv.response_notes && <div className="mt-2 rounded-md bg-muted p-2"><p className="text-xs text-muted-foreground mb-0.5">{isAr ? "ملاحظات الرد" : "Response"}</p><p className="text-sm">{inv.response_notes}</p></div>}
                  <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                    <span>{format(new Date(inv.created_at), "yyyy-MM-dd")}</span>
                    {inv.expires_at && <span>{isAr ? "ينتهي:" : "Expires:"} {format(new Date(inv.expires_at), "yyyy-MM-dd")}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {invitations.length === 0 && !showInvitationForm && (<div className="col-span-full text-center py-12 text-muted-foreground"><CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد دعوات" : "No invitations found"}</p></div>)}
          </div>
        </TabsContent>

        {/* Evaluations */}
        <TabsContent value="evaluations" className="space-y-4">
          <h3 className="text-lg font-semibold">{isAr ? "التقييمات" : "Evaluations"}</h3>
          <div className="space-y-4">
            {evaluations.map((ev) => (
              <Card key={ev.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center"><p className="text-sm text-muted-foreground">{isAr ? "الجودة" : "Quality"}</p><p className="text-2xl font-bold">{ev.quality_rating}/5</p></div>
                    <div className="text-center"><p className="text-sm text-muted-foreground">{isAr ? "التوصيل" : "Delivery"}</p><p className="text-2xl font-bold">{ev.delivery_rating}/5</p></div>
                    <div className="text-center"><p className="text-sm text-muted-foreground">{isAr ? "التواصل" : "Communication"}</p><p className="text-2xl font-bold">{ev.communication_rating}/5</p></div>
                    <div className="text-center"><p className="text-sm text-muted-foreground">{isAr ? "القيمة" : "Value"}</p><p className="text-2xl font-bold">{ev.value_rating}/5</p></div>
                  </div>
                  {ev.review && <><Separator className="my-4" /><p>{ev.review}</p></>}
                  <p className="text-sm text-muted-foreground mt-4">{format(new Date(ev.created_at), "yyyy-MM-dd")}</p>
                </CardContent>
              </Card>
            ))}
            {evaluations.length === 0 && <div className="text-center py-12 text-muted-foreground"><Star className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد تقييمات" : "No evaluations found"}</p></div>}
          </div>
        </TabsContent>

        {/* Catalog */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isAr ? "كتالوج المنتجات" : "Product Catalog"}</h3>
            <Button onClick={() => setShowCatalogForm(!showCatalogForm)}>
              {showCatalogForm ? <><X className="h-4 w-4 me-2" />{isAr ? "إلغاء" : "Cancel"}</> : <><Plus className="h-4 w-4 me-2" />{isAr ? "إضافة منتج" : "Add Product"}</>}
            </Button>
          </div>
          {showCatalogForm && (
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-base">{isAr ? "منتج جديد" : "New Product"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isAr ? "اسم المنتج (EN)" : "Product Name (EN)"} *</Label><Input value={catalogForm.name} onChange={e => setCatalogForm({ ...catalogForm, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "اسم المنتج (AR)" : "Product Name (AR)"}</Label><Input value={catalogForm.name_ar} onChange={e => setCatalogForm({ ...catalogForm, name_ar: e.target.value })} dir="rtl" /></div>
                  <div className="space-y-2"><Label>{isAr ? "الفئة" : "Category"} *</Label><Input value={catalogForm.category} onChange={e => setCatalogForm({ ...catalogForm, category: e.target.value })} placeholder="e.g. ingredients, equipment" /></div>
                  <div className="space-y-2"><Label>SKU</Label><Input value={catalogForm.sku} onChange={e => setCatalogForm({ ...catalogForm, sku: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "السعر" : "Price"}</Label><Input type="number" value={catalogForm.unit_price} onChange={e => setCatalogForm({ ...catalogForm, unit_price: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "الكمية" : "Quantity"}</Label><Input type="number" value={catalogForm.quantity} onChange={e => setCatalogForm({ ...catalogForm, quantity: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>{isAr ? "الوصف" : "Description"}</Label><Textarea value={catalogForm.description} onChange={e => setCatalogForm({ ...catalogForm, description: e.target.value })} rows={2} /></div>
                {shopProducts.length > 0 && (
                  <div className="space-y-2">
                    <Label>{isAr ? "ربط بمنتج المتجر" : "Link to Shop Product"}</Label>
                    <Select value={catalogForm.shop_product_id} onValueChange={v => setCatalogForm({ ...catalogForm, shop_product_id: v })}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختياري - ربط بالمتجر" : "Optional - Link to shop"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{isAr ? "بدون ربط" : "No link"}</SelectItem>
                        {shopProducts.map((p) => (<SelectItem key={p.id} value={p.id}>{p.title} {p.sku ? `(${p.sku})` : ""}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={() => addCatalogMutation.mutate()} disabled={!catalogForm.name || !catalogForm.category || addCatalogMutation.isPending}><Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}</Button>
              </CardContent>
            </Card>
          )}
          {catalogItems.length > 0 ? (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{isAr ? "المنتج" : "Product"}</TableHead>
                  <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>{isAr ? "السعر" : "Price"}</TableHead>
                  <TableHead>{isAr ? "الكمية" : "Qty"}</TableHead>
                  <TableHead>{isAr ? "المتجر" : "Shop"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {catalogItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><div><p className="font-medium">{item.name}</p>{item.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{item.name_ar}</p>}</div></TableCell>
                      <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{item.sku || "-"}</TableCell>
                      <TableCell>{item.unit_price != null ? `${Number(item.unit_price).toLocaleString()} ${item.currency || "SAR"}` : "-"}{item.unit && <span className="text-xs text-muted-foreground"> / {item.unit}</span>}</TableCell>
                      <TableCell>{item.quantity_available ?? "-"}</TableCell>
                      <TableCell>{item.shop_product_id ? <Badge className="bg-chart-5/10 text-chart-5">{isAr ? "مرتبط" : "Linked"}</Badge> : <Badge variant="secondary">{isAr ? "غير مرتبط" : "Not linked"}</Badge>}</TableCell>
                      <TableCell><Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCatalogMutation.mutate(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          ) : !showCatalogForm && (
            <div className="text-center py-12 text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد منتجات" : "No catalog items"}</p></div>
          )}
          <div className="mt-6"><Separator className="mb-4" /><AdminCatalogExtended companyId={companyId} /></div>
        </TabsContent>

        {/* Drivers */}
        <TabsContent value="drivers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isAr ? "السائقون" : "Drivers"}</h3>
            <Button onClick={() => setShowDriverForm(!showDriverForm)}>
              {showDriverForm ? <><X className="h-4 w-4 me-2" />{isAr ? "إلغاء" : "Cancel"}</> : <><Plus className="h-4 w-4 me-2" />{isAr ? "إضافة سائق" : "Add Driver"}</>}
            </Button>
          </div>
          {showDriverForm && (
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-base">{isAr ? "سائق جديد" : "New Driver"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label><Input value={driverForm.name} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label><Input value={driverForm.name_ar} onChange={e => setDriverForm({ ...driverForm, name_ar: e.target.value })} dir="rtl" /></div>
                  <div className="space-y-2"><Label>{isAr ? "الهاتف" : "Phone"} *</Label><Input value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "نوع المركبة" : "Vehicle Type"}</Label><Input value={driverForm.vehicle_type} onChange={e => setDriverForm({ ...driverForm, vehicle_type: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "لوحة المركبة" : "Vehicle Plate"}</Label><Input value={driverForm.vehicle_plate} onChange={e => setDriverForm({ ...driverForm, vehicle_plate: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{isAr ? "رقم الرخصة" : "License Number"}</Label><Input value={driverForm.license_number} onChange={e => setDriverForm({ ...driverForm, license_number: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={driverForm.is_available} onCheckedChange={v => setDriverForm({ ...driverForm, is_available: v })} /><Label className="cursor-pointer">{isAr ? "متاح" : "Available"}</Label></div>
                <Button onClick={() => addDriverMutation.mutate()} disabled={!driverForm.name || !driverForm.phone || addDriverMutation.isPending}><Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}</Button>
              </CardContent>
            </Card>
          )}
          {drivers.length > 0 ? (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{isAr ? "السائق" : "Driver"}</TableHead>
                  <TableHead>{isAr ? "الهاتف" : "Phone"}</TableHead>
                  <TableHead>{isAr ? "المركبة" : "Vehicle"}</TableHead>
                  <TableHead>{isAr ? "الرخصة" : "License"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell><div><p className="font-medium">{driver.name}</p>{driver.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{driver.name_ar}</p>}</div></TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>{[driver.vehicle_type, driver.vehicle_plate].filter(Boolean).join(" - ") || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{driver.license_number || "-"}</TableCell>
                      <TableCell><Badge variant={driver.is_available ? "default" : "secondary"}>{driver.is_available ? (isAr ? "متاح" : "Available") : (isAr ? "غير متاح" : "Unavailable")}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteDriverMutation.mutate(driver.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          ) : !showDriverForm && (
            <div className="text-center py-12 text-muted-foreground"><Truck className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا يوجد سائقون" : "No drivers found"}</p></div>
          )}
        </TabsContent>

        {/* Communications */}
        <TabsContent value="communications" className="space-y-4">
          <h3 className="text-lg font-semibold">
            {isAr ? "سجل التواصل" : "Communication Log"}
            {communications.filter((c) => c.direction === "outgoing" && c.status === "unread").length > 0 && (
              <Badge variant="destructive" className="ms-2">{communications.filter((c) => c.direction === "outgoing" && c.status === "unread").length}</Badge>
            )}
          </h3>
          {communications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد رسائل" : "No messages"}</p></div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {communications.map((msg) => (
                  <Card key={msg.id} className={msg.status === "unread" ? "border-primary/30" : ""}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{msg.direction === "outgoing" ? (isAr ? "من الشركة" : "From Company") : (isAr ? "من الإدارة" : "From Admin")}</Badge>
                            {msg.priority === "urgent" && <Badge variant="destructive" className="text-xs">{isAr ? "عاجل" : "Urgent"}</Badge>}
                            {msg.priority === "high" && <Badge className="bg-chart-4 text-xs">{isAr ? "مرتفع" : "High"}</Badge>}
                            <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), "yyyy-MM-dd HH:mm")}</span>
                          </div>
                          <p className="font-medium text-sm">{msg.subject}</p>
                          <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                          {msg.parent_id && <Badge variant="secondary" className="mt-1 text-xs">{isAr ? "رد" : "Reply"}</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={msg.status === "unread" ? "default" : "secondary"} className="text-xs">{msg.status === "unread" ? (isAr ? "جديد" : "New") : (isAr ? "مقروءة" : "Read")}</Badge>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setReplyTarget(msg.id); setReplyMessage(""); }}><Send className="h-3 w-3 me-1" />{isAr ? "رد" : "Reply"}</Button>
                        </div>
                      </div>
                      {replyTarget === msg.id && (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          <Textarea value={replyMessage} onChange={e => setReplyMessage(e.target.value)} rows={2} placeholder={isAr ? "اكتب ردك هنا..." : "Type your reply..."} />
                          <div className="flex gap-2">
                            <Button size="sm" disabled={!replyMessage || replyMutation.isPending} onClick={() => replyMutation.mutate({ parentId: msg.id, message: replyMessage })}><Send className="h-3 w-3 me-1" />{isAr ? "إرسال" : "Send"}</Button>
                            <Button variant="outline" size="sm" onClick={() => setReplyTarget(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Media */}
        <TabsContent value="media" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isAr ? "مكتبة الوسائط" : "Media Library"}</h3>
            <Button onClick={() => setShowMediaUpload(!showMediaUpload)}>
              {showMediaUpload ? <><X className="h-4 w-4 me-2" />{isAr ? "إلغاء" : "Cancel"}</> : <><Upload className="h-4 w-4 me-2" />{isAr ? "رفع ملف" : "Upload File"}</>}
            </Button>
          </div>
          {showMediaUpload && (
            <Card className="border-primary/30">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>{isAr ? "التصنيف" : "Category"}</Label>
                  <Select value={mediaCategory} onValueChange={setMediaCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MEDIA_CATEGORIES.map(c => (<SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => { const file = e.target.files?.[0]; if (file) uploadMediaMutation.mutate(file); }} disabled={uploadMediaMutation.isPending} />
                  {uploadMediaMutation.isPending && <p className="text-sm text-muted-foreground mt-1">{isAr ? "جارٍ الرفع..." : "Uploading..."}</p>}
                </div>
              </CardContent>
            </Card>
          )}
          {MEDIA_CATEGORIES.map(cat => {
            const catMedia = media.filter((m) => m.category === cat.value);
            if (catMedia.length === 0 && !showMediaUpload) return null;
            const CatIcon = cat.icon;
            return (
              <Card key={cat.value}>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CatIcon className="h-4 w-4 text-primary" />{isAr ? cat.labelAr : cat.label}<Badge variant="secondary" className="text-xs">{catMedia.length}</Badge></CardTitle></CardHeader>
                {catMedia.length > 0 && (
                  <CardContent>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                      {catMedia.map((item) => (
                        <div key={item.id} className="relative group rounded-xl border overflow-hidden">
                          {item.file_type?.startsWith("image") ? (
                            <img src={item.file_url} alt={item.title || item.filename} className="h-32 w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-32 w-full items-center justify-center bg-muted"><File className="h-8 w-8 text-muted-foreground" /></div>
                          )}
                          <div className="p-2"><p className="text-xs font-medium truncate">{item.title || item.filename}</p>{item.file_size && <p className="text-xs text-muted-foreground">{(item.file_size / 1024).toFixed(0)} KB</p>}</div>
                          <Button variant="ghost" size="icon" className="absolute top-1 end-1 h-6 w-6 opacity-0 group-hover:opacity-100 bg-background/80" onClick={() => deleteMediaMutation.mutate(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          {media.length === 0 && !showMediaUpload && (<div className="text-center py-12 text-muted-foreground"><Image className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد ملفات" : "No files found"}</p></div>)}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4"><CompanyClassificationsPanel companyId={companyId} /></TabsContent>
        <TabsContent value="sponsorship" className="space-y-4"><CompanySponsorshipPanelEnhanced companyId={companyId} /></TabsContent>
        <TabsContent value="scorecard" className="space-y-4"><CompanySupplierScorecard /></TabsContent>
      </Tabs>
    </div>
  );
});
