import { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link as LinkIcon, Plus, X, Search, Calendar, MapPin, Building2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface OrganizerExhibitionsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizerId: string;
  organizerName: string;
  organizerLogo?: string | null;
}

export const OrganizerExhibitionsPanel = memo(function OrganizerExhibitionsPanel({
  open, onOpenChange, organizerId, organizerName, organizerLogo,
}: OrganizerExhibitionsPanelProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [searchQ, setSearchQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  // Fetch linked exhibitions
  const { data: linked, isLoading } = useQuery({
    queryKey: ["organizer-exhibitions", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_organizers")
        .select("id, exhibition_id, role, sort_order, created_at")
        .eq("organizer_id", organizerId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (!data?.length) return [];

      // Fetch exhibition details
      const exhIds = data.map(d => d.exhibition_id);
      const { data: exhibitions } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, start_date, end_date, city, country, status, cover_image_url")
        .in("id", exhIds);

      const exhMap = new Map((exhibitions || []).map(e => [e.id, e]));
      return data.map(link => ({
        ...link,
        exhibition: exhMap.get(link.exhibition_id) || null,
      }));
    },
    enabled: open && !!organizerId,
  });

  // Fetch all exhibitions for add panel
  const { data: allExhibitions } = useQuery({
    queryKey: ["all-exhibitions-for-linking"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, start_date, city, country, status, cover_image_url")
        .order("start_date", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: showAddPanel,
  });

  const linkedIds = new Set((linked || []).map(l => l.exhibition_id));

  const availableExhibitions = (allExhibitions || []).filter(e => {
    if (linkedIds.has(e.id)) return false;
    if (!addSearch) return true;
    const q = addSearch.toLowerCase();
    return e.title?.toLowerCase().includes(q) || e.title_ar?.includes(addSearch) || e.city?.toLowerCase().includes(q);
  });

  // Link mutation
  const linkMutation = useMutation({
    mutationFn: async ({ exhibitionId, role }: { exhibitionId: string; role: string }) => {
      const { error } = await supabase.from("exhibition_organizers").insert({
        exhibition_id: exhibitionId,
        organizer_id: organizerId,
        name: organizerName,
        role: role || "organizer",
        logo_url: organizerLogo || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizer-exhibitions", organizerId] });
      toast.success(isAr ? "تم الربط بنجاح" : "Linked successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("exhibition_organizers").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizer-exhibitions", organizerId] });
      toast.success(isAr ? "تم إلغاء الربط" : "Unlinked successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ linkId, role }: { linkId: string; role: string }) => {
      const { error } = await supabase.from("exhibition_organizers").update({ role }).eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizer-exhibitions", organizerId] });
      toast.success(isAr ? "تم التحديث" : "Updated");
    },
  });

  const filteredLinked = (linked || []).filter(l => {
    if (roleFilter !== "all" && l.role !== roleFilter) return false;
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return l.exhibition?.title?.toLowerCase().includes(q) || l.exhibition?.title_ar?.includes(searchQ);
  });

  const roles = ["organizer", "co-organizer", "sponsor", "partner", "supporter"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full p-0 flex flex-col" side="right">
        <SheetHeader className="p-4 pb-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-xl">
              {organizerLogo && <AvatarImage src={organizerLogo} />}
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{organizerName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="text-sm truncate">{organizerName}</SheetTitle>
              <p className="text-[11px] text-muted-foreground">
                {isAr ? `${linked?.length || 0} معرض مرتبط` : `${linked?.length || 0} linked exhibitions`}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Toolbar */}
        <div className="p-3 border-b flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder={isAr ? "بحث..." : "Search..."} className="ps-7 h-8 text-xs" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
              {roles.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 gap-1" onClick={() => setShowAddPanel(!showAddPanel)}>
            {showAddPanel ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAddPanel ? (isAr ? "إغلاق" : "Close") : (isAr ? "ربط" : "Link")}
          </Button>
        </div>

        {/* Add Exhibition Panel */}
        {showAddPanel && (
          <div className="p-3 border-b bg-muted/20 space-y-2">
            <div className="relative">
              <Search className="absolute start-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder={isAr ? "ابحث عن معرض لربطه..." : "Search exhibitions to link..."} className="ps-7 h-8 text-xs" />
            </div>
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {availableExhibitions.slice(0, 20).map(exh => (
                  <div key={exh.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{isAr ? exh.title_ar || exh.title : exh.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {exh.start_date && <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{format(new Date(exh.start_date), "MMM yyyy")}</span>}
                        {exh.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{exh.city}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] capitalize">{exh.status}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 gap-1"
                      onClick={() => linkMutation.mutate({ exhibitionId: exh.id, role: "organizer" })}
                      disabled={linkMutation.isPending}
                    >
                      <LinkIcon className="h-2.5 w-2.5" />{isAr ? "ربط" : "Link"}
                    </Button>
                  </div>
                ))}
                {availableExhibitions.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {isAr ? "لا توجد معارض متاحة" : "No exhibitions available"}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Linked Exhibitions List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />)}
              </div>
            ) : filteredLinked.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد معارض مرتبطة" : "No linked exhibitions"}</p>
                <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={() => setShowAddPanel(true)}>
                  <Plus className="h-3.5 w-3.5" />{isAr ? "ربط معرض" : "Link Exhibition"}
                </Button>
              </div>
            ) : (
              filteredLinked.map(link => {
                const exh = link.exhibition;
                if (!exh) return null;
                return (
                  <Card key={link.id} className="rounded-xl border-border/40 overflow-hidden group">
                    {exh.cover_image_url && (
                      <div className="h-16 w-full overflow-hidden">
                        <img src={exh.cover_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{isAr ? exh.title_ar || exh.title : exh.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            {exh.start_date && <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{format(new Date(exh.start_date), "MMM d, yyyy")}</span>}
                            {exh.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{exh.city}, {exh.country}</span>}
                          </div>
                        </div>
                        <Badge variant={exh.status === "active" ? "default" : "secondary"} className="text-[9px] capitalize shrink-0">
                          {exh.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={link.role || "organizer"}
                          onValueChange={v => updateRoleMutation.mutate({ linkId: link.id, role: v })}
                        >
                          <SelectTrigger className="h-7 text-[10px] flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {roles.map(r => <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] text-destructive gap-1 px-2"
                          onClick={() => { if (confirm(isAr ? "إلغاء الربط؟" : "Unlink?")) unlinkMutation.mutate(link.id); }}
                        >
                          <Unlink className="h-3 w-3" />{isAr ? "إلغاء" : "Unlink"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});
