import { useSearchParams } from "react-router-dom";
import { zonedDateKey } from "@chowgo/shared/dateKeys";
import { RANGE_PRESETS, parseReportRange } from "@chowgo/shared/reportRange";
import { DEFAULT_TIMEZONE } from "@chowgo/shared/scheduling";

import { useAuthStore } from "@/store/useAuthStore";

const DEFAULT_PRESET = "last30";

export function useRestaurantToday() {
  const timeZone = useAuthStore((s) => s.authUser?.restaurant?.[0]?.timezone) || DEFAULT_TIMEZONE;
  return zonedDateKey(new Date(), timeZone);
}

/** The analytics range, kept in the URL as `?preset=` or `?from=&to=`. */
export function useReportRange() {
  const [params, setParams] = useSearchParams();
  const todayKey = useRestaurantToday();

  const from = params.get("from") || undefined;
  const to = params.get("to") || undefined;
  const urlPreset = params.get("preset");
  const preset = RANGE_PRESETS.includes(urlPreset) ? urlPreset : DEFAULT_PRESET;

  const custom = from || to ? parseReportRange({ from, to }, todayKey) : null;
  const isCustom = Boolean(custom?.range);
  const { range } = isCustom ? custom : parseReportRange({ preset }, todayKey);

  return {
    todayKey,
    range,
    selected: isCustom ? "custom" : preset,
    request: isCustom ? { from: range.from, to: range.to } : { preset },
    setPreset: (next) => setParams({ preset: next }, { replace: true }),
    setCustom: (next) => setParams({ from: next.from, to: next.to }, { replace: true }),
  };
}
