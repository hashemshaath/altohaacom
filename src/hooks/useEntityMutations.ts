import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import type { EntityFormData } from "@/components/admin/entities/EntityFormTabs";

type EntityStatus = Database["public"]["Enums"]["entity_status"];

interface UseSaveParams {
  form: EntityFormData;
  editingId: string | null;
  selectedManager: string;
  onSuccess: (wasCreating: boolean) => void;
}

export function useEntityMutations({ form, editingId, selectedManager, onSuccess }: UseSaveParams) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-entities"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
      const payload = {
        name: form.name, name_ar: form.name_ar || null,
        abbreviation: form.abbreviation || null, abbreviation_ar: form.abbreviation_ar || null,
        description: form.description || null, description_ar: form.description_ar || null,
        type: form.type, scope: form.scope, status: form.status,
        is_visible: form.is_visible, is_verified: form.is_verified,
        country: form.country || null, city: form.city || null,
        address: form.address || null, address_ar: form.address_ar || null,
        postal_code: form.postal_code || null,
        email: form.email || null, phone: form.phone || null,
        fax: form.fax || null, website: form.website || null,
        logo_url: form.logo_url || null, cover_image_url: form.cover_image_url || null,
        president_name: form.president_name || null, president_name_ar: form.president_name_ar || null,
        secretary_name: form.secretary_name || null, secretary_name_ar: form.secretary_name_ar || null,
        founded_year: form.founded_year || null, member_count: form.member_count || null,
        mission: form.mission || null, mission_ar: form.mission_ar || null,
        username: form.username || null,
        registration_number: form.registration_number || null,
        license_number: form.license_number || null,
        internal_notes: form.internal_notes || null,
        services: form.services_input ? form.services_input.split(",").map(s => s.trim()) : [],
        specializations: form.specializations_input ? form.specializations_input.split(",").map(s => s.trim()) : [],
        tags: form.tags_input ? form.tags_input.split(",").map(s => s.trim()) : [],
        account_manager_id: selectedManager || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        slug, created_by: user?.id,
      };

      if (editingId) {
        const { error } = await supabase.from("culinary_entities").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("culinary_entities").insert({ ...payload, entity_number: "" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      const wasCreating = !editingId;
      toast({ title: editingId ? (isAr ? "تم تحديث الجهة" : "Entity updated") : (isAr ? "تم إنشاء الجهة" : "Entity created") });
      if (wasCreating) {
        import("@/lib/notificationTriggers").then(({ notifyAdminEntityReview }) => {
          notifyAdminEntityReview({ entityName: form.name, entityNameAr: form.name_ar || undefined, submittedBy: "Admin" });
        });
      }
      onSuccess(wasCreating);
    },
    onError: (err: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("culinary_entities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: isAr ? "تم حذف الجهة" : "Entity deleted" });
    },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase.from("culinary_entities").update({ is_visible: visible }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status, entityName, entityNameAr, createdBy }: { id: string; status: EntityStatus; entityName?: string; entityNameAr?: string; createdBy?: string | null }) => {
      // When activating, also make visible; when suspending/pending, hide
      const is_visible = status === "active";
      const { error } = await supabase.from("culinary_entities").update({ status, is_visible }).eq("id", id);
      if (error) throw error;
      return { status, entityName, entityNameAr, createdBy };
    },
    onSuccess: (data) => {
      invalidate();
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
      if (data) {
        import("@/lib/notificationTriggers").then(({ notifyEntityStatusChanged }) => {
          notifyEntityStatusChanged({
            entityId: "",
            entityName: data.entityName || "Entity",
            entityNameAr: data.entityNameAr,
            newStatus: data.status,
            createdBy: data.createdBy,
          });
        });
      }
    },
  });

  const changeVerified = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from("culinary_entities").update({ is_verified: verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: isAr ? "تم التحديث" : "Verified status updated" });
    },
  });

  return { saveMutation, deleteMutation, toggleVisibility, changeStatus, changeVerified };
}
