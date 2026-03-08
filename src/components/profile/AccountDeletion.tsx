import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AccountDeletion() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user || confirmation !== "DELETE") return;
    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "delete_own_account", confirmation: "DELETE" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: isAr ? "تم حذف حسابك" : "Your account has been deleted" });

      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err: any) {
      toast({
        title: isAr ? "فشل الحذف" : "Deletion failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {isAr ? "حذف الحساب" : "Delete Account"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "سيؤدي حذف حسابك إلى إزالة جميع بياناتك بشكل دائم. لا يمكن التراجع عن هذا الإجراء."
            : "Deleting your account will permanently remove all your data. This action cannot be undone."}
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5 text-xs">
              <Trash2 className="h-3.5 w-3.5" />
              {isAr ? "حذف حسابي" : "Delete My Account"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {isAr ? "تأكيد حذف الحساب" : "Confirm Account Deletion"}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  {isAr
                    ? "هذا الإجراء لا يمكن التراجع عنه. سيتم حذف ملفك الشخصي وجميع بياناتك بشكل نهائي."
                    : "This action is irreversible. Your profile and all associated data will be permanently deleted."}
                </p>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">
                    {isAr ? 'اكتب "DELETE" للتأكيد:' : 'Type "DELETE" to confirm:'}
                  </p>
                  <Input
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="DELETE"
                    dir="ltr"
                    className="font-mono"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmation("")}>
                {isAr ? "إلغاء" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={confirmation !== "DELETE" || deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                ) : (
                  <Trash2 className="h-4 w-4 me-1.5" />
                )}
                {isAr ? "حذف نهائي" : "Permanently Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
