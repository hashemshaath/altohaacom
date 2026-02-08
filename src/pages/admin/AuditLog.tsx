import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface AdminAction {
  id: string;
  admin_id: string;
  target_user_id: string | null;
  action_type: string;
  details: Record<string, any> | null;
  created_at: string;
}

export default function AuditLog() {
  const { t } = useLanguage();

  const { data: actions, isLoading } = useQuery({
    queryKey: ["auditLog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AdminAction[];
    },
  });

  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      suspend_user: "bg-red-100 text-red-800",
      activate_user: "bg-green-100 text-green-800",
      change_membership: "bg-blue-100 text-blue-800",
      resolve_report: "bg-purple-100 text-purple-800",
      assign_role: "bg-orange-100 text-orange-800",
    };
    return (
      <Badge className={colors[actionType] || "bg-gray-100 text-gray-800"} variant="outline">
        {actionType.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">{t("auditLog")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : actions?.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t("noResults")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions?.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>{getActionBadge(action.action_type)}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {action.details ? JSON.stringify(action.details) : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(action.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
