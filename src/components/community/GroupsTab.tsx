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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, Lock, Globe } from "lucide-react";
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

    // Add creator as admin member
    await supabase.from("group_members").insert({
      group_id: data.id,
      user_id: user.id,
      role: "admin",
    });

    setCreating(false);
    setDialogOpen(false);
    setForm({ name: "", name_ar: "", description: "", description_ar: "", is_private: false });
    fetchGroups();
  };

  const handleJoinLeave = async (groupId: string, isMember: boolean) => {
    if (!user) {
      toast({ title: "Please sign in to join groups" });
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

  const getDisplayName = (group: Group) => (language === "ar" && group.name_ar ? group.name_ar : group.name);
  const getDisplayDesc = (group: Group) =>
    language === "ar" && group.description_ar ? group.description_ar : group.description;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">{t("loading")}</div>;
  }

  return (
    <div className="space-y-6">
      {user && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {t("createGroup")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createNewGroup")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("groupName")} (English)</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("groupName")} (العربية)</Label>
                  <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("groupDescription")} (English)</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("groupDescription")} (العربية)</Label>
                  <Textarea
                    value={form.description_ar}
                    onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t("privateGroup")}</Label>
                  <Switch checked={form.is_private} onCheckedChange={(v) => setForm({ ...form, is_private: v })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    {t("cancel")}
                  </Button>
                  <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                    {creating ? t("loading") : t("create")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{getDisplayName(group)}</CardTitle>
                {group.is_private ? (
                  <Badge variant="outline">
                    <Lock className="h-3 w-3 me-1" />
                    {t("privateGroup")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Globe className="h-3 w-3 me-1" />
                    {t("publicGroup")}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {getDisplayDesc(group) && (
                <p className="text-sm text-muted-foreground mb-3">{getDisplayDesc(group)}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {group.members_count} {t("members")}
                </span>
                {user && group.created_by !== user.id && (
                  <Button
                    variant={group.is_member ? "outline" : "default"}
                    size="sm"
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
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("discoverGroups")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
