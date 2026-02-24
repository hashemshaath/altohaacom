import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useSocialLinkPage(userId?: string) {
  return useQuery({
    queryKey: ["social-link-page", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_link_pages")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useSocialLinkItems(pageId?: string) {
  return useQuery({
    queryKey: ["social-link-items", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_link_items")
        .select("*")
        .eq("page_id", pageId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pageId,
  });
}

export function useSocialLinkPageByUsername(username?: string) {
  return useQuery({
    queryKey: ["social-link-page-public", username],
    queryFn: async () => {
      // First get user_id from profiles_public
      const { data: profile, error: pErr } = await supabase
        .from("profiles_public")
        .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, instagram, twitter, facebook, linkedin, youtube, tiktok, snapchat, website")
        .eq("username", username!.toLowerCase())
        .maybeSingle();
      if (pErr) throw pErr;
      if (!profile) throw new Error("Profile not found");

      const { data: page, error: pgErr } = await supabase
        .from("social_link_pages")
        .select("*")
        .eq("user_id", profile.user_id)
        .maybeSingle();
      if (pgErr) throw pgErr;

      const items = page ? await supabase
        .from("social_link_items")
        .select("*")
        .eq("page_id", page.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .then(r => r.data || []) : [];

      return { profile, page, items };
    },
    enabled: !!username,
  });
}

export function useUpsertSocialLinkPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("social_link_pages")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("social_link_pages")
          .update(values)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("social_link_pages")
          .insert({ ...values, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-link-page"] });
      toast({ title: "✅" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

export function useManageSocialLinkItems() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const addItem = useMutation({
    mutationFn: async (item: { page_id: string; title: string; title_ar?: string; url: string; icon?: string; link_type?: string; sort_order?: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("social_link_items")
        .insert({ ...item, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-link-items"] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, any>) => {
      const { data, error } = await supabase
        .from("social_link_items")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-link-items"] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_link_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-link-items"] }),
  });

  const reorderItems = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        await supabase.from("social_link_items").update({ sort_order: item.sort_order }).eq("id", item.id);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-link-items"] }),
  });

  return { addItem, updateItem, deleteItem, reorderItems };
}

export function useRecordLinkClick() {
  return useMutation({
    mutationFn: async (itemId: string) => {
      await supabase.rpc("increment_field" as any, { table_name: "social_link_items", field_name: "click_count", row_id: itemId });
    },
  });
}
