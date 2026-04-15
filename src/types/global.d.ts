/**
 * Augment the global Window interface to avoid `(window as any)` casts
 * for well-known third-party tracking & browser APIs.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface GtagFunction {
  (command: "js", date: Date): void;
  (command: "config", targetId: string, params?: Record<string, unknown>): void;
  (command: "event", eventName: string, params?: Record<string, unknown>): void;
  (...args: unknown[]): void;
}

interface Window {
  // Google Tag Manager / GA4
  dataLayer?: Record<string, unknown>[];
  gtag?: GtagFunction;

  // Meta / Facebook Pixel
  fbq?: (...args: unknown[]) => void;
  _fbq?: unknown;

  // TikTok Pixel
  ttq?: {
    load?: (id: string) => void;
    page?: () => void;
    track?: (event: string, params?: Record<string, unknown>) => void;
    _i?: unknown;
  };
  TiktokAnalyticsObject?: string;

  // Snap Pixel
  snaptr?: (...args: unknown[]) => void;

  // LinkedIn Insight
  _linkedin_data_partner_ids?: string[];
  lintrk?: {
    q?: unknown[];
  };

  // Hotjar
  hj?: (...args: unknown[]) => void;
  _hjSettings?: { hjid: number; hjsv: number };

  // Browser APIs not yet in lib.dom
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
  BarcodeDetector?: new (options?: { formats: string[] }) => {
    detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
  };
  MSStream?: unknown;

  // requestIdleCallback (not in all TS libs)
  requestIdleCallback?: (cb: (deadline: IdleDeadline) => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
}

interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
}
