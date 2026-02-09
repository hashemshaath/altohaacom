import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function CompanyMedia() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: media, isLoading } = useQuery({
    queryKey: ["companyMedia", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_media")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "مكتبة الوسائط" : "Media Library"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "ar" ? "الصور والملفات المرفوعة" : "Uploaded images and files"}
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : media && media.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                {item.file_type?.startsWith("image") ? (
                  <img
                    src={item.file_url}
                    alt={item.title || "Media"}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">{item.file_type}</p>
                  </div>
                )}
              </CardContent>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm">{item.title || item.filename}</CardTitle>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد ملفات" : "No files found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
