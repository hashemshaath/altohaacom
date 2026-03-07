import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useEstablishments(filters?: { type?: string; country?: string; search?: string }) {
  return useQuery({
    queryKey: ["establishments", filters],
    queryFn: async () => {
      let query = supabase
        .from("establishments")
        .select("id, name, name_ar, type, description, description_ar, country_code, city, city_ar, address, phone, email, website, cuisine_type, star_rating, logo_url, cover_image_url, is_active, created_at")
        .eq("is_active", true)
        .order("name");

      if (filters?.type) query = query.eq("type", filters.type);
      if (filters?.country) query = query.eq("country_code", filters.country);
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useEstablishment(id?: string) {
  return useQuery({
    queryKey: ["establishment", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("establishments")
        .select("id, name, name_ar, type, description, description_ar, country_code, city, city_ar, address, phone, email, website, cuisine_type, star_rating, logo_url, cover_image_url, is_active, created_by, created_at, updated_at, latitude, longitude, google_maps_url, instagram_url, facebook_url, twitter_url, tiktok_url, verification_status, verified_at, verified_by")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useEstablishmentAssociations(establishmentId?: string) {
  return useQuery({
    queryKey: ["establishment-associations", establishmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_establishment_associations")
        .select("*, profiles:user_id(full_name, full_name_ar, avatar_url, username)")
        .eq("establishment_id", establishmentId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!establishmentId,
  });
}

export function useMyEstablishmentAssociations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-establishment-associations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_establishment_associations")
        .select("*, establishments(name, name_ar, type, logo_url, city, country_code)")
        .eq("user_id", user!.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useMyEstablishmentQualifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-establishment-qualifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_establishment_qualifications")
        .select("*, chef_establishment_associations(establishment_id, establishments(name, name_ar))")
        .eq("user_id", user!.id)
        .order("issued_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useAssociationQualifications(associationId?: string) {
  return useQuery({
    queryKey: ["association-qualifications", associationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_establishment_qualifications")
        .select("id, association_id, user_id, qualification_name, qualification_name_ar, qualification_type, issued_date, expiry_date, credential_id, description, document_url, verified, verified_by, verified_at, created_at")
        .eq("association_id", associationId!)
        .order("issued_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!associationId,
  });
}

export function useCreateEstablishment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      name_ar?: string;
      type: string;
      description?: string;
      description_ar?: string;
      country_code?: string;
      city?: string;
      city_ar?: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      cuisine_type?: string;
      star_rating?: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("establishments").insert({ ...data, created_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishments"] });
      toast({ title: "Establishment added successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useAddAssociation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      establishment_id: string;
      association_type: string;
      role_title?: string;
      role_title_ar?: string;
      department?: string;
      start_date?: string;
      end_date?: string;
      is_current?: boolean;
      description?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("chef_establishment_associations").insert({ ...data, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-establishment-associations"] });
      queryClient.invalidateQueries({ queryKey: ["establishment-associations"] });
      toast({ title: "Association added" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useAddQualification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      association_id: string;
      qualification_name: string;
      qualification_name_ar?: string;
      qualification_type?: string;
      issued_date?: string;
      expiry_date?: string;
      credential_id?: string;
      description?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("chef_establishment_qualifications").insert({ ...data, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-establishment-qualifications"] });
      queryClient.invalidateQueries({ queryKey: ["association-qualifications"] });
      toast({ title: "Qualification added" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
