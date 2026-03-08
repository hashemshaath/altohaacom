import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Building2, Search, Star, TrendingUp, Clock, Package, Filter, ArrowUpDown } from "lucide-react";

export const CompanySupplierScorecard = memo(function CompanySupplierScorecard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"score" | "orders" | "delivery" | "response">("score");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-scorecard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, name_ar, type, logo_url, status, supplier_score, total_orders, on_time_delivery_rate, response_time_hours, country_code, city")
        .order("supplier_score", { ascending: false });
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    let list = companies;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name?.toLowerCase().includes(q) || c.name_ar?.includes(search));
    }
    if (typeFilter !== "all") {
      list = list.filter(c => c.type === typeFilter);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "orders": return (b.total_orders || 0) - (a.total_orders || 0);
        case "delivery": return (b.on_time_delivery_rate || 0) - (a.on_time_delivery_rate || 0);
        case "response": return (a.response_time_hours || 999) - (b.response_time_hours || 999);
        default: return (b.supplier_score || 0) - (a.supplier_score || 0);
      }
    });
    return list;
  }, [companies, search, typeFilter, sortBy]);

  const { avgScore, totalOrders, avgDelivery } = useMemo(() => ({
    avgScore: companies.length ? Math.round(companies.reduce((s, c) => s + (Number(c.supplier_score) || 0), 0) / companies.length) : 0,
    totalOrders: companies.reduce((s, c) => s + (c.total_orders || 0), 0),
    avgDelivery: companies.length ? Math.round(companies.reduce((s, c) => s + (Number(c.on_time_delivery_rate) || 0), 0) / companies.length) : 0,
  }), [companies]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: isAr ? "ممتاز" : "Excellent", variant: "default" as const };
    if (score >= 70) return { label: isAr ? "جيد" : "Good", variant: "secondary" as const };
    if (score >= 50) return { label: isAr ? "متوسط" : "Average", variant: "outline" as const };
    return { label: isAr ? "يحتاج تحسين" : "Needs Work", variant: "destructive" as const };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{isAr ? "بطاقة أداء الموردين" : "Supplier Scorecard"}</h3>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Star className="h-4 w-4 mx-auto text-primary mb-1" />
          <AnimatedCounter value={avgScore} className="text-xl" suffix="%" />
          <p className="text-xs text-muted-foreground">{isAr ? "متوسط التقييم" : "Avg Score"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Package className="h-4 w-4 mx-auto text-chart-2 mb-1" />
          <AnimatedCounter value={totalOrders} className="text-xl" />
          <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الطلبات" : "Total Orders"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TrendingUp className="h-4 w-4 mx-auto text-chart-3 mb-1" />
          <AnimatedCounter value={avgDelivery} className="text-xl" suffix="%" />
          <p className="text-xs text-muted-foreground">{isAr ? "التسليم بالوقت" : "On-time Delivery"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Building2 className="h-4 w-4 mx-auto text-chart-4 mb-1" />
          <AnimatedCounter value={companies.length} className="text-xl" />
          <p className="text-xs text-muted-foreground">{isAr ? "الشركات" : "Companies"}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><Filter className="h-3.5 w-3.5 me-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All Types"}</SelectItem>
            <SelectItem value="supplier">{isAr ? "مورد" : "Supplier"}</SelectItem>
            <SelectItem value="sponsor">{isAr ? "راعي" : "Sponsor"}</SelectItem>
            <SelectItem value="partner">{isAr ? "شريك" : "Partner"}</SelectItem>
            <SelectItem value="vendor">{isAr ? "بائع" : "Vendor"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-40"><ArrowUpDown className="h-3.5 w-3.5 me-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="score">{isAr ? "التقييم" : "Score"}</SelectItem>
            <SelectItem value="orders">{isAr ? "الطلبات" : "Orders"}</SelectItem>
            <SelectItem value="delivery">{isAr ? "التسليم" : "Delivery"}</SelectItem>
            <SelectItem value="response">{isAr ? "الاستجابة" : "Response"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{isAr ? "الشركة" : "Company"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "النوع" : "Type"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "التقييم" : "Score"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الطلبات" : "Orders"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "التسليم" : "Delivery %"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الاستجابة" : "Response"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map(company => {
                  const score = Number(company.supplier_score) || 0;
                  const badge = getScoreBadge(score);
                  return (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {company.logo_url ? (
                            <img src={company.logo_url} alt="" className="h-7 w-7 rounded object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded bg-muted flex items-center justify-center">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{isAr ? company.name_ar || company.name : company.name}</p>
                            {company.city && <p className="text-[10px] text-muted-foreground">{company.city}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{company.type}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${getScoreColor(score)}`}>{score}%</span>
                          <Progress value={score} className="w-12 h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{company.total_orders || 0}</TableCell>
                      <TableCell className="text-sm">{Number(company.on_time_delivery_rate) || 0}%</TableCell>
                      <TableCell className="text-sm">
                        {company.response_time_hours ? `${Number(company.response_time_hours)}h` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
