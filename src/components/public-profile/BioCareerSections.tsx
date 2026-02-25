import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, GraduationCap, Tv, Award, Trophy, ChevronDown, Calendar, Scale, Users, Medal, CalendarCheck } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";

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
    const parts = d.split("-");
    if (parts.length === 1) return parts[0];
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

const JUDGING_POSITIONS_MAP: Record<string, { en: string; ar: string }> = {
  head_judge: { en: "Head Judge", ar: "رئيس لجنة التحكيم" },
  judge: { en: "Judge", ar: "حَكَم" },
  assistant_judge: { en: "Assistant Judge", ar: "مساعد حكم" },
  technical_judge: { en: "Technical Judge", ar: "حكم تقني" },
};

const MEDAL_MAP: Record<string, { en: string; ar: string; emoji: string }> = {
  gold: { en: "Gold", ar: "ذهبية", emoji: "🥇" },
  silver: { en: "Silver", ar: "فضية", emoji: "🥈" },
  bronze: { en: "Bronze", ar: "برونزية", emoji: "🥉" },
  diploma: { en: "Diploma", ar: "دبلوم", emoji: "📜" },
  best_in_show: { en: "Best in Show", ar: "الأفضل", emoji: "🏆" },
};

const COMPETITION_ROLES_MAP: Record<string, { en: string; ar: string }> = {
  participant: { en: "Participant", ar: "مشارك" },
  organizer: { en: "Organizer", ar: "منظّم" },
  judge: { en: "Judge", ar: "حَكَم" },
  volunteer: { en: "Volunteer", ar: "متطوع" },
  sponsor: { en: "Sponsor", ar: "راعي" },
  coordinator: { en: "Coordinator", ar: "منسّق" },
  speaker: { en: "Speaker", ar: "متحدث" },
};

function RecordCard({ record, isAr, theme, icon: Icon, iconBg, sectionType }: {
  record: any; isAr: boolean; theme: any; icon: any; iconBg: string; sectionType: string;
}) {
  const title = pick(isAr, record.title_ar, record.title);
  const entity = pick(isAr, record.entity_name_ar, record.entity_name);
  const desc = pick(isAr, record.description_ar, record.description);
  const start = fmtDate(record.start_date, isAr);
  const end = record.is_current ? (isAr ? "الحالي" : "Present") : fmtDate(record.end_date, isAr);
  const flag = record.country_code ? countryFlag(record.country_code) : "";

  // Section-specific badges
  const badges: { label: string; bg: string }[] = [];

  if (sectionType === "judging" && record.employment_type) {
    const pos = JUDGING_POSITIONS_MAP[record.employment_type];
    if (pos) badges.push({ label: isAr ? pos.ar : pos.en, bg: `${theme.accent}15` });
  }

  if (sectionType === "competitions" && record.grade) {
    const medal = MEDAL_MAP[record.grade];
    if (medal) badges.push({ label: `${medal.emoji} ${isAr ? medal.ar : medal.en}`, bg: `${theme.accent}20` });
  }

  if (sectionType === "competitions" && record.employment_type) {
    const role = COMPETITION_ROLES_MAP[record.employment_type];
    if (role) badges.push({ label: isAr ? role.ar : role.en, bg: `${theme.accent}10` });
  }

  if (record.is_current) {
    badges.push({ label: isAr ? "حالي" : "Current", bg: `${theme.accent}20` });
  }

  // Media-specific: host
  const host = sectionType === "media" && record.department ? record.department : null;

  return (
    <div className="flex gap-3 px-3.5 py-3 rounded-xl transition-all duration-200" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: iconBg }}>
        <Icon className="h-3.5 w-3.5" style={{ color: theme.accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: theme.text }}>{title || "—"}</p>
        {entity && <p className="text-[10px] mt-0.5 truncate" style={{ color: theme.textMuted }}>{entity}</p>}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {(start || end) && <Calendar className="h-2.5 w-2.5" style={{ color: theme.textMuted }} />}
          {(start || end) && (
            <span className="text-[10px]" style={{ color: `${theme.textMuted}99` }}>
              {start}{end && start ? " – " : ""}{end}
            </span>
          )}
          {record.location && (
            <span className="text-[10px]" style={{ color: `${theme.textMuted}99` }}>
              {flag && `${flag} `}{record.location}
            </span>
          )}
          {!record.location && flag && (
            <span className="text-[10px]">{flag}</span>
          )}
          {host && (
            <span className="text-[10px]" style={{ color: `${theme.textMuted}cc` }}>
              🎤 {host}
            </span>
          )}
          {badges.map((b, i) => (
            <span key={i} className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: b.bg, color: theme.accent }}>
              {b.label}
            </span>
          ))}
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
  const judgingRecords = records.filter((r: any) => r.record_type === "judging");
  const competitionRecords = records.filter((r: any) => r.record_type === "competitions");
  const mediaRecords = records.filter((r: any) => r.record_type === "media");
  const organizingRecords = records.filter((r: any) => r.record_type === "organizing");
  const certRecords = records.filter((r: any) => r.record_type === "certification");

  const hasAny = workRecords.length + eduRecords.length + judgingRecords.length + competitionRecords.length + mediaRecords.length + organizingRecords.length + certRecords.length > 0;
  if (!hasAny) return null;

  const iconBg = `${theme.accent}15`;

  return (
    <div className={`transition-all duration-700 delay-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <CollapsibleBioSection icon={Briefcase} title={isRtl ? "الخبرة المهنية" : "Experience"} count={workRecords.length} theme={theme}>
        <div className="space-y-2">
          {workRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Briefcase} iconBg={iconBg} sectionType="work" />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={GraduationCap} title={isRtl ? "التعليم" : "Education"} count={eduRecords.length} theme={theme}>
        <div className="space-y-2">
          {eduRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={GraduationCap} iconBg={iconBg} sectionType="education" />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={Scale} title={isRtl ? "تحكيم المسابقات" : "Judging Competitions"} count={judgingRecords.length} theme={theme} defaultOpen={false}>
        <div className="space-y-2">
          {judgingRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Scale} iconBg={iconBg} sectionType="judging" />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={Trophy} title={isRtl ? "المسابقات المشارك فيها" : "Competitions"} count={competitionRecords.length} theme={theme} defaultOpen={false}>
        <div className="space-y-2">
          {competitionRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Trophy} iconBg={iconBg} sectionType="competitions" />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={Tv} title={isRtl ? "المقابلات التلفزيونية" : "Television Interviews"} count={mediaRecords.length} theme={theme} defaultOpen={false}>
        <div className="space-y-2">
          {mediaRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Tv} iconBg={iconBg} sectionType="media" />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={CalendarCheck} title={isRtl ? "تنظيم الفعاليات" : "Organizing Events"} count={organizingRecords.length} theme={theme} defaultOpen={false}>
        <div className="space-y-2">
          {organizingRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={CalendarCheck} iconBg={iconBg} sectionType="organizing" />
          ))}
        </div>
      </CollapsibleBioSection>

      <CollapsibleBioSection icon={Award} title={isRtl ? "الشهادات" : "Certifications"} count={certRecords.length} theme={theme} defaultOpen={false}>
        <div className="space-y-2">
          {certRecords.map((r: any) => (
            <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Award} iconBg={iconBg} sectionType="certification" />
          ))}
        </div>
      </CollapsibleBioSection>
    </div>
  );
}
