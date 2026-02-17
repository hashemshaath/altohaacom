import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Radio, Users, Calendar, Clock, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatNumber";

interface LiveSession {
  id: string;
  host_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  max_attendees: number | null;
  cover_image_url: string | null;
  host_name: string | null;
  host_avatar: string | null;
  attendee_count: number;
  is_registered: boolean;
}

export function LiveSessionsSection() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", titleAr: "", description: "", descriptionAr: "", scheduledAt: "", duration: "60" });

  useEffect(() => { fetchSessions(); }, [user]);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("live_sessions")
      .select("*")
      .in("status", ["scheduled", "live"])
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10);

    if (!data?.length) { setSessions([]); setLoading(false); return; }

    const hostIds = [...new Set(data.map((s) => s.host_id))];
    const sessionIds = data.map((s) => s.id);

    const [profilesRes, attendeesRes, userAttendeesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", hostIds),
      supabase.from("live_session_attendees").select("session_id").in("session_id", sessionIds),
      user ? supabase.from("live_session_attendees").select("session_id").eq("user_id", user.id).in("session_id", sessionIds) : { data: [] },
    ]);

    const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);
    const countMap = new Map<string, number>();
    attendeesRes.data?.forEach((a) => countMap.set(a.session_id, (countMap.get(a.session_id) || 0) + 1));
    const registeredSet = new Set(userAttendeesRes.data?.map((a) => a.session_id) || []);

    setSessions(data.map((s) => {
      const host = profileMap.get(s.host_id);
      return {
        ...s,
        host_name: host?.full_name || null,
        host_avatar: host?.avatar_url || null,
        attendee_count: countMap.get(s.id) || 0,
        is_registered: registeredSet.has(s.id),
      };
    }));
    setLoading(false);
  };

  const handleRegister = async (sessionId: string, isRegistered: boolean) => {
    if (!user) return;
    if (isRegistered) {
      await supabase.from("live_session_attendees").delete().eq("session_id", sessionId).eq("user_id", user.id);
    } else {
      await supabase.from("live_session_attendees").insert({ session_id: sessionId, user_id: user.id });
    }
    fetchSessions();
  };

  const handleCreate = async () => {
    if (!user || !form.title.trim() || !form.scheduledAt) return;
    setCreating(true);
    const { error } = await supabase.from("live_sessions").insert({
      host_id: user.id,
      title: form.title.trim(),
      title_ar: form.titleAr.trim() || null,
      description: form.description.trim() || null,
      description_ar: form.descriptionAr.trim() || null,
      scheduled_at: new Date(form.scheduledAt).toISOString(),
      duration_minutes: parseInt(form.duration) || 60,
    });
    setCreating(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setShowForm(false);
      setForm({ title: "", titleAr: "", description: "", descriptionAr: "", scheduledAt: "", duration: "60" });
      fetchSessions();
      toast({ title: isAr ? "تم إنشاء الجلسة" : "Session created!" });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return toEnglishDigits(d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" }));
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return toEnglishDigits(d.toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" }));
  };

  if (loading || (sessions.length === 0 && !user)) return null;

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          <Radio className="h-4 w-4 text-destructive animate-pulse" />
          {isAr ? "جلسات طبخ مباشرة" : "Live Cooking Sessions"}
        </h3>
        {user && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            {isAr ? "جديد" : "New"}
          </Button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {sessions.map((session) => (
          <div key={session.id} className="shrink-0 w-[240px] rounded-xl border border-border bg-card/60 backdrop-blur-sm p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.host_avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {(session.host_name || "C")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{session.host_name || "Chef"}</p>
                {session.status === "live" && (
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                    {isAr ? "مباشر" : "LIVE"}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm font-semibold leading-tight line-clamp-2">
              {isAr ? (session.title_ar || session.title) : session.title}
            </p>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(session.scheduled_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(session.scheduled_at)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {toEnglishDigits(`${session.attendee_count}`)}
              </span>
            </div>

            {user && (
              <Button
                variant={session.is_registered ? "outline" : "default"}
                size="sm"
                className="w-full h-7 text-xs rounded-lg font-semibold"
                onClick={() => handleRegister(session.id, session.is_registered)}
              >
                {session.is_registered ? (isAr ? "مسجّل ✓" : "Registered ✓") : (isAr ? "سجّل الآن" : "Register")}
              </Button>
            )}
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="flex items-center justify-center w-full py-4 text-xs text-muted-foreground">
            {isAr ? "لا توجد جلسات قادمة" : "No upcoming sessions"}
          </div>
        )}
      </div>

      {/* Create session dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{isAr ? "إنشاء جلسة طبخ مباشرة" : "Create Live Cooking Session"}</DialogTitle>
          <div className="space-y-3">
            <Input placeholder={isAr ? "عنوان الجلسة" : "Session title"} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder={isAr ? "العنوان بالعربية (اختياري)" : "Title in Arabic (optional)"} value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
            <Textarea placeholder={isAr ? "وصف الجلسة (اختياري)" : "Description (optional)"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{isAr ? "التاريخ والوقت" : "Date & Time"}</label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{isAr ? "المدة (دقائق)" : "Duration (min)"}</label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} min="15" max="480" />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={creating || !form.title.trim() || !form.scheduledAt} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? "إنشاء الجلسة" : "Create Session")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
