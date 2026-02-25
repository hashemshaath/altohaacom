import { useState, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, GraduationCap, Tv, Award, Trophy, ChevronDown, Calendar, Scale, Users, Medal, CalendarCheck, FileText } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import {
  EDUCATION_LEVELS, JUDGING_POSITIONS, MEDAL_TYPES, COMPETITION_ROLES,
  MEMBERSHIP_TYPES, CERTIFICATE_TYPES, COUNTRIES,
  labelFor,
} from "@/components/admin/career-timeline/constants";
import { BioCareerSkeleton } from "./BioCareerSkeleton";

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

// ── Section Icon Map ──
const SECTION_ICONS: Record<string, any> = {
  work: Briefcase, education: GraduationCap, judging: Scale, memberships: Users,
  competitions: Trophy, awards: Medal, media: Tv, organizing: CalendarCheck,
};

const CollapsibleBioSection = memo(function CollapsibleBioSection({ icon: Icon, title, count, theme, children, defaultOpen = true }: {
  icon: any; title: string; count: number; theme: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;

  return (
    <div className="mb-4">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full mb-2 cursor-pointer select-none group">
        <Icon className="h-3.5 w-3.5" style={{ color: theme.accent }} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] group-hover:opacity-80 transition-opacity" style={{ color: theme.accent }}>
          {title}
        </span>
        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: theme.card, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
          {count}
        </span>
        <div className="flex-1 h-px" style={{ background: theme.border }} />
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300"
          style={{ color: theme.textMuted, transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>
      <div className="grid transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
});

const RecordCard = memo(function RecordCard({ record, isAr, theme, icon: Icon, iconBg, sectionType }: {
  record: any; isAr: boolean; theme: any; icon: any; iconBg: string; sectionType: string;
}) {
  const title = pick(isAr, record.title_ar, record.title);
  const entity = pick(isAr, record.entity_name_ar, record.entity_name);
  const desc = pick(isAr, record.description_ar, record.description);
  const start = fmtDate(record.start_date, isAr);
  const end = record.is_current ? (isAr ? "الحالي" : "Present") : fmtDate(record.end_date, isAr);
  const flag = record.country_code ? countryFlag(record.country_code) : "";

  const badges: { label: string; bg: string }[] = [];

  if (sectionType === "education") {
    if (record.education_level) badges.push({ label: labelFor(record.education_level, EDUCATION_LEVELS, isAr), bg: `${theme.accent}15` });
    if (record.field_of_study) {
      const fieldText = isAr ? (record.field_of_study_ar || record.field_of_study) : record.field_of_study;
      badges.push({ label: fieldText, bg: `${theme.accent}10` });
    }
  }
  if (sectionType === "judging" && record.employment_type) badges.push({ label: labelFor(record.employment_type, JUDGING_POSITIONS, isAr), bg: `${theme.accent}15` });
  if (sectionType === "competitions" && record.grade) {
    const medal = MEDAL_TYPES.find(m => m.value === record.grade);
    if (medal) badges.push({ label: `${medal.emoji || ""} ${isAr ? medal.ar : medal.en}`.trim(), bg: `${theme.accent}20` });
  }
  if (sectionType === "competitions" && record.employment_type) badges.push({ label: labelFor(record.employment_type, COMPETITION_ROLES, isAr), bg: `${theme.accent}10` });
  if (sectionType === "work" && record.employment_type) {
    badges.push({ label: labelFor(record.employment_type, [
      { value: "full_time", en: "Full-time", ar: "دوام كامل" }, { value: "part_time", en: "Part-time", ar: "دوام جزئي" },
      { value: "contract", en: "Contract", ar: "عقد" }, { value: "internship", en: "Internship", ar: "تدريب" },
      { value: "freelance", en: "Freelance", ar: "عمل حر" }, { value: "volunteer", en: "Volunteer", ar: "تطوعي" },
    ], isAr), bg: `${theme.accent}10` });
  }
  if (record.is_current) badges.push({ label: isAr ? "حالي" : "Current", bg: `${theme.accent}20` });

  const host = sectionType === "media" && record.department ? record.department : null;
  const guest = sectionType === "media" && record.field_of_study ? record.field_of_study : null;
  const gpa = sectionType === "education" && record.grade ? record.grade : null;

  return (
    <div className="flex gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 hover:shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
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
          {!record.location && flag && <span className="text-[10px]">{flag}</span>}
          {host && <span className="text-[10px]" style={{ color: `${theme.textMuted}cc` }}>🎤 {host}</span>}
          {guest && <span className="text-[10px]" style={{ color: `${theme.textMuted}cc` }}>👤 {guest}</span>}
          {gpa && <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${theme.accent}10`, color: theme.accent }}>GPA: {gpa}</span>}
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
});

const MembershipCard = memo(function MembershipCard({ membership, isAr, theme, iconBg }: { membership: any; isAr: boolean; theme: any; iconBg: string }) {
  const entity = membership.culinary_entities;
  const name = isAr ? (entity?.name_ar || entity?.name) : entity?.name;
  const title = isAr ? (membership.title_ar || membership.title) : membership.title;
  const typeLabel = membership.membership_type ? labelFor(membership.membership_type, MEMBERSHIP_TYPES, isAr) : null;
  const date = fmtDate(membership.enrollment_date || membership.created_at, isAr);
  const cityCountry = membership.notes ? membership.notes.split("|").filter(Boolean).join(", ") : "";

  return (
    <div className="flex gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 hover:shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
      {entity?.logo_url ? (
        <img src={entity.logo_url} className="h-8 w-8 rounded-lg object-cover shrink-0" alt="" loading="lazy" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: iconBg }}>
          <Users className="h-3.5 w-3.5" style={{ color: theme.accent }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: theme.text }}>{name || "—"}</p>
        {title && <p className="text-[10px] mt-0.5 truncate" style={{ color: theme.textMuted }}>{title}</p>}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {date && <Calendar className="h-2.5 w-2.5" style={{ color: theme.textMuted }} />}
          {date && <span className="text-[10px]" style={{ color: `${theme.textMuted}99` }}>{date}</span>}
          {cityCountry && <span className="text-[10px]" style={{ color: `${theme.textMuted}99` }}>{cityCountry}</span>}
          {typeLabel && (
            <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${theme.accent}15`, color: theme.accent }}>
              {typeLabel}
            </span>
          )}
          {membership.status === "active" && (
            <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${theme.accent}20`, color: theme.accent }}>
              {isAr ? "نشط" : "Active"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

const AwardCard = memo(function AwardCard({ cert, isAr, theme, iconBg }: { cert: any; isAr: boolean; theme: any; iconBg: string }) {
  const eventName = pick(isAr, cert.event_name_ar, cert.event_name);
  const achievement = pick(isAr, cert.achievement_ar, cert.achievement);
  const date = fmtDate(cert.event_date || cert.issued_at, isAr);
  const typeInfo = cert.type ? CERTIFICATE_TYPES.find(t => t.value === cert.type) : null;

  return (
    <div className="flex gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 hover:shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: iconBg }}>
        <Medal className="h-3.5 w-3.5" style={{ color: theme.accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: theme.text }}>{eventName || "—"}</p>
        {achievement && <p className="text-[10px] mt-0.5 truncate" style={{ color: theme.textMuted }}>{achievement}</p>}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {date && <Calendar className="h-2.5 w-2.5" style={{ color: theme.textMuted }} />}
          {date && <span className="text-[10px]" style={{ color: `${theme.textMuted}99` }}>{date}</span>}
          {typeInfo && (
            <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${theme.accent}15`, color: theme.accent }}>
              {typeInfo.emoji} {isAr ? typeInfo.ar : typeInfo.en}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Section order from DB ──
const DEFAULT_SECTION_ORDER = ["work", "education", "judging", "memberships", "competitions", "awards", "media", "organizing"];
const DEFAULT_SECTION_LABELS: Record<string, [string, string]> = {
  work: ["الخبرة المهنية", "Experience"],
  education: ["التعليم", "Education"],
  judging: ["تحكيم المسابقات", "Judging Competitions"],
  memberships: ["العضويات", "Memberships"],
  competitions: ["المسابقات المشارك فيها", "Competitions"],
  awards: ["الجوائز والميداليات", "Awards & Medals"],
  media: ["المقابلات التلفزيونية", "Television Interviews"],
  organizing: ["تنظيم الفعاليات", "Organizing Events"],
};

export function BioCareerSections({ userId, theme, isRtl, animated }: Props) {
  const { data: records = [], isLoading: recordsLoading } = useQuery({
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

  const { data: memberships = [] } = useQuery({
    queryKey: ["bio-memberships", userId],
    queryFn: async () => {
      const { data } = await supabase.from("entity_memberships")
        .select("*, culinary_entities(name, name_ar, logo_url, type)")
        .eq("user_id", userId).eq("status", "active")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["bio-certificates", userId],
    queryFn: async () => {
      const { data } = await supabase.from("certificates")
        .select("id, event_name, event_name_ar, achievement, achievement_ar, type, event_date, issued_at")
        .eq("recipient_id", userId).eq("status", "issued").eq("visibility", "public")
        .order("issued_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: userSections = [] } = useQuery({
    queryKey: ["bio-career-sections", userId],
    queryFn: async () => {
      const { data } = await supabase.from("user_career_sections")
        .select("section_key, name_en, name_ar, sort_order")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true });
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const orderedSections = useMemo(() => {
    if (userSections.length > 0) {
      const sectionOrder = userSections.map((s: any) => s.section_key);
      for (const key of DEFAULT_SECTION_ORDER) {
        if (!sectionOrder.includes(key)) sectionOrder.push(key);
      }
      return sectionOrder.filter((k: string) => DEFAULT_SECTION_ORDER.includes(k));
    }
    return DEFAULT_SECTION_ORDER;
  }, [userSections]);

  const getSectionLabel = (key: string) => {
    const dbSection = userSections.find((s: any) => s.section_key === key);
    if (dbSection) return isRtl ? (dbSection.name_ar || dbSection.name_en) : dbSection.name_en;
    const defaults = DEFAULT_SECTION_LABELS[key];
    return defaults ? (isRtl ? defaults[0] : defaults[1]) : key;
  };

  const recordsByType = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const r of records) {
      if (!map[r.record_type]) map[r.record_type] = [];
      map[r.record_type].push(r);
    }
    return map;
  }, [records]);

  const getCount = (key: string) => {
    if (key === "memberships") return memberships.length;
    if (key === "awards") return certificates.length;
    return (recordsByType[key] || []).length;
  };

  const totalCount = orderedSections.reduce((sum: number, k: string) => sum + getCount(k), 0);

  if (recordsLoading) return <BioCareerSkeleton />;
  if (totalCount === 0) return null;

  const iconBg = `${theme.accent}15`;
  const primarySections = new Set(["work", "education"]);

  return (
    <div className={`transition-all duration-700 delay-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      {orderedSections.map((key: string) => {
        const count = getCount(key);
        const Icon = SECTION_ICONS[key] || FileText;
        const label = getSectionLabel(key);
        const isDefault = primarySections.has(key);

        if (key === "memberships") {
          return (
            <CollapsibleBioSection key={key} icon={Icon} title={label} count={count} theme={theme} defaultOpen={isDefault}>
              <div className="space-y-2">
                {memberships.map((m: any) => <MembershipCard key={m.id} membership={m} isAr={isRtl} theme={theme} iconBg={iconBg} />)}
              </div>
            </CollapsibleBioSection>
          );
        }
        if (key === "awards") {
          return (
            <CollapsibleBioSection key={key} icon={Icon} title={label} count={count} theme={theme} defaultOpen={isDefault}>
              <div className="space-y-2">
                {certificates.map((cert: any) => <AwardCard key={cert.id} cert={cert} isAr={isRtl} theme={theme} iconBg={iconBg} />)}
              </div>
            </CollapsibleBioSection>
          );
        }
        const sectionRecords = recordsByType[key] || [];
        return (
          <CollapsibleBioSection key={key} icon={Icon} title={label} count={count} theme={theme} defaultOpen={isDefault}>
            <div className="space-y-2">
              {sectionRecords.map((r: any) => (
                <RecordCard key={r.id} record={r} isAr={isRtl} theme={theme} icon={Icon} iconBg={iconBg} sectionType={key} />
              ))}
            </div>
          </CollapsibleBioSection>
        );
      })}
    </div>
  );
}
