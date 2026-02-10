import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  User,
} from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {language === "ar" ? "الفروع" : "Branches"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === "ar" ? "فروع الشركة ومقرها الرئيسي" : "Company branches and headquarters"}
          </p>
        </div>
        {!isLoading && branches && (
          <Badge variant="secondary" className="text-sm">
            {branches.length} {language === "ar" ? "فرع" : "branches"}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : branches && branches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {branches.map((branch, index) => (
            <Card
              key={branch.id}
              className={`animate-fade-in overflow-hidden hover:shadow-md transition-shadow ${
                branch.is_headquarters ? "border-s-[3px] border-s-primary" : ""
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      branch.is_headquarters ? "bg-primary/10" : "bg-muted"
                    }`}>
                      {branch.is_headquarters ? (
                        <Star className="h-5 w-5 text-primary" />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{branch.name}</CardTitle>
                      {branch.name_ar && language !== "ar" && (
                        <p className="text-xs text-muted-foreground">{branch.name_ar}</p>
                      )}
                    </div>
                  </div>
                  {branch.is_headquarters && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
                      {language === "ar" ? "مقر رئيسي" : "HQ"}
                    </Badge>
                  )}
                  <Badge variant={branch.is_active !== false ? "secondary" : "outline"} className="shrink-0">
                    {branch.is_active !== false
                      ? (language === "ar" ? "نشط" : "Active")
                      : (language === "ar" ? "غير نشط" : "Inactive")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Separator />
                {(branch.address || branch.city || branch.country) && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{[branch.address, branch.city, branch.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {branch.phone && (
                  <a href={`tel:${branch.phone}`} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{branch.phone}</span>
                  </a>
                )}
                {branch.email && (
                  <a href={`mailto:${branch.email}`} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{branch.email}</span>
                  </a>
                )}
                {branch.manager_name && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{branch.manager_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {language === "ar" ? "لا توجد فروع" : "No branches found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
