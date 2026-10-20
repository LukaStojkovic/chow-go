import { formatTime } from "@chowgo/shared/format";

const live = (until, now) => Boolean(until) && new Date(until).getTime() > now;

export function effectiveStatus(status, now = Date.now()) {
  if (!status) return null;
  const pause = status.pause && (status.pause.indefinite || live(status.pause.until, now)) ? status.pause : null;
  const busy = status.busy && live(status.busy.until, now) ? status.busy : null;

  let kind = "open";
  if (!status.isActive) kind = "inactive";
  else if (pause) kind = pause.indefinite ? "pausedIndefinite" : "paused";
  else if (!status.scheduleOpen) kind = status.closure ? "closedHoliday" : "closedHours";
  else if (busy) kind = "busy";

  return { kind, pause, busy };
}

export const TONE = {
  open: "bg-success",
  busy: "bg-warning",
  paused: "bg-destructive",
  pausedIndefinite: "bg-destructive",
  closedHours: "bg-muted-foreground",
  closedHoliday: "bg-muted-foreground",
  inactive: "bg-muted-foreground",
};

const STATIC_LABEL = {
  open: "seller:status.open",
  pausedIndefinite: "seller:status.pausedIndefinite",
  closedHours: "seller:status.closedHours",
  closedHoliday: "seller:status.closedHoliday",
  inactive: "seller:status.inactive",
};

export function statusLabel(t, view) {
  if (!view) return "";
  const { kind, pause, busy } = view;
  if (kind === "busy") {
    return t("seller:status.web.pillBusy", { minutes: busy.extraMinutes, time: formatTime(busy.until) });
  }
  if (kind === "paused") return t("seller:status.pausedUntil", { time: formatTime(pause.until) });
  return t(STATIC_LABEL[kind]);
}

export function timeLeft(t, until, now = Date.now()) {
  const minutes = Math.max(1, Math.ceil((new Date(until).getTime() - now) / 60000));
  if (minutes < 60) return t("common:units.minutes", { value: minutes });
  return t("common:units.hoursMinutes", { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}

export function pauseBody(option, reason) {
  const trimmed = reason.trim();
  const body = typeof option === "number" ? { action: "pause", minutes: option } : { action: "pause", until: option };
  return trimmed ? { ...body, reason: trimmed } : body;
}
