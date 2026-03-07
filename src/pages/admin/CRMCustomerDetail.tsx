import { useState } from "react";
import { formatCurrency } from "@/lib/currencyFormatter";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Globe, Calendar, Clock,
  ShoppingCart, DollarSign, Heart, Star, Wallet, Gift, Users,
  Plus, Edit, Send, CreditCard, Package, AlertCircle, ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";

export default function CRMCustomerDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { language } = useLanguage();
  const { user: adminUser } = useAuth();
  const isAr = language === "ar";
  const qc = useQueryClient();

  const [walletAmount, setWalletAmount] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [walletType, setWalletType] = useState<"credit" | "debit">("credit");
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["crm-customer", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, email, phone, country_code, bio, specialization, account_status, wallet_balance, loyalty_points, account_number, is_verified, gender, date_of_birth, location, preferred_language, last_login_at, created_at, updated_at")
        .eq("user_id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ["crm-customer-roles", userId],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId!) as { data: any[] | null };
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch shop orders
  const { data: orders = [] } = useQuery({
    queryKey: ["crm-customer-orders", userId],
    queryFn: async (): Promise<any[]> => {
      const result = await (supabase as any)
        .from("shop_orders")
        .select("id, order_number, user_id, status, total_amount, currency, payment_status, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return result.data || [];
    },
    enabled: !!userId,
  });

  // Fetch wallet transactions
  const { data: walletTx = [] } = useQuery({
    queryKey: ["crm-wallet-tx", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_wallet_transactions")
        .select("id, user_id, type, amount, balance_after, description, description_ar, reference_id, reference_type, created_by, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch loyalty points
  const { data: loyaltyTx = [] } = useQuery({
    queryKey: ["crm-loyalty-tx", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_loyalty_points")
        .select("id, user_id, type, points, description, description_ar, reference_id, reference_type, expires_at, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch wishlist
  const { data: wishlist = [] } = useQuery({
    queryKey: ["crm-wishlist", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_wishlist")
        .select("id, user_id, item_id, item_type, item_name, item_name_ar, item_image_url, item_price, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch groups
  const { data: userGroups = [] } = useQuery({
    queryKey: ["crm-customer-groups", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_group_members")
        .select("*, customer_groups(*)")
        .eq("user_id", userId!);
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch all groups for add dialog
  const { data: allGroups = [] } = useQuery({
    queryKey: ["crm-all-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_groups").select("id, name, name_ar, description, color").eq("is_active", true).order("name");
      return data || [];
    },
  });

  // Fetch custom fields
  const { data: customFields = [] } = useQuery({
    queryKey: ["crm-custom-fields", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_custom_fields")
        .select("id, user_id, field_name, field_type, field_value, created_at, updated_at")
        .eq("user_id", userId!)
        .order("field_name");
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch competition registrations
  const { data: registrations = [] } = useQuery({
    queryKey: ["crm-customer-registrations", userId],
    queryFn: async (): Promise<any[]> => {
      const result = await (supabase as any)
        .from("competition_registrations")
        .select("*, competitions(name, name_ar)")
        .eq("user_id", userId!);
      return result.data || [];
    },
    enabled: !!userId,
  });

  // Wallet mutation
  const walletMutation = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(walletAmount);
      if (isNaN(amt) || amt <= 0) throw new Error("Invalid amount");
      const currentBalance = profile?.wallet_balance || 0;
      const newBalance = walletType === "credit" ? currentBalance + amt : currentBalance - amt;

      await supabase.from("customer_wallet_transactions").insert({
        user_id: userId!,
        type: walletType,
        amount: amt,
        balance_after: newBalance,
        description: walletNote || (walletType === "credit" ? "Manual credit" : "Manual debit"),
        created_by: adminUser?.id,
      });

      await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", userId!);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-customer", userId] });
      qc.invalidateQueries({ queryKey: ["crm-wallet-tx", userId] });
      setShowWalletDialog(false);
      setWalletAmount("");
      setWalletNote("");
      toast({ title: isAr ? "تم تحديث المحفظة" : "Wallet updated" });
    },
    onError: (e: any) => toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  // Add to group
  const addToGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from("customer_group_members").insert({
        group_id: groupId,
        user_id: userId!,
        added_by: adminUser?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-customer-groups", userId] });
      setShowGroupDialog(false);
      toast({ title: isAr ? "تمت الإضافة للمجموعة" : "Added to group" });
    },
    onError: () => toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" }),
  });

  // Computed stats
  const totalOrders = orders.length;
  const totalOrderValue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;
  const lastOrder = orders[0];
  const totalLoyalty = loyaltyTx.reduce((s, t) => s + (t.type === "earn" || t.type === "bonus" ? t.points : -t.points), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{isAr ? "المستخدم غير موجود" : "User not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/users"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{isAr ? "بيانات العميل" : "Customer Details"}</h1>
          <p className="text-xs text-muted-foreground">{profile.account_number || profile.user_id}</p>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {isAr ? "إضافة لمجموعة" : "Add to Group"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? "إضافة لمجموعة" : "Add to Group"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allGroups
                .filter(g => !userGroups.some((ug: any) => ug.group_id === g.id))
                .map(g => (
                  <Button
                    key={g.id}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addToGroupMutation.mutate(g.id)}
                  >
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color || "#6366f1" }} />
                    {isAr ? g.name_ar || g.name : g.name}
                  </Button>
                ))}
              {allGroups.filter(g => !userGroups.some((ug: any) => ug.group_id === g.id)).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isAr ? "لا توجد مجموعات متاحة" : "No available groups"}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" className="gap-1.5">
          <Send className="h-3.5 w-3.5" />
          {isAr ? "إرسال طلب مراجعة" : "Send Review Request"}
        </Button>

        <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              {isAr ? "تعديل رصيد المحفظة" : "Modify Wallet Balance"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? "تعديل رصيد المحفظة" : "Modify Wallet Balance"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{isAr ? "الرصيد الحالي" : "Current Balance"}</p>
                <p className="text-2xl font-bold"><AnimatedCounter value={Math.round((profile.wallet_balance || 0) * 100) / 100} className="inline" format /> SAR</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={walletType === "credit" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setWalletType("credit")}
                >
                  {isAr ? "إيداع" : "Credit"}
                </Button>
                <Button
                  variant={walletType === "debit" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setWalletType("debit")}
                >
                  {isAr ? "خصم" : "Debit"}
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "المبلغ" : "Amount"}</Label>
                <Input
                  type="number"
                  value={walletAmount}
                  onChange={e => setWalletAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "ملاحظة" : "Note"}</Label>
                <Textarea
                  value={walletNote}
                  onChange={e => setWalletNote(e.target.value)}
                  placeholder={isAr ? "سبب التعديل..." : "Reason for adjustment..."}
                  rows={2}
                />
              </div>
              <Button className="w-full" onClick={() => walletMutation.mutate()} disabled={walletMutation.isPending}>
                {isAr ? "تأكيد" : "Confirm"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Basic Information */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              {isAr ? "المعلومات الأساسية" : "Basic Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{(profile.full_name || "U")[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{profile.full_name || "—"}</h3>
                <p className="text-xs text-muted-foreground">@{profile.username}</p>
                {profile.is_verified && (
                  <Badge variant="secondary" className="mt-1 gap-1 text-[10px]">
                    <ShieldCheck className="h-3 w-3" /> {isAr ? "موثق" : "Verified"}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {roles.map((r: any) => (
                  <Badge key={r.role} variant="outline" className="text-[10px] capitalize">{r.role}</Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-3 text-sm">
              <InfoRow icon={Phone} label={isAr ? "الهاتف" : "Phone"} value={profile.phone || "—"} />
              <InfoRow icon={User} label={isAr ? "الجنس" : "Gender"} value={profile.gender || "—"} />
              <InfoRow icon={Calendar} label={isAr ? "تاريخ الميلاد" : "Date of Birth"} value={profile.date_of_birth || "—"} />
              <InfoRow icon={MapPin} label={isAr ? "الموقع" : "Location"} value={profile.location || "—"} />
              <InfoRow icon={Globe} label={isAr ? "اللغة" : "Language"} value={profile.preferred_language || "English"} />
              <InfoRow
                icon={Calendar}
                label={isAr ? "تاريخ التسجيل" : "Registration Date"}
                value={format(new Date(profile.created_at), "yyyy/MM/dd")}
              />
              <InfoRow
                icon={Clock}
                label={isAr ? "آخر تسجيل دخول" : "Last Login"}
                value={profile.last_login_at ? format(new Date(profile.last_login_at), "dd/MM/yyyy | hh:mm a") : "—"}
              />
            </div>

            <Separator />

            {/* Groups */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{isAr ? "المجموعات" : "Groups"}</p>
              <div className="flex flex-wrap gap-1">
                {userGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground">{isAr ? "لا توجد مجموعات" : "No groups"}</p>
                )}
                {userGroups.map((ug: any) => (
                  <Badge key={ug.id} variant="outline" className="text-[10px] gap-1">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ug.customer_groups?.color || "#6366f1" }} />
                    {isAr ? ug.customer_groups?.name_ar || ug.customer_groups?.name : ug.customer_groups?.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{isAr ? "حقول مخصصة" : "Custom Fields"}</p>
                  <div className="space-y-1">
                    {customFields.map((f: any) => (
                      <div key={f.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{f.field_name}</span>
                        <span className="font-medium">{f.field_value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="behavior">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
              <TabsTrigger value="behavior" className="gap-1 text-xs">
                <ShoppingCart className="h-3.5 w-3.5" />
                {isAr ? "مؤشرات الشراء" : "Behavior"}
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-1 text-xs">
                <Wallet className="h-3.5 w-3.5" />
                {isAr ? "المحفظة" : "Wallet"}
              </TabsTrigger>
              <TabsTrigger value="loyalty" className="gap-1 text-xs">
                <Gift className="h-3.5 w-3.5" />
                {isAr ? "نقاط الولاء" : "Loyalty"}
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-1 text-xs">
                <Heart className="h-3.5 w-3.5" />
                {isAr ? "قائمة الأمنيات" : "Wishlist"}
              </TabsTrigger>
              <TabsTrigger value="competitions" className="gap-1 text-xs">
                <Star className="h-3.5 w-3.5" />
                {isAr ? "المسابقات" : "Competitions"}
              </TabsTrigger>
            </TabsList>

            {/* Purchasing Behavior */}
            <TabsContent value="behavior">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{isAr ? "مؤشرات سلوك الشراء" : "Purchasing Behavior Indicators"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard label={isAr ? "عدد الطلبات" : "Number of Orders"} value={totalOrders || isAr ? "غير محدد" : "Undefined"} icon={Package} />
                    <StatCard label={isAr ? "قيمة الطلبات" : "Order Value"} value={`${totalOrderValue.toFixed(2)}`} icon={DollarSign} />
                    <StatCard label={isAr ? "متوسط قيمة الطلب" : "Avg Order Value"} value={`${avgOrderValue.toFixed(2)}`} icon={CreditCard} />
                    <StatCard label={isAr ? "طلبات ملغاة" : "Cancelled Orders"} value={cancelledOrders || isAr ? "غير محدد" : "Undefined"} icon={AlertCircle} />
                    <StatCard label={isAr ? "آخر طلب" : "Last Order"} value={lastOrder ? format(new Date(lastOrder.created_at), "yyyy/MM/dd") : isAr ? "غير محدد" : "Undefined"} icon={Clock} />
                    <StatCard label={isAr ? "سلة مهجورة" : "Abandoned Carts"} value={`${wishlist.length} ${isAr ? "منتج" : "Products"}`} icon={ShoppingCart} />
                  </div>

                  {/* Orders Table */}
                  {orders.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">{isAr ? "سجل الطلبات" : "Order History"}</h4>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {orders.slice(0, 10).map((order: any) => (
                            <div key={order.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                              <div>
                                <p className="font-medium">{order.order_number}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(order.created_at), "dd/MM/yyyy")}
                                </p>
                              </div>
                              <div className="text-end">
                                <p className="font-medium">{(order.total_amount || 0).toFixed(2)} SAR</p>
                                <Badge variant="outline" className="text-[10px]">{order.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wallet */}
            <TabsContent value="wallet">
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between">
                  <CardTitle className="text-sm">{isAr ? "محفظة العميل" : "Customer Wallet"}</CardTitle>
                  <Badge variant="outline" className="text-lg font-bold">
                    {(profile.wallet_balance || 0).toFixed(2)} SAR
                  </Badge>
                </CardHeader>
                <CardContent>
                  {walletTx.length === 0 ? (
                    <EmptyState message={isAr ? "لا توجد معاملات في محفظة العميل" : "No transactions recorded in the customer wallet"} />
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {walletTx.map((tx: any) => (
                          <div key={tx.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "dd/MM/yyyy hh:mm a")}</p>
                            </div>
                            <span className={`font-bold ${tx.type === "credit" || tx.type === "refund" ? "text-chart-2" : "text-destructive"}`}>
                              {tx.type === "credit" || tx.type === "refund" ? "+" : "-"}{tx.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Loyalty */}
            <TabsContent value="loyalty">
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between">
                  <CardTitle className="text-sm">{isAr ? "نقاط الولاء" : "Loyalty Points"}</CardTitle>
                  <Badge variant="outline" className="text-lg font-bold gap-1">
                    <Star className="h-4 w-4 text-chart-3" />
                    {totalLoyalty} {isAr ? "نقطة" : "Points"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {loyaltyTx.length === 0 ? (
                    <EmptyState message={isAr ? "لا توجد نقاط ولاء للعميل" : "No loyalty points for the customer"} />
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {loyaltyTx.map((tx: any) => (
                          <div key={tx.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "dd/MM/yyyy")}</p>
                            </div>
                            <span className={`font-bold ${tx.type === "earn" || tx.type === "bonus" ? "text-chart-2" : "text-destructive"}`}>
                              {tx.type === "earn" || tx.type === "bonus" ? "+" : "-"}{tx.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist */}
            <TabsContent value="wishlist">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{isAr ? "قائمة الأمنيات" : "Wishlist"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {wishlist.length === 0 ? (
                    <EmptyState message={isAr ? "لا توجد عناصر في قائمة الأمنيات" : "No items in the wishlist"} />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {wishlist.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3">
                          {item.item_image_url ? (
                            <img src={item.item_image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                              <Heart className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{isAr ? item.item_name_ar || item.item_name : item.item_name}</p>
                            <p className="text-xs text-muted-foreground">{item.item_type}</p>
                          </div>
                           {item.item_price && (
                             <span className="text-sm font-bold">{formatCurrency(item.item_price, language === "ar" ? "ar" : "en")}</span>
                           )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Competitions */}
            <TabsContent value="competitions">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{isAr ? "المسابقات المسجلة" : "Registered Competitions"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {registrations.length === 0 ? (
                    <EmptyState message={isAr ? "لم يسجل في أي مسابقة" : "Not registered in any competition"} />
                  ) : (
                    <div className="space-y-2">
                      {registrations.map((reg: any) => (
                        <div key={reg.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                          <div>
                            <p className="font-medium">
                              {isAr ? reg.competitions?.name_ar || reg.competitions?.name : reg.competitions?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{reg.registration_number}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{reg.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Rewards Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gift className="h-4 w-4 text-chart-3" />
                {isAr ? "المكافآت" : "Rewards"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState message={isAr ? "لا توجد مكافآت للعميل\nستظهر البيانات هنا بمجرد توفرها." : "No rewards for the customer\nData will appear here once available."} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-xl border p-4 text-center space-y-1">
      <Icon className="h-5 w-5 text-muted-foreground mx-auto" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm whitespace-pre-line">{message}</p>
    </div>
  );
}
