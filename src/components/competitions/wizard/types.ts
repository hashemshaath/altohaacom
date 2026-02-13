export interface CategoryForm {
  id?: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  max_participants: number | null;
  gender: string;
}

export interface CriteriaForm {
  id?: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  max_score: number;
  weight: number;
}

export interface CompetitionFormData {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  coverImageUrl: string | null;
  rulesSummary: string;
  rulesSummaryAr: string;
  scoringNotes: string;
  scoringNotesAr: string;
  registrationStart: string;
  registrationEnd: string;
  competitionStart: string;
  competitionEnd: string;
  isVirtual: boolean;
  venue: string;
  venueAr: string;
  city: string;
  country: string;
  countryCode: string;
  editionYear: number;
  maxParticipants: number | "";
  categories: CategoryForm[];
  criteria: CriteriaForm[];
  // Exhibition linkage
  exhibitionId: string | null;
  selectedTypeIds: string[];
  supervisingBodyIds: string[];
  judgeIds: string[];
  // Registration fee settings
  registrationFeeType: "free" | "paid";
  registrationFee: number;
  registrationCurrency: string;
  registrationTaxRate: number;
  registrationTaxName: string;
  registrationTaxNameAr: string;
  // Entry types
  allowedEntryTypes: string[];
  maxTeamSize: number;
  minTeamSize: number;
  // Extended linkage
  linkType: string;
  linkedEntityId: string | null;
  linkedChefId: string | null;
  linkedTastingId: string | null;
}

export const emptyCategory: CategoryForm = {
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
  max_participants: null,
  gender: "open",
};

export const emptyCriteria: CriteriaForm = {
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
  max_score: 10,
  weight: 0.25,
};
