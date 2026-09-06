import { useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";

/**
 * Bars drawn as views rather than SVG.
 *
 * Every chart in the seller app is a short bar or line series over a fixed
 * domain — seven days, twenty-four hours — so a charting library would add a
 * native dependency and a second theming system to serve cases that flex-basis
 * already handles. Tapping a bar reveals its value, which is the only
 * interaction the web charts offered through a hover tooltip.
 */
export function BarChart({
  data,
  height = 140,
  formatValue = String,
  barClassName = "bg-primary",
}) {
  const [selected, setSelected] = useState(null);

  const max = Math.max(...data.map((entry) => entry.value), 0);
  const active = selected != null ? data[selected] : null;

  return (
    <View className="gap-2">
      <View className="h-5 flex-row items-center justify-end">
        {active ? (
          <Text variant="caption" tone="muted">
            {active.label} · {formatValue(active.value)}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-end gap-1" style={{ height }}>
        {data.map((entry, index) => {
          // A zero-value bar still gets a sliver, so an empty day reads as
          // "nothing happened" rather than as a rendering failure.
          const ratio = max > 0 ? entry.value / max : 0;
          const barHeight = Math.max(2, ratio * height);

          return (
            <Pressable
              key={entry.label + index}
              accessibilityRole="button"
              accessibilityLabel={`${entry.label}: ${formatValue(entry.value)}`}
              onPress={() => setSelected(selected === index ? null : index)}
              className="flex-1 justify-end"
              style={{ height }}
            >
              <View
                className={`rounded-t-xs ${barClassName}`}
                style={{
                  height: barHeight,
                  opacity: selected == null || selected === index ? 1 : 0.35,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-1">
        {data.map((entry, index) => (
          <View key={`${entry.label}-tick-${index}`} className="flex-1 items-center">
            {entry.tick ? (
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {entry.tick}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** A labelled share of a whole — used for status and payment breakdowns. */
export function ProportionRow({ label, value, total, tone = "primary" }) {
  const share = total > 0 ? value / total : 0;
  const tones = {
    primary: "bg-primary",
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };

  return (
    <View className="gap-1.5">
      <View className="flex-row justify-between">
        <Text variant="body-sm" className="capitalize">
          {label}
        </Text>
        <Text variant="body-sm" tone="muted">
          {value} · {Math.round(share * 100)}%
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-muted">
        <View
          className={`h-full rounded-full ${tones[tone]}`}
          style={{ width: `${share * 100}%` }}
        />
      </View>
    </View>
  );
}
