/**
 * QR Code utilities - code generation, URL building, vCard generation
 */

const BASE_URL = "https://altohaacom.lovable.app";

export type QREntityType = "user" | "certificate" | "invoice" | "competition" | "company" | "exhibition" | "participant" | "judge" | "team_member";

export interface QRCodeData {
  code: string;
  entityType: QREntityType;
  entityId: string;
  category: string;
  metadata?: Record<string, string>;
}

/** Build the public verification URL for any QR code */
export function getVerificationUrl(code: string): string {
  return `${BASE_URL}/verify?code=${encodeURIComponent(code)}`;
}

/** Build a direct entity URL (used as secondary link in QR metadata) */
export function getEntityUrl(entityType: QREntityType, entityId: string): string {
  switch (entityType) {
    case "user":
      return `${BASE_URL}/${entityId}`; // entityId = username
    case "certificate":
      return `${BASE_URL}/verify?code=${entityId}`;
    case "invoice":
      return `${BASE_URL}/verify?code=${entityId}`;
    case "competition":
      return `${BASE_URL}/competitions/${entityId}`;
    case "company":
      return `${BASE_URL}/entities/${entityId}`;
    case "exhibition":
      return `${BASE_URL}/exhibitions/${entityId}`;
    case "participant":
    case "judge":
    case "team_member":
      return `${BASE_URL}/verify?code=${entityId}`;
    default:
      return `${BASE_URL}/verify?code=${entityId}`;
  }
}

/** Generate a vCard string for saving a contact to phone */
export function generateVCard(data: {
  fullName: string;
  fullNameAr?: string;
  phone?: string;
  email?: string;
  organization?: string;
  title?: string;
  website?: string;
  location?: string;
  accountNumber?: string;
  profileUrl?: string;
}): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.fullName}`,
    `N:${data.fullName};;;`,
  ];

  if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.organization) lines.push(`ORG:${data.organization}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.website) lines.push(`URL:${data.website}`);
  if (data.profileUrl) lines.push(`URL;TYPE=WORK:${data.profileUrl}`);
  if (data.location) lines.push(`ADR;TYPE=WORK:;;${data.location};;;;`);
  if (data.accountNumber) lines.push(`NOTE:Account: ${data.accountNumber}`);

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

/** Download vCard as .vcf file */
export function downloadVCard(vcard: string, filename = "contact") {
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Category-based code prefix mapping */
export const CODE_PREFIXES: Record<string, string> = {
  account: "ACC",
  certificate: "CRT",
  invoice: "INV",
  competition: "CMP",
  company: "COM",
  exhibition: "EXH",
  participant: "PRT",
  judge: "JDG",
  team_member: "TM",
  general: "QR",
};
