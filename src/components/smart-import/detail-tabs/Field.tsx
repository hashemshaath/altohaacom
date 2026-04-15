import React from "react";
import { DataField } from "../DataField";
import { EditableField } from "../EditableField";
import type { EditProps } from "./tabTypes";

export const Field = ({
  label, value, fieldKey, editing, onFieldUpdate, copyable, multiline, pairedFieldKey, pairedFieldValue,
}: {
  label: string;
  value?: string | null;
  fieldKey: string;
  copyable?: boolean;
  multiline?: boolean;
  pairedFieldKey?: string;
  pairedFieldValue?: string | null;
} & EditProps) => {
  if (editing && onFieldUpdate) {
    return (
      <EditableField
        label={label} value={value} fieldKey={fieldKey} onUpdate={onFieldUpdate}
        copyable={copyable} multiline={multiline}
        pairedFieldKey={pairedFieldKey} pairedFieldValue={pairedFieldValue}
      />
    );
  }
  return <DataField label={label} value={value} copyable={copyable} multiline={multiline} />;
};
