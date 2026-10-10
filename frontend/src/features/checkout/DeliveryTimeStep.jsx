import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatTime } from "@chowgo/shared/format";
import { SCHEDULING } from "@chowgo/shared/scheduling";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { dayKey, formatScheduledFor, groupSlotsByDay } from "@chowgo/shared/deliveryTime";
import { CheckoutSection, OptionRow } from "./CheckoutSection";

const selectClass = cn(
  "border-input bg-card text-foreground h-11 w-full rounded-sm border px-3 text-base md:h-10 md:text-body",
  "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
  "disabled:cursor-not-allowed disabled:opacity-55",
);

/**
 * @param {Object} props
 * @param {number} props.step
 * @param {Date[]} props.slots
 * @param {Date} props.now
 * @param {boolean} props.isClosedNow
 * @param {"asap" | "later"} props.mode
 * @param {string | null} props.slot ISO string of a slot still in `slots`.
 * @param {(mode: "asap" | "later") => void} props.onModeChange
 * @param {(slot: string | null) => void} props.onSlotChange
 * @param {string | null} [props.error]
 */
export function DeliveryTimeStep({
  step,
  slots,
  now,
  isClosedNow,
  mode,
  slot,
  onModeChange,
  onSlotChange,
  error = null,
}) {
  const { t } = useTranslation(["basket", "common"]);
  const [selectedDay, setSelectedDay] = useState(null);

  const days = useMemo(() => groupSlotsByDay(slots, now), [slots, now]);
  const hasSlots = days.length > 0;
  const activeDay =
    days.find((day) => day.key === selectedDay) ??
    (slot ? days.find((day) => day.key === dayKey(slot)) : null) ??
    days[0] ??
    null;

  const chooseLater = () => {
    onModeChange("later");
    if (!slot && hasSlots) onSlotChange(days[0].slots[0].toISOString());
  };

  const chooseDay = (key) => {
    setSelectedDay(key);
    const day = days.find((entry) => entry.key === key);
    onSlotChange(day?.slots[0]?.toISOString() ?? null);
  };

  return (
    <CheckoutSection
      step={step}
      title={t("schedule.title")}
      isComplete={mode === "asap" || Boolean(slot)}
      description={isClosedNow ? t("schedule.closedNow") : undefined}
    >
      <fieldset className="space-y-2">
        <legend className="sr-only">{t("schedule.title")}</legend>
        <OptionRow
          id="timing-asap"
          name="delivery-timing"
          checked={mode === "asap"}
          disabled={isClosedNow}
          onSelect={() => onModeChange("asap")}
          label={t("schedule.asap")}
          description={isClosedNow ? t("schedule.required") : undefined}
        />
        <OptionRow
          id="timing-later"
          name="delivery-timing"
          checked={mode === "later"}
          disabled={!hasSlots}
          onSelect={chooseLater}
          label={t("schedule.later")}
        />
      </fieldset>

      {!hasSlots && (
        <p role="status" className="text-body-sm text-muted-foreground mt-3">
          {t("schedule.noSlots", { days: SCHEDULING.maxDaysAhead })}
        </p>
      )}

      {mode === "later" && hasSlots && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="schedule-day">{t("schedule.day")}</Label>
              <select
                id="schedule-day"
                className={selectClass}
                value={activeDay?.key ?? ""}
                onChange={(event) => chooseDay(event.target.value)}
              >
                {days.map((day) => (
                  <option key={day.key} value={day.key}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule-time">{t("schedule.time")}</Label>
              <select
                id="schedule-time"
                className={selectClass}
                value={slot ?? ""}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "schedule-error" : undefined}
                onChange={(event) => onSlotChange(event.target.value || null)}
              >
                {!slot && (
                  <option value="" disabled>
                    {t("schedule.time")}
                  </option>
                )}
                {activeDay?.slots.map((entry) => (
                  <option key={entry.toISOString()} value={entry.toISOString()}>
                    {formatTime(entry)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {slot && (
            <p aria-live="polite" className="text-body-sm text-muted-foreground">
              {t("schedule.summary", { when: formatScheduledFor(slot, now) })}
            </p>
          )}
        </div>
      )}

      {error && (
        <p id="schedule-error" role="alert" className="text-body-sm text-destructive mt-3">
          {error}
        </p>
      )}
    </CheckoutSection>
  );
}
