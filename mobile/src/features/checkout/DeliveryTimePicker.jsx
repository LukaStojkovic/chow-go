import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { CalendarClock, Zap } from "lucide-react-native";
import { SCHEDULING } from "@chowgo/shared/scheduling";
import { formatTime } from "@chowgo/shared/format";
import { PressableScale } from "@/components/motion/Pressable";
import { Inset } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { dayKey, dayLabel, groupSlotsByDay, formatScheduledFor } from "@chowgo/shared/deliveryTime";
import { useTokens } from "@/theme/useTokens";
import { Section } from "./Section";

function ModePill({ label, icon: Icon, selected, disabled, onPress }) {
  const { color } = useTokens();
  const tint = selected ? color["primary-foreground"] : color["muted-foreground"];

  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      haptic="selection"
      disabled={disabled}
      onPress={onPress}
      className={cn(
        "h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full px-3",
        selected ? "bg-primary" : "bg-muted",
        disabled && "opacity-50",
      )}
    >
      <Icon size={16} color={tint} />
      <Text
        variant="label"
        numberOfLines={1}
        className={cn("shrink", selected ? "text-primary-foreground" : "text-foreground")}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

export function DeliveryTimePicker({ closedNow, scheduling, onScheduling, slots, slot, onSlot, day, onDay, now }) {
  const { t } = useTranslation(["basket", "common"]);
  const days = groupSlotsByDay(slots);
  const chosenKey = slot ? dayKey(slot) : day;
  const activeDay = days.find((entry) => entry.key === chosenKey) ?? days[0] ?? null;
  const chosenTime = slot ? new Date(slot).getTime() : null;

  return (
    <Section
      title={t("basket:schedule.title")}
      subtitle={closedNow ? t("basket:schedule.closedNow") : undefined}
    >
      <View className="gap-3">
        <View accessibilityRole="radiogroup" className="flex-row gap-2">
          <ModePill
            label={t("basket:schedule.asap")}
            icon={Zap}
            selected={!scheduling}
            disabled={closedNow}
            onPress={() => onScheduling(false)}
          />
          <ModePill
            label={t("basket:schedule.later")}
            icon={CalendarClock}
            selected={scheduling}
            onPress={() => onScheduling(true)}
          />
        </View>

        {closedNow ? (
          <Text variant="body-sm" tone="muted">
            {t("basket:schedule.required")}
          </Text>
        ) : null}

        {scheduling && days.length === 0 ? (
          <Inset tone="warning" accessibilityLiveRegion="polite">
            <Text variant="body-sm" className="text-warning">
              {t("basket:schedule.noSlots", { days: SCHEDULING.maxDaysAhead })}
            </Text>
          </Inset>
        ) : null}

        {scheduling && activeDay ? (
          <View className="gap-3">
            <View className="gap-2">
              <Text variant="label-sm" tone="muted">
                {t("basket:schedule.day")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                {days.map((entry) => (
                  <Chip
                    key={entry.key}
                    label={dayLabel(entry.date, now)}
                    active={entry.key === activeDay.key}
                    onPress={() => {
                      onDay(entry.key);
                      if (slot && dayKey(slot) !== entry.key) onSlot(null);
                    }}
                  />
                ))}
              </ScrollView>
            </View>

            <View className="gap-2">
              <Text variant="label-sm" tone="muted">
                {t("basket:schedule.time")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {activeDay.slots.map((entry) => (
                  <Chip
                    key={entry.getTime()}
                    label={formatTime(entry)}
                    active={entry.getTime() === chosenTime}
                    onPress={() => onSlot(entry.toISOString())}
                  />
                ))}
              </View>
            </View>

            {slot ? (
              <Inset tone="mint" accessibilityLiveRegion="polite">
                <Text variant="label">{t("basket:schedule.summary", { when: formatScheduledFor(slot, now) })}</Text>
              </Inset>
            ) : null}
          </View>
        ) : null}
      </View>
    </Section>
  );
}
