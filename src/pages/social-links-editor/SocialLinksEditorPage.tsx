import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialLinkPage, useSocialLinkItems, useUpsertSocialLinkPage, useManageSocialLinkItems } from "@/hooks/useSocialLinkPage";
import { Header } from "@/components/Header";
import { useAllCountries } from "@/hooks/useCountries";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Eye, Link as LinkIcon, Globe, Save, Copy, Check, QrCode,
  BarChart3, MousePointerClick, Palette, Smartphone, Settings2,
  Phone, MessageCircle, TrendingUp, Loader2,
} from "lucide-react";
import { buildSocialLinksPath, buildSocialLinksUrl } from "@/lib/publicAppUrl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  THEME_COLORS, THEME_PREVIEW_MAP, BUTTON_STYLES_MAP, FONT_MAP, FONT_FAMILIES,
  parseExtra, DEFAULT_EXTRA,
  type ExtraSettings,
} from "@/lib/socialLinksConstants";
import { SOCIAL_PLATFORMS, CONTACT_FIELDS, normalizeSocialUrl } from "./constants";
import { EditorSkeleton } from "./EditorSkeleton";
import { SocialsTab } from "./SocialsTab";
import { SettingsTab } from "./SettingsTab";
import { LinksTab } from "./LinksTab";
import { AppearanceTab } from "./AppearanceTab";
import { VisibilityTab } from "./VisibilityTab";
import { AnalyticsTab } from "./AnalyticsTab";
import type { PageForm, BioNotification } from "./types";

