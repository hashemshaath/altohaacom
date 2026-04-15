import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Radio, Users, Calendar, Clock, Plus, Loader2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useLiveSessionsData, type LiveSession } from "@/hooks/community/useLiveSessionsData";

const INITIAL_FORM = { title: "", titleAr: "", description: "", descriptionAr: "", scheduledAt: "", duration: "60" };

export const LiveSessionsTab = memo(function LiveSessionsTab() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { toast } = useToast();
  const { sessions, pastSessions, isLoading, createSession, isCreating, toggleRegistration } = useLiveSessionsData();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const handleCreate = async () => {
    if (!user || !form.title.trim() || !form.scheduledAt) return;
    try {
      await createSession(form);
      setShowForm(false);
      setForm(INITIAL_FORM);
      toast({ title: isAr ? "تم إنشاء الجلسة" : "Session created!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const SessionCard = ({ session, isPast = false }: { session: LiveSession; isPast?: boolean }) => (
    <Card className="group border-border/30 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            <AvatarImage src={session.host_avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {(session.host_name || "C")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{session.host_name || "Chef"}</p>
            <div className="flex items-center gap-2">
              {session.status === "live" && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0 animate-pulse">
                  {isAr ? "مباشر" : "LIVE"}
                </Badge>
              )}
              {isPast && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {isAr ? "انتهت" : "Ended"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <h3 className="text-sm font-semibold leading-tight line-clamp-2">
          {isAr ? (session.title_ar || session.title) : session.title}
        </h3>

        {(session.description || session.description_ar) && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {isAr ? (session.description_ar || session.description) : session.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
            <AnimatedCounter value={session.attendee_count} className="inline" />
          </span>
        </div>

        {!isPast && user && (
          <Button
            variant={session.is_registered ? "outline" : "default"}
            size="sm"
            className="w-full h-8 text-xs rounded-xl font-semibold"
            onClick={() => toggleRegistration(session.id, session.is_registered)}
          >
            {session.is_registered ? (isAr ? "مسجّل ✓" : "Registered ✓") : (isAr ? "سجّل الآن" : "Register")}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Radio className="h-5 w-5 text-destructive" />
          {isAr ? "جلسات الطبخ المباشرة" : "Live Cooking Sessions"}
        </h2>
        {user && (
          <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            {isAr ? "إنشاء جلسة" : "Create Session"}
          </Button>
        )}
      </div>

      {sessions.length > 0 ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">{isAr ? "لا توجد جلسات قادمة" : "No upcoming sessions"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "كن أول من ينشئ جلسة طبخ مباشرة!" : "Be the first to create a live cooking session!"}</p>
          </CardContent>
        </Card>
      )}

      {pastSessions.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {isAr ? "الجلسات السابقة" : "Past Sessions"}
          </h3>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {pastSessions.map((s) => <SessionCard key={s.id} session={s} isPast />)}
          </div>
        </>
      )}

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
            <Button onClick={handleCreate} disabled={isCreating || !form.title.trim() || !form.scheduledAt} className="w-full">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? "إنشاء الجلسة" : "Create Session")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
