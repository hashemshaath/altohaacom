export interface CertificateLine {
  id: string;
  text: string;
  font: string;
  fontSize: number;
  color: string;
  alignment: "left" | "center" | "right";
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  marginBottom: number;
  isVariable?: boolean; // uses {{var}} syntax for auto-fill
}

export interface LogoItem {
  id: string;
  name: string;
  url: string;
  position: "header-left" | "header-center" | "header-right" | "footer-left" | "footer-center" | "footer-right";
  width: number;
  height: number;
  order: number;
  sourceId?: string; // from certificate_logos table
}

export interface SignatureItem {
  id: string;
  name: string;
  title: string;
  organization: string;
  signatureUrl?: string;
}

export interface CertificateDesign {
  // Language — single language per certificate
  certificateLanguage: "en" | "ar";

  // Layout
  orientation: "landscape" | "portrait";
  paperSize: "a4" | "letter" | "a3";
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  innerPadding: number;

  // Background & Border
  backgroundColor: string;
  backgroundImage: string;
  backgroundPattern: "none" | "subtle" | "elegant" | "ornate" | "damask" | "geometric";
  borderStyle: "none" | "simple" | "double" | "ornate" | "gold" | "classic" | "modern";
  borderColor: string;
  borderWidth: number;
  innerBorderWidth: number;
  cornerOrnament: boolean;

  // Lines — each line independently styled
  lines: CertificateLine[];

  // Logos
  logos: LogoItem[];

  // Signatures
  signatures: SignatureItem[];
  signatureLineWidth: number;
  signatureLineColor: string;

  // Decorations
  showAwardIcon: boolean;
  awardIconColor: string;
  awardIconSize: number;
  showWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  showVerificationCode: boolean;
  showCertificateNumber: boolean;
}

export const fontOptions = [
  { value: "serif", label: "Serif (Times New Roman)" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "sans-serif", label: "Sans-serif (Arial)" },
  { value: "'Segoe UI', sans-serif", label: "Segoe UI" },
  { value: "'Helvetica Neue', sans-serif", label: "Helvetica" },
  { value: "cursive", label: "Cursive" },
  { value: "'Amiri', serif", label: "Amiri (Arabic)" },
  { value: "'Cairo', sans-serif", label: "Cairo (Arabic)" },
  { value: "'Tajawal', sans-serif", label: "Tajawal (Arabic)" },
  { value: "'Noto Naskh Arabic', serif", label: "Noto Naskh Arabic" },
  { value: "'IBM Plex Sans Arabic', sans-serif", label: "IBM Plex Sans Arabic" },
];