export default function SocialLinksEditorPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingSocials, setSavingSocials] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: page, isLoading: pageLoading } = useSocialLinkPage(user?.id);
  const { data: items = [], isLoading: itemsLoading } = useSocialLinkItems(page?.id);
  const upsertPage = useUpsertSocialLinkPage();
  const { addItem, updateItem, deleteItem, reorderItems } = useManageSocialLinkItems();

  const { data: profile, refetch: refetchProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile-for-links", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url, full_name, full_name_ar, display_name, display_name_ar, bio, bio_ar, instagram, twitter, facebook, linkedin, youtube, tiktok, snapchat, website, phone, phone2, whatsapp, country_code, job_title, job_title_ar")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  const { data: visitorStats } = useQuery({
    queryKey: ["social-link-visits-stats", page?.id],
    queryFn: async () => {
      const { data: visits } = await supabase.from("social_link_visits").select("country, device_type, browser, referrer, created_at").eq("page_id", page!.id).order("created_at", { ascending: false }).limit(1000);
      if (!visits) return { countries: {}, devices: {}, browsers: {}, referrers: {}, total: 0, recent7d: 0, dailyVisits: [] };
      const now = Date.now();
      const week = 7 * 24 * 60 * 60 * 1000;
      const countries: Record<string, number> = {};
      const devices: Record<string, number> = {};
      const browsers: Record<string, number> = {};
      const referrers: Record<string, number> = {};
      const dailyMap: Record<string, number> = {};
      let recent7d = 0;
      for (const v of visits) {
        if (v.country) countries[v.country] = (countries[v.country] || 0) + 1;
        if (v.device_type) devices[v.device_type] = (devices[v.device_type] || 0) + 1;
        if (v.browser) browsers[v.browser] = (browsers[v.browser] || 0) + 1;
        try { const ref = v.referrer ? new URL(v.referrer).hostname.replace("www.", "") : "direct"; referrers[ref] = (referrers[ref] || 0) + 1; } catch { referrers["direct"] = (referrers["direct"] || 0) + 1; }
        const ts = new Date(v.created_at).getTime();
        if (now - ts < week) recent7d++;
        const day = v.created_at.slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + 1;
      }
      const dailyVisits: { date: string; visits: number }[] = [];
      for (let i = 13; i >= 0; i--) { const d = new Date(now - i * 86400000); const key = d.toISOString().slice(0, 10); dailyVisits.push({ date: key.slice(5), visits: dailyMap[key] || 0 }); }
      return { countries, devices, browsers, referrers, total: visits.length, recent7d, dailyVisits };
    },
    enabled: !!page?.id,
    staleTime: 5 * 60_000,
  });

  const { data: clickAnalytics } = useQuery({
    queryKey: ["social-link-clicks-analytics", page?.id],
    queryFn: async () => {
      const { data: clicks } = await supabase.from("social_link_clicks").select("link_id, device_type, browser, created_at").eq("page_id", page!.id).order("created_at", { ascending: false }).limit(2000);
      if (!clicks || !Array.isArray(clicks) || clicks.length === 0) return null;
      const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      const dailyClickMap: Record<string, number> = {};
      const linkDaily: Record<string, Record<string, number>> = {};
      for (const c of clicks) {
        const d = new Date(c.created_at); heatmap[d.getDay()][d.getHours()]++;
        const dayKey = c.created_at.slice(0, 10); dailyClickMap[dayKey] = (dailyClickMap[dayKey] || 0) + 1;
        if (c.link_id) { if (!linkDaily[c.link_id]) linkDaily[c.link_id] = {}; linkDaily[c.link_id][dayKey] = (linkDaily[c.link_id][dayKey] || 0) + 1; }
      }
      let bestHour = 0, bestDay = 0, maxVal = 0;
      for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) if (heatmap[d][h] > maxVal) { maxVal = heatmap[d][h]; bestHour = h; bestDay = d; }
      const now = Date.now();
      const dailyClicks: { date: string; clicks: number }[] = [];
      for (let i = 13; i >= 0; i--) { const dt = new Date(now - i * 86400000); const key = dt.toISOString().slice(0, 10); dailyClicks.push({ date: key.slice(5), clicks: dailyClickMap[key] || 0 }); }
      const hourlyAgg = Array(24).fill(0);
      for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) hourlyAgg[h] += heatmap[d][h];
      return { heatmap, bestHour, bestDay, dailyClicks, hourlyAgg, total: clicks.length, linkDaily };
    },
    enabled: !!page?.id,
    staleTime: 5 * 60_000,
  });

  const { data: bioNotifications } = useQuery({
    queryKey: ["bio-notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("id, title, title_ar, body, body_ar, type, is_read, created_at, metadata").eq("user_id", user!.id).in("type", ["bio_subscriber", "bio_milestone", "link_milestone"]).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const [socials, setSocials] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [contactCountryCodes, setContactCountryCodes] = useState<Record<string, string>>({ whatsapp: "SA", phone: "SA", phone2: "SA" });
  const { data: countries } = useAllCountries();

  const detectCountryFromPhone = useCallback((fullPhone: string, fallback: string) => {
    if (!fullPhone || !countries?.length) return fallback;
    const sorted = [...countries].filter(c => c.phone_code).sort((a, b) => (b.phone_code?.length || 0) - (a.phone_code?.length || 0));
    for (const c of sorted) { if (fullPhone.startsWith(c.phone_code!)) return c.code; }
    return fallback;
  }, [countries]);

  const stripPhoneCode = useCallback((fullPhone: string, countryCode: string) => {
    if (!fullPhone) return "";
    const country = countries?.find(c => c.code === countryCode);
    if (country?.phone_code && fullPhone.startsWith(country.phone_code)) return fullPhone.slice(country.phone_code.length);
    if (fullPhone.startsWith("+")) return fullPhone;
    return fullPhone;
  }, [countries]);

  useEffect(() => {
    if (profile) {
      setSocials({ instagram: profile.instagram || "", twitter: profile.twitter || "", tiktok: profile.tiktok || "", youtube: profile.youtube || "", snapchat: profile.snapchat || "", facebook: profile.facebook || "", linkedin: profile.linkedin || "", website: profile.website || "" });
      const defaultCC = profile.country_code || "SA";
      const waCC = detectCountryFromPhone(profile.whatsapp || "", defaultCC);
      const phCC = detectCountryFromPhone(profile.phone || "", defaultCC);
      const ph2CC = detectCountryFromPhone(profile.phone2 || "", defaultCC);
      setContactCountryCodes({ whatsapp: waCC, phone: phCC, phone2: ph2CC });
      setContacts({ whatsapp: stripPhoneCode(profile.whatsapp || "", waCC), phone: stripPhoneCode(profile.phone || "", phCC), phone2: stripPhoneCode(profile.phone2 || "", ph2CC) });
    }
  }, [profile, countries]);

  const [form, setForm] = useState<PageForm>({
    page_title: "", page_title_ar: "", bio: "", bio_ar: "",
    theme: "default", button_style: "rounded", button_color: "#000000",
    text_color: "#ffffff", background_color: "#ffffff",
    show_avatar: true, show_social_icons: true, is_published: true,
    background_image_url: "", font_family: "default",
  });

  const [extra, setExtra] = useState<ExtraSettings>({ ...DEFAULT_EXTRA });

  useEffect(() => {
    if (page) {
      setForm({ page_title: page.page_title || "", page_title_ar: page.page_title_ar || "", bio: page.bio || "", bio_ar: page.bio_ar || "", theme: page.theme || "default", button_style: page.button_style || "rounded", button_color: page.button_color || "#000000", text_color: page.text_color || "#ffffff", background_color: page.background_color || "#ffffff", show_avatar: page.show_avatar !== false, show_social_icons: page.show_social_icons !== false, is_published: page.is_published !== false, background_image_url: page.background_image_url || "", font_family: page.font_family || "default" });
      setExtra(parseExtra(page.custom_css));
    } else if (profile && !page) {
      setForm(f => ({ ...f, page_title: profile.display_name || profile.full_name || "", page_title_ar: profile.display_name_ar || profile.full_name_ar || "", bio: profile.bio || "", bio_ar: profile.bio_ar || "" }));
    }
  }, [page, profile]);

  const updateForm = useCallback((updates: Partial<PageForm>) => { setForm(f => ({ ...f, ...updates })); setHasUnsavedChanges(true); }, []);
  const updateExtra = useCallback((updates: Partial<ExtraSettings>) => { setExtra(prev => ({ ...prev, ...updates })); setHasUnsavedChanges(true); }, []);

  const handleSavePage = useCallback(() => { upsertPage.mutate({ ...form, custom_css: JSON.stringify(extra) }, { onSuccess: () => setHasUnsavedChanges(false) }); }, [form, extra, upsertPage]);

  // Auto-save
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasUnsavedChanges || !page) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => { upsertPage.mutate({ ...form, custom_css: JSON.stringify(extra) }, { onSuccess: () => setHasUnsavedChanges(false) }); }, 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [hasUnsavedChanges, form, extra, page]);

  const handleSaveSocials = useCallback(async () => {
    if (!user) return;
    setSavingSocials(true);
    try {
      const normalizedSocials: Record<string, string | null> = {};
      SOCIAL_PLATFORMS.forEach(p => { const val = socials[p.key]?.trim(); normalizedSocials[p.key] = val ? normalizeSocialUrl(val, p) : null; });
      const buildPhone = (val: string, fieldKey: string) => {
        if (!val) return null;
        const cc = contactCountryCodes[fieldKey] || "SA";
        const country = countries?.find(c => c.code === cc);
        const phoneCode = country?.phone_code || "+966";
        const clean = val.replace(/^0+/, "");
        if (clean.startsWith("+")) return clean;
        return phoneCode + clean;
      };
      const { error } = await supabase.from("profiles").update({ ...normalizedSocials, whatsapp: buildPhone(contacts.whatsapp, "whatsapp"), phone: buildPhone(contacts.phone, "phone"), phone2: buildPhone(contacts.phone2, "phone2") }).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: isAr ? "✅ تم حفظ الحسابات" : "✅ Accounts saved" });
      refetchProfile();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally { setSavingSocials(false); }
  }, [user, socials, contacts, contactCountryCodes, countries, isAr, toast, refetchProfile]);

  const handleExportLinks = useCallback(() => {
    const exportData = items.map(item => ({ title: item.title, title_ar: item.title_ar || "", url: item.url, icon: item.icon || "", link_type: item.link_type || "custom", sort_order: item.sort_order, is_active: item.is_active }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${profile?.username || "links"}-altoha-export.json`; a.click(); URL.revokeObjectURL(a.href);
    toast({ title: isAr ? "✅ تم تصدير الروابط" : "✅ Links exported" });
  }, [items, profile?.username, isAr, toast]);

  const handleExportCSV = useCallback(() => {
    const header = "title,title_ar,url,icon,link_type,sort_order,is_active";
    const rows = items.map(item => [item.title, item.title_ar || "", item.url, item.icon || "", item.link_type || "custom", item.sort_order, item.is_active].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${profile?.username || "links"}-altoha-export.csv`; a.click(); URL.revokeObjectURL(a.href);
    toast({ title: isAr ? "✅ تم تصدير CSV" : "✅ CSV exported" });
  }, [items, profile?.username, isAr, toast]);

  const handleImportLinks = useCallback(async (file: File) => {
    if (!page?.id && !user) return;
    try {
      const text = await file.text();
      let importedItems: any[];
      if (file.name.endsWith(".csv")) {
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
        importedItems = lines.slice(1).map(line => { const values = line.match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"')) || []; const obj: any = {}; headers.forEach((h, i) => { obj[h] = values[i] || ""; }); return obj; });
      } else { importedItems = JSON.parse(text); }
      if (!Array.isArray(importedItems)) throw new Error("Invalid format");
      const pageId = page?.id || (await upsertPage.mutateAsync({ ...form, custom_css: JSON.stringify(extra) })).id;
      let order = items.length;
      for (const item of importedItems) { if (!item.title || !item.url) continue; await addItem.mutateAsync({ page_id: pageId, title: item.title, title_ar: item.title_ar || undefined, url: item.url, icon: item.icon || undefined, link_type: item.link_type || "custom", sort_order: order++ } as any); }
      toast({ title: isAr ? `✅ تم استيراد ${importedItems.length} رابط` : `✅ Imported ${importedItems.length} links` });
    } catch (err: unknown) { toast({ title: isAr ? "خطأ في الاستيراد" : "Import error", description: err instanceof Error ? err.message : String(err), variant: "destructive" }); }
  }, [page, user, form, extra, items.length, isAr, toast, upsertPage, addItem]);

  const handleBgUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/social-bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
      updateForm({ background_image_url: urlData.publicUrl });
      toast({ title: isAr ? "تم رفع الصورة" : "Image uploaded" });
    } catch (err: unknown) { toast({ title: "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" }); } finally { setUploading(false); }
  }, [user, isAr, toast, updateForm]);

  const copyLink = useCallback(async () => {
    if (!profile?.username) return;
    await navigator.clipboard.writeText(buildSocialLinksUrl(profile.username)).then(null, () => {});
    setCopied(true);
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  }, [profile?.username, isAr, toast]);

  const totalClicks = useMemo(() => items.reduce((sum, item) => sum + (item.click_count || 0), 0), [items]);
  const previewUrl = profile?.username ? buildSocialLinksPath(profile.username) : "#";
  const fullUrl = profile?.username ? buildSocialLinksUrl(profile.username) : "";
  const displayName = profile?.display_name || profile?.full_name || profile?.username || "";
  const activeSocials = useMemo(() => SOCIAL_PLATFORMS.filter(p => socials[p.key]), [socials]);
  const isLoading = pageLoading || profileLoading;
  const alignClass = extra.text_align === "start" ? "text-start" : extra.text_align === "end" ? "text-end" : "text-center";
  const justifyClass = extra.text_align === "start" ? "justify-start" : extra.text_align === "end" ? "justify-end" : "justify-center";

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="flex-1 px-4 md:px-6 max-w-6xl mx-auto w-full py-6 space-y-6">
        {isLoading ? <EditorSkeleton /> : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                  <LinkIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">{isAr ? "صفحة الروابط الاجتماعية" : "Social Links Page"}</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">{isAr ? "أنشئ صفحتك الشخصية للروابط — احترافية ومخصصة" : "Create your personalized link page — professional & customizable"}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-[12px] border-amber-500/30 text-amber-600 dark:text-amber-400 animate-in fade-in duration-200 gap-1">
                    {page ? <><Loader2 className="h-2.5 w-2.5 animate-spin" />{isAr ? "حفظ تلقائي..." : "Auto-saving..."}</> : (isAr ? "تغييرات غير محفوظة" : "Unsaved changes")}
                  </Badge>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{isAr ? "نسخ الرابط" : "Copy Link"}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isAr ? "نسخ رابط الصفحة" : "Copy page link"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {profile?.username && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5"><QrCode className="h-3.5 w-3.5" /><span className="hidden sm:inline">QR</span></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader><DialogTitle className="text-center">{isAr ? "رمز QR مخصص" : "Custom QR Code"}</DialogTitle></DialogHeader>
                      <div className="flex flex-col items-center gap-4 py-4">
                        <div id="qr-themed-container" className="p-6 rounded-2xl shadow-lg relative" style={{ background: THEME_COLORS[form.theme]?.bg || "#ffffff", border: `2px solid ${THEME_COLORS[form.theme]?.border || "#e5e7eb"}` }}>
                          <QRCodeSVG value={fullUrl} size={200} level="H" fgColor={THEME_COLORS[form.theme]?.accent || "#000000"} bgColor="transparent" imageSettings={extra.qr_logo_url ? { src: extra.qr_logo_url, height: 40, width: 40, excavate: true } : undefined} />
                          {extra.qr_show_username && <p className="text-center mt-3 text-xs font-semibold" style={{ color: THEME_COLORS[form.theme]?.text || "#000", fontFamily: FONT_MAP[form.font_family] || "inherit" }}>@{profile.username}</p>}
                        </div>
                        <p className="text-xs text-muted-foreground text-center font-mono" dir="ltr">{fullUrl}</p>
                        <div className="w-full space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">{isAr ? "إظهار اسم المستخدم" : "Show Username"}</Label>
                            <Switch checked={extra.qr_show_username} onCheckedChange={v => updateExtra({ qr_show_username: v })} />
                          </div>
                          <div>
                            <Label className="text-[12px] mb-1 block">{isAr ? "شعار مخصص (URL)" : "Custom Logo (URL)"}</Label>
                            <Input value={extra.qr_logo_url} onChange={e => updateExtra({ qr_logo_url: e.target.value })} placeholder="https://..." dir="ltr" className="text-xs h-8" />
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {profile?.username && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5 hidden sm:inline-flex">
                    <Link to={previewUrl} target="_blank" rel="noopener noreferrer"><Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? "معاينة" : "Preview"}</span></Link>
                  </Button>
                )}
                <Button size="sm" onClick={handleSavePage} disabled={upsertPage.isPending} className="gap-1.5 min-w-[80px]">
                  {upsertPage.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isAr ? "حفظ" : "Save"}
                </Button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: LinkIcon, value: items.length, label: isAr ? "روابط" : "Links", iconBg: "bg-primary/10", iconColor: "text-primary" },
                { icon: MousePointerClick, value: totalClicks, label: isAr ? "نقرات" : "Clicks", iconBg: "bg-chart-3/10", iconColor: "text-chart-3" },
                { icon: Globe, value: activeSocials.length, label: isAr ? "حسابات" : "Socials", iconBg: "bg-chart-1/10", iconColor: "text-chart-1" },
                { icon: TrendingUp, value: items.length > 0 ? Math.round(totalClicks / items.length) : 0, label: isAr ? "متوسط/رابط" : "Avg/Link", iconBg: "bg-chart-2/10", iconColor: "text-chart-2" },
              ].map((stat, i) => (
                <Card key={i} className="border-border/30 overflow-hidden group hover:border-primary/20 transition-colors">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                      <stat.icon className={`h-4.5 w-4.5 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                      <p className="text-[12px] text-muted-foreground font-medium">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* URL Banner */}
            {profile?.username && (
              <Card className="border-primary/15 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent overflow-hidden">
                <CardContent className="py-3 px-4 flex items-center justify-between gap-2 text-sm flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Globe className="h-4 w-4 text-primary" /></div>
                    <div>
                      <span className="text-xs text-muted-foreground">{isAr ? "رابط صفحتك" : "Your page link"}</span>
                      <code className="block text-xs bg-background/80 px-2 py-0.5 rounded font-mono mt-0.5" dir="ltr">altoha.com/bio/{profile.username}</code>
                    </div>
                  </div>
                  <Badge variant={form.is_published ? "default" : "secondary"} className="text-[12px]">
                    {form.is_published ? (isAr ? "✓ منشور" : "✓ Published") : (isAr ? "مسودة" : "Draft")}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Main Content */}
            <div className="grid lg:grid-cols-[1fr_340px] gap-6">
              <div className="space-y-4">
                <Tabs defaultValue="socials" className="w-full">
                  <TabsList className="w-full grid grid-cols-6 h-11">
                    <TabsTrigger value="socials" className="text-xs gap-1"><Globe className="h-3 w-3 hidden sm:block" />{isAr ? "الحسابات" : "Accounts"}</TabsTrigger>
                    <TabsTrigger value="settings" className="text-xs gap-1"><Settings2 className="h-3 w-3 hidden sm:block" />{isAr ? "الإعدادات" : "Settings"}</TabsTrigger>
                    <TabsTrigger value="links" className="text-xs gap-1"><LinkIcon className="h-3 w-3 hidden sm:block" />{isAr ? "الروابط" : "Links"}</TabsTrigger>
                    <TabsTrigger value="appearance" className="text-xs gap-1"><Palette className="h-3 w-3 hidden sm:block" />{isAr ? "المظهر" : "Style"}</TabsTrigger>
                    <TabsTrigger value="visibility" className="text-xs gap-1"><Eye className="h-3 w-3 hidden sm:block" />{isAr ? "العرض" : "Display"}</TabsTrigger>
                    <TabsTrigger value="analytics" className="text-xs gap-1"><BarChart3 className="h-3 w-3 hidden sm:block" />{isAr ? "التحليلات" : "Analytics"}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="socials">
                    <SocialsTab socials={socials} setSocials={setSocials} contacts={contacts} setContacts={setContacts} contactCountryCodes={contactCountryCodes} setContactCountryCodes={setContactCountryCodes} countries={countries} handleSaveSocials={handleSaveSocials} savingSocials={savingSocials} isAr={isAr} />
                  </TabsContent>
                  <TabsContent value="settings">
                    <SettingsTab form={form} updateForm={updateForm} extra={extra} updateExtra={updateExtra} profile={profile} isAr={isAr} />
                  </TabsContent>
                  <TabsContent value="links">
                    <LinksTab items={items} itemsLoading={itemsLoading} extra={extra} pageId={page?.id} userId={user?.id} isAr={isAr} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} reorderItems={reorderItems} upsertPage={upsertPage} form={form} handleExportLinks={handleExportLinks} handleExportCSV={handleExportCSV} handleImportLinks={handleImportLinks} profileUsername={profile?.username} />
                  </TabsContent>
                  <TabsContent value="appearance">
                    <AppearanceTab form={form} updateForm={updateForm} extra={extra} updateExtra={updateExtra} profile={profile} isAr={isAr} uploading={uploading} handleBgUpload={handleBgUpload} />
                  </TabsContent>
                  <TabsContent value="visibility">
                    <VisibilityTab form={form} updateForm={updateForm} extra={extra} updateExtra={updateExtra} profile={profile} isAr={isAr} userId={user?.id} socials={socials} setSocials={setSocials} contacts={contacts} setContacts={setContacts} setHasUnsavedChanges={setHasUnsavedChanges} setForm={setForm} setExtra={setExtra} items={items} />
                  </TabsContent>
                  <TabsContent value="analytics">
                    <AnalyticsTab items={items} isAr={isAr} visitorStats={visitorStats} clickAnalytics={clickAnalytics} bioNotifications={bioNotifications as BioNotification[] | undefined} pageId={page?.id} />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Live Preview */}
              <div className="hidden lg:block sticky top-20 self-start">
                <Card className="overflow-hidden border-border/20 shadow-lg">
                  <CardHeader className="py-2 px-3 bg-muted/40 border-b border-border/20">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "معاينة مباشرة" : "Live Preview"}</p>
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-destructive/60" />
                        <div className="h-2 w-2 rounded-full bg-chart-2/60" />
                        <div className="h-2 w-2 rounded-full bg-chart-1/60" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {(() => {
                      const pt = THEME_PREVIEW_MAP[form.theme] || THEME_PREVIEW_MAP.default;
                      return (
                        <div className="p-4 min-h-[500px] rounded-b-lg" dir={extra.text_direction === "auto" ? undefined : extra.text_direction} style={{ background: form.background_image_url ? `url(${form.background_image_url}) center/cover` : pt.bg, fontFamily: FONT_FAMILIES.find(f => f.id === form.font_family)?.css || "inherit", color: pt.text }}>
                          {extra.cover_image_url && (
                            <div className="relative -mx-4 -mt-4 mb-4 h-32 overflow-hidden rounded-t-lg">
                              <img src={extra.cover_image_url} alt="" className="w-full h-full object-cover object-center" loading="eager" />
                            </div>
                          )}
                          <div className="relative z-10 flex flex-col items-center gap-3">
                            {form.show_avatar && (
                              <Avatar className="h-16 w-16 shadow-xl" style={{ boxShadow: `0 0 0 2px ${pt.border}` }}>
                                <AvatarImage src={profile?.avatar_url || ""} />
                                <AvatarFallback className="text-lg" style={{ background: `${pt.accent}22`, color: pt.accent }}>{displayName.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={alignClass}>
                              <p className={`font-bold ${extra.font_size === "sm" ? "text-xs" : extra.font_size === "lg" ? "text-base" : extra.font_size === "xl" ? "text-lg" : "text-sm"}`} style={{ color: pt.text }}>{form.page_title || displayName || "Your Name"}</p>
                              <p className="text-[12px] mt-0.5" style={{ color: `${pt.text}66` }}>@{profile?.username || "username"}</p>
                              {extra.show_bio && form.bio && <p className="text-[12px] mt-1" style={{ color: `${pt.text}aa` }}>{form.bio}</p>}
                            </div>
                            {form.show_social_icons && activeSocials.length > 0 && (
                              <div className={`flex gap-2 mt-1 flex-wrap ${justifyClass}`}>
                                {activeSocials.map(({ key, icon: Icon }) => (
                                  <div key={key} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: pt.card, border: `1px solid ${pt.border}` }}>
                                    <Icon className="h-3.5 w-3.5" style={{ color: pt.text }} />
                                  </div>
                                ))}
                                {contacts.whatsapp && <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)" }}><MessageCircle className="h-3.5 w-3.5" style={{ color: "#25d366" }} /></div>}
                                {contacts.phone && <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: pt.card, border: `1px solid ${pt.border}` }}><Phone className="h-3.5 w-3.5" style={{ color: pt.text }} /></div>}
                              </div>
                            )}
                            <div className={`w-full ${extra.link_layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"} mt-3`}>
                              {items.filter(i => i.is_active !== false).map(item => {
                                const btnRadius = form.button_style === "rounded" ? "rounded-xl" : form.button_style === "pill" ? "rounded-full" : form.button_style === "square" ? "rounded-xl" : form.button_style === "sharp" ? "rounded-none" : "rounded-xl";
                                const customColor = form.button_color !== "#000000" ? { backgroundColor: form.button_color, color: form.text_color, border: "1px solid transparent" } : { background: pt.card, border: `1px solid ${pt.border}` };
                                return (
                                  <div key={item.id} className={`flex items-center gap-2 px-3 py-2.5 ${btnRadius} ${extra.link_layout === "grid" ? "flex-col text-center py-4" : ""}`} style={customColor}>
                                    {item.icon && <span className="text-sm">{item.icon}</span>}
                                    <span className={`${extra.link_layout === "grid" ? "" : "flex-1"} text-[12px] font-medium ${alignClass}`} style={{ color: (customColor as any).color || pt.text }}>{item.title}</span>
                                  </div>
                                );
                              })}
                              {items.length === 0 && (
                                <div className={`text-center py-6 opacity-40 ${extra.link_layout === "grid" ? "col-span-2" : ""}`} style={{ color: pt.text }}>
                                  <Globe className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-[12px]">{isAr ? "أضف روابط" : "Add links"}</p>
                                </div>
                              )}
                            </div>
                            {extra.show_footer && extra.footer_text && (
                              <div className="mt-4 pt-3 w-full text-center" style={{ borderTop: `1px solid ${pt.border}` }}>
                                <p className="text-[12px]" style={{ color: `${pt.text}55` }}>{extra.footer_text}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
