import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flame, PauseCircle } from "lucide-react";
import {
  BUSY_DURATION_OPTIONS,
  BUSY_EXTRA_OPTIONS,
  PAUSE_OPTIONS,
  STATUS_LIMITS,
} from "@chowgo/shared/restaurantStatus";
import { formatTime } from "@chowgo/shared/format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSetRestaurantStatus } from "@/hooks/Restaurants/useRestaurantStatus";
import { pauseBody, timeLeft } from "./statusView";

function Chip({ selected, onClick, children, disabled }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong bg-card text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function RestaurantStatusPanel({ view, now }) {
  const { t } = useTranslation(["seller", "common"]);
  const { mutate, isPending } = useSetRestaurantStatus();
  const [pauseOption, setPauseOption] = useState(30);
  const [reason, setReason] = useState("");
  const [extra, setExtra] = useState(15);
  const [duration, setDuration] = useState(60);

  const minutesLabel = (value) => t("common:units.minutes", { value });
  const pauseLabel = (option) => {
    if (typeof option === "number") return minutesLabel(option);
    return option === "endOfDay" ? t("seller:status.pauseSheet.endOfDay") : t("seller:status.pauseSheet.indefinite");
  };

  const { pause, busy } = view ?? {};

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="status-pause-heading">
        <div className="flex items-center gap-2">
          <PauseCircle className="size-5 text-destructive" aria-hidden="true" />
          <h3 id="status-pause-heading" className="font-semibold">
            {t("seller:status.pauseSheet.title")}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">{t("seller:status.pauseSheet.description")}</p>

        {pause ? (
          <div className="space-y-3 rounded-lg bg-destructive-subtle p-3">
            <p className="text-sm font-medium">
              {pause.indefinite
                ? t("seller:status.pausedHint")
                : t("seller:status.web.pauseActive", {
                    time: formatTime(pause.until),
                    left: timeLeft(t, pause.until, now),
                  })}
            </p>
            {pause.reason ? (
              <p className="text-sm text-muted-foreground">
                {t("seller:status.web.reasonShown", { reason: pause.reason })}
              </p>
            ) : null}
            <Button onClick={() => mutate({ action: "resume" })} disabled={isPending}>
              {t("seller:status.actions.resume")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PAUSE_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  selected={pauseOption === option}
                  onClick={() => setPauseOption(option)}
                  disabled={isPending}
                >
                  {pauseLabel(option)}
                </Chip>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-pause-reason">{t("seller:status.pauseSheet.reason")}</Label>
              <Input
                id="status-pause-reason"
                value={reason}
                maxLength={STATUS_LIMITS.reasonLength}
                placeholder={t("seller:status.pauseSheet.reasonPlaceholder")}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button
              variant="destructive"
              onClick={() => mutate(pauseBody(pauseOption, reason), { onSuccess: () => setReason("") })}
              disabled={isPending}
            >
              {t("seller:status.pauseSheet.confirm")}
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-3 border-t border-border pt-5" aria-labelledby="status-busy-heading">
        <div className="flex items-center gap-2">
          <Flame className="size-5 text-warning" aria-hidden="true" />
          <h3 id="status-busy-heading" className="font-semibold">
            {t("seller:status.busySheet.title")}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">{t("seller:status.busySheet.description")}</p>

        {busy ? (
          <div className="space-y-3 rounded-lg bg-warning-subtle p-3">
            <p className="text-sm font-medium">
              {t("seller:status.web.busyActive", {
                minutes: busy.extraMinutes,
                time: formatTime(busy.until),
                left: timeLeft(t, busy.until, now),
              })}
            </p>
            <Button variant="outline" onClick={() => mutate({ action: "normal" })} disabled={isPending}>
              {t("seller:status.actions.normal")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-sm font-medium" id="status-busy-extra">
                {t("seller:status.busySheet.extra")}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="status-busy-extra">
                {BUSY_EXTRA_OPTIONS.map((value) => (
                  <Chip key={value} selected={extra === value} onClick={() => setExtra(value)} disabled={isPending}>
                    {t("seller:status.busySheet.extraOption", { value })}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium" id="status-busy-duration">
                {t("seller:status.busySheet.duration")}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="status-busy-duration">
                {BUSY_DURATION_OPTIONS.map((value) => (
                  <Chip
                    key={value}
                    selected={duration === value}
                    onClick={() => setDuration(value)}
                    disabled={isPending}
                  >
                    {minutesLabel(value)}
                  </Chip>
                ))}
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => mutate({ action: "busy", extraMinutes: extra, minutes: duration })}
              disabled={isPending}
            >
              {t("seller:status.busySheet.confirm")}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
