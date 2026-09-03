export type Hass = {
  states: Record<string, { state: string; attributes?: Record<string, unknown> }>;
  callWS<T>(message: Record<string, unknown>): Promise<T>;
};

export type Style = {
  background?: string;
  foreground?: string;
  accent?: string;
  radius?: "none" | "small" | "medium" | "large";
  fontFamily?: "sans" | "sans-bold" | "mono" | "serif";
  fontSize?: "auto" | "small" | "medium" | "large" | "xlarge";
  horizontalAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
};

export type PageTransition = {
  type: "none" | "random" | "slide" | "bounce" | "fade" | "wipe" | "dissolve" | "curtain" | "blinds" | "mosaic" | "doors" | "spiral";
  direction?: "left" | "right" | "up" | "down";
  speed?: "slow" | "normal" | "fast";
  intensity?: "subtle" | "strong";
  tileSize?: "small" | "medium" | "large";
};

export type VisibilityRuleOperator = "range" | "equals" | "not_equals" | "starts_with" | "ends_with" | "contains" | "available" | "unavailable";
export type VisibilityRule = {
  id: string;
  source: "card" | "entity";
  entity?: string;
  operator: VisibilityRuleOperator;
  minimum?: number;
  maximum?: number;
  match?: string;
};
export type VisibilityRuleExpression = { type: "rule"; ruleId: string; negate?: boolean };
export type VisibilityGroupExpression = { type: "group"; operator: "and" | "or"; children: VisibilityExpression[]; negate?: boolean };
export type VisibilityExpression = VisibilityRuleExpression | VisibilityGroupExpression;
export type Visibility = { rules: VisibilityRule[]; expression: VisibilityGroupExpression };
export type NumberValueMapping = { minimum?: number; maximum?: number; value: string };
export type TextValueMapping = { operator: "equals" | "starts_with" | "ends_with" | "contains"; match: string; value: string };
export type NumberColorMapping = { minimum?: number; maximum?: number; background?: string; foreground?: string };
export type TextColorMapping = { operator: "equals" | "starts_with" | "ends_with" | "contains"; match: string; background?: string; foreground?: string };

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
  visibility?: Visibility;
  valueMappings?: NumberValueMapping[] | TextValueMapping[];
  colorMappings?: NumberColorMapping[] | TextColorMapping[];
};

export type DisplayRow = { title?: string; showTitle?: boolean; weight?: number; gap?: "none" | "small" | "medium"; cards: DisplayCard[]; visibility?: Visibility };
export type DisplayPage = { id: string; title?: string; showTitle?: boolean; durationSeconds?: number; enabled?: boolean; transition?: PageTransition; rows: DisplayRow[] };
export type Dashboard = { version: 1; defaults?: Record<string, unknown>; pages: DisplayPage[] };
export type Display = {
  config_entry_id: string;
  title: string;
  available: boolean;
  active_scene_id: string | null;
  active_scene_name: string | null;
  preview_scene_id: string | null;
  width: number;
  height: number;
};
export type Scene = { id: string; name: string; is_default: boolean };

export const newCard = (type: DisplayCard["type"] = "number"): DisplayCard => {
  if (type === "clock") return { type, format: "24h", showDate: true };
  if (type === "text") return { type, text: "Text" };
  if (type === "status") return { type, source: "", onText: "On", offText: "Off" };
  return { type, source: "", progress: "none" };
};
export const newRow = (): DisplayRow => ({ weight: 1, gap: "small", cards: [newCard("clock")] });
export const newPage = (number: number): DisplayPage => ({ id: `page_${number}`, title: `Page ${number}`, durationSeconds: 10, enabled: true, transition: { type: "none" }, rows: [newRow()] });
export const newDashboard = (): Dashboard => ({ version: 1, defaults: { pageDurationSeconds: 10, theme: "dark" }, pages: [newPage(1)] });

export const mapCardValue = (card: DisplayCard, raw: string): { value: string; mapped: boolean } => {
  if (card.type === "number") {
    const number = Number(raw);
    if (Number.isFinite(number)) {
      for (const mapping of (card.valueMappings ?? []) as NumberValueMapping[]) {
        if ((mapping.minimum === undefined || number >= mapping.minimum)
          && (mapping.maximum === undefined || number <= mapping.maximum)) {
          return { value: mapping.value, mapped: true };
        }
      }
    }
  }
  if (card.type === "text") {
    for (const mapping of (card.valueMappings ?? []) as TextValueMapping[]) {
      const matches = mapping.operator === "equals" ? raw === mapping.match
        : mapping.operator === "starts_with" ? raw.startsWith(mapping.match)
        : mapping.operator === "ends_with" ? raw.endsWith(mapping.match)
        : raw.includes(mapping.match);
      if (matches) return { value: mapping.value, mapped: true };
    }
  }
  return { value: raw, mapped: false };
};

export const mapCardColors = (card: DisplayCard, raw: string): NumberColorMapping | TextColorMapping | undefined => {
  if (card.type === "number") {
    const number = Number(raw);
    if (Number.isFinite(number)) {
      return ((card.colorMappings ?? []) as NumberColorMapping[]).find((mapping) =>
        (mapping.minimum === undefined || number >= mapping.minimum)
        && (mapping.maximum === undefined || number <= mapping.maximum));
    }
  }
  if (card.type === "text") {
    return ((card.colorMappings ?? []) as TextColorMapping[]).find((mapping) =>
      mapping.operator === "equals" ? raw === mapping.match
        : mapping.operator === "starts_with" ? raw.startsWith(mapping.match)
        : mapping.operator === "ends_with" ? raw.endsWith(mapping.match)
        : raw.includes(mapping.match));
  }
  return undefined;
};
