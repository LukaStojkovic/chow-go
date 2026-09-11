import { useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";

/**
 * Bars drawn as views rather than SVG.
 *
 * Every chart in the seller app is a short bar or line series over a fixed
 * domain - seven days, twenty-four hours - so a charting library would add a
 * native dependency and a second theming system to serve cases that flex-basis
 * already handles. Tapping a bar reveals its value, which is the only
 * interaction the web charts offered through a hover tooltip.
 *
 * The tallest bar carries the full brand green and a dot at its crown; the rest
 * sit in a paler tint. That means the peak is found by shape before the numbers
 * are read at all.
 */
export function BarChart({ data, height = 150, formatValue = String, peakLabel = "Peak" }) {
  const [selected, setSelected] = useState(null);

  const max = Math.max(...data.map((entry) => entry.value), 0);
  const peak = data.findIndex((entry) => entry.value === max && max > 0);
  const active = selected != null ? data[selected] : peak >= 0 ? data[peak] : null;

  return (
    <View className="gap-2">
      <View className="h-7 flex-row items-center justify-end">
        {active ? (
          <View className="flex-row items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1.5">
            <Text variant="label-sm" tone="primary" numberOfLines={1}>
              {selected != null ? active.label : peakLabel}
            </Text>
            <Text variant="label-sm" tone="primary">
              {formatValue(active.value)}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-end gap-1.5" style={{ height }}>
        {data.map((entry, index) => {
          // A zero-value bar still gets a sliver, so an empty day reads as
          // "nothing happened" rather than as a rendering failure.
          const ratio = max > 0 ? entry.value / max : 0;
          const barHeight = Math.max(3, ratio * (height - 10));
          const isPeak = index === peak;
          const isSelected = selected === index;
          const highlighted = isSelected || (selected == null && isPeak);

          return (
            <Pressable
              key={entry.label + index}
              accessibilityRole="button"
              accessibilityLabel={`${entry.label}: ${formatValue(entry.value)}`}
              onPress={() => setSelected(selected === index ? null : index)}
              className="flex-1 items-center justify-end"
              style={{ height }}
            >
              <View
                className={cn(
                  "w-full items-center rounded-t-sm",
                  highlighted ? "bg-primary" : "bg-chart-3",
                )}
                style={{
                  height: barHeight,
                  opacity: selected == null || isSelected ? 1 : 0.45,
                }}
              >
                {highlighted && barHeight > 16 ? (
                  <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-1.5">
        {data.map((entry, index) => (
          <View key={`${entry.label}-tick-${index}`} className="flex-1 items-center">
            {entry.tick ? (
              <Text
                variant="caption"
                tone={index === (selected ?? peak) ? "primary" : "muted"}
                numberOfLines={1}
              >
                {entry.tick}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** A labelled share of a whole - used for status and payment breakdowns. */
export function ProportionRow({ label, value, total, tone = "primary" }) {
  const share = total > 0 ? value / total : 0;
  const tones = {
    primary: "bg-primary",
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
    citrus: "bg-tertiary",
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text variant="label" numberOfLines={1} className="flex-1 capitalize">
          {label}
        </Text>
        <View className="flex-row items-baseline gap-1.5">
          <Text variant="price">{value}</Text>
          <Text variant="caption" tone="muted">
            {Math.round(share * 100)}%
          </Text>
        </View>
      </View>
      <View className="h-2.5 overflow-hidden rounded-full bg-muted">
        <View
          className={cn("h-full rounded-full", tones[tone])}
          style={{ width: `${Math.max(share * 100, share > 0 ? 3 : 0)}%` }}
        />
      </View>
    </View>
  );
}
