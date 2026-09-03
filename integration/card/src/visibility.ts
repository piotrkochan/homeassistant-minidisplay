import type { Hass, Visibility } from "./types";

const unavailableStates = new Set(["unknown", "unavailable"]);

export function visibilityMatches(hass: Hass | undefined, visibility: Visibility | undefined): boolean {
  if (!visibility) return true;
  const matches = visibility.conditions.map((condition) => {
    const state = hass?.states[condition.entity]?.state;
    const available = state !== undefined && !unavailableStates.has(state);
    if (condition.operator === "available") return available;
    if (condition.operator === "unavailable") return !available;
    if (!available) return false;
    if (condition.operator === "equals") return state === (condition.value ?? "");
    if (condition.operator === "not_equals") return state !== (condition.value ?? "");
    const actual = Number(state);
    const expected = Number(condition.value);
    if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
    return condition.operator === "above" ? actual > expected : actual < expected;
  });
  return visibility.mode === "any" ? matches.some(Boolean) : matches.every(Boolean);
}
