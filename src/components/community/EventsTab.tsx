import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Plus, Check, X, BarChart3, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { toEnglishDigits } from "@/lib/formatNumber";

interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string | null;
  location: string | null;
  is_virtual: boolean;
  max_attendees: number | null;
  status: string;
  organizer_id: string;
  organizer_name: string | null;
  attendees_count: number;
  is_attending: boolean;
}

interface Poll {
  id: string;
  question: string;
  options: { text: string }[];
  expires_at: string | null;
  is_active: boolean;
  author_id: string;
  author_name: string | null;
  votes: Record<number, number>;
  total_votes: number;
  user_vote: number | null;
}

export function EventsTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "", description: "", event_date: "", location: "", is_virtual: false, max_attendees: "",
  });
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""] });

  const fetchData = async () => {
    const [eventsRes, pollsRes] = await Promise.all([
      supabase.from("community_events").select("*").order("event_date", { ascending: true }),
      supabase.from("community_polls").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);

    const eventIds = eventsRes.data?.map((e) => e.id) || [];
    const organizerIds = [...new Set(eventsRes.data?.map((e) => e.organizer_id) || [])];
    const [profilesRes, attendeesRes, userAttendeesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", [...organizerIds, ...(pollsRes.data?.map((p) => p.author_id) || [])]),
      supabase.from("event_attendees").select("event_id").in("event_id", eventIds),
      user ? supabase.from("event_attendees").select("event_id").eq("user_id", user.id).in("event_id", eventIds) : { data: [] },
    ]);

    const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p.full_name]) || []);
    const attendeesMap = new Map<string, number>();
    attendeesRes.data?.forEach((a) => attendeesMap.set(a.event_id, (attendeesMap.get(a.event_id) || 0) + 1));
    const userAttendingSet = new Set(userAttendeesRes.data?.map((a) => a.event_id) || []);

    setEvents((eventsRes.data || []).map((e) => ({
      id: e.id, title: e.title, description: e.description, event_type: e.event_type,
      event_date: e.event_date, location: e.location, is_virtual: e.is_virtual || false,
      max_attendees: e.max_attendees, status: e.status || "upcoming",
      organizer_id: e.organizer_id, organizer_name: profileMap.get(e.organizer_id) || null,
      attendees_count: attendeesMap.get(e.id) || 0,
      is_attending: userAttendingSet.has(e.id),
    })));

    const pollIds = pollsRes.data?.map((p) => p.id) || [];
    const [votesRes, userVotesRes] = await Promise.all([
      supabase.from("poll_votes").select("poll_id, option_index").in("poll_id", pollIds),
      user ? supabase.from("poll_votes").select("poll_id, option_index").eq("user_id", user.id).in("poll_id", pollIds) : { data: [] },
    ]);

    const votesMap = new Map<string, Record<number, number>>();
    votesRes.data?.forEach((v) => {
      const existing = votesMap.get(v.poll_id) || {};
      existing[v.option_index] = (existing[v.option_index] || 0) + 1;
      votesMap.set(v.poll_id, existing);
    });
    const userVoteMap = new Map<string, number>();
    userVotesRes.data?.forEach((v) => userVoteMap.set(v.poll_id, v.option_index));

    setPolls((pollsRes.data || []).map((p) => {
      const votes = votesMap.get(p.id) || {};
      const totalVotes = Object.values(votes).reduce((s, n) => s + n, 0);
      return {
        id: p.id, question: p.question, options: (p.options as any) || [],
        expires_at: p.expires_at, is_active: p.is_active ?? true,
        author_id: p.author_id, author_name: profileMap.get(p.author_id) || null,
        votes, total_votes: totalVotes,
        user_vote: userVoteMap.get(p.id) ?? null,
      };
    }));

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreateEvent = async () => {
    if (!user || !eventForm.title.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("community_events").insert({
      organizer_id: user.id,
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || null,
      event_date: eventForm.event_date || null,
      location: eventForm.location.trim() || null,
      is_virtual: eventForm.is_virtual,
      max_attendees: eventForm.max_attendees ? parseInt(eventForm.max_attendees) : null,
    });
    setCreating(false);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); }
    else { setShowEventForm(false); setEventForm({ title: "", description: "", event_date: "", location: "", is_virtual: false, max_attendees: "" }); fetchData(); }
  };

  const handleCreatePoll = async () => {
    if (!user || !pollForm.question.trim() || pollForm.options.filter(Boolean).length < 2) return;
    setCreating(true);
    const options = pollForm.options.filter(Boolean).map((text) => ({ text: text.trim() }));
    const { error } = await supabase.from("community_polls").insert({
      author_id: user.id, question: pollForm.question.trim(), options,
    });
    setCreating(false);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); }
    else { setShowPollForm(false); setPollForm({ question: "", options: ["", ""] }); fetchData(); }
  };

  const handleAttend = async (eventId: string, isAttending: boolean) => {
    if (!user) return;
    if (isAttending) { await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id); }
    else { await supabase.from("event_attendees").insert({ event_id: eventId, user_id: user.id }); }
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, is_attending: !isAttending, attendees_count: isAttending ? e.attendees_count - 1 : e.attendees_count + 1 } : e));
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user) return;
    const { error } = await supabase.from("poll_votes").insert({ poll_id: pollId, user_id: user.id, option_index: optionIndex });
    if (!error) fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="space-y-2 p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-24" />
            </CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Tabs defaultValue="events">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="events" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              {isAr ? "الفعاليات" : "Events"}
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              {isAr ? "التصويتات" : "Polls"}
            </TabsTrigger>
          </TabsList>
          {user && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={showPollForm ? "outline" : "secondary"}
                className="gap-1 text-xs"
                onClick={() => { setShowPollForm(!showPollForm); setShowEventForm(false); }}
              >
                {showPollForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {isAr ? "تصويت" : "Poll"}
              </Button>
              <Button
                size="sm"
                variant={showEventForm ? "outline" : "default"}
                className="gap-1 text-xs"
                onClick={() => { setShowEventForm(!showEventForm); setShowPollForm(false); }}
              >
                {showEventForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {isAr ? "فعالية" : "Event"}
              </Button>
            </div>
          )}
        </div>

        {/* Event create form */}
        {showEventForm && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isAr ? "فعالية جديدة" : "New Event"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "العنوان" : "Title"}</Label>
                  <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "التاريخ" : "Date"}</Label>
                  <Input type="datetime-local" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الوصف" : "Description"}</Label>
                <Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} rows={2} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "الموقع" : "Location"}</Label>
                  <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "الحد الأقصى" : "Max Attendees"}</Label>
                  <Input type="number" value={eventForm.max_attendees} onChange={(e) => setEventForm({ ...eventForm, max_attendees: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setShowEventForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleCreateEvent} disabled={creating || !eventForm.title.trim()}>
                  {creating ? "..." : isAr ? "إنشاء" : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Poll create form */}
        {showPollForm && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isAr ? "تصويت جديد" : "New Poll"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "السؤال" : "Question"}</Label>
                <Input value={pollForm.question} onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })} />
              </div>
              {pollForm.options.map((opt, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-xs">{isAr ? `الخيار ${i + 1}` : `Option ${i + 1}`}</Label>
                  <Input value={opt} onChange={(e) => { const opts = [...pollForm.options]; opts[i] = e.target.value; setPollForm({ ...pollForm, options: opts }); }} />
                </div>
              ))}
              {pollForm.options.length < 6 && (
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ""] })}>
                  <Plus className="h-3.5 w-3.5" />{isAr ? "إضافة خيار" : "Add Option"}
                </Button>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setShowPollForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleCreatePoll} disabled={creating || !pollForm.question.trim() || pollForm.options.filter(Boolean).length < 2}>
                  {creating ? "..." : isAr ? "إنشاء" : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value="events">
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event) => (
              <Card key={event.id} className="border-border/50 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{event.title}</h3>
                    <Badge
                      variant={event.status === "upcoming" ? "default" : "secondary"}
                      className="shrink-0 text-[10px]"
                    >
                      {event.status}
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
                  )}
                  <div className="mb-3 flex flex-wrap gap-2.5 text-[10px] text-muted-foreground">
                    {event.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {toEnglishDigits(format(new Date(event.event_date), "MMM d, yyyy HH:mm"))}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.attendees_count}{event.max_attendees ? `/${event.max_attendees}` : ""}
                    </span>
                  </div>
                  {user && event.organizer_id !== user.id && (
                    <Button
                      size="sm"
                      variant={event.is_attending ? "outline" : "default"}
                      className="gap-1 text-xs"
                      onClick={() => handleAttend(event.id, event.is_attending)}
                    >
                      {event.is_attending ? (
                        <><Check className="h-3.5 w-3.5" />{isAr ? "مسجل" : "Registered"}</>
                      ) : (
                        isAr ? "سجّل الآن" : "Register"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {events.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center py-16 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
                    <CalendarDays className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "لا توجد فعاليات بعد" : "No events yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="polls">
          <div className="mx-auto max-w-xl space-y-3">
            {polls.map((poll) => (
              <Card key={poll.id}>
                <CardContent className="p-4">
                  <h3 className="mb-3 text-sm font-semibold">{poll.question}</h3>
                  <div className="space-y-2">
                    {poll.options.map((opt, i) => {
                      const count = poll.votes[i] || 0;
                      const pct = poll.total_votes > 0 ? Math.round((count / poll.total_votes) * 100) : 0;
                      const hasVoted = poll.user_vote !== null;
                      return (
                        <button
                          key={i}
                          className={`w-full rounded-lg border p-3 text-start transition-colors ${
                            poll.user_vote === i
                              ? "border-primary bg-primary/5"
                              : hasVoted
                              ? "cursor-default"
                              : "cursor-pointer hover:bg-accent/50"
                          }`}
                          onClick={() => !hasVoted && user && handleVote(poll.id, i)}
                          disabled={hasVoted || !user}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{opt.text}</span>
                            {hasVoted && <span className="text-xs font-medium">{pct}%</span>}
                          </div>
                          {hasVoted && (
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {poll.total_votes} {isAr ? "صوت" : "votes"}
                  </p>
                </CardContent>
              </Card>
            ))}
            {polls.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <div className="mb-3 rounded-2xl bg-muted/60 p-4">
                    <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "لا توجد تصويتات بعد" : "No polls yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
