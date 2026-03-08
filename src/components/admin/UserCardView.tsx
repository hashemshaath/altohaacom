import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { Eye, Shield, Crown, Mail, MapPin } from "lucide-react";

interface UserCardProps {
  user: {
    user_id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    account_status: string | null;
    account_type: string;
    membership_tier: string | null;
    is_verified: boolean | null;
    email: string | null;
    country_code: string | null;
    city: string | null;
    roles?: { role: string }[];
    created_at: string;
  };
  onView: (userId: string) => void;
}

export const UserCard = memo(function UserCard({ user, onView }: UserCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const statusColor = user.account_status === "active"
    ? "bg-chart-2/15 text-chart-2 border-chart-2/20"
    : user.account_status === "suspended"
    ? "bg-destructive/15 text-destructive border-destructive/20"
    : "bg-muted text-muted-foreground border-border/30";

  return (
    <Card className="group relative overflow-hidden border-border/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-primary/20 rounded-2xl">
      {/* Accent top bar */}
      <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${
        user.account_status === "active" ? "bg-chart-2" : 
        user.account_status === "suspended" ? "bg-destructive" : "bg-muted-foreground/30"
      }`} />
      <CardContent className="p-4 pt-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-border/50 rounded-xl transition-transform duration-300 group-hover:scale-105">
            <AvatarImage src={user.avatar_url || ""} />
            <AvatarFallback className="text-sm font-semibold rounded-xl">
              {(user.full_name || user.username || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate">{user.full_name || user.username || "—"}</span>
              {user.is_verified && <Shield className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
            {user.username && (
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            )}
            {user.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3" /> <span className="truncate">{user.email}</span>
              </p>
            )}
            {(user.city || user.country_code) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {user.city}{user.city && user.country_code ? ", " : ""}{user.country_code}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="outline" className={statusColor + " text-[10px] px-2 py-0.5 rounded-xl"}>
            {user.account_status || "active"}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-xl">
            {user.account_type === "professional" ? (isAr ? "محترف" : "Pro") : (isAr ? "متابع" : "Fan")}
          </Badge>
          {user.membership_tier && user.membership_tier !== "basic" && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-xl border-chart-4/50 text-chart-4">
              <Crown className="h-2.5 w-2.5 me-0.5" /> {user.membership_tier}
            </Badge>
          )}
          {user.roles?.slice(0, 2).map(r => (
            <Badge key={r.role} variant="outline" className="text-[10px] px-2 py-0.5 rounded-xl">{r.role}</Badge>
          ))}
          {(user.roles?.length || 0) > 2 && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-xl">+{(user.roles?.length || 0) - 2}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
          <span className="text-[10px] text-muted-foreground">
            {new Date(user.created_at).toLocaleDateString()}
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => onView(user.user_id)}>
            <Eye className="h-3 w-3" /> {isAr ? "عرض" : "View"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface UserCardViewProps {
  users: UserCardProps["user"][];
  onViewUser: (userId: string) => void;
}

export function UserCardView({ users, onViewUser }: UserCardViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {users.map(user => (
        <UserCard key={user.user_id} user={user} onView={onViewUser} />
      ))}
    </div>
  );
}
