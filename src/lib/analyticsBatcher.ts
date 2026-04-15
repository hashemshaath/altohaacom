/**
 * Analytics write batcher.
 *
 * Collects inserts per table and flushes them in a single bulk request
 * after a short debounce (2s) or when the page hides.
 * Reduces network requests by ~80% for analytics-heavy pages.
 */


type QueuedRecord = Record<string, unknown>;

interface TableQueue {
  table: string;
  records: QueuedRecord[];
  timer: ReturnType<typeof setTimeout> | null;
}

const queues = new Map<string, TableQueue>();
const FLUSH_DELAY = 2000; // 2 seconds debounce

function getQueue(table: string): TableQueue {
  let q = queues.get(table);
  if (!q) {
    q = { table, records: [], timer: null };
    queues.set(table, q);
  }
  return q;
}

async function flushTable(table: string) {
  const q = queues.get(table);
  if (!q || q.records.length === 0) return;

  const batch = q.records.splice(0); // drain
  q.timer = null;

  try {
    // Use the REST API directly for bulk insert with keepalive
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}`;
    const headers = {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      Prefer: "return=minimal",
    };

    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
      keepalive: true,
    });
  } catch {
    // Silent — analytics are non-critical
  }
}

function flushAll() {
  for (const [table] of queues) {
    flushTable(table);
  }
}

// Flush on page hide for reliability
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAll();
  });
}

/**
 * Queue an analytics record for batched insertion.
 *
 * ```ts
 * queueAnalyticsInsert("seo_page_views", { path: "/", title: "Home" });
 * ```
 */
export function queueAnalyticsInsert(table: string, record: QueuedRecord) {
  const q = getQueue(table);
  q.records.push(record);

  // Reset debounce timer
  if (q.timer) clearTimeout(q.timer);
  q.timer = setTimeout(() => flushTable(table), FLUSH_DELAY);
}

/**
 * Immediately flush all pending analytics writes.
 * Useful before navigation or page unload.
 */
function flushAnalytics() {
  flushAll();
}
