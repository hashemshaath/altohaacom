import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Globe, AlertTriangle, CheckCircle2, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

interface PageMeta {
  path: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  keywords: string;
  keywords_ar: string;
  og_image: string;
  canonical: string;
  no_index: boolean;
}

const DEFAULT_ROUTES = [
  "/", "/competitions", "/recipes", "/news", "/community", "/masterclasses",
  "/rankings", "/establishments", "/jobs", "/shop", "/exhibitions",
  "/events-calendar", "/about", "/contact", "/mentorship", "/knowledge",
  "/organizers", "/pro-suppliers", "/tastings", "/membership-plans",
];

export const SEOMetaConfigurator = memo(function SEOMetaConfigurator({ isAr }: { isAr: boolean }) {
  const qc = useQueryClient();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Partial<PageMeta>>({});

  const { data: metaConfigs = [] } = useQuery({
    queryKey: ["seo-meta-configs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .like("key", "seo_meta_%");
      return (data || []).map((d) => ({ path: d.key.replace("seo_meta_", "").replace(/_/g, "/"), ...(typeof d.value === 'object' && d.value !== null && !Array.isArray(d.value) ? d.value as Record<string, unknown> : {}) }));
    },
  });

  const saveMeta = useMutation({
    mutationFn: async (meta: Partial<PageMeta> & { path: string }) => {
      const key = `seo_meta_${meta.path.replace(/\//g, "_")}`;
      const { path, ...value } = meta;
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value: value as unknown as Json }, { onConflict: "key" });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo-meta-configs"] });
      toast.success(isAr ? "تم حفظ إعدادات SEO" : "SEO meta saved");
    },
    onError: (e: Error) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const selectPage = (path: string) => {
    setSelectedPath(path);
    const existing = metaConfigs.find((m) => m.path === path);
    setForm(existing || { path });
  };

  const titleLen = (form.title || "").length;
  const descLen = (form.description || "").length;
  const titleOk = titleLen > 0 && titleLen <= 60;
  const descOk = descLen > 0 && descLen <= 160;

  const filteredRoutes = DEFAULT_ROUTES.filter(r => r.includes(search.toLowerCase()));
  const configuredPaths = new Set(metaConfigs.map((m) => m.path));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Page list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {isAr ? "الصفحات" : "Pages"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-8 h-8 text-xs"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-0.5">
              {filteredRoutes.map((path) => (
                <button
                  key={path}
                  onClick={() => selectPage(path)}
                  className={cn(
                    "w-full text-start text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2",
                    selectedPath === path ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60"
                  )}
                >
                  {configuredPaths.has(path) ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border border-border shrink-0" />
                  )}
                  <span className="font-mono truncate">{path}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Meta editor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {selectedPath ? (
                <span className="flex items-center gap-2">
                  {isAr ? "تحرير SEO:" : "Edit SEO:"} <code className="text-primary text-xs bg-primary/5 px-2 py-0.5 rounded">{selectedPath}</code>
                </span>
              ) : (
                isAr ? "اختر صفحة لتحرير SEO" : "Select a page to edit SEO"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPath ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {isAr ? "اختر صفحة من القائمة" : "Choose a page from the list to configure its SEO metadata"}
              </p>
            ) : (
              <div className="space-y-4">
                {/* Title EN */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Title (EN)</Label>
                    <span className={cn("text-xs tabular-nums", titleOk ? "text-emerald-500" : "text-destructive")}>
                      {titleLen}/60
                    </span>
                  </div>
                  <Input
                    value={form.title || ""}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    className="h-9 text-sm"
                    placeholder="Page Title — Brand Name"
                  />
                  {titleLen > 60 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Title exceeds 60 characters
                    </p>
                  )}
                </div>

                {/* Title AR */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">العنوان (AR)</Label>
                    <span className={cn("text-xs tabular-nums", (form.title_ar || "").length <= 60 ? "text-emerald-500" : "text-destructive")}>
                      {(form.title_ar || "").length}/60
                    </span>
                  </div>
                  <Input
                    value={form.title_ar || ""}
                    onChange={(e) => setForm(f => ({ ...f, title_ar: e.target.value }))}
                    className="h-9 text-sm"
                    dir="rtl"
                    placeholder="عنوان الصفحة — اسم العلامة"
                  />
                </div>

                {/* Description EN */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Meta Description (EN)</Label>
                    <span className={cn("text-xs tabular-nums", descOk ? "text-emerald-500" : "text-destructive")}>
                      {descLen}/160
                    </span>
                  </div>
                  <textarea
                    value={form.description || ""}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Concise description for search results..."
                  />
                </div>

                {/* Description AR */}
                <div className="space-y-1.5">
                  <Label className="text-xs">الوصف (AR)</Label>
                  <textarea
                    value={form.description_ar || ""}
                    onChange={(e) => setForm(f => ({ ...f, description_ar: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="rtl"
                    placeholder="وصف موجز لنتائج البحث..."
                  />
                </div>

                {/* Keywords */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Keywords (EN)</Label>
                    <Input
                      value={form.keywords || ""}
                      onChange={(e) => setForm(f => ({ ...f, keywords: e.target.value }))}
                      className="h-9 text-xs"
                      placeholder="keyword1, keyword2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">الكلمات المفتاحية (AR)</Label>
                    <Input
                      value={form.keywords_ar || ""}
                      onChange={(e) => setForm(f => ({ ...f, keywords_ar: e.target.value }))}
                      className="h-9 text-xs"
                      dir="rtl"
                      placeholder="كلمة1، كلمة2"
                    />
                  </div>
                </div>

                {/* OG Image */}
                <div className="space-y-1.5">
                  <Label className="text-xs">OG Image URL</Label>
                  <Input
                    value={form.og_image || ""}
                    onChange={(e) => setForm(f => ({ ...f, og_image: e.target.value }))}
                    className="h-9 text-xs"
                    placeholder="https://..."
                  />
                </div>

                {/* Canonical */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Canonical URL</Label>
                  <Input
                    value={form.canonical || ""}
                    onChange={(e) => setForm(f => ({ ...f, canonical: e.target.value }))}
                    className="h-9 text-xs"
                    placeholder="https://altoha.lovable.app/page"
                  />
                </div>

                {/* noIndex toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.no_index || false}
                    onChange={(e) => setForm(f => ({ ...f, no_index: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-xs">{isAr ? "منع الفهرسة (noindex)" : "Block indexing (noindex)"}</span>
                </label>

                {/* SERP Preview */}
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                    {isAr ? "معاينة نتائج البحث" : "SERP Preview"}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate">
                    {form.title || "Page Title — Altoha"}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono truncate">
                    altoha.lovable.app{selectedPath}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {form.description || "Add a description to see it previewed here..."}
                  </p>
                </div>

                <Button
                  onClick={() => saveMeta.mutate({ ...form, path: selectedPath } as any)}
                  disabled={saveMeta.isPending}
                  size="sm"
                  className="gap-1.5"
                >
                  {saveMeta.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isAr ? "حفظ" : "Save Meta"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
