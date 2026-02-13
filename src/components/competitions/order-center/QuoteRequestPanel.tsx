import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send, Building2, FileText, CheckCircle, Clock,
  XCircle, Mail,
} from "lucide-react";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function QuoteRequestPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { data: lists } = useQuery({
    queryKey: ["quote-req-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, title, title_ar, category, status")
        .eq("competition_id", competitionId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: listItems } = useQuery({
    queryKey: ["quote-req-items", selectedListId],
    queryFn: async () => {
      if (!selectedListId) return [];
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("*, requirement_items(name, name_ar, category)")
        .eq("list_id", selectedListId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedListId,
  });

  const { data: companies } = useQuery({
    queryKey: ["quote-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, type")
        .eq("status", "active")
        .order("name")
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: existingRequests } = useQuery({
    queryKey: ["req-sponsorship-requests", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_sponsorship_requests")
        .select("*, companies:sponsor_company_id(name, name_ar)")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sendQuoteRequest = useMutation({
    mutationFn: async () => {
      if (!selectedCompanyId || !selectedListId || !title) return;
      const itemsData = listItems
        ?.filter((item) => selectedItems.includes(item.id))
        .map((item) => {
          const name = item.item_id && item.requirement_items
            ? (item.requirement_items as any).name
            : item.custom_name;
          return { name, quantity: item.quantity, unit: item.unit, cost: item.estimated_cost };
        });

      const totalCost = itemsData?.reduce((sum, i) => sum + (Number(i.cost) || 0) * (i.quantity || 1), 0) || 0;

      const { error } = await supabase.from("requirement_sponsorship_requests").insert({
        competition_id: competitionId,
        list_id: selectedListId,
        sponsor_company_id: selectedCompanyId,
        requested_by: user!.id,
        title,
        description: message || null,
        items: itemsData as any,
        total_estimated_cost: totalCost,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["req-sponsorship-requests", competitionId] });
      setSelectedItems([]);
      setMessage("");
      setTitle("");
      setSelectedCompanyId(null);
      toast({ title: isAr ? "تم إرسال طلب عرض الأسعار بنجاح" : "Quote request sent successfully" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (!listItems) return;
    setSelectedItems(
      selectedItems.length === listItems.length ? [] : listItems.map((i) => i.id)
    );
  };

  const STATUS_STYLES: Record<string, { color: string; icon: typeof Clock }> = {
    pending: { color: "bg-muted text-muted-foreground", icon: Clock },
    sent: { color: "bg-chart-1/10 text-chart-1", icon: Mail },
    quoted: { color: "bg-chart-4/10 text-chart-4", icon: FileText },
    accepted: { color: "bg-chart-5/10 text-chart-5", icon: CheckCircle },
    rejected: { color: "bg-destructive/10 text-destructive", icon: XCircle },
  };

  return (
    <div className="space-y-6">
      {isOrganizer && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4 text-primary" />
              {isAr ? "إنشاء طلب عرض أسعار" : "Create Quote Request"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{isAr ? "عنوان الطلب" : "Request Title"}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isAr ? "مثال: تجهيزات مطبخ المسابقة" : "e.g. Competition Kitchen Setup"}
              />
            </div>

            <div>
              <Label>{isAr ? "اختر قائمة المتطلبات" : "Select Requirement List"}</Label>
              <Select value={selectedListId || ""} onValueChange={setSelectedListId}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر قائمة..." : "Choose a list..."} />
                </SelectTrigger>
                <SelectContent>
                  {lists?.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {isAr && list.title_ar ? list.title_ar : list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedListId && listItems && listItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{isAr ? "اختر العناصر المطلوبة" : "Select Required Items"}</Label>
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                    {selectedItems.length === listItems.length
                      ? (isAr ? "إلغاء تحديد الكل" : "Deselect All")
                      : (isAr ? "تحديد الكل" : "Select All")}
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                  {listItems.map((item) => {
                    const name = item.item_id && item.requirement_items
                      ? (isAr && (item.requirement_items as any).name_ar
                        ? (item.requirement_items as any).name_ar
                        : (item.requirement_items as any).name)
                      : (isAr && item.custom_name_ar ? item.custom_name_ar : item.custom_name);
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.quantity} {item.unit}
                            {item.estimated_cost ? ` · $${Number(item.estimated_cost).toLocaleString()}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedItems.length}/{listItems.length} {isAr ? "عنصر محدد" : "items selected"}
                </p>
              </div>
            )}

            <div>
              <Label>{isAr ? "اختر الشركة / الراعي" : "Select Company / Sponsor"}</Label>
              <Select value={selectedCompanyId || ""} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <Building2 className="me-1.5 h-3.5 w-3.5" />
                  <SelectValue placeholder={isAr ? "اختر شركة..." : "Choose a company..."} />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {isAr && company.name_ar ? company.name_ar : company.name}
                      <span className="text-muted-foreground ms-1 text-xs">({company.type})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{isAr ? "رسالة (اختياري)" : "Message (optional)"}</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isAr ? "أضف رسالة للشركة..." : "Add a message for the company..."}
                rows={3}
              />
            </div>

            <Button
              onClick={() => sendQuoteRequest.mutate()}
              disabled={!selectedListId || !selectedCompanyId || !title || selectedItems.length === 0 || sendQuoteRequest.isPending}
              className="w-full"
            >
              <Send className="me-2 h-4 w-4" />
              {isAr
                ? `إرسال طلب عرض أسعار (${selectedItems.length} عنصر)`
                : `Send Quote Request (${selectedItems.length} items)`}
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {isAr ? "طلبات عروض الأسعار" : "Quote Requests"}
          {existingRequests?.length ? (
            <Badge variant="secondary">{existingRequests.length}</Badge>
          ) : null}
        </h4>

        {!existingRequests?.length ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Send className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {isAr ? "لا توجد طلبات عروض أسعار بعد" : "No quote requests yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? "أرسل طلبات للشركات والرعاة" : "Send requests to companies & sponsors"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {existingRequests.map((req) => {
              const statusInfo = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
              const StatusIcon = statusInfo.icon;
              const companyData = req.companies as any;
              const companyName = companyData
                ? (isAr && companyData.name_ar ? companyData.name_ar : companyData.name)
                : "—";
              return (
                <Card key={req.id} className="border-border/60">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{req.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {companyName} · {new Date(req.created_at || "").toLocaleDateString()}
                          {req.total_estimated_cost ? ` · $${Number(req.total_estimated_cost).toLocaleString()}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusInfo.color} variant="outline">
                      <StatusIcon className="me-1 h-3 w-3" />
                      {req.status}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
