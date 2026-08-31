export type Hass = {
  states: Record<string, { state: string }>;
  callWS<T>(message: Record<string, unknown>): Promise<T>;
};

export type Style = {
  background?: string;
  foreground?: string;
  accent?: string;
  radius?: "none" | "small" | "medium" | "large";
  fontFamily?: "sans" | "sans-bold" | "mono" | "serif";
  fontSize?: "auto" | "small" | "medium" | "large" | "xlarge";
};

export type DisplayCard = {
  type: "clock" | "number" | "status" | "text";
  title?: string;
  source?: string;
  text?: string;
  unit?: string;
  minimum?: number;
  maximum?: number;
  progress?: "none" | "bar" | "ring";
  format?: "24h" | "12h";
  showSeconds?: boolean;
  showDate?: boolean;
  onText?: string;
  offText?: string;
  style?: Style;
  valueStyle?: Style;
};

export type DisplayRow = { title?: string; showTitle?: boolean; weight?: number; gap?: "none" | "small" | "medium"; cards: DisplayCard[] };
export type DisplayPage = { id: string; title?: string; durationSeconds?: number; enabled?: boolean; rows: DisplayRow[] };
export type Dashboard = { version: 1; defaults?: Record<string, unknown>; pages: DisplayPage[] };
export type CardConfig = { config_entry_id: string; show_preview?: boolean };
export type Display = { config_entry_id: string; title: string; available: boolean };

export const newCard = (type: DisplayCard["type"] = "number"): DisplayCard => {
  if (type === "clock") return { type, format: "24h", showDate: true };
  if (type === "text") return { type, text: "Text" };
  if (type === "status") return { type, source: "", onText: "On", offText: "Off" };
  return { type, source: "", progress: "none" };
};
export const newRow = (): DisplayRow => ({ weight: 1, gap: "small", cards: [newCard("clock")] });
export const newPage = (number: number): DisplayPage => ({ id: `page_${number}`, title: `Page ${number}`, durationSeconds: 10, enabled: true, rows: [newRow()] });
export const newDashboard = (): Dashboard => ({ version: 1, defaults: { pageDurationSeconds: 10, theme: "dark" }, pages: [newPage(1)] });
