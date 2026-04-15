/**
 * Centralized state management for Smart Import.
 * Replaces 42 individual useState calls with a single useReducer.
 */
import type { SearchResultItem, ExistingRecord, Step, TargetTable, EntityType, CompanyType, ExhibitionType } from "@/components/smart-import/types";
import type { ImportedData } from "@/components/smart-import/SmartImportDialog";

export interface SmartImportState {
  // Search
  query: string;
  location: string;
  websiteUrl: string;
  directUrl: string;
  step: Step;
  searching: boolean;
  searchResults: SearchResultItem[];
  selectedResult: SearchResultItem | null;
  searchedQuery: string;
  searchedLocation: string;
  searchTime: number | null;

  // Details
  loadingDetails: boolean;
  details: ImportedData | null;
  sourcesUsed: Record<string, boolean>;
  activeTab: string;
  dataQuality: number;

  // DB Check
  checkingDb: boolean;
  existingRecords: ExistingRecord[];
  dbChecked: boolean;

  // Add Form
  showAddForm: boolean;
  targetTable: TargetTable;
  selectedEntityType: EntityType;
  selectedCompanyType: CompanyType;
  selectedEstablishmentType: string;
  selectedExhibitionType: ExhibitionType;
  saving: boolean;
  updating: boolean;
  selectedExistingId: string | null;
  suggestedTarget: { table: string; sub_type: string; confidence: number } | null;

  // Batch
  batchSelected: Set<string>;
  batchImporting: boolean;
  batchProgress: { current: number; total: number; successes: number; failures: number };

  // History
  showHistory: boolean;
  importHistory: Record<string, unknown>[];
  loadingHistory: boolean;

  // Mode
  importMode: "search" | "url" | "bulk" | "cv";
  urlImporting: boolean;

  // Stats
  stats: {
    totals: { entities: number; companies: number; establishments: number; exhibitions?: number; competitions?: number; organizers?: number };
    imports: { today: number; week: number; total: number; by_table: Record<string, number>; by_action: { create: number; update: number } };
  } | null;
  loadingStats: boolean;

  // Misc
  editingFields: boolean;
  lastSavedRecord: { table: TargetTable; id: string } | null;
}

export const initialSmartImportState: SmartImportState = {
  query: "", location: "", websiteUrl: "", directUrl: "",
  step: "search", searching: false, searchResults: [], selectedResult: null,
  searchedQuery: "", searchedLocation: "", searchTime: null,
  loadingDetails: false, details: null, sourcesUsed: {}, activeTab: "overview", dataQuality: 0,
  checkingDb: false, existingRecords: [], dbChecked: false,
  showAddForm: false, targetTable: "culinary_entities",
  selectedEntityType: "culinary_association", selectedCompanyType: "supplier",
  selectedEstablishmentType: "restaurant", selectedExhibitionType: "exhibition",
  saving: false, updating: false, selectedExistingId: null, suggestedTarget: null,
  batchSelected: new Set(), batchImporting: false, batchProgress: { current: 0, total: 0, successes: 0, failures: 0 },
  showHistory: false, importHistory: [], loadingHistory: false,
  importMode: "search", urlImporting: false,
  stats: null, loadingStats: true,
  editingFields: false, lastSavedRecord: null,
};

export type SmartImportAction =
  | { type: "SET_FIELD"; field: keyof SmartImportState; value: unknown }
  | { type: "SEARCH_START" }
  | { type: "SEARCH_SUCCESS"; results: SearchResultItem[]; time: number }
  | { type: "SEARCH_FAIL" }
  | { type: "DETAILS_START"; result: SearchResultItem | null }
  | { type: "DETAILS_SUCCESS"; details: ImportedData; sourcesUsed: Record<string, boolean>; dataQuality: number; suggestedTarget?: { table: string; sub_type: string; confidence: number } | null }
  | { type: "DETAILS_FAIL" }
  | { type: "URL_IMPORT_START" }
  | { type: "URL_IMPORT_SUCCESS"; details: ImportedData; sourcesUsed: Record<string, boolean>; dataQuality: number; suggestedTarget?: { table: string; sub_type: string; confidence: number } | null }
  | { type: "URL_IMPORT_FAIL" }
  | { type: "DB_CHECK_START" }
  | { type: "DB_CHECK_DONE"; records: ExistingRecord[] }
  | { type: "RESET_SEARCH" }
  | { type: "BACK_TO_RESULTS" }
  | { type: "APPLY_SUGGESTED_TARGET"; target: { table: string; sub_type: string; confidence: number } }
  | { type: "SAVE_START" }
  | { type: "SAVE_DONE"; record?: { table: TargetTable; id: string } }
  | { type: "UPDATE_START"; id: string }
  | { type: "UPDATE_DONE"; record?: { table: TargetTable; id: string } }
  | { type: "BATCH_PROGRESS"; progress: { current: number; total: number; successes: number; failures: number } }
  | { type: "BATCH_DONE" }
  | { type: "HISTORY_LOADED"; history: Record<string, unknown>[] }
  | { type: "STATS_LOADED"; stats: SmartImportState["stats"] }
  | { type: "UPDATE_DETAILS_FIELD"; key: string; value: string }
  | { type: "TOGGLE_BATCH"; id: string }
  | { type: "TOGGLE_SELECT_ALL"; allIds: string[] };

