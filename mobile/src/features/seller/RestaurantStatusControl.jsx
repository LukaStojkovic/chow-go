import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Gauge, PauseCircle, Store } from "lucide-react-native";
import {
  BUSY_DURATION_OPTIONS,
  BUSY_EXTRA_OPTIONS,
  PAUSE_OPTIONS,
  STATUS_LIMITS,
} from "@chowgo/shared/restaurantStatus";
import { formatTime } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { PressableScale } from "@/components/motion/Pressable";
import { StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import {
  effectiveStatus,
  useRestaurantStatus,
  useSetRestaurantStatus,
} from "@/hooks/Restaurants/useRestaurantStatus";
import { useNow } from "@/hooks/useNow";
import { toast } from "@/store/useToastStore";

const TONES = {
  open: "success",
  busy: "warning",
  paused: "danger",
  holiday: "muted",
  closed: "muted",
  inactive: "muted",
};

function describe(view, t) {
  const minutes = view.extraMinutes;
  switch (view.kind) {
    case "inactive":
      return { title: t("status.inactive"), hint: t("status.inactiveHint"), chip: t("status.chip.inactive") };
    case "paused":
      return {
        title: view.pause.indefinite
          ? t("status.pausedIndefinite")
          : t("status.pausedUntil", { time: formatTime(view.pause.until) }),
        hint: view.pause.reason || t("status.pausedHint"),
        chip: t("status.chip.paused"),
      };
    case "holiday":
      return { title: t("status.closedHoliday"), hint: t("status.closedHint"), chip: t("status.chip.closed") };
    case "closed":
      return { title: t("status.closedHours"), hint: t("status.closedHint"), chip: t("status.chip.closed") };
    case "busy":
      return {
        title: t("status.busy", { minutes }),
        hint: t("status.busyUntil", { time: formatTime(view.busy.until) }),
        chip: t("status.chip.busy", { minutes }),
      };
    default:
      return { title: t("status.open"), hint: t("status.openHint"), chip: t("status.chip.open") };
  }
}

function useStatusView() {
  const now = useNow(60000);
  const query = useRestaurantStatus();
  const view = effectiveStatus(query.data, now);
  return { query, view };
}

function useStatusActions(onDone) {
  const { t } = useTranslation("seller");
  const mutation = useSetRestaurantStatus();

  async function run(body, message) {
    try {
      await mutation.mutateAsync(body);
      toast.success(message);
      onDone?.();
    } catch (error) {
      toast.error(t("status.toast.failed"), { description: errorMessage(error) });
    }
  }

  return {
    isPending: mutation.isPending,
    pause: (option, reason) =>
      run(
        {
          action: "pause",
          ...(typeof option === "number" ? { minutes: option } : { until: option }),
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        },
        t("status.toast.paused"),
      ),
    resume: () => run({ action: "resume" }, t("status.toast.resumed")),
    busy: (extraMinutes, minutes) =>
      run({ action: "busy", extraMinutes, minutes }, t("status.toast.busy")),
    normal: () => run({ action: "normal" }, t("status.toast.normal")),
  };
}

function durationLabel(option, t) {
  if (option === "endOfDay") return t("status.pauseSheet.endOfDay");
  if (option === "indefinite") return t("status.pauseSheet.indefinite");
  if (option >= 60 && option % 60 === 0) return t("status.hours", { count: option / 60 });
  return t("common:units.minutes", { value: option });
}

function PauseForm({ actions }) {
  const { t } = useTranslation(["seller", "common"]);
  const [option, setOption] = useState(30);
  const [reason, setReason] = useState("");

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-2">
        {PAUSE_OPTIONS.map((entry) => (
          <Chip
            key={entry}
            label={durationLabel(entry, t)}
            active={option === entry}
            onPress={() => setOption(entry)}
          />
        ))}
      </View>
      <Input
        label={t("status.pauseSheet.reason")}
        value={reason}
        onChangeText={setReason}
        placeholder={t("status.pauseSheet.reasonPlaceholder")}
        maxLength={STATUS_LIMITS.reasonLength}
      />
      <Button
        variant="destructive"
        size="lg"
        fullWidth
        loading={actions.isPending}
        onPress={() => actions.pause(option, reason)}
      >
        {t("status.pauseSheet.confirm")}
      </Button>
    </View>
  );
}

