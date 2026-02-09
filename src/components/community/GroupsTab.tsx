import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Lock, Globe, UsersRound, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  is_private: boolean;
  created_by: string;
  members_count: number;
  is_member: boolean;
}

export function GroupsTab() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
    is_private: false,
  });

  const fetchGroups = async () => {
    const { data: groupsData, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching groups:", error);
      setLoading(false);
      return;
    }

    const groupIds = groupsData?.map((g) => g.id) || [];

    const [membersRes, userMembersRes] = await Promise.all([
      supabase.from("group_members").select("group_id").in("group_id", groupIds),
      user
        ? supabase.from("group_members").select("group_id").eq("user_id", user.id).in("group_id", groupIds)
        : { data: [] },
    ]);

    const membersMap = new Map<string, number>();
    membersRes.data?.forEach((m) => membersMap.set(m.group_id, (membersMap.get(m.group_id) || 0) + 1));
    const userMemberSet = new Set(userMembersRes.data?.map((m) => m.group_id) || []);

    const enriched: Group[] = (groupsData || []).map((g) => ({
      id: g.id,
      name: g.name,
      name_ar: g.name_ar,
      description: g.description,
      description_ar: g.description_ar,
      is_private: g.is_private,
      created_by: g.created_by,
      members_count: membersMap.get(g.id) || 0,
      is_member: userMemberSet.has(g.id) || g.created_by === user?.id,
    }));

    setGroups(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !form.name.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        description: form.description.trim() || null,
        description_ar: form.description_ar.trim() || null,
        is_private: form.is_private,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      setCreating(false);
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    await supabase.from("group_members").insert({
      group_id: data.id,
      user_id: user.id,
      role: "admin",
    });

    setCreating(false);
    setShowForm(false);
    setForm({ name: "", name_ar: "", description: "", description_ar: "", is_private: false });
    fetchGroups();
  };

  const handleJoinLeave = async (groupId: string, isMember: boolean) => {
    if (!user) {
      toast({ title: isAr ? "يرجى تسجيل الدخول" : "Please sign in to join groups" });
      return;
    }
    if (isMember) {
      await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    } else {
      await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
    }
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, is_member: !isMember, members_count: isMember ? g.members_count - 1 : g.members_count + 1 }
          : g
      )
    );
  };

  const getDisplayName = (group: Group) => (isAr && group.name_ar ? group.name_ar : group.name);
  const getDisplayDesc = (group: Group) => (isAr && group.description_ar ? group.description_ar : group.description);

  if (loading) {
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

      {/* Inline create form */}
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
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">{t("privateGroup")}</Label>
                <p className="text-[10px] text-muted-foreground">
                  {isAr ? "المجموعة الخاصة تتطلب دعوة للانضمام" : "Private groups require invitation to join"}
                </p>
              </div>
              <Switch checked={form.is_private} onCheckedChange={(v) => setForm({ ...form, is_private: v })} />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                {creating ? t("loading") : t("create")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold">{getDisplayName(group)}</h3>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {group.is_private ? (
                    <><Lock className="me-1 h-2.5 w-2.5" />{t("privateGroup")}</>
                  ) : (
                    <><Globe className="me-1 h-2.5 w-2.5" />{t("publicGroup")}</>
                  )}
                </Badge>
              </div>
              {getDisplayDesc(group) && (
                <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{getDisplayDesc(group)}</p>
              )}
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {group.members_count} {t("members")}
                </span>
                {user && group.created_by !== user.id && (
                  <Button
                    variant={group.is_member ? "outline" : "default"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleJoinLeave(group.id, group.is_member)}
                  >
                    {group.is_member ? t("leaveGroup") : t("joinGroup")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
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
}
