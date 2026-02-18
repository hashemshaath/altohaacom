import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useChefsTableSessions, useChefsTableRequests, useUpdateChefsTableSession } from "@/hooks/useChefsTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { ChefHat, Search, Eye, Package, Calendar, Plus, FileText, Clock, Check, X, Building2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ChefsTableAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const { data: sessions, isLoading: sessionsLoading } = useChefsTableSessions();
  const { data: requests, isLoading: requestsLoading } = useChefsTableRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSessions = useMemo(() => {
    return sessions?.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = s.title.toLowerCase().includes(q) || s.product_name.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sessions, search, statusFilter]);

  const pendingRequests = requests?.filter(r => r.status === "pending") || [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ChefHat}
        title={isAr ? "طاولة الشيف" : "Chef's Table"}
        description={isAr ? "إدارة طلبات وجلسات تقييم المنتجات" : "Manage product evaluation requests & sessions"}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isAr ? "الطلبات المعلقة" : "Pending Requests", count: pendingRequests.length, icon: Clock, color: "text-chart-4" },
          { label: isAr ? "الجلسات المجدولة" : "Scheduled", count: sessions?.filter(s => s.status === "scheduled").length || 0, icon: Calendar, color: "text-primary" },
          { label: isAr ? "قيد التنفيذ" : "In Progress", count: sessions?.filter(s => s.status === "in_progress").length || 0, icon: ChefHat, color: "text-chart-5" },
          { label: isAr ? "مكتملة" : "Completed", count: sessions?.filter(s => s.status === "completed").length || 0, icon: Check, color: "text-chart-5" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-black">{stat.count}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions" className="gap-1.5">
            <ChefHat className="h-3.5 w-3.5" />
            {isAr ? "الجلسات" : "Sessions"}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {isAr ? "الطلبات" : "Requests"}
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ms-1 h-5 min-w-5 px-1.5 text-[10px]">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={isAr ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="scheduled">{isAr ? "مجدول" : "Scheduled"}</SelectItem>
                <SelectItem value="in_progress">{isAr ? "قيد التنفيذ" : "In Progress"}</SelectItem>
                <SelectItem value="completed">{isAr ? "مكتمل" : "Completed"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sessionsLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <Card className="border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الجلسة" : "Session"}</TableHead>
                    <TableHead>{isAr ? "المنتج" : "Product"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions?.map(session => (
                    <TableRow key={session.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/chefs-table/${session.id}`)}>
                      <TableCell className="font-medium">{isAr && session.title_ar ? session.title_ar : session.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          {isAr && session.product_name_ar ? session.product_name_ar : session.product_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{session.experience_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase">{session.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.session_date ? format(new Date(session.session_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {requestsLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : requests?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 font-medium">{isAr ? "لا توجد طلبات" : "No requests"}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{isAr ? "المنتج" : "Product"}</TableHead>
                    <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                    <TableHead>{isAr ? "نوع التجربة" : "Experience"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{isAr && req.title_ar ? req.title_ar : req.title}</TableCell>
                      <TableCell>{isAr && req.product_name_ar ? req.product_name_ar : req.product_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{req.product_category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{req.experience_type}</TableCell>
                      <TableCell>
                        <Badge variant={req.status === "pending" ? "secondary" : req.status === "approved" ? "default" : "destructive"} className="text-[10px] uppercase">
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(req.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
