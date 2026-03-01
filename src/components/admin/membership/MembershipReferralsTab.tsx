import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Gift, TrendingUp, Search, Link2, ArrowUpDown, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function MembershipReferralsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch referral codes with user info
  const { data: referralCodes, isLoading: codesLoading } = useQuery({
    queryKey: ["admin-referral-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*, profiles:user_id(full_name, username, email, avatar_url)")
        .order("total_conversions", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch conversions
  const { data: conversions, isLoading: conversionsLoading } = useQuery({
    queryKey: ["admin-referral-conversions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_conversions")
        .select("*, referrer:referrer_id(full_name, username, email), referred:referred_user_id(full_name, username, email)")
        .order("converted_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch membership referrals
  const { data: membershipReferrals, isLoading: membershipLoading } = useQuery({
    queryKey: ["admin-membership-referrals", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("membership_referrals")
        .select("*, referrer:referrer_id(full_name, username, email), referred:referred_id(full_name, username, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Stats
  const totalCodes = referralCodes?.length || 0;
  const activeCodes = referralCodes?.filter((c: any) => c.is_active).length || 0;
  const totalConversions = referralCodes?.reduce((sum: number, c: any) => sum + (c.total_conversions || 0), 0) || 0;
  const totalPointsAwarded = referralCodes?.reduce((sum: number, c: any) => sum + (c.total_points_earned || 0), 0) || 0;
  const totalClicks = referralCodes?.reduce((sum: number, c: any) => sum + (c.total_clicks || 0), 0) || 0;
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : "0";

  const filteredCodes = referralCodes?.filter((code: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const profile = code.profiles;
    return (
      code.code?.toLowerCase().includes(term) ||
      code.custom_slug?.toLowerCase().includes(term) ||
      profile?.full_name?.toLowerCase().includes(term) ||
      profile?.username?.toLowerCase().includes(term) ||
      profile?.email?.toLowerCase().includes(term)
    );
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      converted: { variant: "default", icon: CheckCircle2 },
      expired: { variant: "destructive", icon: XCircle },
      cancelled: { variant: "secondary", icon: XCircle },
    };
    const config = map[status] || map.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (d: string) => {
    if (!d) return "-";
    return format(new Date(d), "dd MMM yyyy", { locale: isAr ? ar : undefined });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: isAr ? "تم النسخ" : "Copied!" });
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">{isAr ? "أكواد نشطة" : "Active Codes"}</p>
            </div>
            <p className="text-2xl font-bold mt-1"><AnimatedCounter value={activeCodes} /><span className="text-sm text-muted-foreground font-normal">/{totalCodes}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي التحويلات" : "Total Conversions"}</p>
            </div>
            <AnimatedCounter value={totalConversions} className="text-2xl mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">{isAr ? "معدل التحويل" : "Conversion Rate"}</p>
            </div>
            <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">{isAr ? "نقاط مكافآت" : "Points Rewarded"}</p>
            </div>
            <AnimatedCounter value={totalPointsAwarded} className="text-2xl mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="codes" className="space-y-3">
        <TabsList className="h-8">
          <TabsTrigger value="codes" className="text-xs h-7 px-3">{isAr ? "أكواد الإحالة" : "Referral Codes"}</TabsTrigger>
          <TabsTrigger value="conversions" className="text-xs h-7 px-3">{isAr ? "التحويلات" : "Conversions"}</TabsTrigger>
          <TabsTrigger value="membership" className="text-xs h-7 px-3">{isAr ? "إحالات العضوية" : "Membership Referrals"}</TabsTrigger>
        </TabsList>

        {/* Referral Codes */}
        <TabsContent value="codes">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "بحث بالاسم أو الكود..." : "Search by name or code..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ps-8 h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "المستخدم" : "User"}</TableHead>
                      <TableHead>{isAr ? "الكود" : "Code"}</TableHead>
                      <TableHead className="text-center">{isAr ? "نقرات" : "Clicks"}</TableHead>
                      <TableHead className="text-center">{isAr ? "دعوات" : "Invites"}</TableHead>
                      <TableHead className="text-center">{isAr ? "تحويلات" : "Conversions"}</TableHead>
                      <TableHead className="text-center">{isAr ? "نقاط" : "Points"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codesLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
                    ) : filteredCodes?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results"}</TableCell></TableRow>
                    ) : (
                      filteredCodes?.map((code: any) => (
                        <TableRow key={code.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{code.profiles?.full_name || code.profiles?.username || "-"}</p>
                              <p className="text-xs text-muted-foreground">{code.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{code.code}</code>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(code.code)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            {code.custom_slug && (
                              <p className="text-xs text-muted-foreground mt-0.5">/{code.custom_slug}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">{code.total_clicks}</TableCell>
                          <TableCell className="text-center font-medium">{code.total_invites_sent}</TableCell>
                          <TableCell className="text-center font-bold">{code.total_conversions}</TableCell>
                          <TableCell className="text-center">{code.total_points_earned.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={code.is_active ? "default" : "secondary"}>
                              {code.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversions */}
        <TabsContent value="conversions">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "المُحيل" : "Referrer"}</TableHead>
                      <TableHead>{isAr ? "المُحال" : "Referred"}</TableHead>
                      <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                      <TableHead className="text-center">{isAr ? "نقاط المُحيل" : "Referrer Pts"}</TableHead>
                      <TableHead className="text-center">{isAr ? "نقاط المُحال" : "Referred Pts"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversionsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
                    ) : conversions?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد تحويلات" : "No conversions yet"}</TableCell></TableRow>
                    ) : (
                      conversions?.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <p className="text-sm font-medium">{c.referrer?.full_name || c.referrer?.username || "-"}</p>
                            <p className="text-xs text-muted-foreground">{c.referrer?.email}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{c.referred?.full_name || c.referred?.username || "-"}</p>
                            <p className="text-xs text-muted-foreground">{c.referred?.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{c.conversion_type}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium text-primary">+{c.points_awarded_referrer}</TableCell>
                          <TableCell className="text-center font-medium text-primary">+{c.points_awarded_referred}</TableCell>
                          <TableCell className="text-sm">{formatDate(c.converted_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Referrals */}
        <TabsContent value="membership">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
                    <SelectItem value="converted">{isAr ? "محوّل" : "Converted"}</SelectItem>
                    <SelectItem value="expired">{isAr ? "منتهي" : "Expired"}</SelectItem>
                    <SelectItem value="cancelled">{isAr ? "ملغي" : "Cancelled"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "المُحيل" : "Referrer"}</TableHead>
                      <TableHead>{isAr ? "المُحال" : "Referred"}</TableHead>
                      <TableHead>{isAr ? "الفئة" : "Tier"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-center">{isAr ? "نقاط المُحيل" : "Referrer Bonus"}</TableHead>
                      <TableHead className="text-center">{isAr ? "خصم المُحال" : "Referred Discount"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membershipLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
                    ) : membershipReferrals?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد إحالات" : "No referrals yet"}</TableCell></TableRow>
                    ) : (
                      membershipReferrals?.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <p className="text-sm font-medium">{r.referrer?.full_name || r.referrer?.username || "-"}</p>
                            <p className="text-xs text-muted-foreground">{r.referrer?.email}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{r.referred?.full_name || r.referred?.username || "-"}</p>
                            <p className="text-xs text-muted-foreground">{r.referred?.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{r.tier}</Badge>
                          </TableCell>
                          <TableCell>{statusBadge(r.status)}</TableCell>
                          <TableCell className="text-center">
                            {r.referrer_bonus_points ? <span className="text-primary font-medium">+{r.referrer_bonus_points}</span> : "-"}
                            {r.referrer_discount_percent ? <span className="text-xs text-muted-foreground block">{r.referrer_discount_percent}% off</span> : null}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.referred_bonus_points ? <span className="text-primary font-medium">+{r.referred_bonus_points}</span> : "-"}
                            {r.referred_discount_percent ? <span className="text-xs text-muted-foreground block">{r.referred_discount_percent}% off</span> : null}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(r.created_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
