import type { ImportedData } from "../SmartImportDialog";

export type EditProps = {
  editing?: boolean;
  onFieldUpdate?: (key: string, value: string) => void;
};

export type TabProps = {
  details: ImportedData;
  isAr: boolean;
} & EditProps;
