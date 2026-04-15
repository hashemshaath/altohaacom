import type { GlobalEvent } from "@/hooks/useGlobalEventsCalendar";

function formatICSDate(dateStr: string, allDay: boolean): string {
  const d = new Date(dateStr);
  if (allDay) {
    return d.toISOString().replace(/[-:]/g, "").split("T")[0];
  }
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICS(text: string): string {
  return text.replace(/[\\;,\n]/g, (m) => {
    if (m === "\n") return "\\n";
    return `\\${m}`;
  });
}

function generateICS(event: GlobalEvent): string {
  const uid = `${event.id}@altoha.com`;
  const dtStart = formatICSDate(event.start_date, event.all_day);
  const dtEnd = event.end_date
    ? formatICSDate(event.end_date, event.all_day)
    : dtStart;

  const dateProp = event.all_day ? "VALUE=DATE" : "";
  const dtStartLine = event.all_day
    ? `DTSTART;${dateProp}:${dtStart}`
    : `DTSTART:${dtStart}`;
  const dtEndLine = event.all_day
    ? `DTEND;${dateProp}:${dtEnd}`
    : `DTEND:${dtEnd}`;

  const location = [event.venue, event.city].filter(Boolean).join(", ");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Altoha//Events Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date().toISOString(), false)}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${escapeICS(event.title)}`,
    ...(location ? [`LOCATION:${escapeICS(location)}`] : []),
    ...(event.link ? [`URL:${event.link}`] : []),
    ...(event.organizer_name ? [`ORGANIZER:${escapeICS(event.organizer_name)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

export function downloadICS(event: GlobalEvent): void {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, "").trim().replace(/\s+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareEvent(event: GlobalEvent, isAr: boolean): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({
      title: event.title,
      text: isAr
        ? `${event.title_ar || event.title} - ${event.city || ""}`
        : `${event.title} - ${event.city || ""}`,
      url: event.link || window.location.href,
    });
    return true;
  } catch {
    return false;
  }
}
