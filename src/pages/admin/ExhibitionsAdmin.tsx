import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, ChevronDown, ChevronUp, Landmark } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type ExhibitionStatus = Database["public"]["Enums"]["exhibition_status"];
type ExhibitionType = Database["public"]["Enums"]["exhibition_type"];
type ExhibitionInsert = Database["public"]["Tables"]["exhibitions"]["Insert"];

const statusOptions: ExhibitionStatus[] = ["draft", "upcoming", "active", "completed", "cancelled"];
const typeOptions: { value: ExhibitionType; label: string }[] = [
  { value: "exhibition", label: "Exhibition" },
  { value: "conference", label: "Conference" },
  { value: "summit", label: "Summit" },
  { value: "workshop", label: "Workshop" },
  { value: "food_festival", label: "Food Festival" },
  { value: "trade_show", label: "Trade Show" },
  { value: "competition_event", label: "Competition Event" },
];

const emptyForm: Partial<ExhibitionInsert> = {
  title: "", title_ar: "", slug: "", description: "", description_ar: "",
  type: "exhibition", status: "draft",
  start_date: "", end_date: "",
  venue: "", venue_ar: "", city: "", country: "",
  is_virtual: false, virtual_link: "",
  organizer_name: "", organizer_name_ar: "",
  organizer_email: "", organizer_phone: "", organizer_website: "",
  registration_url: "", website_url: "", map_url: "",
  ticket_price: "", ticket_price_ar: "", is_free: false,
  max_attendees: undefined, is_featured: false,
  cover_image_url: "",
};