export const defaultLines: CertificateLine[] = [
  {
    id: "title",
    text: "Certificate of Achievement",
    font: "'Georgia', serif",
    fontSize: 28,
    color: "#1a1a1a",
    alignment: "center",
    fontWeight: 700,
    letterSpacing: 3,
    lineHeight: 1.2,
    marginBottom: 12,
  },
  {
    id: "subtitle",
    text: "This is to certify that",
    font: "'Segoe UI', sans-serif",
    fontSize: 13,
    color: "#4a4a4a",
    alignment: "center",
    fontWeight: 400,
    letterSpacing: 1,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  {
    id: "recipient",
    text: "{{recipient_name}}",
    font: "'Playfair Display', serif",
    fontSize: 32,
    color: "#1a1a1a",
    alignment: "center",
    fontWeight: 700,
    letterSpacing: 1,
    lineHeight: 1.3,
    marginBottom: 8,
    isVariable: true,
  },
  {
    id: "body",
    text: "has successfully participated in {{event_name}} held at {{event_location}} on {{event_date}}",
    font: "'Segoe UI', sans-serif",
    fontSize: 13,
    color: "#4a4a4a",
    alignment: "center",
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.6,
    marginBottom: 8,
    isVariable: true,
  },
  {
    id: "achievement",
    text: "{{achievement}}",
    font: "'Georgia', serif",
    fontSize: 16,
    color: "#1a1a1a",
    alignment: "center",
    fontWeight: 600,
    letterSpacing: 1,
    lineHeight: 1.4,
    marginBottom: 6,
    isVariable: true,
  },
];

export const defaultDesign: CertificateDesign = {
  certificateLanguage: "en",

  orientation: "landscape",
  paperSize: "a4",
  marginTop: 24,
  marginBottom: 20,
  marginLeft: 28,
  marginRight: 28,
  innerPadding: 16,

  backgroundColor: "#ffffff",
  backgroundImage: "",
  backgroundPattern: "elegant",
  borderStyle: "gold",
  borderColor: "#c9a227",
  borderWidth: 6,
  innerBorderWidth: 1,
  cornerOrnament: true,

  lines: [...defaultLines],

  logos: [],

  signatures: [
    {
      id: "1",
      name: "Competition President",
      title: "President",
      organization: "",
    },
  ],
  signatureLineWidth: 140,
  signatureLineColor: "#9ca3af",

  showAwardIcon: true,
  awardIconColor: "#c9a227",
  awardIconSize: 44,
  showWatermark: false,
  watermarkText: "CERTIFIED",
  watermarkOpacity: 5,
  showVerificationCode: true,
  showCertificateNumber: true,
};

// Arabic defaults
export const defaultLinesAr: CertificateLine[] = [
  {
    id: "title",
    text: "شهادة تقدير",
    font: "'Amiri', serif",
    fontSize: 28,
    color: "#1a1a1a",
    alignment: "center",
    fontWeight: 700,
    letterSpacing: 0,
    lineHeight: 1.4,
    marginBottom: 12,
  },
  {
    id: "subtitle",
    text: "نشهد بأن",
    font: "'Cairo', sans-serif",
    fontSize: 14,
    color: "#4a4a4a",
    alignment: "center",
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  {
    id: "recipient",
    text: "{{recipient_name}}",
    font: "'Amiri', serif",
    fontSize: 32,
    color: "#1a1a1a",
    alignment: "center",
    fontWeight: 700,
    letterSpacing: 0,
    lineHeight: 1.4,
    marginBottom: 8,
    isVariable: true,
  },
  {
    id: "body",
    text: "قد شارك بنجاح في {{event_name}} المقام في {{event_location}} بتاريخ {{event_date}}",
    font: "'Cairo', sans-serif",
    fontSize: 13,
    color: "#4a4a4a",
    alignment: "center",
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.8,
    marginBottom: 8,
    isVariable: true,
  },
  {
    id: "achievement",
    text: "{{achievement}}",
    font: "'Amiri', serif",
    fontSize: 16,
    color: "#1a1a1a",
    alignment: "center",
    fontWeight: 600,
    letterSpacing: 0,
    lineHeight: 1.4,
    marginBottom: 6,
    isVariable: true,
  },
];

export const professionalTemplates = [
  {
    id: "classic-gold",
    name: "Classic Gold",
    nameAr: "ذهبي كلاسيكي",
    preview: "#c9a227",
    design: { ...defaultDesign },
  },
  {
    id: "modern-emerald",
    name: "Modern Emerald",
    nameAr: "زمردي عصري",
    preview: "#10B981",
    design: {
      ...defaultDesign,
      borderStyle: "modern" as const,
      borderColor: "#10B981",
      backgroundPattern: "subtle" as const,
      awardIconColor: "#10B981",
      cornerOrnament: false,
    },
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    nameAr: "أرجواني ملكي",
    preview: "#8B5CF6",
    design: {
      ...defaultDesign,
      borderStyle: "classic" as const,
      borderColor: "#8B5CF6",
      backgroundPattern: "damask" as const,
      awardIconColor: "#8B5CF6",
    },
  },
  {
    id: "executive",
    name: "Executive",
    nameAr: "تنفيذي",
    preview: "#1f2937",
    design: {
      ...defaultDesign,
      borderStyle: "double" as const,
      borderColor: "#1f2937",
      backgroundPattern: "geometric" as const,
      awardIconColor: "#374151",
      cornerOrnament: false,
    },
  },
  {
    id: "minimalist",
    name: "Minimalist",
    nameAr: "بسيط",
    preview: "#6b7280",
    design: {
      ...defaultDesign,
      borderStyle: "simple" as const,
      borderColor: "#d1d5db",
      borderWidth: 2,
      innerBorderWidth: 0,
      backgroundPattern: "none" as const,
      showAwardIcon: false,
      cornerOrnament: false,
    },
  },
  {
    id: "navy-formal",
    name: "Navy Formal",
    nameAr: "كحلي رسمي",
    preview: "#1e3a5f",
    design: {
      ...defaultDesign,
      borderStyle: "classic" as const,
      borderColor: "#1e3a5f",
      awardIconColor: "#c9a227",
      backgroundPattern: "subtle" as const,
    },
  },
];