function BusyForm({ actions }) {
  const { t } = useTranslation(["seller", "common"]);
  const [extra, setExtra] = useState(15);
  const [duration, setDuration] = useState(60);

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text variant="label-sm" tone="muted">
          {t("status.busySheet.extra")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {BUSY_EXTRA_OPTIONS.map((minutes) => (
            <Chip
              key={minutes}
              label={t("status.busySheet.extraOption", { value: minutes })}
              active={extra === minutes}
              onPress={() => setExtra(minutes)}
            />
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Text variant="label-sm" tone="muted">
          {t("status.busySheet.duration")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {BUSY_DURATION_OPTIONS.map((minutes) => (
            <Chip
              key={minutes}
              label={durationLabel(minutes, t)}
              active={duration === minutes}
              onPress={() => setDuration(minutes)}
            />
          ))}
        </View>
      </View>
      <Button
        variant="tertiary"
        size="lg"
        fullWidth
        loading={actions.isPending}
        onPress={() => actions.busy(extra, duration)}
      >
        {t("status.busySheet.confirm")}
      </Button>
    </View>
  );
}

function StatusButtons({ view, actions, onOpen, size = "md" }) {
  const { t } = useTranslation("seller");
  if (!view || view.kind === "inactive") return null;
  const disabled = actions.isPending;

  return (
    <View className="flex-row flex-wrap gap-2">
      {view.pause ? (
        <Button size={size} disabled={disabled} onPress={actions.resume} className="flex-1">
          {t("status.actions.resume")}
        </Button>
      ) : (
        <Button
          size={size}
          variant="outline"
          disabled={disabled}
          onPress={() => onOpen("pause")}
          className="flex-1"
        >
          {t("status.actions.pause")}
        </Button>
      )}
      {view.busy ? (
        <Button size={size} variant="mint" disabled={disabled} onPress={actions.normal} className="flex-1">
          {t("status.actions.normal")}
        </Button>
      ) : view.pause ? null : (
        <Button
          size={size}
          variant="mint"
          disabled={disabled}
          onPress={() => onOpen("busy")}
          className="flex-1"
        >
          {t("status.actions.busy")}
        </Button>
      )}
    </View>
  );
}

function StatusSheet({ mode, setMode, view, actions }) {
  const { t } = useTranslation("seller");
  const label = view ? describe(view, t) : null;
  const config = {
    menu: { icon: Store, tone: "mint", title: label?.title, description: label?.hint },
    pause: {
      icon: PauseCircle,
      tone: "danger",
      title: t("status.pauseSheet.title"),
      description: t("status.pauseSheet.description"),
    },
    busy: {
      icon: Gauge,
      tone: "warning",
      title: t("status.busySheet.title"),
      description: t("status.busySheet.description"),
    },
  }[mode ?? "menu"];

  return (
    <Sheet visible={Boolean(mode)} onClose={() => setMode(null)} {...config}>
      {mode === "pause" ? <PauseForm actions={actions} /> : null}
      {mode === "busy" ? <BusyForm actions={actions} /> : null}
      {mode === "menu" ? (
        <SheetActions>
          <StatusButtons view={view} actions={actions} onOpen={setMode} size="lg" />
        </SheetActions>
      ) : null}
    </Sheet>
  );
}

export function RestaurantStatusCard() {
  const { t } = useTranslation("seller");
  const { query, view } = useStatusView();
  const [mode, setMode] = useState(null);
  const actions = useStatusActions(() => setMode(null));

  if (!view) {
    return query.isLoading ? <Card className="h-28" elevation="none" bordered /> : null;
  }

  const label = describe(view, t);
  const active = view.kind === "open" || view.kind === "busy";

  return (
    <>
      <Card className="gap-3" bordered={!active} elevation={active ? "subtle" : "none"}>
        <View className="flex-row items-center gap-3">
          <StatusDot tone={TONES[view.kind]} size={10} />
          <View className="flex-1">
            <Text variant="caption" tone="muted">
              {t("status.heading")}
            </Text>
            <Text variant="h3" testID="restaurant-status-title">
              {label.title}
            </Text>
            <Text variant="caption" tone="muted">
              {label.hint}
            </Text>
          </View>
        </View>
        <StatusButtons view={view} actions={actions} onOpen={setMode} size="sm" />
      </Card>
      <StatusSheet mode={mode} setMode={setMode} view={view} actions={actions} />
    </>
  );
}

const CHIP_TONES = {
  open: "bg-primary-subtle",
  busy: "bg-warning-subtle",
  paused: "bg-destructive-subtle",
  holiday: "bg-muted",
  closed: "bg-muted",
  inactive: "bg-muted",
};

export function RestaurantStatusChip() {
  const { t } = useTranslation("seller");
  const { view } = useStatusView();
  const [mode, setMode] = useState(null);
  const actions = useStatusActions(() => setMode(null));

  if (!view) return null;
  const label = describe(view, t);

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label.title}
        haptic="selection"
        onPress={() => setMode("menu")}
        className={`h-8 flex-row items-center gap-1.5 self-start rounded-full px-3 ${CHIP_TONES[view.kind]}`}
      >
        <StatusDot tone={TONES[view.kind]} />
        <Text variant="label-sm" numberOfLines={1}>
          {label.chip}
        </Text>
      </PressableScale>
      <StatusSheet mode={mode} setMode={setMode} view={view} actions={actions} />
    </>
  );
}
