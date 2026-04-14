/**
import { MS_PER_DAY } from "@/lib/constants";
 * Calendar sync utility — generates .ics files and Google/Outlook calendar links
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO date
  endDate?: string;  // ISO date
  url?: string;
}

function formatICSDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICS(text: string): string {
  return text.replace(/[\\;,\n]/g, (c) => {
    if (c === "\n") return "\\n";
    return `\\${c}`;
  });
}

export function generateICS(event: CalendarEvent): string {
  const start = formatICSDate(event.startDate);
  const end = event.endDate ? formatICSDate(event.endDate) : formatICSDate(
    new Date(new Date(event.startDate).getTime() + MS_PER_DAY).toISOString()
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Altoha//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);

  lines.push(
    `UID:${crypto.randomUUID()}@altoha.com`,
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Event tomorrow",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}

export function downloadICS(event: CalendarEvent) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const start = formatICSDate(event.startDate);
  const end = event.endDate ? formatICSDate(event.endDate) : formatICSDate(
    new Date(new Date(event.startDate).getTime() + MS_PER_DAY).toISOString()
  );
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    ...(event.description && { details: event.description }),
    ...(event.location && { location: event.location }),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function getOutlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    rru: "addevent",
    subject: event.title,
    startdt: event.startDate,
    ...(event.endDate && { enddt: event.endDate }),
    ...(event.description && { body: event.description }),
    ...(event.location && { location: event.location }),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}
