declare function gtag(command: "config", targetId: string, config?: Record<string, unknown>): void;
declare function gtag(command: "event", action: string, params?: Record<string, unknown>): void;
declare function gtag(command: "js", date: Date): void;

interface Window {
  gtag: typeof gtag;
  dataLayer: unknown[];
}
