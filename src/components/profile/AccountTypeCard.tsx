import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccountType } from "@/hooks/useAccountType";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Heart, ArrowUpCircle, Loader2 } from "lucide-react";

export function AccountTypeCard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { accountType, isFan } = useAccountType();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!user?.id) return;
    setUpgrading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ account_type: "professional" })
      .eq("user_id", user.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      // Also add chef role if not present
      await supabase.from("user_roles").upsert(
        { user_id: user.id, role: "chef" as any },
        { onConflict: "user_id,role" }
      );
      queryClient.invalidateQueries({ queryKey: ["accountType"] });
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
      toast({ title: isAr ? "تم ترقية حسابك! 🎉" : "Account upgraded! 🎉" });
    }
    setUpgrading(false);
  };

  return (
    <Card className="border-border/50">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isFan ? "bg-secondary" : "bg-primary/10"}`}>
              {isFan ? <Heart className="h-5 w-5 text-secondary-foreground" /> : <ChefHat className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">
                  {isAr ? "نوع الحساب" : "Account Type"}
                </p>
                <Badge variant={isFan ? "secondary" : "default"}>
                  {isFan ? (isAr ? "متابع" : "Follower") : (isAr ? "محترف" : "Professional")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isFan
                  ? (isAr ? "تابع الطهاة والمسابقات والمعارض" : "Follow chefs, competitions & exhibitions")
                  : (isAr ? "ملف شخصي مهني كامل مع جميع الأدوات" : "Full professional profile with all tools")}
              </p>
            </div>
          </div>
          {isFan && (
            <Button size="sm" onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <ArrowUpCircle className="me-1.5 h-3.5 w-3.5" />}
              {isAr ? "ترقية إلى محترف" : "Upgrade to Pro"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
