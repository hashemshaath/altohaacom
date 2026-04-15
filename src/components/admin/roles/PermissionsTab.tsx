import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Shield, Save, Loader2, Lock, Search, Copy, ChevronDown, ChevronUp, CheckCircle2,
} from "lucide-react";
import { ROLE_META, ALL_ROLES, type AppRole } from "./types";

interface Props {
  permissions: Record<string, unknown>[];
  rolePerms: Record<string, unknown>[];
  allRolePerms: Record<string, unknown>[];
  rolePermsLoading: boolean;
  activeRole: AppRole;
  isAr: boolean;
  t: (en: string, ar: string) => string;
  onRoleChange: (role: AppRole) => void;
}

export default function PermissionsTab({ permissions, rolePerms, allRolePerms, rolePermsLoading, activeRole, isAr, t, onRoleChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [lastSyncedRole, setLastSyncedRole] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [permSearch, setPermSearch] = useState("");
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);

  const totalPerms = permissions.length;

  // Sync selectedPerms when role data loads
  if (!rolePermsLoading && lastSyncedRole !== activeRole) {
    const ids = new Set(rolePerms.map((rp) => rp.permission_id as string));
    setSelectedPerms(ids);
    setLastSyncedRole(activeRole);
  }

  const handleRoleChange = (role: AppRole) => {
    onRoleChange(role);
    setLastSyncedRole(null);
  };

  const togglePerm = useCallback((permId: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId); else next.add(permId);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  const selectAllInCategory = useCallback((catPerms: Record<string, unknown>[]) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      catPerms.forEach(p => next.add(p.id));
      return next;
    });
  }, []);

  const deselectAllInCategory = useCallback((catPerms: Record<string, unknown>[]) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      catPerms.forEach(p => next.delete(p.id));
      return next;
    });
  }, []);

  const grouped = useMemo(() => permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    const cat = p.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {}), [permissions]);

  const filteredGrouped = useMemo(() => {
    if (!permSearch.trim()) return grouped;
    const result: Record<string, typeof permissions> = {};
    Object.entries(grouped).forEach(([cat, perms]) => {
      const filtered = perms.filter((p) =>
        p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
        (p.name_ar && p.name_ar.includes(permSearch))
      );
      if (filtered.length > 0) result[cat] = filtered;
    });
    return result;
  }, [grouped, permSearch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("role_permissions").delete().eq("role", activeRole);
      if (selectedPerms.size > 0) {
        const inserts = Array.from(selectedPerms).map(pid => ({ role: activeRole, permission_id: pid }));
        const { error } = await supabase.from("role_permissions").insert(inserts);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
      queryClient.invalidateQueries({ queryKey: ["roleStats"] });
      toast({ title: t("Permissions saved successfully", "تم حفظ الصلاحيات بنجاح") });
    } catch (err: unknown) {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const copyPermsFromRole = (sourceRole: AppRole) => {
    const sourcePerms = allRolePerms.filter((rp) => rp.role === sourceRole).map((rp) => rp.permission_id as string);
    setSelectedPerms(new Set(sourcePerms));
    setCopyMenuOpen(false);
    toast({ title: t(`Copied permissions from ${ROLE_META[sourceRole].labelEn}`, `تم نسخ الصلاحيات من ${ROLE_META[sourceRole].labelAr}`) });
  };

  // Calculate diff from saved state
  const savedPerms = useMemo(() => new Set(rolePerms.map((rp) => rp.permission_id as string)), [rolePerms]);
  const hasChanges = useMemo(() => {
    if (savedPerms.size !== selectedPerms.size) return true;
    for (const id of selectedPerms) if (!savedPerms.has(id)) return true;
    return false;
  }, [savedPerms, selectedPerms]);

  const added = useMemo(() => [...selectedPerms].filter(id => !savedPerms.has(id)).length, [selectedPerms, savedPerms]);
  const removed = useMemo(() => [...savedPerms].filter(id => !selectedPerms.has(id)).length, [selectedPerms, savedPerms]);

  const meta = ROLE_META[activeRole];
  const ActiveIcon = meta.icon;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ALL_ROLES.map((role) => {
          const rm = ROLE_META[role];
          const Icon = rm.icon;
          return (
            <Button key={role} variant={activeRole === role ? "default" : "outline"} size="sm"
              onClick={() => handleRoleChange(role)} className="gap-1.5 text-xs rounded-xl active:scale-[0.98] touch-manipulation">
              <Icon className="h-3.5 w-3.5" />
              {isAr ? rm.labelAr : rm.labelEn}
            </Button>
          );
        })}
      </div>

      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${meta.color}`}>
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{isAr ? meta.labelAr : meta.labelEn}</CardTitle>
                <CardDescription className="text-xs">{isAr ? meta.descAr : meta.descEn}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{selectedPerms.size}/{totalPerms}</Badge>
              {/* Copy from another role */}
              <div className="relative">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl"
                  onClick={() => setCopyMenuOpen(!copyMenuOpen)}>
                  <Copy className="h-3.5 w-3.5" /> {t("Copy from", "نسخ من")}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {copyMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" role="presentation" onClick={() => setCopyMenuOpen(false)} onKeyDown={(e) => e.key === "Escape" && setCopyMenuOpen(false)} />
                    <div className="absolute end-0 top-full mt-1 z-20 bg-popover border rounded-xl shadow-lg p-1 min-w-[160px]">
                      {ALL_ROLES.filter(r => r !== activeRole).map(role => {
                        const rm = ROLE_META[role];
                        const Icon = rm.icon;
                        const count = allRolePerms.filter((rp) => rp.role === role).length;
                        return (
                          <button key={role} onClick={() => copyPermsFromRole(role)}
                            className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors text-start">
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1">{isAr ? rm.labelAr : rm.labelEn}</span>
                            <span className="text-xs text-muted-foreground">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder={t("Search permissions...", "ابحث في الصلاحيات...")} value={permSearch} onChange={e => setPermSearch(e.target.value)} className="ps-9 h-8 text-xs rounded-xl" />
          </div>

          {rolePermsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            Object.entries(filteredGrouped).map(([category, perms]) => {
              const catSelected = perms.filter((p) => selectedPerms.has(p.id)).length;
              const allSelected = catSelected === perms.length;
              const isExpanded = expandedCategories.has(category) || catSelected > 0;
              return (
                <div key={category} className="rounded-xl border border-border/60 overflow-hidden">
                  <button onClick={() => toggleCategory(category)}
                    className="flex w-full items-center justify-between p-3 hover:bg-muted/30 transition-colors touch-manipulation">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-sm font-semibold capitalize">{category}</h3>
                      <Badge variant={catSelected > 0 ? "default" : "outline"} className="text-xs h-5">{catSelected}/{perms.length}</Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t px-3 pb-3 pt-2 space-y-2 bg-muted/5">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-6 text-xs rounded-lg"
                          onClick={() => selectAllInCategory(perms)} disabled={allSelected}>
                          {t("Select All", "تحديد الكل")}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-xs rounded-lg"
                          onClick={() => deselectAllInCategory(perms)} disabled={catSelected === 0}>
                          {t("Deselect All", "إلغاء الكل")}
                        </Button>
                      </div>
                      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {perms.map((perm) => (
                          <label key={perm.id}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 transition-all duration-200 hover:bg-muted/50 active:scale-[0.98] touch-manipulation ${
                              selectedPerms.has(perm.id) ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/40"
                            }`}>
                            <Checkbox checked={selectedPerms.has(perm.id)} onCheckedChange={() => togglePerm(perm.id)} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium leading-tight">{isAr ? perm.name_ar || perm.name : perm.name}</p>
                              <p className="text-xs text-muted-foreground font-mono" dir="ltr">{perm.code}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Save bar with diff summary */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <>
                  {added > 0 && <Badge variant="default" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> +{added} {t("added", "مضاف")}</Badge>}
                  {removed > 0 && <Badge variant="destructive" className="text-xs gap-1">-{removed} {t("removed", "محذوف")}</Badge>}
                </>
              )}
              {!hasChanges && !rolePermsLoading && (
                <p className="text-xs text-muted-foreground">{t("No unsaved changes", "لا توجد تغييرات غير محفوظة")}</p>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-1.5 rounded-xl active:scale-[0.98] touch-manipulation">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {t("Save Permissions", "حفظ الصلاحيات")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
