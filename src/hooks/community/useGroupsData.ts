import { CACHE } from "@/lib/queryConfig";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export interface Group {
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

interface CreateGroupInput {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  is_private: boolean;
}

interface UseGroupsDataReturn {
  groups: Group[];
  isLoading: boolean;
  createGroup: (input: CreateGroupInput) => Promise<void>;
  isCreating: boolean;
  toggleMembership: (groupId: string, isMember: boolean) => void;
}

export function useGroupsData(): UseGroupsDataReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["community-groups", user?.id],
    queryFn: async (): Promise<Group[]> => {
      const { data: groupsData, error } = await supabase
        .from("groups")
        .select("id, name, name_ar, description, description_ar, cover_image_url, is_private, category, created_by, created_at")
        .order("created_at", { ascending: false });

      if (error || !groupsData?.length) return [];

      const groupIds = groupsData.map((g) => g.id);
      const [membersRes, userMembersRes] = await Promise.all([
        supabase.from("group_members").select("group_id").in("group_id", groupIds),
        user ? supabase.from("group_members").select("group_id").eq("user_id", user.id).in("group_id", groupIds) : { data: [] },
      ]);

      const membersMap = new Map<string, number>();
      membersRes.data?.forEach((m) => membersMap.set(m.group_id, (membersMap.get(m.group_id) || 0) + 1));
      const userMemberSet = new Set(userMembersRes.data?.map((m) => m.group_id) || []);

      return groupsData.map((g) => ({
        id: g.id, name: g.name, name_ar: g.name_ar, description: g.description,
        description_ar: g.description_ar, is_private: g.is_private,
        created_by: g.created_by, members_count: membersMap.get(g.id) || 0,
        is_member: userMemberSet.has(g.id) || g.created_by === user?.id,
      }));
    },
    ...CACHE.short,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("groups").insert({
        name: input.name.trim(), name_ar: input.name_ar.trim() || null,
        description: input.description.trim() || null, description_ar: input.description_ar.trim() || null,
        is_private: input.is_private, created_by: user.id,
      }).select().single();
      if (error) throw handleSupabaseError(error);
      await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id, role: "admin" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community-groups"] }),
  });

  const membershipMutation = useMutation({
    mutationFn: async ({ groupId, isMember }: { groupId: string; isMember: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isMember) {
        await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
      } else {
        await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
      }
    },
    onMutate: async ({ groupId, isMember }) => {
      await queryClient.cancelQueries({ queryKey: ["community-groups"] });
      queryClient.setQueryData<Group[]>(["community-groups", user?.id], (old) =>
        old?.map((g) => g.id === groupId
          ? { ...g, is_member: !isMember, members_count: isMember ? g.members_count - 1 : g.members_count + 1 }
          : g
        )
      );
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ["community-groups"] }),
  });

  return {
    groups,
    isLoading,
    createGroup: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    toggleMembership: (groupId, isMember) => membershipMutation.mutate({ groupId, isMember }),
  };
}
