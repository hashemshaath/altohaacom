import { useState } from "react";
import { EntityFormGuard } from "@/components/admin/EntityFormGuard";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { BatchDuplicateScanner } from "@/components/admin/BatchDuplicateScanner";
import { CompanyFinanceWidget } from "@/components/admin/CompanyFinanceWidget";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useTableSort } from "@/hooks/useTableSort";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCSVExport } from "@/hooks/useCSVExport";
import { usePagination } from "@/hooks/usePagination";
import { AdminTablePagination } from "@/components/admin/AdminTablePagination";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { CompanyClassificationsPanel } from "@/components/admin/CompanyClassificationsPanel";
import { CompanySponsorshipPanelEnhanced } from "@/components/admin/CompanySponsorshipPanelEnhanced";
import { AdminSupplierControls } from "@/components/admin/AdminSupplierControls";
import { AdminReviewsModeration } from "@/components/admin/AdminReviewsModeration";
import { CompanyEditPanel } from "@/components/admin/CompanyEditPanel";
import { CompanySupplierScorecard } from "@/components/admin/CompanySupplierScorecard";
import { useAllCountries } from "@/hooks/useCountries";
import { countryFlag } from "@/lib/countryFlag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Users, Package, FileText, Send, Search, Plus, Edit, Trash2, Eye,
  CheckCircle, XCircle, Clock, MapPin, Phone, Mail, Globe, ChevronLeft, Save, X,
  Truck, DollarSign, Star, Image, CalendarCheck, MessageSquare, UserPlus, Building,
  Upload, FolderOpen, FileImage, File, Sparkles, FileSpreadsheet, Factory,
} from "lucide-react";
import { SmartImportDialog, type ImportedData } from "@/components/smart-import/SmartImportDialog";
import { CompanyAnalyticsWidget } from "@/components/admin/CompanyAnalyticsWidget";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { CompanyLiveStatsWidget } from "@/components/admin/CompanyLiveStatsWidget";
import { format } from "date-fns";

type CompanyType = "sponsor" | "supplier" | "partner" | "vendor";
type CompanyStatus = "active" | "inactive" | "pending" | "suspended";

