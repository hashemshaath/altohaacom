import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Trophy,
  ChefHat,
  Star,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface ParticipantsListProps {
  competitionId: string;
}

interface CategoryData {
  id: string;
  name: string;
  name_ar: string | null;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; className: string; label: string; labelAr: string }> = {
  approved: { icon: CheckCircle2, className: "bg-primary/15 text-primary", label: "Approved", labelAr: "مقبول" },
  pending: { icon: Clock, className: "bg-chart-4/15 text-chart-4", label: "Pending", labelAr: "معلق" },
  rejected: { icon: XCircle, className: "bg-destructive/15 text-destructive", label: "Rejected", labelAr: "مرفوض" },
  withdrawn: { icon: XCircle, className: "bg-muted text-muted-foreground", label: "Withdrawn", labelAr: "منسحب" },
};

export function ParticipantsList({ competitionId }: ParticipantsListProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: categories } = useQuery({
    queryKey: ["participant-categories", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_categories")
        .select("id, name, name_ar")
        .eq("competition_id", competitionId)
        .order("sort_order");
      if (error) throw error;
      return data as CategoryData[];
    },
    enabled: !!competitionId,
  });

  const { data: participants, isLoading } = useQuery({
    queryKey: ["competition-all-participants", competitionId],
    queryFn: async () => {
      const { data: registrations, error } = await supabase
        .from("competition_registrations")
        .select("id, participant_id, status, dish_name, dish_image_url, dish_description, category_id, registered_at, registration_number")
        .eq("competition_id", competitionId)
        .order("registered_at", { ascending: true });

      if (error) throw error;
      if (!registrations || registrations.length === 0) return [];

      const userIds = registrations.map((r) => r.participant_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url, specialization, is_verified")
        .in("user_id", userIds);

      // Fetch scores for approved participants
      const approvedRegIds = registrations.filter((r) => r.status === "approved").map((r) => r.id);
      let scoresMap = new Map<string, { total: number; count: number }>();
      if (approvedRegIds.length > 0) {
        const { data: scores } = await supabase
          .from("competition_scores")
          .select("registration_id, score")
          .in("registration_id", approvedRegIds);
        
        scores?.forEach((s) => {
          const existing = scoresMap.get(s.registration_id) || { total: 0, count: 0 };
          existing.total += Number(s.score);
          existing.count += 1;
          scoresMap.set(s.registration_id, existing);
        });
      }

      const categoryIds = registrations.map((r) => r.category_id).filter(Boolean) as string[];
      const { data: cats } = categoryIds.length > 0
        ? await supabase.from("competition_categories").select("id, name, name_ar").in("id", categoryIds)
        : { data: [] as CategoryData[] };

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const categoryMap = new Map<string, CategoryData>((cats || []).map((c) => [c.id, c]));

      return registrations.map((reg) => ({
        ...reg,
        profile: profileMap.get(reg.participant_id),
        category: reg.category_id ? categoryMap.get(reg.category_id) : null,
        scores: scoresMap.get(reg.id) || null,
      }));
    },
    enabled: !!competitionId,
  });

  const filtered = participants?.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.profile?.full_name || "").toLowerCase();
      const dish = (p.dish_name || "").toLowerCase();
      if (!name.includes(q) && !dish.includes(q)) return false;
    }
    return true;
  });

  const statusCounts = participants?.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0 } as Record<string, number>
  ) || { total: 0 };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h3 className="flex items-center gap-2 font-semibold text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "المشاركين" : "Participants"}
            <Badge variant="secondary" className="ms-1">{statusCounts.total || 0}</Badge>
          </h3>
        </div>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { key: "all", label: isAr ? "الكل" : "All", count: statusCounts.total },
              { key: "approved", label: isAr ? "مقبول" : "Approved", count: statusCounts.approved || 0 },
              { key: "pending", label: isAr ? "معلق" : "Pending", count: statusCounts.pending || 0 },
              { key: "rejected", label: isAr ? "مرفوض" : "Rejected", count: statusCounts.rejected || 0 },
            ].map((f) => (
              <Button
                key={f.key}
                variant={statusFilter === f.key ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
                <Badge variant="secondary" className="text-[10px] h-4 px-1">{f.count}</Badge>
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالاسم أو الطبق..." : "Search by name or dish..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-9 text-xs"
              />
            </div>
            {categories && categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <Filter className="h-3 w-3 me-1" />
                  <SelectValue placeholder={isAr ? "الفئة" : "Category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {isAr && cat.name_ar ? cat.name_ar : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants Grid */}
      {filtered && filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((participant) => {
            const status = STATUS_CONFIG[participant.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;

            return (
              <Card key={participant.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                <CardContent className="p-0">
                  <div className="flex gap-3 p-3">
                    {/* Dish Image or Avatar */}
                    <div className="relative shrink-0">
                      {participant.dish_image_url ? (
                        <img
                          src={participant.dish_image_url}
                          alt={participant.dish_name || "Dish"}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                          <ChefHat className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                      {/* Score overlay */}
                      {participant.scores && participant.scores.count > 0 && (
                        <div className="absolute -top-1 -end-1 flex h-5 items-center gap-0.5 rounded-full bg-primary px-1.5">
                          <Star className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" />
                          <span className="text-[9px] font-bold text-primary-foreground">
                            {(participant.scores.total / participant.scores.count).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          to={`/${participant.profile?.username || participant.participant_id}`}
                          className="hover:underline"
                        >
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={participant.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-[8px]">
                                {(participant.profile?.full_name || "U")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate">
                              {participant.profile?.full_name || "Unknown"}
                            </span>
                            {participant.profile?.is_verified && (
                              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                            )}
                          </div>
                        </Link>
                        <Badge className={`${status.className} text-[9px] h-5 shrink-0`}>
                          <StatusIcon className="h-2.5 w-2.5 me-0.5" />
                          {isAr ? status.labelAr : status.label}
                        </Badge>
                      </div>

                      {participant.dish_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          <ChefHat className="inline h-3 w-3 me-0.5" />
                          {participant.dish_name}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {participant.category && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {isAr && participant.category.name_ar
                              ? participant.category.name_ar
                              : participant.category.name}
                          </Badge>
                        )}
                        {participant.profile?.specialization && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                            {participant.profile.specialization}
                          </span>
                        )}
                        {participant.registration_number && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            #{participant.registration_number}
                          </span>
                        )}
                      </div>

                      {/* Score details */}
                      {participant.scores && participant.scores.count > 0 && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Trophy className="h-2.5 w-2.5" />
                          <span>
                            {isAr ? `${participant.scores.count} تقييم` : `${participant.scores.count} scores`}
                            {" · "}
                            {isAr ? "المعدل" : "Avg"}: {(participant.scores.total / participant.scores.count).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registration date footer */}
                  <div className="border-t bg-muted/20 px-3 py-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {isAr ? "تاريخ التسجيل:" : "Registered:"}{" "}
                      {format(new Date(participant.registered_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/50">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? (isAr ? "لا توجد نتائج مطابقة" : "No matching participants found")
              : (isAr ? "لا يوجد مشاركين حتى الآن" : "No participants yet")}
          </p>
        </div>
      )}
    </div>
  );
}
