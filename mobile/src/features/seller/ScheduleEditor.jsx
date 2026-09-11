import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Moon } from "lucide-react-native";
import { WEEK_DAYS, formatDayHours, getTodayKey } from "@chowgo/shared/schedule";
import { Badge } from "@/components/ui/Badge";
import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";

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
 *
 * A closed day collapses to a single row. Seven days of time pickers is a wall
 * of controls, and most of them are for hours that never change.
 */
export function ScheduleEditor({ schedule, onChangeDay }) {
  const [editing, setEditing] = useState(null);
  const today = getTodayKey();

  const entryFor = (key) => schedule?.[key] ?? { isOpen: false };

  return (
    <View className="gap-0">
      {WEEK_DAYS.map(({ key, label }, index) => {
        const entry = entryFor(key);
        const overnight = entry.isOpen && entry.closingTime < entry.openingTime;

        return (
          <View key={key}>
            {index > 0 ? <Divider /> : null}

            <View className="gap-2.5 py-3">
              <View className="flex-row items-center gap-2">
                <Text
                  variant="h3"
                  tone={key === today ? "primary" : "foreground"}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                {key === today ? (
                  <Badge tone="mint" size="sm">
                    Today
                  </Badge>
                ) : null}
                {overnight ? (
                  <Badge tone="info" size="sm" icon={Moon}>
                    Overnight
                  </Badge>
                ) : null}

                <View className="flex-1 items-end">
                  <Toggle
                    value={entry.isOpen}
                    onValueChange={(isOpen) => onChangeDay(key, { ...entry, isOpen })}
                    accessibilityLabel={`Open on ${label}`}
                  />
                </View>
              </View>

              {entry.isOpen ? (
                <View className="flex-row items-center gap-2">
                  {["openingTime", "closingTime"].map((field) => (
                    <Pressable
                      key={field}
                      accessibilityRole="button"
                      accessibilityLabel={`${label} ${field === "openingTime" ? "opens" : "closes"}`}
                      onPress={() => setEditing({ day: key, field })}
                      className="flex-1 gap-0.5 rounded-md bg-muted px-3.5 py-2.5 active:opacity-70"
                    >
                      <Text variant="caption" tone="muted">
                        {field === "openingTime" ? "Opens" : "Closes"}
                      </Text>
                      <Text variant="price">{entry[field] ?? "09:00"}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text variant="body-sm" tone="muted">
                  {formatDayHours(entry)}
                </Text>
              )}
            </View>
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
          className="items-center rounded-full bg-primary-subtle py-3 active:opacity-70"
        >
          <Text variant="label" tone="primary">
            Done
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
