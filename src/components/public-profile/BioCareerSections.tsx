import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, GraduationCap, Tv, Award, Trophy, ChevronDown, Calendar, Building2 } from "lucide-react";

interface Props {
  userId: string;
  theme: any;
  isRtl: boolean;
  animated: boolean;
}

const containsArabic = (text?: string | null) => !!text && /[\u0600-\u06FF]/.test(text);

const pick = (isAr: boolean, ar?: string | null, en?: string | null) => {
  const a = (ar || "").trim();
  const e = (en || "").trim();
  if (isAr) return a || e || "";
  if (e && !containsArabic(e)) return e;
  return e || a || "";
};

const fmtDate = (d?: string | null, isAr?: boolean) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" });
  } catch { return d; }
};

function CollapsibleBioSection({ icon: Icon, title, count, theme, children, defaultOpen = true }: {
  icon: any; title: string; count: number; theme: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full mb-2 cursor-pointer select-none group"
      >
        <Icon className="h-3.5 w-3.5" style={{ color: theme.accent }} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] group-hover:opacity-80 transition-opacity" style={{ color: theme.accent }}>
          {title}
        </span>
        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: theme.card, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
          {count}
        </span>
        <div className="flex-1 h-px" style={{ background: theme.border }} />
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform duration-300"
          style={{ color: theme.textMuted, transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      <div
        className="grid transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

function RecordCard({ record, isAr, theme, icon: Icon, iconBg }: {
  record: any; isAr: boolean; theme: any; icon: any; iconBg: string;
}) {
  const title = pick(isAr, record.title_ar, record.title);
  const entity = pick(isAr, record.entity_name_ar, record.entity_name);
  const desc = pick(isAr, record.description_ar, record.description);
  const start = fmtDate(record.start_date, isAr);
  const end = record.is_current ? (isAr ? "الحالي" : "Present") : fmtDate(record.end_date, isAr);

  return (
    <div className="flex gap-3 px-3.5 py-3 rounded-xl transition-all duration-200" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: iconBg }}>
        <Icon className="h-3.5 w-3.5" style={{ color: theme.accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: theme.text }}>{title || "—"}</p>
        {entity && <p className="text-[10px] mt-0.5 truncate" style={{ color: theme.textMuted }}>{entity}</p>}
        <div className="flex items-center gap-1.5 mt-1">
          <Calendar className="h-2.5 w-2.5" style={{ color: theme.textMuted }} />
          <span className="text-[10px]" style={{ color: `${theme.textMuted}99` }}>
            {start}{(start || end) && " – "}{end}
          </span>
          {record.is_current && (
            <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${theme.accent}20`, color: theme.accent }}>
              {isAr ? "حالي" : "Current"}
            </span>
          )}
        </div>
        {desc && (
          <p className="text-[10px] mt-1.5 leading-relaxed line-clamp-2" dir={isAr ? "rtl" : "ltr"} style={{ color: `${theme.textMuted}cc` }}>
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}

export function BioCareerSections({ userId, theme, isRtl, animated }: Props) {
  const { data: records = [] } = useQuery({
    queryKey: ["bio-career-records", userId],
    queryFn: async () => {
      const { data } = await supabase.from("user_career_records").select("*")
        .eq("user_id", userId)
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const workRecords = records.filter((r: any) => r.record_type === "work");
  const eduRecords = records.filter((r: any) => r.record_type === "education");
  const mediaRecords = records.filter((r: any) => r.record_type === "media");
  const certRecords = records.filter((r: any) => r.record_type === "certification");
  const competitionRecords = records.filter((r: any) => r.record_type === "competitions");

  const hasAny = workRecords.length + eduRecords.length + mediaRecords.length + certRecords.length + competitionRecords.length > 0;
  if (!hasAny) return null;

  const iconBg = `${theme.accent}15`;

  return (
    <div className={`transition-all duration-700 delay-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <CollapsibleBioSection icon={Briefcase} title={isRtl ? "الخبرة المهنية" : "Experience"} count={workRecords.length} theme={theme}>
        <div className="space-y-2">
          {workRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Briefcase} iconBg={iconBg} />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={GraduationCap} title={isRtl ? "التعليم" : "Education"} count={eduRecords.length} theme={theme}>
        <div className="space-y-2">
          {eduRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={GraduationCap} iconBg={iconBg} />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={Tv} title={isRtl ? "الظهور الإعلامي" : "Media"} count={mediaRecords.length} theme={theme} defaultOpen={false}>
        <div className="space-y-2">
          {mediaRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Tv} iconBg={iconBg} />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={Award} title={isRtl ? "الشهادات" : "Certifications"} count={certRecords.length} theme={theme} defaultOpen={false}>
        <div className="space-y-2">
          {certRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Award} iconBg={iconBg} />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={Trophy} title={isRtl ? "المسابقات والفعاليات" : "Competitions & Events"} count={competitionRecords.length} theme={theme} defaultOpen={false}>
        <div className="space-y-2">
          {competitionRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Trophy} iconBg={iconBg} />
          ))}
        </div>
      </CollapsibleBioSection>
    </div>
  );
}
