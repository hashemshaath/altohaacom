/**
 * Export utilities for CSV and data downloads across the platform.
 */

export function downloadCSV(data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) {
  if (!data.length) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `"${c.label}"`).join(",");
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '""';
      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );

  const csv = "\uFEFF" + [header, ...rows].join("\n"); // BOM for Arabic support
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

export function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  triggerDownload(blob, `${filename}.json`);
}

export function printableReport(elementId: string, title: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html><head>
      <title>${title}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; direction: auto; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: start; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <h1 style="font-size:18px;margin-bottom:0.5rem;">${title}</h1>
      <p style="color:#888;font-size:12px;margin-bottom:1rem;">Generated: ${new Date().toLocaleString()}</p>
      ${el.innerHTML}
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