export default function ExhibitionsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ExhibitionInsert>>(emptyForm);
  const [tagsInput, setTagsInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");

  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ["admin-exhibitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.slug || form.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
      const payload: ExhibitionInsert = {
        ...form as ExhibitionInsert,
        slug,
        tags: tagsInput ? tagsInput.split(",").map(t => t.trim()) : [],
        target_audience: audienceInput ? audienceInput.split(",").map(t => t.trim()) : [],
        created_by: user?.id,
      };

      if (editingId) {
        const { error } = await supabase.from("exhibitions").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exhibitions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      toast({ title: editingId ? "Exhibition updated" : "Exhibition created" });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      toast({ title: "Exhibition deleted" });
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setTagsInput("");
    setAudienceInput("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (ex: any) => {
    setForm({
      title: ex.title, title_ar: ex.title_ar, slug: ex.slug,
      description: ex.description, description_ar: ex.description_ar,
      type: ex.type, status: ex.status,
      start_date: ex.start_date?.slice(0, 16), end_date: ex.end_date?.slice(0, 16),
      venue: ex.venue, venue_ar: ex.venue_ar, city: ex.city, country: ex.country,
      is_virtual: ex.is_virtual, virtual_link: ex.virtual_link,
      organizer_name: ex.organizer_name, organizer_name_ar: ex.organizer_name_ar,
      organizer_email: ex.organizer_email, organizer_phone: ex.organizer_phone,
      organizer_website: ex.organizer_website,
      registration_url: ex.registration_url, website_url: ex.website_url, map_url: ex.map_url,
      ticket_price: ex.ticket_price, ticket_price_ar: ex.ticket_price_ar,
      is_free: ex.is_free, max_attendees: ex.max_attendees, is_featured: ex.is_featured,
      cover_image_url: ex.cover_image_url,
      registration_deadline: ex.registration_deadline?.slice(0, 16),
    });
    setTagsInput((ex.tags || []).join(", "));
    setAudienceInput((ex.target_audience || []).join(", "));
    setEditingId(ex.id);
    setShowForm(true);
  };

  const updateField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold sm:text-2xl">
              {isAr ? "إدارة المعارض والفعاليات" : "Exhibitions & Events"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isAr ? "إدارة المعارض والمؤتمرات والفعاليات" : "Manage exhibitions, conferences, and events"}
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? (isAr ? "إغلاق" : "Close") : <><Plus className="me-2 h-4 w-4" />{isAr ? "إضافة فعالية" : "Add Event"}</>}
        </Button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? (isAr ? "تعديل الفعالية" : "Edit Event") : (isAr ? "إضافة فعالية جديدة" : "New Event")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Title (EN)</Label><Input value={form.title || ""} onChange={e => updateField("title", e.target.value)} /></div>
              <div><Label>Title (AR)</Label><Input value={form.title_ar || ""} onChange={e => updateField("title_ar", e.target.value)} dir="rtl" /></div>
              <div><Label>Slug</Label><Input value={form.slug || ""} onChange={e => updateField("slug", e.target.value)} placeholder="auto-generated-from-title" /></div>
              <div><Label>Cover Image URL</Label><Input value={form.cover_image_url || ""} onChange={e => updateField("cover_image_url", e.target.value)} /></div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Description (EN)</Label><Textarea value={form.description || ""} onChange={e => updateField("description", e.target.value)} rows={3} /></div>
              <div><Label>Description (AR)</Label><Textarea value={form.description_ar || ""} onChange={e => updateField("description_ar", e.target.value)} rows={3} dir="rtl" /></div>
            </div>

            {/* Type, Status, Dates */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => updateField("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => updateField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Start Date</Label><Input type="datetime-local" value={form.start_date || ""} onChange={e => updateField("start_date", e.target.value)} /></div>
              <div><Label>End Date</Label><Input type="datetime-local" value={form.end_date || ""} onChange={e => updateField("end_date", e.target.value)} /></div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label>Registration Deadline</Label><Input type="datetime-local" value={(form as any).registration_deadline || ""} onChange={e => updateField("registration_deadline", e.target.value)} /></div>
              <div><Label>Registration URL</Label><Input value={form.registration_url || ""} onChange={e => updateField("registration_url", e.target.value)} /></div>
              <div><Label>Website URL</Label><Input value={form.website_url || ""} onChange={e => updateField("website_url", e.target.value)} /></div>
            </div>

            <Separator />

            {/* Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Switch checked={form.is_virtual || false} onCheckedChange={v => updateField("is_virtual", v)} />
                <Label>Virtual Event</Label>
              </div>
              {form.is_virtual && <div><Label>Virtual Link</Label><Input value={form.virtual_link || ""} onChange={e => updateField("virtual_link", e.target.value)} /></div>}
            </div>

            {!form.is_virtual && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div><Label>Venue (EN)</Label><Input value={form.venue || ""} onChange={e => updateField("venue", e.target.value)} /></div>
                <div><Label>Venue (AR)</Label><Input value={form.venue_ar || ""} onChange={e => updateField("venue_ar", e.target.value)} dir="rtl" /></div>
                <div><Label>City</Label><Input value={form.city || ""} onChange={e => updateField("city", e.target.value)} /></div>
                <div><Label>Country</Label><Input value={form.country || ""} onChange={e => updateField("country", e.target.value)} /></div>
              </div>
            )}

            <Separator />

            {/* Organizer */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><Label>Organizer (EN)</Label><Input value={form.organizer_name || ""} onChange={e => updateField("organizer_name", e.target.value)} /></div>
              <div><Label>Organizer (AR)</Label><Input value={form.organizer_name_ar || ""} onChange={e => updateField("organizer_name_ar", e.target.value)} dir="rtl" /></div>
              <div><Label>Organizer Email</Label><Input value={form.organizer_email || ""} onChange={e => updateField("organizer_email", e.target.value)} /></div>
              <div><Label>Organizer Phone</Label><Input value={form.organizer_phone || ""} onChange={e => updateField("organizer_phone", e.target.value)} /></div>
              <div><Label>Organizer Website</Label><Input value={form.organizer_website || ""} onChange={e => updateField("organizer_website", e.target.value)} /></div>
              <div><Label>Map URL</Label><Input value={form.map_url || ""} onChange={e => updateField("map_url", e.target.value)} /></div>
            </div>

            <Separator />

            {/* Tickets */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.is_free || false} onCheckedChange={v => updateField("is_free", v)} />
                <Label>Free Entry</Label>
              </div>
              {!form.is_free && (
                <>
                  <div><Label>Ticket Price (EN)</Label><Input value={form.ticket_price || ""} onChange={e => updateField("ticket_price", e.target.value)} /></div>
                  <div><Label>Ticket Price (AR)</Label><Input value={form.ticket_price_ar || ""} onChange={e => updateField("ticket_price_ar", e.target.value)} dir="rtl" /></div>
                </>
              )}
              <div><Label>Max Attendees</Label><Input type="number" value={form.max_attendees || ""} onChange={e => updateField("max_attendees", parseInt(e.target.value) || undefined)} /></div>
            </div>

            {/* Tags & Audience */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Tags (comma-separated)</Label><Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="food, beverages, cooking" /></div>
              <div><Label>Target Audience (comma-separated)</Label><Input value={audienceInput} onChange={e => setAudienceInput(e.target.value)} placeholder="Chefs, Restaurant Owners, Students" /></div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_featured || false} onCheckedChange={v => updateField("is_featured", v)} />
              <Label>Featured Event</Label>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.start_date || !form.end_date}>
                {saveMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "إنشاء" : "Create")}
              </Button>
              <Button variant="outline" onClick={resetForm}>{isAr ? "إلغاء" : "Cancel"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">{isAr ? "الفعالية" : "Event"}</TableHead>
                <TableHead className="font-semibold">{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead className="font-semibold">{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="font-semibold">{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="font-semibold">{isAr ? "الموقع" : "Location"}</TableHead>
                <TableHead className="text-end font-semibold">{isAr ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : exhibitions?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No events yet</TableCell></TableRow>
              ) : (
                exhibitions?.map((ex) => (
                  <TableRow key={ex.id} className="group hover:bg-muted/20 transition-colors duration-150">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{isAr && ex.title_ar ? ex.title_ar : ex.title}</p>
                        {ex.organizer_name && <p className="text-[10px] text-muted-foreground">{ex.organizer_name}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{ex.type.replace("_", " ")}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{ex.status}</Badge></TableCell>
                    <TableCell className="text-sm">{format(new Date(ex.start_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-sm">{ex.is_virtual ? "Virtual" : `${ex.city || ""}${ex.country ? `, ${ex.country}` : ""}`}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(ex)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(ex.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