interface Company {
  id: string;
  name: string;
  name_ar: string | null;
  type: CompanyType;
  status: CompanyStatus;
  company_number: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  operating_countries: string[] | null;
  logo_url: string | null;
  created_at: string;
  import_source: string | null;
  rating: number | null;
  neighborhood: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

const companyTypes: { value: CompanyType; label: string; labelAr: string }[] = [
  { value: "sponsor", label: "Sponsor", labelAr: "راعي" },
  { value: "supplier", label: "Supplier", labelAr: "مورد" },
  { value: "partner", label: "Partner", labelAr: "شريك" },
  { value: "vendor", label: "Vendor", labelAr: "بائع" },
];

const statusColors: Record<CompanyStatus, string> = {
  active: "bg-chart-5",
  inactive: "bg-muted-foreground",
  pending: "bg-chart-4",
  suspended: "bg-destructive",
};

const DAYS = [
  { en: "Monday", ar: "الاثنين" },
  { en: "Tuesday", ar: "الثلاثاء" },
  { en: "Wednesday", ar: "الأربعاء" },
  { en: "Thursday", ar: "الخميس" },
  { en: "Friday", ar: "الجمعة" },
  { en: "Saturday", ar: "السبت" },
  { en: "Sunday", ar: "الأحد" },
];

const MEDIA_CATEGORIES = [
  { value: "logo", label: "Logo", labelAr: "الشعار", icon: FileImage },
  { value: "documents", label: "Documents", labelAr: "المستندات", icon: File },
  { value: "product_images", label: "Product Images", labelAr: "صور المنتجات", icon: Image },
  { value: "certificates", label: "Certificates", labelAr: "الشهادات", icon: FileText },
  { value: "other", label: "Other", labelAr: "أخرى", icon: FolderOpen },
];

export default function CompaniesAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showDedupScanner, setShowDedupScanner] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [mainTab, setMainTab] = useState<"companies" | "suppliers" | "reviews">("companies");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyDetailTab, setCompanyDetailTab] = useState("overview");

  // Sub-form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [mediaCategory, setMediaCategory] = useState("logo");

  // Reply state
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  // Contact form
  const [contactForm, setContactForm] = useState({
    name: "", name_ar: "", title: "", title_ar: "", department: "general",
    email: "", phone: "", mobile: "", whatsapp: "", is_primary: false, can_login: false,
  });

  // Branch form
  const [branchForm, setBranchForm] = useState({
    name: "", name_ar: "", address: "", address_ar: "", city: "", country: "",
    phone: "", email: "", postal_code: "", is_headquarters: false,
    manager_name: "", manager_phone: "", manager_email: "",
  });

  // Driver form
  const [driverForm, setDriverForm] = useState({
    name: "", name_ar: "", phone: "", vehicle_type: "", vehicle_plate: "",
    license_number: "", is_available: true,
  });

  // Invitation form
  const [invitationForm, setInvitationForm] = useState({
    title: "", title_ar: "", description: "", invitation_type: "sponsorship",
    event_date: "", expires_at: "",
  });

  // Catalog form
  const [catalogForm, setCatalogForm] = useState({
    name: "", name_ar: "", category: "", sku: "", unit_price: "", quantity: "",
    description: "", shop_product_id: "",
  });

  // Company form
  const [companyForm, setCompanyForm] = useState({
    name: "", name_ar: "", type: "supplier" as CompanyType,
    registration_number: "", tax_number: "", email: "", phone: "", website: "",
    address: "", address_ar: "", city: "", country: "", country_code: "",
    postal_code: "", description: "", description_ar: "",
    credit_limit: 0, payment_terms: 30, currency: "SAR",
  });

  // Working hours state
  const [workingHours, setWorkingHours] = useState<Record<string, { open: string; close: string; enabled: boolean }>>({});
  const [editingHours, setEditingHours] = useState(false);

  const { data: allCountries = [] } = useAllCountries();

  // ── Queries ──
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies", searchQuery, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from("companies").select("id, name, name_ar, type, status, company_number, email, phone, city, country, country_code, operating_countries, logo_url, created_at, import_source, rating, neighborhood, google_maps_url, latitude, longitude").order("created_at", { ascending: false });
      if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      if (typeFilter !== "all") query = query.eq("type", typeFilter as CompanyType);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as CompanyStatus);
      const { data, error } = await query;
      if (error) throw error;
      return data as Company[];
    },
  });

  const { data: companyDetails } = useQuery({
    queryKey: ["company", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return null;
      const { data, error } = await supabase.from("companies").select("id, name, name_ar, type, status, country_code, country, city, address, address_ar, phone, email, website, logo_url, cover_image_url, description, description_ar, company_number, tax_number, registration_number, founded_year, specializations, social_links, currency, credit_limit, payment_terms, created_at, updated_at").eq("id", selectedCompany).single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["company-contacts", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_contacts").select("id, company_id, user_id, name, name_ar, role, role_ar, email, phone, is_primary, created_at").eq("company_id", selectedCompany).order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["company-branches", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_branches").select("id, company_id, name, name_ar, city, city_ar, address, address_ar, phone, email, is_headquarters, is_active, country_code, created_at").eq("company_id", selectedCompany).order("is_headquarters", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["company-orders", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_orders").select("id, company_id, order_number, status, total_amount, currency, notes, created_at, updated_at, created_by").eq("company_id", selectedCompany).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["company-transactions", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_transactions").select("id, company_id, transaction_number, type, amount, currency, description, description_ar, invoice_id, transaction_date, created_at, created_by").eq("company_id", selectedCompany).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ["company-invitations", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_invitations").select("id, company_id, email, role, status, invited_by, created_at, accepted_at").eq("company_id", selectedCompany).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ["company-evaluations", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_evaluations").select("id, company_id, evaluator_id, score, feedback, feedback_ar, status, created_at").eq("company_id", selectedCompany).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: catalogItems = [] } = useQuery({
    queryKey: ["company-catalog", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_catalog").select("id, company_id, name, name_ar, category, description, description_ar, price, currency, image_url, is_active, created_at").eq("company_id", selectedCompany).order("category").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["company-drivers", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_drivers").select("id, company_id, name, name_ar, phone, email, license_number, vehicle_type, vehicle_plate, is_active, created_at").eq("company_id", selectedCompany).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: communications = [] } = useQuery({
    queryKey: ["company-communications", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_communications").select("id, company_id, sender_id, direction, subject, message, status, priority, tags, is_archived, is_starred, is_internal_note, parent_id, created_at, updated_at").eq("company_id", selectedCompany).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: media = [] } = useQuery({
    queryKey: ["company-media", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from("company_media").select("id, company_id, file_url, file_name, category, media_type, description, created_at").eq("company_id", selectedCompany).order("category").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Shop products for linking
  const { data: shopProducts = [] } = useQuery({
    queryKey: ["shop-products-for-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_products").select("id, title, sku").eq("is_active", true).order("title").limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCompany,
  });

  // ── Mutations ──
  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof companyForm) => {
      const { country_code, ...rest } = data;
      const { error } = await supabase.from("companies").insert({ ...rest, country_code: country_code || null, status: "pending" });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setShowCompanyForm(false);
      // Notify admins about new company
      import("@/lib/notificationTriggers").then(({ notifyAdminCompanyRegistration }) => {
        notifyAdminCompanyRegistration({
          companyName: variables.name,
          companyNameAr: variables.name_ar || undefined,
          submittedBy: "Admin",
        });
      });
      resetCompanyForm();
      toast({ title: isAr ? "تم إنشاء الشركة" : "Company created" });
    },
    onError: () => toast({ title: isAr ? "فشل في إنشاء الشركة" : "Failed to create company", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompanyStatus }) => {
      const { error } = await supabase.from("companies").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", selectedCompany] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) throw new Error("No company");
      const { error } = await supabase.from("company_contacts").insert({
        company_id: selectedCompany,
        name: contactForm.name,
        name_ar: contactForm.name_ar || null,
        title: contactForm.title || null,
        title_ar: contactForm.title_ar || null,
        department: contactForm.department,
        email: contactForm.email || null,
        phone: contactForm.phone || null,
        mobile: contactForm.mobile || null,
        whatsapp: contactForm.whatsapp || null,
        is_primary: contactForm.is_primary,
        can_login: contactForm.can_login,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-contacts", selectedCompany] });
      setShowContactForm(false);
      setContactForm({ name: "", name_ar: "", title: "", title_ar: "", department: "general", email: "", phone: "", mobile: "", whatsapp: "", is_primary: false, can_login: false });
      toast({ title: isAr ? "تم إضافة جهة الاتصال" : "Contact added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الإضافة" : "Failed to add", description: e.message }),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-contacts", selectedCompany] });
      toast({ title: isAr ? "تم الحذف" : "Contact removed" });
    },
  });

  const addBranchMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) throw new Error("No company");
      const { error } = await supabase.from("company_branches").insert({
        company_id: selectedCompany,
        name: branchForm.name,
        name_ar: branchForm.name_ar || null,
        address: branchForm.address || null,
        address_ar: branchForm.address_ar || null,
        city: branchForm.city || null,
        country: branchForm.country || null,
        phone: branchForm.phone || null,
        email: branchForm.email || null,
        postal_code: branchForm.postal_code || null,
        is_headquarters: branchForm.is_headquarters,
        manager_name: branchForm.manager_name || null,
        manager_phone: branchForm.manager_phone || null,
        manager_email: branchForm.manager_email || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branches", selectedCompany] });
      setShowBranchForm(false);
      setBranchForm({ name: "", name_ar: "", address: "", address_ar: "", city: "", country: "", phone: "", email: "", postal_code: "", is_headquarters: false, manager_name: "", manager_phone: "", manager_email: "" });
      toast({ title: isAr ? "تم إضافة الفرع" : "Branch added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الإضافة" : "Failed to add", description: e.message }),
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branches", selectedCompany] });
      toast({ title: isAr ? "تم الحذف" : "Branch removed" });
    },
  });

  const addDriverMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) throw new Error("No company");
      const { error } = await supabase.from("company_drivers").insert({
        company_id: selectedCompany,
        name: driverForm.name,
        name_ar: driverForm.name_ar || null,
        phone: driverForm.phone,
        vehicle_type: driverForm.vehicle_type || null,
        vehicle_plate: driverForm.vehicle_plate || null,
        license_number: driverForm.license_number || null,
        is_available: driverForm.is_available,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-drivers", selectedCompany] });
      setShowDriverForm(false);
      setDriverForm({ name: "", name_ar: "", phone: "", vehicle_type: "", vehicle_plate: "", license_number: "", is_available: true });
      toast({ title: isAr ? "تم إضافة السائق" : "Driver added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الإضافة" : "Failed to add", description: e.message }),
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_drivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-drivers", selectedCompany] });
      toast({ title: isAr ? "تم الحذف" : "Driver removed" });
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) throw new Error("No company");
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from("company_invitations").insert({
        company_id: selectedCompany,
        invitation_type: invitationForm.invitation_type,
        title: invitationForm.title,
        title_ar: invitationForm.title_ar || null,
        description: invitationForm.description || null,
        event_date: invitationForm.event_date || null,
        expires_at: invitationForm.expires_at || null,
        status: "pending",
        created_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-invitations", selectedCompany] });
      setShowInvitationForm(false);
      setInvitationForm({ title: "", title_ar: "", description: "", invitation_type: "sponsorship", event_date: "", expires_at: "" });
      toast({ title: isAr ? "تم إرسال الدعوة" : "Invitation sent" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ parentId, message }: { parentId: string; message: string }) => {
      if (!selectedCompany) throw new Error("No company");
      const parent = communications.find((c: any) => c.id === parentId);
      const { error } = await supabase.from("company_communications").insert({
        company_id: selectedCompany,
        sender_id: (await supabase.auth.getUser()).data.user?.id || "",
        subject: `Re: ${parent?.subject || ""}`,
        message,
        direction: "incoming",
        priority: parent?.priority || "normal",
        parent_id: parentId,
        status: "unread",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-communications"] });
      setReplyTarget(null);
      setReplyMessage("");
      toast({ title: isAr ? "تم إرسال الرد" : "Reply sent" });
    },
    onError: () => toast({ title: isAr ? "فشل الإرسال" : "Failed to send", variant: "destructive" }),
  });

  const saveWorkingHoursMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) throw new Error("No company");
      const { error } = await supabase.from("companies").update({ working_hours: workingHours as any }).eq("id", selectedCompany);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", selectedCompany] });
      setEditingHours(false);
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedCompany) throw new Error("No company");
      const ext = file.name.split(".").pop();
      const path = `${selectedCompany}/${mediaCategory}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("company-media").upload(path, file);
      if (uploadError) {
        // Bucket might not exist yet, try ad-creatives as fallback
        const { error: err2 } = await supabase.storage.from("ad-creatives").upload(path, file);
        if (err2) throw err2;
        const { data: urlData } = supabase.storage.from("ad-creatives").getPublicUrl(path);
        return { url: urlData.publicUrl, file };
      }
      const { data: urlData } = supabase.storage.from("company-media").getPublicUrl(path);
      return { url: urlData.publicUrl, file };
    },
    onSuccess: async ({ url, file }) => {
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("company_media").insert({
        company_id: selectedCompany!,
        category: mediaCategory,
        file_url: url,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user?.id || null,
      });
      queryClient.invalidateQueries({ queryKey: ["company-media", selectedCompany] });
      toast({ title: isAr ? "تم رفع الملف" : "File uploaded" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الرفع" : "Upload failed", description: e.message }),
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-media", selectedCompany] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const addCatalogMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) throw new Error("No company");
      const { error } = await supabase.from("company_catalog").insert({
        company_id: selectedCompany,
        name: catalogForm.name,
        name_ar: catalogForm.name_ar || null,
        category: catalogForm.category,
        sku: catalogForm.sku || null,
        unit_price: catalogForm.unit_price ? Number(catalogForm.unit_price) : null,
        quantity_available: catalogForm.quantity ? Number(catalogForm.quantity) : null,
        description: catalogForm.description || null,
        shop_product_id: catalogForm.shop_product_id && catalogForm.shop_product_id !== "none" ? catalogForm.shop_product_id : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-catalog", selectedCompany] });
      setShowCatalogForm(false);
      setCatalogForm({ name: "", name_ar: "", category: "", sku: "", unit_price: "", quantity: "", description: "", shop_product_id: "" });
      toast({ title: isAr ? "تم إضافة المنتج" : "Product added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الإضافة" : "Failed to add", description: e.message }),
  });

  const deleteCatalogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-catalog", selectedCompany] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  // AI Translation state
  const [aiLoading, setAiLoading] = useState(false);

  const handleAITranslate = async (textAr: string, setter: (enText: string) => void) => {
    if (!textAr.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text: textAr, source_lang: "ar", target_lang: "en", optimize_seo: true },
      });
      if (error) throw error;
      if (data?.translated) setter(data.translated);
      else toast({ variant: "destructive", title: isAr ? "لم يتم الترجمة" : "Translation failed" });
    } catch {
      // Fallback - just notify
      toast({ variant: "destructive", title: isAr ? "خدمة الترجمة غير متاحة حالياً" : "Translation service unavailable" });
    }
    setAiLoading(false);
  };

  const handleAIOptimize = async (text: string, lang: "ar" | "en", setter: (optimized: string) => void) => {
    if (!text.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text, source_lang: lang, optimize_seo: true, optimize_only: true },
      });
      if (error) throw error;
      if (data?.optimized) setter(data.optimized);
    } catch {
      toast({ variant: "destructive", title: isAr ? "خدمة التحسين غير متاحة" : "Optimization service unavailable" });
    }
    setAiLoading(false);
  };

  const resetCompanyForm = () => {
    setCompanyForm({
      name: "", name_ar: "", type: "supplier", registration_number: "", tax_number: "",
      email: "", phone: "", website: "", address: "", address_ar: "", city: "",
      country: "", country_code: "", postal_code: "", description: "", description_ar: "",
      credit_limit: 0, payment_terms: 30, currency: "SAR",
    });
  };

  const getTypeLabel = (type: CompanyType) => {
    const t = companyTypes.find(ct => ct.value === type);
    return isAr ? t?.labelAr : t?.label;
  };

  const getStatusLabel = (status: CompanyStatus) => {
    const labels: Record<CompanyStatus, { en: string; ar: string }> = {
      active: { en: "Active", ar: "نشط" },
      inactive: { en: "Inactive", ar: "غير نشط" },
      pending: { en: "Pending", ar: "قيد الانتظار" },
      suspended: { en: "Suspended", ar: "معلق" },
    };
    return isAr ? labels[status].ar : labels[status].en;
  };

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === "active").length,
    pending: companies.filter(c => c.status === "pending").length,
    sponsors: companies.filter(c => c.type === "sponsor").length,
    suppliers: companies.filter(c => c.type === "supplier").length,
  };

  const { sorted: sortedCompanies, sortColumn, sortDirection, toggleSort } = useTableSort(companies, "created_at", "desc");
  const companyPagination = usePagination(sortedCompanies, { defaultPageSize: 15 });
  const bulk = useAdminBulkActions(sortedCompanies);

  const { exportCSV: exportCompaniesCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (c: Company) => c.name },
      { header: isAr ? "الاسم (AR)" : "Name (AR)", accessor: (c: Company) => c.name_ar || "" },
      { header: isAr ? "النوع" : "Type", accessor: (c: Company) => getTypeLabel(c.type) || c.type },
      { header: isAr ? "الحالة" : "Status", accessor: (c: Company) => getStatusLabel(c.status) },
      { header: isAr ? "البريد" : "Email", accessor: (c: Company) => c.email || "" },
      { header: isAr ? "الهاتف" : "Phone", accessor: (c: Company) => c.phone || "" },
      { header: isAr ? "المدينة" : "City", accessor: (c: Company) => c.city || "" },
      { header: isAr ? "الدولة" : "Country", accessor: (c: Company) => c.country || "" },
      { header: isAr ? "التاريخ" : "Created", accessor: (c: Company) => c.created_at?.split("T")[0] || "" },
    ],
    filename: "companies",
  });

  const bulkActivate = async () => {
    const ids = [...bulk.selected];
    const { error } = await supabase.from("companies").update({ status: "active" as any }).in("id", ids);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      bulk.clearSelection();
      toast({ title: isAr ? `تم تفعيل ${ids.length} شركة` : `Activated ${ids.length} companies` });
    }
  };

  const bulkSuspend = async () => {
    if (!confirm(isAr ? "هل أنت متأكد من تعليق الشركات المحددة؟" : "Suspend selected companies?")) return;
    const ids = [...bulk.selected];
    const { error } = await supabase.from("companies").update({ status: "suspended" as any }).in("id", ids);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      bulk.clearSelection();
      toast({ title: isAr ? `تم تعليق ${ids.length} شركة` : `Suspended ${ids.length} companies` });
    }
  };

  const companyBalance = transactions.reduce((acc, t: any) => {
    if (t.type === "payment" || t.type === "credit" || t.type === "refund") return acc + Number(t.amount);
    if (t.type === "invoice" || t.type === "debit") return acc - Number(t.amount);
    return acc + Number(t.amount);
  }, 0);

  // ── AI Translation Button Component ──
  const AIButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={disabled || aiLoading} className="gap-1">
      <Sparkles className="h-3 w-3" />
      {aiLoading ? "..." : isAr ? "ترجمة + SEO" : "Translate + SEO"}
    </Button>
  );

  // ══════════════════════════════════════════════════════════
  // COMPANY DETAIL VIEW
  // ══════════════════════════════════════════════════════════
  if (selectedCompany && companyDetails) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedCompany(null); setCompanyDetailTab("overview"); }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              {companyDetails.logo_url ? (
                <img src={companyDetails.logo_url} alt={companyDetails.name} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{isAr && companyDetails.name_ar ? companyDetails.name_ar : companyDetails.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className={statusColors[companyDetails.status as CompanyStatus]}>{getStatusLabel(companyDetails.status)}</Badge>
                  <Badge variant="outline">{getTypeLabel(companyDetails.type)}</Badge>
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
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Star className="h-8 w-8 text-chart-4" /><div><p className="text-sm text-muted-foreground">{isAr ? "التقييم" : "Rating"}</p><p className="text-xl font-bold">{evaluations.length > 0 ? (evaluations.reduce((a: number, e: any) => a + Number(e.overall_rating || 0), 0) / evaluations.length).toFixed(1) : "-"}</p></div></div></CardContent></Card>
        </div>

        {/* Detail Tabs */}
        <Tabs value={companyDetailTab} onValueChange={setCompanyDetailTab}>
          <TabsList className="flex-wrap h-auto gap-1">
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

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-6">
            <CompanyEditPanel companyId={selectedCompany} companyDetails={companyDetails} />
          </TabsContent>

          {/* ── Contacts Tab ── */}
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
                    <div className="space-y-2">
                      <Label>{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label>
                      <Input value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                      </div>
                      <Input value={contactForm.name_ar} onChange={e => setContactForm({ ...contactForm, name_ar: e.target.value })} dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "المسمى الوظيفي (EN)" : "Title (EN)"}</Label>
                      <Input value={contactForm.title} onChange={e => setContactForm({ ...contactForm, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "المسمى الوظيفي (AR)" : "Title (AR)"}</Label>
                      <Input value={contactForm.title_ar} onChange={e => setContactForm({ ...contactForm, title_ar: e.target.value })} dir="rtl" />
                    </div>
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
                    <div className="space-y-2">
                      <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                      <Input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الهاتف" : "Phone"}</Label>
                      <Input value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الجوال" : "Mobile"}</Label>
                      <Input value={contactForm.mobile} onChange={e => setContactForm({ ...contactForm, mobile: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp</Label>
                      <Input value={contactForm.whatsapp} onChange={e => setContactForm({ ...contactForm, whatsapp: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={contactForm.is_primary} onCheckedChange={v => setContactForm({ ...contactForm, is_primary: v })} />
                      <Label className="cursor-pointer">{isAr ? "جهة اتصال أساسية" : "Primary contact"}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={contactForm.can_login} onCheckedChange={v => setContactForm({ ...contactForm, can_login: v })} />
                      <Label className="cursor-pointer">{isAr ? "يمكنه تسجيل الدخول" : "Can login"}</Label>
                    </div>
                  </div>
                  <Button onClick={() => addContactMutation.mutate()} disabled={!contactForm.name || !contactForm.department || addContactMutation.isPending}>
                    <Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact: any) => (
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteContactMutation.mutate(contact.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
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
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isAr ? "لا توجد جهات اتصال" : "No contacts found"}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Branches Tab ── */}
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
                    <div className="space-y-2">
                      <Label>{isAr ? "اسم الفرع (EN)" : "Branch Name (EN)"} *</Label>
                      <Input value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "اسم الفرع (AR)" : "Branch Name (AR)"}</Label>
                      <Input value={branchForm.name_ar} onChange={e => setBranchForm({ ...branchForm, name_ar: e.target.value })} dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "العنوان" : "Address"}</Label>
                      <Input value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "المدينة" : "City"}</Label>
                      <Input value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الدولة" : "Country"}</Label>
                      <Input value={branchForm.country} onChange={e => setBranchForm({ ...branchForm, country: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الهاتف" : "Phone"}</Label>
                      <Input value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "البريد" : "Email"}</Label>
                      <Input type="email" value={branchForm.email} onChange={e => setBranchForm({ ...branchForm, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "اسم المدير" : "Manager Name"}</Label>
                      <Input value={branchForm.manager_name} onChange={e => setBranchForm({ ...branchForm, manager_name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "هاتف المدير" : "Manager Phone"}</Label>
                      <Input value={branchForm.manager_phone} onChange={e => setBranchForm({ ...branchForm, manager_phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={branchForm.is_headquarters} onCheckedChange={v => setBranchForm({ ...branchForm, is_headquarters: v })} />
                    <Label className="cursor-pointer">{isAr ? "المقر الرئيسي" : "Headquarters"}</Label>
                  </div>
                  <Button onClick={() => addBranchMutation.mutate()} disabled={!branchForm.name || addBranchMutation.isPending}>
                    <Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map((branch: any) => (
                <Card key={branch.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{branch.name}</p>
                        <p className="text-sm text-muted-foreground">{[branch.city, branch.country].filter(Boolean).join(", ")}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {branch.is_headquarters && <Badge className="bg-primary">{isAr ? "المقر الرئيسي" : "HQ"}</Badge>}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteBranchMutation.mutate(branch.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {branch.address && <p className="text-sm mt-2">{branch.address}</p>}
                    {branch.manager_name && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-sm text-muted-foreground">{isAr ? "مدير الفرع" : "Branch Manager"}</p>
                          <p className="font-medium">{branch.manager_name}</p>
                          {branch.manager_phone && <p className="text-sm">{branch.manager_phone}</p>}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
              {branches.length === 0 && !showBranchForm && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isAr ? "لا توجد فروع" : "No branches found"}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Orders Tab ── */}
          <TabsContent value="orders" className="space-y-4">
            <h3 className="text-lg font-semibold">{isAr ? "الطلبات" : "Orders"}</h3>
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "رقم الطلب" : "Order #"}</TableHead>
                    <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{isAr ? "الاتجاه" : "Direction"}</TableHead>
                    <TableHead>{isAr ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.order_number}</TableCell>
                      <TableCell>{order.title}</TableCell>
                      <TableCell><Badge variant={order.direction === "incoming" ? "default" : "secondary"}>{order.direction === "incoming" ? (isAr ? "وارد" : "Incoming") : (isAr ? "صادر" : "Outgoing")}</Badge></TableCell>
                      <TableCell>{Number(order.total_amount).toLocaleString()} {order.currency}</TableCell>
                      <TableCell><Badge>{order.status}</Badge></TableCell>
                      <TableCell>{format(new Date(order.created_at), "yyyy-MM-dd")}</TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد طلبات" : "No orders found"}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          {/* ── Transactions Tab ── */}
          <TabsContent value="transactions" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{isAr ? "كشف الحساب" : "Account Statement"}</h3>
              <p className="text-sm text-muted-foreground">{isAr ? "الرصيد الحالي:" : "Current Balance:"} <span className={`font-bold mx-2 ${companyBalance >= 0 ? "text-chart-5" : "text-destructive"}`}>{companyBalance.toLocaleString()} {companyDetails?.currency || "SAR"}</span></p>
            </div>
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "رقم المعاملة" : "Transaction #"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الوصف" : "Description"}</TableHead>
                    <TableHead>{isAr ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t: any) => (
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

          {/* ── Invitations Tab (INLINE form) ── */}
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
                      <div className="flex items-center justify-between">
                        <Label>{isAr ? "العنوان (EN)" : "Title (EN)"} *</Label>
                        <AIButton onClick={() => handleAITranslate(invitationForm.title_ar, v => setInvitationForm(f => ({ ...f, title: v })))} />
                      </div>
                      <Input value={invitationForm.title} onChange={e => setInvitationForm({ ...invitationForm, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
                      <Input value={invitationForm.title_ar} onChange={e => setInvitationForm({ ...invitationForm, title_ar: e.target.value })} dir="rtl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "الوصف" : "Description"}</Label>
                    <Textarea value={invitationForm.description} onChange={e => setInvitationForm({ ...invitationForm, description: e.target.value })} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isAr ? "تاريخ الفعالية" : "Event Date"}</Label>
                      <Input type="date" value={invitationForm.event_date} onChange={e => setInvitationForm({ ...invitationForm, event_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "ينتهي في" : "Expires At"}</Label>
                      <Input type="date" value={invitationForm.expires_at} onChange={e => setInvitationForm({ ...invitationForm, expires_at: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={() => sendInvitationMutation.mutate()} disabled={!invitationForm.title || sendInvitationMutation.isPending}>
                    <Send className="me-2 h-4 w-4" />{isAr ? "إرسال" : "Send"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitations.map((inv: any) => (
                <Card key={inv.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{isAr && inv.title_ar ? inv.title_ar : inv.title}</p>
                        <p className="text-sm text-muted-foreground">{inv.invitation_type}</p>
                      </div>
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
              {invitations.length === 0 && !showInvitationForm && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isAr ? "لا توجد دعوات" : "No invitations found"}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Evaluations Tab ── */}
          <TabsContent value="evaluations" className="space-y-4">
            <h3 className="text-lg font-semibold">{isAr ? "التقييمات" : "Evaluations"}</h3>
            <div className="space-y-4">
              {evaluations.map((ev: any) => (
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

          {/* ── Catalog Tab (with add product + link to shop) ── */}
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
                    <div className="space-y-2">
                      <Label>{isAr ? "اسم المنتج (EN)" : "Product Name (EN)"} *</Label>
                      <Input value={catalogForm.name} onChange={e => setCatalogForm({ ...catalogForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "اسم المنتج (AR)" : "Product Name (AR)"}</Label>
                      <Input value={catalogForm.name_ar} onChange={e => setCatalogForm({ ...catalogForm, name_ar: e.target.value })} dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الفئة" : "Category"} *</Label>
                      <Input value={catalogForm.category} onChange={e => setCatalogForm({ ...catalogForm, category: e.target.value })} placeholder="e.g. ingredients, equipment" />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input value={catalogForm.sku} onChange={e => setCatalogForm({ ...catalogForm, sku: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "السعر" : "Price"}</Label>
                      <Input type="number" value={catalogForm.unit_price} onChange={e => setCatalogForm({ ...catalogForm, unit_price: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الكمية" : "Quantity"}</Label>
                      <Input type="number" value={catalogForm.quantity} onChange={e => setCatalogForm({ ...catalogForm, quantity: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "الوصف" : "Description"}</Label>
                    <Textarea value={catalogForm.description} onChange={e => setCatalogForm({ ...catalogForm, description: e.target.value })} rows={2} />
                  </div>
                  {shopProducts.length > 0 && (
                    <div className="space-y-2">
                      <Label>{isAr ? "ربط بمنتج المتجر" : "Link to Shop Product"}</Label>
                      <Select value={catalogForm.shop_product_id} onValueChange={v => setCatalogForm({ ...catalogForm, shop_product_id: v })}>
                        <SelectTrigger><SelectValue placeholder={isAr ? "اختياري - ربط بالمتجر" : "Optional - Link to shop"} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{isAr ? "بدون ربط" : "No link"}</SelectItem>
                          {shopProducts.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.title} {p.sku ? `(${p.sku})` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={() => addCatalogMutation.mutate()} disabled={!catalogForm.name || !catalogForm.category || addCatalogMutation.isPending}>
                    <Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {catalogItems.length > 0 ? (
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "المنتج" : "Product"}</TableHead>
                      <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>{isAr ? "السعر" : "Price"}</TableHead>
                      <TableHead>{isAr ? "الكمية" : "Qty"}</TableHead>
                      <TableHead>{isAr ? "المتجر" : "Shop"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogItems.map((item: any) => (
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
          </TabsContent>

          {/* ── Drivers Tab ── */}
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
                    <div className="space-y-2">
                      <Label>{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label>
                      <Input value={driverForm.name} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                      <Input value={driverForm.name_ar} onChange={e => setDriverForm({ ...driverForm, name_ar: e.target.value })} dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الهاتف" : "Phone"} *</Label>
                      <Input value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "نوع المركبة" : "Vehicle Type"}</Label>
                      <Input value={driverForm.vehicle_type} onChange={e => setDriverForm({ ...driverForm, vehicle_type: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "لوحة المركبة" : "Vehicle Plate"}</Label>
                      <Input value={driverForm.vehicle_plate} onChange={e => setDriverForm({ ...driverForm, vehicle_plate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "رقم الرخصة" : "License Number"}</Label>
                      <Input value={driverForm.license_number} onChange={e => setDriverForm({ ...driverForm, license_number: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={driverForm.is_available} onCheckedChange={v => setDriverForm({ ...driverForm, is_available: v })} />
                    <Label className="cursor-pointer">{isAr ? "متاح" : "Available"}</Label>
                  </div>
                  <Button onClick={() => addDriverMutation.mutate()} disabled={!driverForm.name || !driverForm.phone || addDriverMutation.isPending}>
                    <Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {drivers.length > 0 ? (
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                      <TableHead>{isAr ? "الهاتف" : "Phone"}</TableHead>
                      <TableHead>{isAr ? "نوع المركبة" : "Vehicle"}</TableHead>
                      <TableHead>{isAr ? "لوحة المركبة" : "Plate"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver: any) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell>{driver.phone}</TableCell>
                        <TableCell>{driver.vehicle_type || "-"}</TableCell>
                        <TableCell>{driver.vehicle_plate || "-"}</TableCell>
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

          {/* ── Communications Tab (with full log) ── */}
          <TabsContent value="communications" className="space-y-4">
            <h3 className="text-lg font-semibold">
              {isAr ? "سجل التواصل" : "Communication Log"}
              {communications.filter((c: any) => c.direction === "outgoing" && c.status === "unread").length > 0 && (
                <Badge variant="destructive" className="ms-2">{communications.filter((c: any) => c.direction === "outgoing" && c.status === "unread").length}</Badge>
              )}
            </h3>
            {communications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد رسائل" : "No messages"}</p></div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {communications.map((msg: any) => (
                    <Card key={msg.id} className={msg.status === "unread" ? "border-primary/30" : ""}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px]">
                                {msg.direction === "outgoing" ? (isAr ? "من الشركة" : "From Company") : (isAr ? "من الإدارة" : "From Admin")}
                              </Badge>
                              {msg.priority === "urgent" && <Badge variant="destructive" className="text-[10px]">{isAr ? "عاجل" : "Urgent"}</Badge>}
                              {msg.priority === "high" && <Badge className="bg-chart-4 text-[10px]">{isAr ? "مرتفع" : "High"}</Badge>}
                              <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), "yyyy-MM-dd HH:mm")}</span>
                            </div>
                            <p className="font-medium text-sm">{msg.subject}</p>
                            <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                            {/* Show thread replies */}
                            {msg.parent_id && <Badge variant="secondary" className="mt-1 text-[10px]">{isAr ? "رد" : "Reply"}</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={msg.status === "unread" ? "default" : "secondary"} className="text-[10px]">
                              {msg.status === "unread" ? (isAr ? "جديد" : "New") : (isAr ? "مقروءة" : "Read")}
                            </Badge>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setReplyTarget(msg.id); setReplyMessage(""); }}>
                              <Send className="h-3 w-3 me-1" />{isAr ? "رد" : "Reply"}
                            </Button>
                          </div>
                        </div>
                        {replyTarget === msg.id && (
                          <div className="mt-3 space-y-2 border-t pt-3">
                            <Textarea value={replyMessage} onChange={e => setReplyMessage(e.target.value)} rows={2} placeholder={isAr ? "اكتب ردك هنا..." : "Type your reply..."} />
                            <div className="flex gap-2">
                              <Button size="sm" disabled={!replyMessage || replyMutation.isPending} onClick={() => replyMutation.mutate({ parentId: msg.id, message: replyMessage })}>
                                <Send className="h-3 w-3 me-1" />{isAr ? "إرسال" : "Send"}
                              </Button>
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

          {/* ── Media Tab (Organized by category) ── */}
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
                      <SelectContent>
                        {MEDIA_CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadMediaMutation.mutate(file);
                      }}
                      disabled={uploadMediaMutation.isPending}
                    />
                    {uploadMediaMutation.isPending && <p className="text-sm text-muted-foreground mt-1">{isAr ? "جارٍ الرفع..." : "Uploading..."}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categorized sections */}
            {MEDIA_CATEGORIES.map(cat => {
              const catMedia = media.filter((m: any) => m.category === cat.value);
              if (catMedia.length === 0 && !showMediaUpload) return null;
              const CatIcon = cat.icon;
              return (
                <Card key={cat.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CatIcon className="h-4 w-4 text-primary" />
                      {isAr ? cat.labelAr : cat.label}
                      <Badge variant="secondary" className="text-[10px]">{catMedia.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  {catMedia.length > 0 && (
                    <CardContent>
                      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                        {catMedia.map((item: any) => (
                          <div key={item.id} className="relative group rounded-xl border overflow-hidden">
                            {item.file_type?.startsWith("image") ? (
                              <img src={item.file_url} alt={item.title || item.filename} className="h-32 w-full object-cover" />
                            ) : (
                              <div className="flex h-32 w-full items-center justify-center bg-muted">
                                <File className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="p-2">
                              <p className="text-xs font-medium truncate">{item.title || item.filename}</p>
                              {item.file_size && <p className="text-[10px] text-muted-foreground">{(item.file_size / 1024).toFixed(0)} KB</p>}
                            </div>
                            <Button variant="ghost" size="icon" className="absolute top-1 end-1 h-6 w-6 opacity-0 group-hover:opacity-100 bg-background/80" onClick={() => deleteMediaMutation.mutate(item.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {media.length === 0 && !showMediaUpload && (
              <div className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{isAr ? "لا توجد ملفات" : "No files found"}</p>
              </div>
            )}
          </TabsContent>

          {/* ── Classifications (formerly Roles) Tab ── */}
          <TabsContent value="roles" className="space-y-4">
            <CompanyClassificationsPanel companyId={selectedCompany} />
          </TabsContent>

          {/* ── Sponsorship Tab ── */}
          <TabsContent value="sponsorship" className="space-y-4">
            <CompanySponsorshipPanelEnhanced companyId={selectedCompany} />
          </TabsContent>

          {/* ── Scorecard Tab ── */}
          <TabsContent value="scorecard" className="space-y-4">
            <CompanySupplierScorecard />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // COMPANIES LIST VIEW
  // ══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          {isAr ? "إدارة الشركات" : "Company Management"}
        </h1>
        <p className="text-muted-foreground mt-1">{isAr ? "إدارة الشركات والرعاة والموردين والشركاء - موحّدة" : "Unified management for companies, sponsors, suppliers & partners"}</p>
      </div>

      {/* Company Finance Analytics */}
      <CompanyFinanceWidget />

      {/* Bulk Import & Export */}
      <div className="flex flex-wrap gap-2">
        <Button variant={showDedupScanner ? "secondary" : "outline"} size="sm" onClick={() => { setShowDedupScanner(!showDedupScanner); if (showBulkImport) setShowBulkImport(false); }}>
          <Search className="me-2 h-4 w-4" />
          {isAr ? "فاحص التكرارات" : "Dedup Scanner"}
        </Button>
        <Button variant={showBulkImport ? "secondary" : "outline"} size="sm" onClick={() => setShowBulkImport(!showBulkImport)}>
          <FileSpreadsheet className="me-2 h-4 w-4" />
          {isAr ? "استيراد جماعي" : "Bulk Import"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          const csv = ["Name,Name (AR),Type,Status,Email,Phone,City,Country,Company Number,Created"];
          companies.forEach(c => {
            csv.push([c.name, c.name_ar || "", c.type, c.status, c.email || "", c.phone || "", c.city || "", c.country || "", c.company_number || "", c.created_at?.slice(0, 10) || ""].join(","));
          });
          const blob = new Blob([csv.join("\n")], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `companies-export-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click(); URL.revokeObjectURL(url);
        }}>
          <Upload className="me-2 h-4 w-4 rotate-180" />
          {isAr ? "تصدير CSV" : "Export CSV"}
        </Button>
      </div>
      {showBulkImport && (
        <BulkImportPanel entityType="company" onImportComplete={() => { setShowBulkImport(false); queryClient.invalidateQueries({ queryKey: ["companies"] }); }} />
      )}

      {showDedupScanner && (
        <BatchDuplicateScanner
          defaultTable="companies"
          onMergeComplete={() => queryClient.invalidateQueries({ queryKey: ["companies"] })}
        />
      )}

      {showCompanyForm ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => { setShowCompanyForm(false); resetCompanyForm(); }}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle>{isAr ? "إضافة شركة جديدة" : "Add New Company"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <EntityFormGuard
              entity={{ name: companyForm.name, name_ar: companyForm.name_ar, email: companyForm.email, phone: companyForm.phone, website: companyForm.website, city: companyForm.city, country: companyForm.country }}
              tables={["companies", "organizers", "culinary_entities", "establishments"]}
              translationFields={[
                { en: companyForm.name, ar: companyForm.name_ar, key: "name" },
                { en: companyForm.description, ar: companyForm.description_ar, key: "description" },
                { en: companyForm.address, ar: companyForm.address_ar, key: "address" },
              ]}
              translationContext="company / business / food industry supplier"
              onTranslated={(u) => setCompanyForm(f => ({ ...f, ...u }))}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isAr ? "اسم الشركة (EN)" : "Company Name (EN)"} *</Label>
                  <AIButton onClick={() => handleAITranslate(companyForm.name_ar, v => setCompanyForm(f => ({ ...f, name: v })))} />
                </div>
                <Input value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="Company Name" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "اسم الشركة (AR)" : "Company Name (AR)"}</Label>
                <Input value={companyForm.name_ar} onChange={e => setCompanyForm({ ...companyForm, name_ar: e.target.value })} placeholder="اسم الشركة" dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? "نوع الشركة" : "Company Type"} *</Label>
                <Select value={companyForm.type} onValueChange={v => setCompanyForm({ ...companyForm, type: v as CompanyType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{companyTypes.map(type => <SelectItem key={type.value} value={type.value}>{isAr ? type.labelAr : type.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{isAr ? "رقم السجل التجاري" : "Registration Number"}</Label><Input value={companyForm.registration_number} onChange={e => setCompanyForm({ ...companyForm, registration_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>{isAr ? "الرقم الضريبي" : "Tax Number"}</Label><Input value={companyForm.tax_number} onChange={e => setCompanyForm({ ...companyForm, tax_number: e.target.value })} /></div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label><Input type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>{isAr ? "الموقع الإلكتروني" : "Website"}</Label><Input value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isAr ? "العنوان (EN)" : "Address (EN)"}</Label>
                  <AIButton onClick={() => handleAITranslate(companyForm.address_ar, v => setCompanyForm(f => ({ ...f, address: v })))} />
                </div>
                <Textarea value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2"><Label>{isAr ? "العنوان (AR)" : "Address (AR)"}</Label><Textarea value={companyForm.address_ar} onChange={e => setCompanyForm({ ...companyForm, address_ar: e.target.value })} rows={2} dir="rtl" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>{isAr ? "المدينة" : "City"}</Label><Input value={companyForm.city} onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })} /></div>
              <CountrySelector value={companyForm.country_code} onChange={(code, country) => {
                const name = isAr ? (country?.name_ar || country?.name || "") : (country?.name || "");
                setCompanyForm({ ...companyForm, country_code: code, country: name, currency: country?.currency_code || companyForm.currency });
              }} label={isAr ? "الدولة" : "Country"} required />
              <div className="space-y-2"><Label>{isAr ? "الرمز البريدي" : "Postal Code"}</Label><Input value={companyForm.postal_code} onChange={e => setCompanyForm({ ...companyForm, postal_code: e.target.value })} /></div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>{isAr ? "حد الائتمان" : "Credit Limit"}</Label><Input type="number" value={companyForm.credit_limit} onChange={e => setCompanyForm({ ...companyForm, credit_limit: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>{isAr ? "شروط الدفع (أيام)" : "Payment Terms (days)"}</Label><Input type="number" value={companyForm.payment_terms} onChange={e => setCompanyForm({ ...companyForm, payment_terms: Number(e.target.value) })} /></div>
              <div className="space-y-2">
                <Label>{isAr ? "العملة" : "Currency"}</Label>
                <Select value={companyForm.currency} onValueChange={v => setCompanyForm({ ...companyForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
                  <AIButton onClick={() => handleAITranslate(companyForm.description_ar, v => setCompanyForm(f => ({ ...f, description: v })))} />
                </div>
                <Textarea value={companyForm.description} onChange={e => setCompanyForm({ ...companyForm, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2"><Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label><Textarea value={companyForm.description_ar} onChange={e => setCompanyForm({ ...companyForm, description_ar: e.target.value })} rows={3} dir="rtl" /></div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => createCompanyMutation.mutate(companyForm)} disabled={!companyForm.name}><Save className="h-4 w-4 me-2" />{isAr ? "حفظ الشركة" : "Save Company"}</Button>
              <Button variant="outline" onClick={() => { setShowCompanyForm(false); resetCompanyForm(); }}><X className="h-4 w-4 me-2" />{isAr ? "إلغاء" : "Cancel"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
      <div className="space-y-6">
        {/* Main Tabs: Companies vs Pro Suppliers */}
        <div className="flex gap-2 border-b pb-3">
          <Button variant={mainTab === "companies" ? "default" : "outline"} size="sm" onClick={() => setMainTab("companies")}>
            <Building2 className="me-1.5 h-3.5 w-3.5" />{isAr ? "الشركات" : "Companies"}
          </Button>
          <Button variant={mainTab === "suppliers" ? "default" : "outline"} size="sm" onClick={() => setMainTab("suppliers")}>
            <Factory className="me-1.5 h-3.5 w-3.5" />{isAr ? "الموردون المحترفون" : "Pro Suppliers"}
          </Button>
          <Button variant={mainTab === "reviews" ? "default" : "outline"} size="sm" onClick={() => setMainTab("reviews")}>
            <Star className="me-1.5 h-3.5 w-3.5" />{isAr ? "التقييمات" : "Reviews"}
          </Button>
        </div>

        {mainTab === "suppliers" ? (
          <AdminSupplierControls />
        ) : mainTab === "reviews" ? (
          <AdminReviewsModeration />
        ) : (
        <>
        {/* Pending Approvals Alert */}
        {stats.pending > 0 && (
          <Card className="border-chart-4/50 bg-chart-4/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-chart-4/15">
                <Clock className="h-6 w-6 text-chart-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-chart-4">
                  {isAr ? `${stats.pending} شركات بانتظار الموافقة` : `${stats.pending} Companies Pending Approval`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isAr ? "يرجى مراجعة الطلبات والموافقة عليها أو رفضها" : "Please review and approve or reject these requests"}
                </p>
              </div>
              <Button
                variant="outline"
                className="border-chart-4/30 text-chart-4 hover:bg-chart-4/10"
                onClick={() => setStatusFilter("pending")}
              >
                <Eye className="h-4 w-4 me-2" />
                {isAr ? "عرض الطلبات" : "View Requests"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="rounded-2xl border-border/40 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/40 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-chart-5/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <CheckCircle className="h-5 w-5 text-chart-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "نشط" : "Active"}</p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/40 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-chart-4/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Clock className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "قيد الانتظار" : "Pending"}</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/40 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-chart-3/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Star className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "الرعاة" : "Sponsors"}</p>
                  <p className="text-xl font-bold">{stats.sponsors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/40 group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-chart-2/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Truck className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "الموردون" : "Suppliers"}</p>
                  <p className="text-xl font-bold">{stats.suppliers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Analytics Widgets */}
        <CompanyLiveStatsWidget />
        <CompanyAnalyticsWidget />

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowCompanyForm(true)}>
            <Plus className="h-4 w-4 me-2" />{isAr ? "شركة جديدة" : "New Company"}
          </Button>
          <Button variant="outline" onClick={() => setShowSmartImport(true)}>
            <Sparkles className="h-4 w-4 me-2" />{isAr ? "استيراد ذكي" : "Smart Import"}
          </Button>
          <Button variant="outline" onClick={() => setShowBulkImport(!showBulkImport)}>
            <Upload className="h-4 w-4 me-2" />{isAr ? "استيراد" : "Import"}
          </Button>
          <Button variant="outline" onClick={() => exportCompaniesCSV(bulk.count > 0 ? bulk.selectedItems : companies)}>
            <FileSpreadsheet className="h-4 w-4 me-2" />{isAr ? "تصدير CSV" : "Export CSV"}
          </Button>
        </div>

        {showBulkImport && <BulkImportPanel entityType="company" />}

        {/* Company List */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={isAr ? "بحث بالاسم أو البريد..." : "Search by name or email..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-10" />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder={isAr ? "النوع" : "Type"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
                  {companyTypes.map(type => <SelectItem key={type.value} value={type.value}>{isAr ? type.labelAr : type.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder={isAr ? "الحالة" : "Status"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
                  <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                  <SelectItem value="pending">{isAr ? "قيد الانتظار" : "Pending"}</SelectItem>
                  <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                  <SelectItem value="suspended">{isAr ? "معلق" : "Suspended"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <BulkActionBar
              count={bulk.count}
              onClear={bulk.clearSelection}
              onStatusChange={bulkActivate}
              onDelete={bulkSuspend}
              onExport={() => exportCompaniesCSV(bulk.selectedItems)}
            />

            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                    </TableHead>
                    <SortableTableHead column="name" label={isAr ? "الشركة" : "Company"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="type" label={isAr ? "النوع" : "Type"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <TableHead>{isAr ? "الاتصال" : "Contact"}</TableHead>
                    <SortableTableHead column="country" label={isAr ? "الموقع" : "Location"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="status" label={isAr ? "الحالة" : "Status"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="created_at" label={isAr ? "التاريخ" : "Date"} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCompanies.map(company => (
                    <TableRow key={company.id} className={`cursor-pointer hover:bg-muted/50 ${bulk.isSelected(company.id) ? "bg-primary/5" : ""}`} onClick={() => setSelectedCompany(company.id)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={bulk.isSelected(company.id)} onCheckedChange={() => bulk.toggleOne(company.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {company.logo_url ? <img src={company.logo_url} alt={company.name} className="h-10 w-10 rounded-xl object-cover" /> : <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center"><Building2 className="h-5 w-5 text-muted-foreground" /></div>}
                          <div>
                            <p className="font-medium">{isAr && company.name_ar ? company.name_ar : company.name}</p>
                            {company.company_number && <p className="text-xs text-muted-foreground font-mono">{company.company_number}</p>}
                            {(isAr ? company.name : company.name_ar) && <p className="text-sm text-muted-foreground" dir={isAr ? "ltr" : "rtl"}>{isAr ? company.name : company.name_ar}</p>}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {company.import_source === 'smart_import' && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 bg-primary/5 text-primary border-primary/20">
                                  <Sparkles className="h-2.5 w-2.5" />{isAr ? "ذكي" : "Smart"}
                                </Badge>
                              )}
                              {company.rating && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 bg-chart-4/5 text-chart-4 border-chart-4/20">
                                  <Star className="h-2.5 w-2.5" />{Number(company.rating).toFixed(1)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{getTypeLabel(company.type)}</Badge></TableCell>
                      <TableCell><div className="text-sm">{company.email && <p>{company.email}</p>}{company.phone && <p className="text-muted-foreground">{company.phone}</p>}</div></TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{company.country_code ? `${countryFlag(company.country_code)} ` : ""}{[company.city, company.country].filter(Boolean).join(", ") || "-"}</p>
                          {company.neighborhood && <p className="text-xs text-muted-foreground">{company.neighborhood}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={statusColors[company.status]}>{getStatusLabel(company.status)}</Badge></TableCell>
                      <TableCell>{format(new Date(company.created_at), "yyyy-MM-dd")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {company.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-chart-5 hover:text-chart-5 hover:bg-chart-5/10"
                                onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: company.id, status: "active" }); }}
                                title={isAr ? "تفعيل" : "Approve"}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: company.id, status: "suspended" }); }}
                                title={isAr ? "رفض" : "Reject"}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {companies.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground"><Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{isAr ? "لا توجد شركات" : "No companies found"}</p></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        </>
        )}
      </div>
      )}
      <SmartImportDialog
        open={showSmartImport}
        onOpenChange={setShowSmartImport}
        entityType="company"
        onImport={(data: ImportedData) => {
          setCompanyForm(prev => ({
            ...prev,
            name: data.name_en || prev.name,
            name_ar: data.name_ar || prev.name_ar,
            description: data.description_en || prev.description,
            description_ar: data.description_ar || prev.description_ar,
            country_code: data.country_code || prev.country_code,
            city: data.city_en || prev.city,
            address: data.full_address_en || prev.address,
            address_ar: data.full_address_ar || prev.address_ar,
            postal_code: data.postal_code || prev.postal_code,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            website: data.website || prev.website,
            registration_number: data.national_id || data.registration_number || prev.registration_number,
          }));
          setShowCompanyForm(true);
        }}
      />
    </div>
  );
}
