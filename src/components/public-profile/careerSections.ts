import { Briefcase, Gavel, Users, GraduationCap, Tv, Award } from "lucide-react";

export interface SectionDef {
  key: string;
  visKey: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  labelEn: string;
  labelAr: string;
  defaultOpen: boolean;
  showEmpty?: boolean;
  emptyDescEn?: string;
  emptyDescAr?: string;
}

export const CAREER_SECTIONS: SectionDef[] = [
  { key: "work", visKey: "career", icon: Briefcase, iconBg: "bg-chart-3/8", iconColor: "text-chart-3", labelEn: "Professional Experience", labelAr: "الخبرة المهنية", defaultOpen: true, showEmpty: true, emptyDescEn: "No experience added yet", emptyDescAr: "لم يتم إضافة خبرة مهنية بعد" },
  { key: "judging", visKey: "career", icon: Gavel, iconBg: "bg-chart-5/8", iconColor: "text-chart-5", labelEn: "Judging", labelAr: "التحكيم", defaultOpen: true },
  { key: "participation", visKey: "career", icon: Users, iconBg: "bg-chart-1/8", iconColor: "text-chart-1", labelEn: "Participation & Events", labelAr: "المشاركات والفعاليات", defaultOpen: false },
  { key: "education", visKey: "education", icon: GraduationCap, iconBg: "bg-chart-2/8", iconColor: "text-chart-2", labelEn: "Education", labelAr: "التعليم", defaultOpen: true, showEmpty: true, emptyDescEn: "No education added yet", emptyDescAr: "لم يتم إضافة تعليم بعد" },
  { key: "media", visKey: "career", icon: Tv, iconBg: "bg-chart-4/8", iconColor: "text-chart-4", labelEn: "Media Appearances", labelAr: "الظهور الإعلامي", defaultOpen: true },
  { key: "certification", visKey: "career", icon: Award, iconBg: "bg-chart-5/8", iconColor: "text-chart-5", labelEn: "Professional Certifications", labelAr: "الشهادات المهنية", defaultOpen: true },
];

/** Categorize career records into logical sections */
export function categorizeCareerRecords(careerRecords: any[]) {
  const isJudging = (r) => /Role:\s*Judge|Head.?Judge/i.test(r.description || "") || /Role:\s*Judge|Head.?Judge/i.test(r.description_ar || "");
  const isMediaInWork = (r) => /^📺|^📻|^🎙️|^📰|^📖|^🌐|TV\b|Radio\b|Podcast\b|interview/i.test(r.description || "");
  const isParticipation = (r) => /Role:\s*(Organizer|Participant)/i.test(r.description || "");

  const allWork = careerRecords.filter((r) => r.record_type === "work");
  const judging = allWork.filter(isJudging);
  const mediaInWork = allWork.filter((r) => !isJudging(r) && isMediaInWork(r));
  const participation = allWork.filter((r) => !isJudging(r) && !isMediaInWork(r) && isParticipation(r));
  const work = allWork.filter((r) => !isJudging(r) && !isMediaInWork(r) && !isParticipation(r));

  return {
    work,
    judging,
    participation,
    education: careerRecords.filter((r) => r.record_type === "education"),
    media: [...careerRecords.filter((r) => r.record_type === "media"), ...mediaInWork],
    certification: careerRecords.filter((r) => r.record_type === "certification"),
  };
}