function applyTarget(state: SmartImportState, st: { table: string; sub_type: string; confidence: number }): Partial<SmartImportState> {
  const changes: Partial<SmartImportState> = { suggestedTarget: st };
  if (st.table === "culinary_entities") { changes.targetTable = "culinary_entities"; changes.selectedEntityType = st.sub_type as EntityType; }
  else if (st.table === "companies") { changes.targetTable = "companies"; changes.selectedCompanyType = st.sub_type as CompanyType; }
  else if (st.table === "establishments") { changes.targetTable = "establishments"; changes.selectedEstablishmentType = st.sub_type; }
  else if (st.table === "exhibitions") { changes.targetTable = "exhibitions"; changes.selectedExhibitionType = st.sub_type as ExhibitionType; }
  else if (st.table === "competitions") { changes.targetTable = "competitions"; }
  else if (st.table === "organizers") { changes.targetTable = "organizers"; }
  return changes;
}

export function smartImportReducer(state: SmartImportState, action: SmartImportAction): SmartImportState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SEARCH_START":
      return { ...state, searching: true, searchResults: [], selectedResult: null, details: null, sourcesUsed: {}, dbChecked: false, existingRecords: [], searchedQuery: state.query.trim(), searchedLocation: state.location.trim(), searchTime: null };

    case "SEARCH_SUCCESS":
      return { ...state, searching: false, searchResults: action.results, searchTime: action.time, step: "results" };

    case "SEARCH_FAIL":
      return { ...state, searching: false };

    case "DETAILS_START":
      return { ...state, selectedResult: action.result, loadingDetails: true, details: null, activeTab: "overview", dbChecked: false, existingRecords: [], dataQuality: 0 };

    case "DETAILS_SUCCESS":
      return { ...state, loadingDetails: false, details: action.details, sourcesUsed: action.sourcesUsed, dataQuality: action.dataQuality, step: "details", ...(action.suggestedTarget ? applyTarget(state, action.suggestedTarget) : {}) };

    case "DETAILS_FAIL":
      return { ...state, loadingDetails: false };

    case "URL_IMPORT_START":
      return { ...state, urlImporting: true, details: null, sourcesUsed: {}, dbChecked: false, existingRecords: [], selectedResult: null, dataQuality: 0 };

    case "URL_IMPORT_SUCCESS":
      return { ...state, urlImporting: false, details: action.details, sourcesUsed: action.sourcesUsed, dataQuality: action.dataQuality, step: "details", ...(action.suggestedTarget ? applyTarget(state, action.suggestedTarget) : {}) };

    case "URL_IMPORT_FAIL":
      return { ...state, urlImporting: false };

    case "DB_CHECK_START":
      return { ...state, checkingDb: true, existingRecords: [] };

    case "DB_CHECK_DONE":
      return { ...state, checkingDb: false, dbChecked: true, existingRecords: action.records };

    case "RESET_SEARCH":
      return { ...state, step: "search", searchResults: [], selectedResult: null, details: null, sourcesUsed: {}, dbChecked: false, existingRecords: [], batchSelected: new Set(), suggestedTarget: null, dataQuality: 0, searchTime: null, editingFields: false };

    case "BACK_TO_RESULTS":
      return { ...state, step: "results", details: null, sourcesUsed: {}, dbChecked: false, existingRecords: [], suggestedTarget: null, dataQuality: 0, editingFields: false };

    case "APPLY_SUGGESTED_TARGET":
      return { ...state, ...applyTarget(state, action.target) };

    case "SAVE_START":
      return { ...state, saving: true };

    case "SAVE_DONE":
      return { ...state, saving: false, showAddForm: false, dbChecked: false, lastSavedRecord: action.record || null };

    case "UPDATE_START":
      return { ...state, updating: true, selectedExistingId: action.id };

    case "UPDATE_DONE":
      return { ...state, updating: false, selectedExistingId: null, dbChecked: false, lastSavedRecord: action.record || null };

    case "BATCH_PROGRESS":
      return { ...state, batchImporting: true, batchProgress: action.progress };

    case "BATCH_DONE":
      return { ...state, batchImporting: false, batchSelected: new Set() };

    case "HISTORY_LOADED":
      return { ...state, importHistory: action.history, loadingHistory: false };

    case "STATS_LOADED":
      return { ...state, stats: action.stats, loadingStats: false };

    case "UPDATE_DETAILS_FIELD":
      return { ...state, details: state.details ? { ...state.details, [action.key]: action.value } : null };

    case "TOGGLE_BATCH": {
      const next = new Set(state.batchSelected);
      next.has(action.id) ? next.delete(action.id) : next.add(action.id);
      return { ...state, batchSelected: next };
    }

    case "TOGGLE_SELECT_ALL":
      return { ...state, batchSelected: state.batchSelected.size === action.allIds.length ? new Set() : new Set(action.allIds) };

    default:
      return state;
  }
}
