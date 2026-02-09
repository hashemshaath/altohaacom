import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function CompanyBranches() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: branches, isLoading } = useQuery({
    queryKey: ["companyBranches", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_branches")
        .select("*")
        .eq("company_id", companyId)
        .order("is_headquarters", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "الفروع" : "Branches"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "فروع الشركة ومقرها الرئيسي" : "Company branches and headquarters"}
        </p>
      </div>

      <div>
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : branches && branches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {branches.map((branch) => (
              <Card key={branch.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{branch.name}</CardTitle>
                    {branch.is_headquarters && (
                      <Badge>{language === "ar" ? "مقر رئيسي" : "Headquarters"}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {branch.address && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? "العنوان" : "Address"}
                      </p>
                      <p>{branch.address}</p>
                    </div>
                  )}
                  {(branch.city || branch.country) && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? "الموقع" : "Location"}
                      </p>
                      <p>{[branch.city, branch.country].filter(Boolean).join(", ")}</p>
                    </div>
                  )}
                  {branch.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? "الهاتف" : "Phone"}
                      </p>
                      <a href={`tel:${branch.phone}`} className="text-primary hover:underline">
                        {branch.phone}
                      </a>
                    </div>
                  )}
                  {branch.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? "البريد الإلكتروني" : "Email"}
                      </p>
                      <a href={`mailto:${branch.email}`} className="text-primary hover:underline">
                        {branch.email}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "لا توجد فروع" : "No branches found"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
