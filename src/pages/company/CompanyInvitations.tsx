import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CompanyInvitations() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["companyInvitations", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_invitations")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const getStatusColor = (status: string | null): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      pending: "secondary",
      accepted: "default",
      declined: "destructive",
    };
    return colors[status || "pending"] || "secondary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "الدعوات" : "Invitations"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "دعوات المشاركة والتعاون" : "Participation and collaboration invitations"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "ar" ? "قائمة الدعوات" : "Invitations List"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : invitations && invitations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                    <TableHead>{language === "ar" ? "الوصف" : "Description"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.title}</TableCell>
                      <TableCell>{invitation.invitation_type}</TableCell>
                      <TableCell className="max-w-xs truncate">{invitation.description}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invitation.status)}>
                          {invitation.status || "pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد دعوات" : "No invitations found"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
