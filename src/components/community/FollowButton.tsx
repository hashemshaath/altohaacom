import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsFollowing, useToggleFollow } from "@/hooks/useFollow";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserRoundPlus, UserRoundCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  userId: string;
  userName?: string;
  fullWidth?: boolean;
  className?: string;
}

export function FollowButton({ userId, userName, fullWidth = false, className = "" }: FollowButtonProps) {
  const { data: isFollowing } = useIsFollowing(userId);
  const toggleFollow = useToggleFollow(userId);
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);

  const handleClick = () => {
    if (isFollowing) {
      setShowUnfollowDialog(true);
      return;
    }
    toggleFollow.mutate(false, {
      onSuccess: (result: any) => {
        if (result?.type === "request_sent") {
          toast({ title: isAr ? "تم إرسال طلب المتابعة" : "Follow request sent" });
        }
      },
    });
  };

  const confirmUnfollow = () => {
    toggleFollow.mutate(true, {
      onSuccess: () => {
        setShowUnfollowDialog(false);
        toast({ title: isAr ? "تم إلغاء المتابعة" : "Unfollowed successfully" });
      },
    });
  };

  return (
    <>
      <Button
        variant={isFollowing ? "outline" : "default"}
        size="sm"
        className={`gap-1.5 text-xs h-8 rounded-xl font-semibold transition-all duration-200 ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={toggleFollow.isPending}
        onClick={handleClick}
      >
        {toggleFollow.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isFollowing ? (
          <UserRoundCheck className="h-3.5 w-3.5" />
        ) : (
          <UserRoundPlus className="h-3.5 w-3.5" />
        )}
        {isFollowing ? (isAr ? "متابَع" : "Following") : (isAr ? "متابعة" : "Follow")}
      </Button>

      <AlertDialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? "إلغاء المتابعة" : "Unfollow"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد أنك تريد إلغاء متابعة ${userName || "هذا المستخدم"}؟`
                : `Are you sure you want to unfollow ${userName || "this user"}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnfollow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isAr ? "إلغاء المتابعة" : "Unfollow"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
