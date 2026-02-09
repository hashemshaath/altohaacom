import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CompanyDrivers() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["companyDrivers", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_drivers")
        .select("*")
        .eq("company_id", companyId)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "السائقون" : "Drivers"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "قائمة السائقين للتوصيل والشحن" : "List of drivers for delivery"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "ar" ? "السائقون المتاحون" : "Available Drivers"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : drivers && drivers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{language === "ar" ? "الهاتف" : "Phone"}</TableHead>
                    <TableHead>{language === "ar" ? "نوع المركبة" : "Vehicle"}</TableHead>
                    <TableHead>{language === "ar" ? "لوحة المركبة" : "Plate"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>
                        <a href={`tel:${driver.phone}`} className="text-primary hover:underline">
                          {driver.phone}
                        </a>
                      </TableCell>
                      <TableCell>{driver.vehicle_type}</TableCell>
                      <TableCell>{driver.vehicle_plate}</TableCell>
                      <TableCell>
                        {driver.is_available ? (
                          <Badge variant="default">
                            {language === "ar" ? "متاح" : "Available"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {language === "ar" ? "غير متاح" : "Unavailable"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد سائقين" : "No drivers found"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
