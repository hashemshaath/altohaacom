import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useCanAccessPage } from "@/hooks/useCompanyPermissions";
import { ShieldX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CompanyPageGuardProps {
  page: string;
  children: React.ReactNode;
}

export const CompanyPageGuard = memo(function CompanyPageGuard({ page, children }: CompanyPageGuardProps) {
  const isAr = useIsAr();
  const canAccess = useCanAccessPage(page);
  const navigate = useNavigate();

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">
              {isAr ? "لا تملك صلاحية الوصول" : "Access Restricted"}
            </h2>
            <p className="text-muted-foreground">
              {isAr
                ? "ليس لديك الصلاحية الكافية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير الشركة."
                : "You don't have permission to access this page. Please contact your company administrator."}
            </p>
            <Button variant="outline" onClick={() => navigate("/company")}>
              {isAr ? "العودة للوحة التحكم" : "Back to Dashboard"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
});
