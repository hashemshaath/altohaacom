import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileResumeExportProps {
  profile: any;
  careerRecords: any[];
  memberships: any[];
  userAwards: any[];
  userSpecialties: any[];
  displayName: string;
  isAr: boolean;
  isOwnProfile: boolean;
}

export const ProfileResumeExport = memo(function ProfileResumeExport({
  profile, careerRecords, memberships, userAwards, userSpecialties,
  displayName, isAr, isOwnProfile,
}: ProfileResumeExportProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const generateCV = useCallback(async () => {
    setExporting(true);
    try {
      const bio = isAr ? (profile.bio_ar || profile.bio) : (profile.bio || profile.bio_ar);
      const jobTitle = isAr ? (profile.job_title_ar || profile.job_title) : (profile.job_title || profile.job_title_ar);
      const spec = isAr ? (profile.specialization_ar || profile.specialization) : (profile.specialization || profile.specialization_ar);

      // Group career records
      const work = careerRecords.filter((r) => r.record_type === "work");
      const education = careerRecords.filter((r) => r.record_type === "education");
      const certifications = careerRecords.filter((r) => r.record_type === "certification");

      const formatDate = (d: string | null) => {
        if (!d) return "";
        const parts = d.split("-");
        return parts.length >= 2 ? `${parts[1]}/${parts[0]}` : parts[0];
      };

      // Build HTML resume
      const html = `
<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${displayName} - ${isAr ? 'السيرة الذاتية' : 'Resume'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px 32px; }
    .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 24px; }
    .name { font-size: 28px; font-weight: 700; color: #1a1a2e; }
    .title { font-size: 16px; color: #6366f1; margin-top: 4px; font-weight: 500; }
    .contact { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; font-size: 13px; color: #666; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6366f1; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
    .entry { margin-bottom: 14px; }
    .entry-title { font-weight: 600; font-size: 15px; }
    .entry-org { color: #6366f1; font-size: 13px; }
    .entry-date { font-size: 12px; color: #999; }
    .entry-desc { font-size: 13px; color: #555; margin-top: 4px; }
    .skills { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-tag { background: #eef2ff; color: #4f46e5; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .bio { font-size: 14px; color: #444; line-height: 1.7; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${displayName}</div>
    ${jobTitle ? `<div class="title">${jobTitle}</div>` : ''}
    <div class="contact">
      ${profile.email ? `<span>✉ ${profile.email}</span>` : ''}
      ${profile.phone ? `<span>☎ ${profile.phone}</span>` : ''}
      ${profile.city || profile.country_code ? `<span>📍 ${[profile.city, profile.country_code].filter(Boolean).join(', ')}</span>` : ''}
      ${profile.website ? `<span>🔗 ${profile.website}</span>` : ''}
      <span>altoha.com/${profile.username}</span>
    </div>
  </div>

  ${bio ? `<div class="section"><div class="section-title">${isAr ? 'نبذة' : 'Summary'}</div><p class="bio">${bio}</p></div>` : ''}

  ${work.length > 0 ? `
  <div class="section">
    <div class="section-title">${isAr ? 'الخبرة المهنية' : 'Professional Experience'}</div>
    ${work.map((r) => `
    <div class="entry">
      <div class="entry-title">${isAr ? (r.title_ar || r.title) : r.title}</div>
      ${r.entity_name ? `<div class="entry-org">${isAr ? (r.entity_name_ar || r.entity_name) : r.entity_name}</div>` : ''}
      <div class="entry-date">${formatDate(r.start_date)} ${r.is_current ? `- ${isAr ? 'الحالي' : 'Present'}` : r.end_date ? `- ${formatDate(r.end_date)}` : ''}</div>
      ${r.description ? `<div class="entry-desc">${isAr ? (r.description_ar || r.description) : r.description}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  ${education.length > 0 ? `
  <div class="section">
    <div class="section-title">${isAr ? 'التعليم' : 'Education'}</div>
    ${education.map((r) => `
    <div class="entry">
      <div class="entry-title">${isAr ? (r.title_ar || r.title) : r.title}</div>
      ${r.entity_name ? `<div class="entry-org">${isAr ? (r.entity_name_ar || r.entity_name) : r.entity_name}</div>` : ''}
      <div class="entry-date">${formatDate(r.start_date)} ${r.end_date ? `- ${formatDate(r.end_date)}` : ''}</div>
    </div>`).join('')}
  </div>` : ''}

  ${certifications.length > 0 ? `
  <div class="section">
    <div class="section-title">${isAr ? 'الشهادات' : 'Certifications'}</div>
    ${certifications.map((r) => `
    <div class="entry">
      <div class="entry-title">${isAr ? (r.title_ar || r.title) : r.title}</div>
      ${r.entity_name ? `<div class="entry-org">${isAr ? (r.entity_name_ar || r.entity_name) : r.entity_name}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  ${(userSpecialties.length > 0 || spec) ? `
  <div class="section">
    <div class="section-title">${isAr ? 'المهارات' : 'Skills'}</div>
    <div class="skills">
      ${spec ? `<span class="skill-tag">${spec}</span>` : ''}
      ${userSpecialties.map((us) => `<span class="skill-tag">${isAr ? (us.specialties?.name_ar || us.specialties?.name) : us.specialties?.name}</span>`).join('')}
    </div>
  </div>` : ''}

  ${userAwards.length > 0 ? `
  <div class="section">
    <div class="section-title">${isAr ? 'الجوائز' : 'Awards'}</div>
    ${userAwards.map((ua) => `
    <div class="entry">
      <div class="entry-title">${isAr ? (ua.global_awards_system?.name_ar || ua.global_awards_system?.name) : ua.global_awards_system?.name}</div>
    </div>`).join('')}
  </div>` : ''}
</body>
</html>`;

      // Open in new window for print
      const printWindow = window.open("", "_blank", "noopener");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }

      toast({
        title: isAr ? "تم إنشاء السيرة الذاتية" : "Resume generated",
        description: isAr ? "استخدم حوار الطباعة لحفظها كـ PDF" : "Use the print dialog to save as PDF",
      });
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setExporting(false);
    }
  }, [profile, careerRecords, memberships, userAwards, userSpecialties, displayName, isAr, toast]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={generateCV}
          disabled={exporting}
          className="rounded-xl gap-1.5 text-xs border-border/30 hover:border-primary/30 hover:text-primary transition-all"
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          {isAr ? "تصدير CV" : "Export CV"}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        {isAr ? "تحميل السيرة الذاتية كملف PDF" : "Download resume as PDF"}
      </TooltipContent>
    </Tooltip>
  );
});
