import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { tl, type LangCode } from "@/lib/socialLinksTranslations";
import { getVideoEmbedUrl } from "@/lib/socialLinksConstants";

// ── Animated Number ──
export const AnimatedNumber = memo(function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
});

// ── Floating Particles ──
export const FloatingParticles = memo(function FloatingParticles({ color, count = 20 }: { color: string; count?: number }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 2 + Math.random() * 3, duration: 8 + Math.random() * 12, delay: Math.random() * 5,
  })), [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full animate-pulse" style={{
          left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
          background: color || "rgba(255,255,255,0.15)", opacity: 0.3,
          animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
        }} />
      ))}
      <style>{`@keyframes float-particle { 0% { transform: translateY(0) translateX(0); opacity: 0.1; } 50% { opacity: 0.4; } 100% { transform: translateY(-80px) translateX(30px); opacity: 0.05; } }`}</style>
    </div>
  );
});

// ── Typing Text ──
export const TypingText = memo(function TypingText({ text, speed = 40, style, className }: { text: string; speed?: number; style?: React.CSSProperties; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) return;
    setDisplayed(""); setDone(false);
    let i = 0;
    const interval = setInterval(() => { i++; setDisplayed(text.slice(0, i)); if (i >= text.length) { clearInterval(interval); setDone(true); } }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span className={className} style={style}>{displayed}{!done && <span className="animate-pulse">|</span>}</span>;
});

// ── Video Embed ──
export const VideoEmbed = memo(function VideoEmbed({ url, theme }: { url: string; theme: any }) {
  const embedUrl = getVideoEmbedUrl(url);
  if (!embedUrl) return null;
  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ border: `1px solid ${theme.border}`, background: theme.card }}>
      <div className="relative" style={{ paddingBottom: "56.25%" }}>
        <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" style={{ border: "none" }} />
      </div>
    </div>
  );
});

// ── Section Divider ──
export function SectionDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-3 my-5">
      <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <div className="h-1 w-1 rounded-full" style={{ background: color }} />
      <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  );
}

// ── Contact Form ──
export function ContactFormSection({ theme, lang, isRtl, profileUserId, ownerName }: {
  theme: any; lang: LangCode; isRtl: boolean; profileUserId: string; ownerName: string;
}) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSend = useCallback(async () => {
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: profileUserId, title: `📩 ${form.name}`, title_ar: `📩 ${form.name}`,
        body: `${form.email}: ${form.message}`, body_ar: `${form.email}: ${form.message}`,
        type: "contact_form", metadata: { sender_name: form.name, sender_email: form.email, message: form.message },
      });
      if (error) throw error;
      setSent(true); setForm({ name: "", email: "", message: "" });
      toast({ title: tl("contactSent", lang) });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSending(false); }
  }, [form, profileUserId, lang, toast]);

  if (sent) {
    return (
      <div className="text-center py-6 rounded-2xl" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <Check className="h-8 w-8 mx-auto mb-2" style={{ color: theme.accent }} />
        <p className="text-sm font-semibold" style={{ color: theme.text }}>{tl("contactSent", lang)}</p>
      </div>
    );
  }

  const inputStyle = { background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text };
  return (
    <div className="space-y-3 rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={tl("contactName", lang)}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200" style={inputStyle}
        onFocus={e => (e.target.style.borderColor = theme.accent)} onBlur={e => (e.target.style.borderColor = theme.border)} />
      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={tl("contactEmail", lang)}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200" dir="ltr" style={inputStyle}
        onFocus={e => (e.target.style.borderColor = theme.accent)} onBlur={e => (e.target.style.borderColor = theme.border)} />
      <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder={tl("contactMessage", lang)}
        rows={3} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition-all duration-200" style={inputStyle}
        onFocus={e => (e.target.style.borderColor = theme.accent)} onBlur={e => (e.target.style.borderColor = theme.border)} />
      <button onClick={handleSend} disabled={sending || !form.name || !form.email || !form.message}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`, color: theme.bg.includes("fff") ? "#ffffff" : "#0a0a12", boxShadow: `0 4px 20px ${theme.accentLight}` }}>
        {sending ? "..." : tl("contactSend", lang)}
      </button>
    </div>
  );
}

// ── Email Subscription ──
export function EmailSubscriptionSection({ theme, lang, isRtl, profileUserId, pageId, extra }: {
  theme: any; lang: LangCode; isRtl: boolean; profileUserId: string; pageId: string; extra: any;
}) {
  const [subEmail, setSubEmail] = useState("");
  const [subName, setSubName] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = useCallback(async () => {
    if (!subEmail) return;
    setSubscribing(true);
    try {
      const { error: subErr } = await supabase.from("bio_subscribers").insert({
        page_id: pageId, page_owner_id: profileUserId, email: subEmail, name: subName || null,
      } as any);
      if (subErr) {
        if (subErr.code === "23505") { toast({ title: tl("subscribed", lang) }); setSubscribed(true); }
        else throw subErr;
      } else { setSubscribed(true); toast({ title: tl("subscribed", lang) }); setSubEmail(""); setSubName(""); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSubscribing(false); }
  }, [subEmail, subName, pageId, profileUserId, lang, toast]);

  if (subscribed) {
    return (
      <div className="text-center py-3">
        <Check className="h-6 w-6 mx-auto mb-1" style={{ color: theme.accent }} />
        <p className="text-xs font-semibold" style={{ color: theme.text }}>{tl("subscribed", lang)}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-2 mb-1" style={{ justifyContent: extra.text_align === "start" ? "flex-start" : extra.text_align === "end" ? "flex-end" : "center" }}>
        <Mail className="h-4 w-4" style={{ color: theme.accent }} />
        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
          {isRtl ? (extra.email_collection_title_ar || extra.email_collection_title) : (extra.email_collection_title || "Stay Connected")}
        </h3>
      </div>
      <p className="text-xs" style={{ color: theme.textMuted }}>
        {isRtl ? (extra.email_collection_description_ar || extra.email_collection_description) : (extra.email_collection_description || "Subscribe to get updates")}
      </p>
      <div className="space-y-2">
        <input value={subName} onChange={e => setSubName(e.target.value)} placeholder={tl("contactName", lang)}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }} />
        <input type="email" value={subEmail} onChange={e => setSubEmail(e.target.value)} placeholder={tl("contactEmail", lang)} dir="ltr"
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background: theme.btnBg, border: `1px solid ${theme.border}`, color: theme.text }} />
        <button onClick={handleSubscribe} disabled={subscribing || !subEmail}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`, color: theme.bg.includes("fff") ? "#ffffff" : "#0a0a12" }}>
          {subscribing ? <Loader2 className="h-4 w-4 mx-auto animate-spin" /> : tl("subscribe", lang)}
        </button>
      </div>
    </div>
  );
}
