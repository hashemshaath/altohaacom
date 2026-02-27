import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembershipFeatures } from "@/hooks/useMembershipFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Plus, Trash2, Shield, Clock, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MembershipUserOverrides() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user: adminUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: features = [] } = useMembershipFeatures();

  const [searchUser, setSearchUser] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newOverride, setNewOverride] = useState({
    featureId: "",
    granted: true,
    reason: "",
    expiresAt: "",
  });
  const [saving, setSaving] = useState(false);

  // Search users
  const { data: users = [], isLoading: searchLoading } = useQuery({
    queryKey: ["admin-search-users-overrides", searchUser],
    queryFn: async () => {
      if (searchUser.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, display_name, username, avatar_url, membership_tier, account_number")
        .or(`full_name.ilike.%${searchUser}%,username.ilike.%${searchUser}%,account_number.ilike.%${searchUser}%`)
        .limit(10);
      return data || [];
    },
    enabled: searchUser.length >= 2,
    staleTime: 10000,
  });

  // Fetch overrides for selected user
  const { data: overrides = [], isLoading: overridesLoading } = useQuery({
    queryKey: ["user-feature-overrides", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from("membership_feature_overrides")
        .select("*, membership_features(code, name, name_ar, category)")
        .eq("user_id", selectedUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedUserId,
  });

  const selectedProfile = users.find((u: any) => u.user_id === selectedUserId) || null;

  const handleAddOverride = async () => {
    if (!selectedUserId || !newOverride.featureId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("membership_feature_overrides").upsert(
        {
          user_id: selectedUserId,
          feature_id: newOverride.featureId,
          granted: newOverride.granted,
          reason: newOverride.reason || null,
          granted_by: adminUser?.id || null,
          expires_at: newOverride.expiresAt || null,
        },
        { onConflict: "user_id,feature_id" }
      );
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["user-feature-overrides", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["userFeatureAccess"] });
      queryClient.invalidateQueries({ queryKey: ["userAllFeatures"] });
      toast.success(isAr ? "تم حفظ التجاوز" : "Override saved");
      setAddDialogOpen(false);
      setNewOverride({ featureId: "", granted: true, reason: "", expiresAt: "" });
    } catch {
      toast.error(isAr ? "فشل الحفظ" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    try {
      const { error } = await supabase
        .from("membership_feature_overrides")
        .delete()
        .eq("id", overrideId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["user-feature-overrides", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["userFeatureAccess"] });
      queryClient.invalidateQueries({ queryKey: ["userAllFeatures"] });
      toast.success(isAr ? "تم الحذف" : "Override removed");
    } catch {
      toast.error(isAr ? "فشل الحذف" : "Delete failed");
    }
  };

  const handleToggleGranted = async (overrideId: string, currentGranted: boolean) => {
    try {
      const { error } = await supabase
        .from("membership_feature_overrides")
        .update({ granted: !currentGranted })
        .eq("id", overrideId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["user-feature-overrides", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["userFeatureAccess"] });
      toast.success(isAr ? "تم التحديث" : "Updated");
    } catch {
      toast.error(isAr ? "فشل التحديث" : "Update failed");
    }
  };

  // Features not yet overridden
  const existingFeatureIds = new Set(overrides.map((o: any) => o.feature_id));
  const availableFeatures = features.filter(f => !existingFeatureIds.has(f.id));

  return (
    <div className="space-y-4">
      {/* User search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {isAr ? "البحث عن مستخدم" : "Find User"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "ابحث بالاسم أو اسم المستخدم أو رقم الحساب..." : "Search by name, username, or account number..."}
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="ps-9"
            />
          </div>

          {searchLoading && <Skeleton className="h-12 w-full max-w-md" />}

          {users.length > 0 && (
            <div className="space-y-1 max-w-md">
              {users.map((u: any) => (
                <button
                  key={u.user_id}
                  onClick={() => {
                    setSelectedUserId(u.user_id);
                    setSearchUser("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors",
                    selectedUserId === u.user_id
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : "hover:bg-muted/50"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(u.display_name || u.full_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isAr ? (u.full_name_ar || u.full_name) : (u.display_name || u.full_name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.username ? `@${u.username}` : u.account_number}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                    {u.membership_tier || "basic"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User overrides panel */}
      {selectedUserId && selectedProfile && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(selectedProfile.display_name || selectedProfile.full_name || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm">
                    {isAr ? (selectedProfile.full_name_ar || selectedProfile.full_name) : (selectedProfile.display_name || selectedProfile.full_name)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedProfile.username ? `@${selectedProfile.username}` : ""} · {isAr ? "باقة" : "Tier"}: <span className="capitalize font-medium">{selectedProfile.membership_tier || "basic"}</span>
                  </p>
                </div>
              </div>

              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5" disabled={availableFeatures.length === 0}>
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? "إضافة تجاوز" : "Add Override"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isAr ? "إضافة تجاوز ميزة" : "Add Feature Override"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>{isAr ? "الميزة" : "Feature"}</Label>
                      <Select value={newOverride.featureId} onValueChange={(v) => setNewOverride(p => ({ ...p, featureId: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={isAr ? "اختر ميزة" : "Select a feature"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFeatures.map(f => (
                            <SelectItem key={f.id} value={f.id}>
                              {isAr ? (f.name_ar || f.name) : f.name}
                              <span className="text-muted-foreground text-xs ms-2">({f.code})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label>{isAr ? "منح الوصول" : "Grant Access"}</Label>
                        <p className="text-xs text-muted-foreground">
                          {newOverride.granted
                            ? (isAr ? "سيتم منح هذه الميزة بغض النظر عن الباقة" : "Feature will be granted regardless of tier")
                            : (isAr ? "سيتم حجب هذه الميزة بغض النظر عن الباقة" : "Feature will be revoked regardless of tier")}
                        </p>
                      </div>
                      <Switch
                        checked={newOverride.granted}
                        onCheckedChange={(v) => setNewOverride(p => ({ ...p, granted: v }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{isAr ? "السبب (اختياري)" : "Reason (optional)"}</Label>
                      <Input
                        value={newOverride.reason}
                        onChange={(e) => setNewOverride(p => ({ ...p, reason: e.target.value }))}
                        placeholder={isAr ? "سبب التجاوز..." : "Reason for override..."}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {isAr ? "تاريخ الانتهاء (اختياري)" : "Expiry Date (optional)"}
                      </Label>
                      <Input
                        type="datetime-local"
                        value={newOverride.expiresAt}
                        onChange={(e) => setNewOverride(p => ({ ...p, expiresAt: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      {isAr ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button onClick={handleAddOverride} disabled={!newOverride.featureId || saving}>
                      {saving ? "..." : (isAr ? "حفظ" : "Save")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {overridesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : overrides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>{isAr ? "لا توجد تجاوزات لهذا المستخدم" : "No overrides for this user"}</p>
                <p className="text-xs mt-1">{isAr ? "سيتم استخدام إعدادات الباقة الافتراضية" : "Default tier settings apply"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overrides.map((override: any) => {
                  const feature = override.membership_features;
                  const isExpired = override.expires_at && new Date(override.expires_at) < new Date();
                  return (
                    <div
                      key={override.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                        isExpired && "opacity-50 bg-muted/30"
                      )}
                    >
                      <Switch
                        checked={override.granted}
                        onCheckedChange={() => handleToggleGranted(override.id, override.granted)}
                        className="scale-75"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">
                            {isAr ? (feature?.name_ar || feature?.name) : feature?.name}
                          </p>
                          <Badge
                            variant={override.granted ? "default" : "destructive"}
                            className="text-[10px] h-4"
                          >
                            {override.granted ? (isAr ? "ممنوح" : "Granted") : (isAr ? "محجوب" : "Revoked")}
                          </Badge>
                          {isExpired && (
                            <Badge variant="outline" className="text-[10px] h-4 text-destructive">
                              {isAr ? "منتهي" : "Expired"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono">{feature?.code}</span>
                          {override.reason && <span>· {override.reason}</span>}
                          {override.expires_at && (
                            <span className="flex items-center gap-1">
                              · <Clock className="h-3 w-3" />
                              {new Date(override.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteOverride(override.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
