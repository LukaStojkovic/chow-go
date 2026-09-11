import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { useMotionStore } from "@/store/useMotionStore";
import { useTokens } from "@/theme/useTokens";
import { Text } from "./Text";

/**
 * Filter pill. Inactive is a white pill with a hairline border; active is a
 * solid green pill with a check. The check matters - it is what tells you a
 * green pill is *selected* rather than merely being the brand colour.
 */
export function Chip({ label, icon: Icon, active, onPress, showCheck = false, className }) {
  const { color } = useTokens();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      className={cn(
        "h-10 flex-row items-center gap-1.5 rounded-full border px-4 active:opacity-70",
        active ? "border-primary bg-primary" : "border-border bg-card",
        className,
      )}
    >
      {active && showCheck ? (
        <Check size={15} color={color["primary-foreground"]} strokeWidth={3} />
      ) : Icon ? (
        <Icon size={16} color={active ? color["primary-foreground"] : color["muted-foreground"]} />
      ) : null}
      <Text
        variant="label"
        numberOfLines={1}
        className={cn("shrink", active ? "text-primary-foreground" : "text-foreground")}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Horizontally scrolling chip row that bleeds to the screen edges.
export function ChipRow({ children, className }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName={cn("gap-2 px-5", className)}
    >
      {children}
    </ScrollView>
  );
}

/**
 * Segmented control.
 *
 * One pill slides between the segments rather than each segment lighting up
 * independently. The movement is what makes the group read as a single control
 * with a position, instead of three buttons that happen to sit together - and
 * it is the difference between this looking like a native toggle and looking
 * like a row of chips.
 *
 * `iconOnly` drops the labels for cases where the glyphs are unambiguous and
 * the current value is named elsewhere - the appearance and motion settings put
 * it in the row heading. Every segment keeps an accessibilityLabel regardless,
 * so the control is never icon-only to a screen reader.
 */
export function Segmented({
  options,
  value,
  onChange,
  tone = "primary",
  iconOnly = false,
  className,
}) {
  const [width, setWidth] = useState(0);
  const reduced = useMotionStore((state) => state.isReduced);
  const { elevation, scheme } = useTokens();

  const items = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
  const index = Math.max(
    0,
    items.findIndex((option) => option.value === value),
  );

  // The track carries 4pt of padding on every side, so the travel available to
  // the indicator is the measured width less both insets.
  const segment = width > 0 ? (width - 8) / items.length : 0;

  const offset = useSharedValue(0);
  useEffect(() => {
    const target = index * segment;
    offset.value = reduced ? target : withTiming(target, { duration: 220 });
  }, [index, segment, reduced, offset]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityRole="tablist"
      className={cn("flex-row rounded-full bg-muted p-1", className)}
    >
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            indicator,
            { width: segment },
            tone === "primary" ? null : elevation.subtle[scheme],
          ]}
          className={cn(
            "absolute bottom-1 left-1 top-1 rounded-full",
            tone === "primary" ? "bg-primary" : "bg-card",
          )}
        />
      ) : null}

      {items.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(option.value);
            }}
            className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full"
          >
            {Icon ? <SegmentedIcon Icon={Icon} active={active} tone={tone} /> : null}
            {iconOnly && Icon ? null : (
              <Text
                variant="label"
                numberOfLines={1}
                className={cn(
                  "shrink",
                  active
                    ? tone === "primary"
                      ? "text-primary-foreground"
                      : "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {option.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function SegmentedIcon({ Icon, active, tone }) {
  const { color } = useTokens();
  const tint = active
    ? tone === "primary"
      ? color["primary-foreground"]
      : color.foreground
    : color["muted-foreground"];
  return <Icon size={17} strokeWidth={2} color={tint} />;
}

/**
 * Underlined tab bar - Sign In / Create Account. Distinct from Segmented on
 * purpose: this one switches the *content of the page*, where the segmented
 * pill switches a filter applied to it.
 */
export function TabSwitch({ options, value, onChange, className }) {
  return (
    <View className={cn("flex-row border-b border-border", className)}>
      {options.map((option) => {
        const key = option.value ?? option;
        const label = option.label ?? option;
        const active = key === value;

        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(key);
            }}
            className={cn(
              "flex-1 items-center border-b-[2.5px] pb-3",
              active ? "border-primary" : "border-transparent",
            )}
          >
            <Text variant="h3" tone={active ? "primary" : "muted"} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
