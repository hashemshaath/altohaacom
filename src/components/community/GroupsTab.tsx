import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Lock, Globe, UsersRound, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGroupsData } from "@/hooks/community/useGroupsData";

const INITIAL_FORM = { name: "", name_ar: "", description: "", description_ar: "", is_private: false };

export const GroupsTab = memo(function GroupsTab() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { groups, isLoading, createGroup, isCreating, toggleMembership } = useGroupsData();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const handleCreate = async () => {
    if (!user || !form.name.trim()) return;
    try {
      await createGroup(form);
      setShowForm(false);
      setForm(INITIAL_FORM);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleJoinLeave = (groupId: string, isMember: boolean) => {
    if (!user) {
      toast({ title: isAr ? "يرجى تسجيل الدخول" : "Please sign in to join groups" });
      return;
    }
    toggleMembership(groupId, isMember);
  };

  const getDisplayName = (group: typeof groups[0]) => (isAr && group.name_ar ? group.name_ar : group.name);
  const getDisplayDesc = (group: typeof groups[0]) => (isAr && group.description_ar ? group.description_ar : group.description);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end"><Skeleton className="h-10 w-36" /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="space-y-2 p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-20" />
            </CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {user && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="gap-1.5">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? (isAr ? "إلغاء" : "Cancel") : t("createGroup")}
          </Button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("createNewGroup")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("groupName")} (English)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("groupName")} (العربية)</Label>
                <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("groupDescription")} (English)</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("groupDescription")} (العربية)</Label>
                <Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <Label className="text-sm">{t("privateGroup")}</Label>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "المجموعة الخاصة تتطلب دعوة للانضمام" : "Private groups require invitation to join"}
                </p>
              </div>
              <Switch checked={form.is_private} onCheckedChange={(v) => setForm({ ...form, is_private: v })} />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              <Button onClick={handleCreate} disabled={isCreating || !form.name.trim()}>
                {isCreating ? t("loading") : t("create")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.id} className="group/card rounded-xl border border-border/15 bg-card p-3.5 transition-all duration-200 hover:shadow-md hover:border-primary/15">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${group.is_private ? "bg-chart-5/8" : "bg-primary/8"}`}>
                  {group.is_private ? <Lock className="h-3.5 w-3.5 text-chart-5" /> : <Globe className="h-3.5 w-3.5 text-primary" />}
                </div>
                <h3 className="font-semibold text-[0.8125rem] leading-tight truncate">{getDisplayName(group)}</h3>
              </div>
            </div>
            {getDisplayDesc(group) && (
              <p className="mb-2.5 line-clamp-2 text-[0.6875rem] text-muted-foreground/60 leading-relaxed">{getDisplayDesc(group)}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border/10">
              <span className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground/50">
                <Users className="h-3 w-3" />
                {group.members_count} {isAr ? "عضو" : "members"}
              </span>
              {user && group.created_by !== user.id && (
                <Button
                  variant={group.is_member ? "ghost" : "default"}
                  size="sm"
                  className="h-7 text-[0.6875rem] rounded-lg px-3 active:scale-[0.98]"
                  onClick={() => handleJoinLeave(group.id, group.is_member)}
                >
                  {group.is_member ? (isAr ? "مغادرة" : "Leave") : (isAr ? "انضمام" : "Join")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <UsersRound className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{t("discoverGroups")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
