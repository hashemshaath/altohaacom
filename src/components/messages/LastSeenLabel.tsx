import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface LastSeenLabelProps {
  userId: string;
  isOnline: boolean;
  isTyping: boolean;
  isAr: boolean;
  username?: string | null;
}

export function LastSeenLabel({ userId, isOnline, isTyping, isAr, username }: LastSeenLabelProps) {
  const { data: lastSeen } = useQuery({
    queryKey: ["lastSeen", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("last_login_at")
        .eq("user_id", userId)
        .single();
      return data?.last_login_at || null;
    },
    enabled: !isOnline && !isTyping,
    staleTime: 1000 * 60 * 5,
  });

  if (isTyping) return <span className="text-primary">{isAr ? "يكتب..." : "typing..."}</span>;
  if (isOnline) return <span className="text-chart-2">{isAr ? "متصل الآن" : "online"}</span>;

  if (lastSeen) {
    const ago = formatDistanceToNow(new Date(lastSeen), {
      addSuffix: true,
      locale: isAr ? ar : enUS,
    });
    return <span>{isAr ? `آخر ظهور ${ago}` : `last seen ${ago}`}</span>;
  }

  return <span>{username ? `@${username}` : ""}</span>;
}
