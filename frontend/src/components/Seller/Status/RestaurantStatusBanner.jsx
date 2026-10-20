import { useTranslation } from "react-i18next";
import { Flame, PauseCircle } from "lucide-react";
import { formatTime } from "@chowgo/shared/format";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/useNow";
import { useRestaurantStatus, useSetRestaurantStatus } from "@/hooks/Restaurants/useRestaurantStatus";
import { effectiveStatus, timeLeft } from "./statusView";

export function RestaurantStatusBanner() {
  const { t } = useTranslation(["seller", "common"]);
  const { data } = useRestaurantStatus();
  const now = useNow(60000, Boolean(data));
  const { mutate, isPending } = useSetRestaurantStatus();
  const view = effectiveStatus(data, now);
  if (!view || (!view.pause && !view.busy)) return null;

  const { pause, busy } = view;
  if (pause) {
    return (
      <Alert variant="destructive" className="border-destructive/40">
        <PauseCircle aria-hidden="true" />
        <AlertTitle>{t("seller:status.web.bannerPaused")}</AlertTitle>
        <AlertDescription>
          <p>
            {pause.indefinite
              ? t("seller:status.pausedHint")
              : t("seller:status.web.pauseActive", {
                  time: formatTime(pause.until),
                  left: timeLeft(t, pause.until, now),
                })}
          </p>
          {pause.reason ? <p>{t("seller:status.web.reasonShown", { reason: pause.reason })}</p> : null}
          <Button size="sm" className="mt-2" onClick={() => mutate({ action: "resume" })} disabled={isPending}>
            {t("seller:status.actions.resume")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-warning/50 bg-warning-subtle">
      <Flame aria-hidden="true" className="text-warning" />
      <AlertTitle>{t("seller:status.web.bannerBusy", { minutes: busy.extraMinutes })}</AlertTitle>
      <AlertDescription>
        <p>
          {t("seller:status.web.busyActive", {
            minutes: busy.extraMinutes,
            time: formatTime(busy.until),
            left: timeLeft(t, busy.until, now),
          })}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => mutate({ action: "normal" })}
          disabled={isPending}
        >
          {t("seller:status.actions.normal")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
