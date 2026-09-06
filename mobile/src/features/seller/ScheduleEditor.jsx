import { useState } from "react";
import { Platform, Pressable, Switch, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { WEEK_DAYS, formatDayHours, getTodayKey } from "@chowgo/shared/schedule";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

const toDate = (value) => {
  const [hours, minutes] = String(value ?? "09:00")
    .split(":")
    .map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
};

const toTime = (date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

/**
 * Per-day hours. Two conventions the backend enforces and this surfaces:
 * an opening time equal to the closing time means open around the clock, and a
 * closing time earlier than the opening one is an overnight window.
 */
export function ScheduleEditor({ schedule, onChangeDay }) {
  const { color } = useTokens();
  const [editing, setEditing] = useState(null);
  const today = getTodayKey();

  const entryFor = (key) => schedule?.[key] ?? { isOpen: false };

  return (
    <View className="gap-1">
      {WEEK_DAYS.map(({ key, label }) => {
        const entry = entryFor(key);

        return (
          <View key={key} className="gap-1.5 py-2">
            <View className="flex-row items-center justify-between">
              <Text variant="label" tone={key === today ? "primary" : "foreground"}>
                {label}
              </Text>
              <Switch
                value={Boolean(entry.isOpen)}
                onValueChange={(isOpen) => onChangeDay(key, { ...entry, isOpen })}
                trackColor={{ true: color.primary, false: color.border }}
              />
            </View>

            {entry.isOpen ? (
              <View className="flex-row items-center gap-2">
                {["openingTime", "closingTime"].map((field) => (
                  <Pressable
                    key={field}
                    accessibilityRole="button"
                    accessibilityLabel={`${label} ${field === "openingTime" ? "opens" : "closes"}`}
                    onPress={() => setEditing({ day: key, field })}
                    className="flex-1 rounded-sm border border-border bg-background px-3 py-2 active:opacity-60"
                  >
                    <Text variant="caption" tone="muted">
                      {field === "openingTime" ? "Opens" : "Closes"}
                    </Text>
                    <Text variant="body">{entry[field] ?? "09:00"}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text variant="caption" tone="muted">
              {formatDayHours(entry)}
              {entry.isOpen && entry.closingTime < entry.openingTime ? " · overnight" : ""}
            </Text>
          </View>
        );
      })}

      {editing ? (
        <DateTimePicker
          value={toDate(entryFor(editing.day)[editing.field])}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "clock"}
          onChange={(event, date) => {
            // Android fires once and dismisses itself; iOS keeps the spinner up
            // until it is closed explicitly.
            if (Platform.OS === "android") setEditing(null);
            if (event.type === "dismissed" || !date) return;

            const entry = entryFor(editing.day);
            onChangeDay(editing.day, { ...entry, [editing.field]: toTime(date) });
          }}
        />
      ) : null}

      {editing && Platform.OS === "ios" ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setEditing(null)}
          className="items-center py-2"
        >
          <Text variant="label" tone="primary">
            Done
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
