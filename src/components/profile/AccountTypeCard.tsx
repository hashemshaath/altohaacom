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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChefHat, Heart, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";

export function AccountTypeCard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { accountType, isFan, isProfessional } = useAccountType();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ account_type: "professional" })
      .eq("user_id", user.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      await supabase.from("user_roles").upsert(
        { user_id: user.id, role: "chef" as any },
        { onConflict: "user_id,role" }
      );
      queryClient.invalidateQueries({ queryKey: ["accountType"] });
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
      toast({ title: isAr ? "تم ترقية حسابك! 🎉" : "Account upgraded! 🎉" });
    }
    setLoading(false);
  };

  const handleDowngrade = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ account_type: "fan" })
      .eq("user_id", user.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      queryClient.invalidateQueries({ queryKey: ["accountType"] });
      toast({ title: isAr ? "تم تحويل حسابك إلى متابع" : "Switched to Follower account" });
    }
    setLoading(false);
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
          <div className="flex gap-2">
            {isFan && (
              <Button size="sm" onClick={handleUpgrade} disabled={loading}>
                {loading ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <ArrowUpCircle className="me-1.5 h-3.5 w-3.5" />}
                {isAr ? "ترقية إلى محترف" : "Upgrade to Pro"}
              </Button>
            )}
            {isProfessional && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={loading}>
                    {loading ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <ArrowDownCircle className="me-1.5 h-3.5 w-3.5" />}
                    {isAr ? "تحويل لمتابع" : "Switch to Follower"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isAr ? "تحويل إلى حساب متابع؟" : "Switch to Follower account?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isAr
                        ? "ستفقد الوصول إلى الأدوات المهنية مثل إنشاء المسابقات والمعارض. يمكنك الترقية مجدداً في أي وقت."
                        : "You'll lose access to professional tools like creating competitions and exhibitions. You can upgrade again anytime."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDowngrade}>
                      {isAr ? "تأكيد التحويل" : "Confirm Switch"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
