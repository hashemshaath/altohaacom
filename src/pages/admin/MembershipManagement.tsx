import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, Star, Search, CreditCard, TrendingUp, Users, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type MembershipTier = Database["public"]["Enums"]["membership_tier"];

interface MemberProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  membership_tier: MembershipTier | null;
  membership_expires_at: string | null;
  created_at: string;
}

export default function MembershipManagement() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [upgradeUser, setUpgradeUser] = useState<MemberProfile | null>(null);
  const [newTier, setNewTier] = useState<MembershipTier>("professional");

  // Fetch membership stats
  const { data: stats } = useQuery({
    queryKey: ["membershipStats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier");

      const total = data?.length || 0;
      const basic = data?.filter(p => p.membership_tier === "basic" || !p.membership_tier).length || 0;
      const professional = data?.filter(p => p.membership_tier === "professional").length || 0;
      const enterprise = data?.filter(p => p.membership_tier === "enterprise").length || 0;

      return { total, basic, professional, enterprise };
    },
  });

  // Fetch members
  const { data: members, isLoading } = useQuery({
    queryKey: ["adminMembers", searchQuery, tierFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, username, avatar_url, membership_tier, membership_expires_at, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
      }

      if (tierFilter !== "all") {
        query = query.eq("membership_tier", tierFilter as MembershipTier);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MemberProfile[];
    },
  });

  // Upgrade membership mutation
  const upgradeMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: MembershipTier }) => {
      // Get current tier for history
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("membership_tier")
        .eq("user_id", userId)
        .single();

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          membership_tier: tier,
          membership_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        })
        .eq("user_id", userId);

      if (error) throw error;

      // Record in history
      await supabase.from("membership_history").insert({
        user_id: userId,
        previous_tier: currentProfile?.membership_tier,
        new_tier: tier,
        changed_by: user!.id,
        reason: "Admin upgrade",
      });

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: "change_membership",
        details: { previous: currentProfile?.membership_tier, new: tier },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMembers"] });
      queryClient.invalidateQueries({ queryKey: ["membershipStats"] });
      toast({ title: language === "ar" ? "تم ترقية العضوية" : "Membership upgraded" });
      setUpgradeUser(null);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const tiers = [
    {
      tier: "basic" as MembershipTier,
      price: language === "ar" ? "مجاني" : "Free",
      color: "border-border",
      features: [
        language === "ar" ? "إنشاء ملف شخصي" : "Create profile",
        language === "ar" ? "الانضمام للمجتمع" : "Join community",
        language === "ar" ? "متابعة الطهاة" : "Follow chefs",
        language === "ar" ? "الانضمام للمجموعات العامة" : "Join public groups",
        language === "ar" ? "عرض المسابقات" : "View competitions",
      ],
    },
    {
      tier: "professional" as MembershipTier,
      price: "SAR 19/" + (language === "ar" ? "شهر" : "month"),
      color: "border-primary",
      featured: true,
      features: [
        language === "ar" ? "جميع مميزات الأساسية" : "All Basic features",
        language === "ar" ? "شارة التوثيق" : "Verified badge",
        language === "ar" ? "دعم ذو أولوية" : "Priority support",
        language === "ar" ? "إنشاء مجموعات خاصة" : "Create private groups",
        language === "ar" ? "تحليلات متقدمة" : "Advanced analytics",
        language === "ar" ? "وصول مبكر للمسابقات" : "Early competition access",
      ],
    },
    {
      tier: "enterprise" as MembershipTier,
      price: "SAR 99/" + (language === "ar" ? "شهر" : "month"),
      color: "border-chart-3",
      features: [
        language === "ar" ? "جميع مميزات الاحترافية" : "All Professional features",
        language === "ar" ? "علامة تجارية مخصصة" : "Custom branding",
        language === "ar" ? "وصول API" : "API access",
        language === "ar" ? "مدير حساب مخصص" : "Dedicated account manager",
        language === "ar" ? "خيارات العلامة البيضاء" : "White-label options",
        language === "ar" ? "أعضاء فريق غير محدودين" : "Unlimited team members",
      ],
    },
  ];

  const getTierBadge = (tier: MembershipTier | null) => {
    const colors: Record<MembershipTier, string> = {
      basic: "bg-muted text-muted-foreground",
      professional: "bg-primary/20 text-primary",
      enterprise: "bg-chart-2/20 text-chart-2",
    };
    return (
      <Badge className={colors[tier || "basic"]}>
        {tier === "professional" ? t("professionalTier") : t(tier || "basic")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">{t("membershipControl")}</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "ar" ? "إجمالي الأعضاء" : "Total Members"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("basic")}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.basic || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("professionalTier")}</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.professional || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("enterprise")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.enterprise || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((item) => (
          <Card key={item.tier} className={`relative ${item.color} ${item.featured ? "ring-2 ring-primary" : ""}`}>
            {item.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">
                  <Star className="mr-1 h-3 w-3" /> {language === "ar" ? "الأكثر شعبية" : "Popular"}
                </Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{t(item.tier as any)}</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground">
                {item.price}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "إدارة الأعضاء" : "Manage Members"}</CardTitle>
          <CardDescription>
            {language === "ar" ? "ترقية أو تخفيض عضويات المستخدمين" : "Upgrade or downgrade user memberships"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={language === "ar" ? "بحث..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "جميع المستويات" : "All Tiers"}</SelectItem>
                <SelectItem value="basic">{t("basic")}</SelectItem>
                <SelectItem value="professional">{t("professionalTier")}</SelectItem>
                <SelectItem value="enterprise">{t("enterprise")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "العضو" : "Member"}</TableHead>
                  <TableHead>{language === "ar" ? "المستوى الحالي" : "Current Tier"}</TableHead>
                  <TableHead>{language === "ar" ? "تاريخ الانتهاء" : "Expires"}</TableHead>
                  <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback>{(member.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">@{member.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTierBadge(member.membership_tier)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.membership_expires_at 
                        ? format(new Date(member.membership_expires_at), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setUpgradeUser(member);
                          setNewTier(member.membership_tier === "enterprise" ? "professional" : "enterprise");
                        }}
                      >
                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                        {language === "ar" ? "تغيير" : "Change"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={!!upgradeUser} onOpenChange={() => setUpgradeUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تغيير العضوية" : "Change Membership"}</DialogTitle>
            <DialogDescription>
              {language === "ar" 
                ? `تغيير مستوى العضوية لـ ${upgradeUser?.full_name}` 
                : `Change membership tier for ${upgradeUser?.full_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{language === "ar" ? "المستوى الحالي" : "Current Tier"}</p>
                <p className="text-sm text-muted-foreground">
                  {t(upgradeUser?.membership_tier || "basic")}
                </p>
              </div>
              <span className="text-2xl">→</span>
              <div>
                <p className="font-medium">{language === "ar" ? "المستوى الجديد" : "New Tier"}</p>
                <Select value={newTier} onValueChange={(v) => setNewTier(v as MembershipTier)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">{t("basic")}</SelectItem>
                    <SelectItem value="professional">{t("professionalTier")}</SelectItem>
                    <SelectItem value="enterprise">{t("enterprise")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeUser(null)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={() => upgradeUser && upgradeMutation.mutate({ userId: upgradeUser.user_id, tier: newTier })}
              disabled={upgradeMutation.isPending}
            >
              {language === "ar" ? "تأكيد التغيير" : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
