import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { isPast, differenceInDays } from "date-fns";
import { getItemDisplayName } from "./orderCenterUtils";

/**
 * Hook that shows toast warnings for overdue/upcoming deadlines
 * when the Order Center first loads or when new deadlines are detected.
 */
export function useDeadlineAlerts(competitionId: string) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const shownRef = useRef(false);

  const { data: lists } = useQuery({
    queryKey: ["deadline-alert-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: items } = useQuery({
    queryKey: ["deadline-alert-items", competitionId],
    queryFn: async () => {
      if (!lists?.length) return [];
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("id, status, deadline, custom_name, custom_name_ar, item_id, requirement_items(name, name_ar)")
        .in("list_id", lists.map(l => l.id))
        .not("deadline", "is", null)
        .neq("status", "delivered");
      if (error) throw error;
      return data;
    },
    enabled: !!lists?.length,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!items?.length || shownRef.current) return;
    shownRef.current = true;

    const overdue = items.filter(i => i.deadline && isPast(new Date(i.deadline)));
    const dueSoon = items.filter(i => {
      if (!i.deadline || isPast(new Date(i.deadline))) return false;
      return differenceInDays(new Date(i.deadline), new Date()) <= 2;
    });

    if (overdue.length > 0) {
      toast({
        title: isAr ? `⚠️ ${overdue.length} عناصر متأخرة` : `⚠️ ${overdue.length} Overdue Items`,
        description: isAr
          ? "بعض العناصر تجاوزت الموعد النهائي وتحتاج اهتمام فوري"
          : "Some items have passed their deadline and need immediate attention",
        variant: "destructive",
      });
    } else if (dueSoon.length > 0) {
      const firstName = getItemDisplayName(dueSoon[0], isAr);
      toast({
        title: isAr ? `⏰ ${dueSoon.length} عناصر تستحق قريباً` : `⏰ ${dueSoon.length} Items Due Soon`,
        description: isAr
          ? `"${firstName}" ${dueSoon.length > 1 ? `و ${dueSoon.length - 1} آخرين` : ""} تستحق خلال يومين`
          : `"${firstName}"${dueSoon.length > 1 ? ` and ${dueSoon.length - 1} more` : ""} due within 2 days`,
      });
    }
  }, [items, isAr, toast]);

  return {
    overdueCount: items?.filter(i => i.deadline && isPast(new Date(i.deadline))).length || 0,
    dueSoonCount: items?.filter(i => {
      if (!i.deadline || isPast(new Date(i.deadline))) return false;
      return differenceInDays(new Date(i.deadline), new Date()) <= 2;
    }).length || 0,
  };
}
