import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Trophy,
  Users,
  Calendar,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

interface Competition {
  id: string;
  title: string;
  title_ar: string | null;
  status: CompetitionStatus;
  competition_start: string;
  competition_end: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  is_virtual: boolean | null;
  max_participants: number | null;
  organizer_id: string;
  created_at: string;
}

const ALL_STATUSES: CompetitionStatus[] = [
  "draft", "upcoming", "registration_open", "registration_closed", 
  "in_progress", "judging", "completed", "cancelled"
];

export default function CompetitionsAdmin() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch competitions
  const { data: competitions, isLoading } = useQuery({
    queryKey: ["adminCompetitions", searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("competitions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,title_ar.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as CompetitionStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Competition[];
    },
  });

  // Fetch participant counts
  const { data: participantCounts } = useQuery({
    queryKey: ["competitionParticipantCounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_registrations")
        .select("competition_id, status");

      const counts: Record<string, { approved: number; pending: number }> = {};
      data?.forEach(reg => {
        if (!counts[reg.competition_id]) {
          counts[reg.competition_id] = { approved: 0, pending: 0 };
        }
        if (reg.status === "approved") {
          counts[reg.competition_id].approved++;
        } else if (reg.status === "pending") {
          counts[reg.competition_id].pending++;
        }
      });
      return counts;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompetitionStatus }) => {
      const { error } = await supabase
        .from("competitions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        action_type: "update_competition_status",
        details: { competition_id: id, new_status: status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
      toast({ title: language === "ar" ? "تم تحديث الحالة" : "Status updated" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Delete competition mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("competitions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        action_type: "delete_competition",
        details: { competition_id: id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCompetitions"] });
      toast({ title: language === "ar" ? "تم حذف المسابقة" : "Competition deleted" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const getStatusBadge = (status: CompetitionStatus) => {
    const colors: Record<CompetitionStatus, string> = {
      draft: "bg-muted text-muted-foreground",
      upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      registration_open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      registration_closed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      judging: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <Badge className={colors[status]} variant="outline">
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">
          {language === "ar" ? "إدارة المسابقات" : "Competition Management"}
        </h1>
        <Badge variant="outline">
          {competitions?.length || 0} {language === "ar" ? "مسابقة" : "competitions"}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "بحث بالعنوان أو المدينة..." : "Search by title or city..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "ar" ? "جميع الحالات" : "All Statuses"}</SelectItem>
              {ALL_STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Competitions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {language === "ar" ? "المسابقات" : "Competitions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : competitions?.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {language === "ar" ? "لا توجد مسابقات" : "No competitions found"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "المسابقة" : "Competition"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{language === "ar" ? "الموقع" : "Location"}</TableHead>
                  <TableHead>{language === "ar" ? "المشاركين" : "Participants"}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions?.map((comp) => {
                  const counts = participantCounts?.[comp.id] || { approved: 0, pending: 0 };
                  return (
                    <TableRow key={comp.id}>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">
                            {language === "ar" && comp.title_ar ? comp.title_ar : comp.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {comp.is_virtual ? (language === "ar" ? "افتراضية" : "Virtual") : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(comp.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(comp.competition_start), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {comp.is_virtual ? (
                          <Badge variant="outline">{language === "ar" ? "عبر الإنترنت" : "Online"}</Badge>
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {comp.city}, {comp.country}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="text-sm">
                            {counts.approved}
                            {counts.pending > 0 && (
                              <span className="text-muted-foreground"> (+{counts.pending})</span>
                            )}
                            {comp.max_participants && `/${comp.max_participants}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/competitions/${comp.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {language === "ar" ? "عرض" : "View"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/competitions/${comp.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {language === "ar" ? "تعديل" : "Edit"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => updateStatusMutation.mutate({ id: comp.id, status: "cancelled" })}
                              className="text-orange-600"
                              disabled={comp.status === "cancelled"}
                            >
                              {language === "ar" ? "إلغاء المسابقة" : "Cancel Competition"}
                            </DropdownMenuItem>
                            {comp.status === "draft" && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (confirm(language === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
                                    deleteMutation.mutate(comp.id);
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {language === "ar" ? "حذف" : "Delete"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
