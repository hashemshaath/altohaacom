export interface CVPersonalInfo {
  full_name?: string;
  full_name_ar?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  second_nationality?: string;
  country_code?: string;
  city?: string;
  location?: string;
  national_address?: string;
  date_of_birth?: string;
  gender?: string;
  job_title?: string;
  job_title_ar?: string;
  specialization?: string;
  specialization_ar?: string;
  bio?: string;
  bio_ar?: string;
  years_of_experience?: number;
  experience_level?: string;
  website?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
}

export interface CVEducation {
  institution: string;
  institution_ar?: string;
  degree: string;
  degree_ar?: string;
  education_level?: string;
  field_of_study?: string;
  field_of_study_ar?: string;
  grade?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  location?: string;
  country_code?: string;
}

export interface CVWorkExperience {
  company: string;
  company_ar?: string;
  title: string;
  title_ar?: string;
  employment_type?: string;
  department?: string;
  department_ar?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  location?: string;
  country_code?: string;
  tasks?: string[];
  achievements?: string[];
}

export interface CVCompetition {
  name: string;
  name_ar?: string;
  role?: string;
  edition?: string;
  year?: number;
  country_code?: string;
  city?: string;
  achievement?: string;
  achievement_ar?: string;
}

export interface CVCertification {
  name: string;
  name_ar?: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface CVMediaAppearance {
  type?: string;
  channel_name: string;
  program_name?: string;
  date?: string;
  description?: string;
  country_code?: string;
}

export interface CVLanguage {
  language: string;
  level?: string;
}

export interface CVData {
  personal_info: CVPersonalInfo;
  education?: CVEducation[];
  work_experience?: CVWorkExperience[];
  competitions?: CVCompetition[];
  certifications?: CVCertification[];
  media_appearances?: CVMediaAppearance[];
  skills?: string[];
  languages?: CVLanguage[];
}

export const COUNTRY_FLAGS: Record<string, string> = {
  SA: "🇸🇦", AE: "🇦🇪", KW: "🇰🇼", BH: "🇧🇭", QA: "🇶🇦", OM: "🇴🇲",
  EG: "🇪🇬", JO: "🇯🇴", LB: "🇱🇧", IQ: "🇮🇶", SY: "🇸🇾", PS: "🇵🇸",
  MA: "🇲🇦", TN: "🇹🇳", DZ: "🇩🇿", LY: "🇱🇾", SD: "🇸🇩", YE: "🇾🇪",
  US: "🇺🇸", GB: "🇬🇧", FR: "🇫🇷", DE: "🇩🇪", IT: "🇮🇹", ES: "🇪🇸",
  TR: "🇹🇷", IN: "🇮🇳", PK: "🇵🇰", PH: "🇵🇭", ID: "🇮🇩", MY: "🇲🇾",
  SG: "🇸🇬", AU: "🇦🇺", CA: "🇨🇦", JP: "🇯🇵", KR: "🇰🇷", CN: "🇨🇳",
  TH: "🇹🇭", BR: "🇧🇷", MX: "🇲🇽", ZA: "🇿🇦", NG: "🇳🇬", KE: "🇰🇪",
};

export const getFlag = (code?: string) => code ? (COUNTRY_FLAGS[code.toUpperCase()] || "🏳️") : "";

export const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  participant: { en: "Participant", ar: "مشارك" },
  organizer: { en: "Organizer", ar: "منظم" },
  judge: { en: "Judge", ar: "حكم" },
  head_judge: { en: "Head Judge", ar: "رئيس لجنة التحكيم" },
};

export const MEDIA_TYPE_LABELS: Record<string, { en: string; ar: string; icon: string }> = {
  tv: { en: "TV", ar: "تلفزيون", icon: "📺" },
  radio: { en: "Radio", ar: "إذاعة", icon: "📻" },
  podcast: { en: "Podcast", ar: "بودكاست", icon: "🎙️" },
  newspaper: { en: "Newspaper", ar: "صحيفة", icon: "📰" },
  magazine: { en: "Magazine", ar: "مجلة", icon: "📖" },
  online: { en: "Online", ar: "إلكتروني", icon: "🌐" },
};

export const EMPLOYMENT_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  full_time: { en: "Full-time", ar: "دوام كامل" },
  part_time: { en: "Part-time", ar: "دوام جزئي" },
  contract: { en: "Contract", ar: "عقد" },
  internship: { en: "Internship", ar: "تدريب" },
  freelance: { en: "Freelance", ar: "عمل حر" },
  volunteer: { en: "Volunteer", ar: "تطوعي" },
};

export const EDUCATION_LEVEL_LABELS: Record<string, { en: string; ar: string }> = {
  high_school: { en: "High School", ar: "ثانوية عامة" },
  diploma: { en: "Diploma", ar: "دبلوم" },
  bachelors: { en: "Bachelor's", ar: "بكالوريوس" },
  masters: { en: "Master's", ar: "ماجستير" },
  doctorate: { en: "PhD / Doctorate", ar: "دكتوراه" },
  culinary_certificate: { en: "Culinary Certificate", ar: "شهادة طهي" },
  professional_diploma: { en: "Professional Diploma", ar: "دبلوم مهني" },
  other: { en: "Other", ar: "أخرى" },
};
