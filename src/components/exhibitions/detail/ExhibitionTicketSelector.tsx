import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Check, Crown, Users, Sparkles } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
  onSelect?: (typeId: string, typeName: string) => void;
  selectedTypeId?: string | null;
}

export function ExhibitionTicketSelector({ exhibitionId, isAr, onSelect, selectedTypeId }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;

  const { data: types = [] } = useQuery({
    queryKey: ["ticket-types-public", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_ticket_types")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (types.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{t("Choose Ticket Type", "اختر نوع التذكرة")}</h4>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {types.map((tt: any) => {
          const isSelected = selectedTypeId === tt.id;
          const isSoldOut = tt.max_quantity && tt.sold_count >= tt.max_quantity;
          const remaining = tt.max_quantity ? tt.max_quantity - tt.sold_count : null;
          const isFree = tt.price === 0 || tt.price === null;
          const isPremium = tt.name.toLowerCase().includes("vip") || tt.name.toLowerCase().includes("premium");

          return (
            <Card
              key={tt.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-primary border-primary/50" :
                isSoldOut ? "opacity-50 cursor-not-allowed" :
                isPremium ? "border-chart-4/40 bg-gradient-to-br from-chart-4/[0.04] to-transparent" :
                "border-border/60"
              }`}
              onClick={() => !isSoldOut && onSelect?.(tt.id, tt.name)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {isPremium && <Crown className="h-3.5 w-3.5 text-chart-4" />}
                      <p className="text-sm font-bold">{isAr && tt.name_ar ? tt.name_ar : tt.name}</p>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    {(tt.description || tt.description_ar) && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                        {isAr && tt.description_ar ? tt.description_ar : tt.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold" style={{ color: tt.color || undefined }}>
                        {isFree ? t("Free", "مجاني") : `${tt.price} ${tt.currency}`}
                      </span>
                    </div>
                  </div>
                  {tt.color && (
                    <div className="h-2 w-2 rounded-full shrink-0 mt-1" style={{ background: tt.color }} />
                  )}
                </div>
                {/* Status badges */}
                <div className="flex items-center gap-2 mt-2">
                  {isSoldOut ? (
                    <Badge variant="destructive" className="text-[9px]">{t("Sold Out", "نفذت")}</Badge>
                  ) : remaining !== null ? (
                    <Badge variant="outline" className="text-[9px]">
                      <Users className="me-0.5 h-2.5 w-2.5" />{remaining} {t("left", "متبقي")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] border-chart-3/30 text-chart-3">
                      <Sparkles className="me-0.5 h-2.5 w-2.5" />{t("Available", "متاح")}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
