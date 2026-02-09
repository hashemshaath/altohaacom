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
import { Mail, Phone, Building } from "lucide-react";

export default function CompanyTeam() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["companyContacts", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_contacts")
        .select("*")
        .eq("company_id", companyId)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "فريق العمل" : "Team Members"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "إدارة جهات الاتصال والممثلين" : "Manage contacts and representatives"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "ar" ? "جهات الاتصال" : "Contacts"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : contacts && contacts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{language === "ar" ? "المنصب" : "Title"}</TableHead>
                    <TableHead>{language === "ar" ? "القسم" : "Department"}</TableHead>
                    <TableHead>{language === "ar" ? "البريد الإلكتروني" : "Email"}</TableHead>
                    <TableHead>{language === "ar" ? "الهاتف" : "Phone"}</TableHead>
                    <TableHead>{language === "ar" ? "دور" : "Role"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {contact.is_primary && (
                            <Badge variant="outline" className="text-xs">
                              {language === "ar" ? "رئيسي" : "Primary"}
                            </Badge>
                          )}
                          {contact.name}
                        </div>
                      </TableCell>
                      <TableCell>{contact.title}</TableCell>
                      <TableCell>{contact.department}</TableCell>
                      <TableCell>
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                            {contact.email}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                            {contact.phone}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{contact.title}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد جهات اتصال" : "No contacts found"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
