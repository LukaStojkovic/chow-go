import { Pressable, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";
import { Text } from "./Text";

/**
 * Section heading: a title, an optional line of context under it, and an
 * optional "See all" on the right.
 *
 * Two sizes. `lg` is the title of a screen and appears once; `md` is a section
 * inside one, and is deliberately only a little larger than body text. A feed
 * of rails where every heading is set at display size reads as a series of
 * unrelated pages rather than one scrollable surface.
 */
export function SectionHeader({ title, subtitle, size = "md", actionLabel, onAction, className }) {
  const { color } = useTokens();

  return (
    <View className={cn("flex-row items-center justify-between gap-3", className)}>
      <View className="flex-1 gap-0.5">
        <Text variant={size === "lg" ? "h1" : "h2"} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body-sm" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel ?? "See all"}
          hitSlop={10}
          onPress={onAction}
          className="shrink-0 flex-row items-center gap-0.5 active:opacity-60"
        >
          <Text variant="label" tone="primary" numberOfLines={1}>
            {actionLabel ?? "See all"}
          </Text>
          <ChevronRight size={16} color={color.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

// A hairline.
export function Divider({ className }) {
  return <View className={cn("h-px bg-border", className)} />;
}
