import { useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

interface Props {
  companyId: string;
  variant?: "icon" | "full";
}

export function SupplierWishlistButton({ companyId, variant = "full" }: Props) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isWishlisted = false } = useQuery({
    queryKey: ["supplierWishlist", companyId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("supplier_wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (isWishlisted) {
        const { error } = await supabase
          .from("supplier_wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("company_id", companyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("supplier_wishlists")
          .insert({ user_id: user.id, company_id: companyId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplierWishlist", companyId] });
      queryClient.invalidateQueries({ queryKey: ["mySupplierWishlists"] });
      toast({
        title: isWishlisted
          ? (isAr ? "تمت الإزالة من المفضلة" : "Removed from favorites")
          : (isAr ? "تمت الإضافة للمفضلة" : "Added to favorites"),
      });
    },
  });

  if (!user) return null;

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(); }}
        disabled={toggleMutation.isPending}
      >
        <Heart className={`h-4 w-4 transition-all ${isWishlisted ? "fill-destructive text-destructive scale-110" : "text-muted-foreground"}`} />
      </Button>
    );
  }

  return (
    <Button
      variant={isWishlisted ? "secondary" : "outline"}
      size="sm"
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
      className="transition-all active:scale-95"
    >
      <Heart className={`me-1.5 h-3.5 w-3.5 transition-all ${isWishlisted ? "fill-destructive text-destructive" : ""}`} />
      {isWishlisted ? (isAr ? "في المفضلة" : "Saved") : (isAr ? "إضافة للمفضلة" : "Save")}
    </Button>
  );
}
