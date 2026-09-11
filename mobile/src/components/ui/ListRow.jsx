import { Pressable, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";
import { Text } from "./Text";

/**
 * The settings / account row.
 *
 * The icon is a plain grey glyph, not a coloured tile. A column of rainbow
 * squircles turns a settings list into a toy; the icon here is only there to
 * give the eye something to land on while scanning down the labels.
 *
 * Rows stack inside one Card with dividers between them rather than each being
 * its own card - that grouping is what the profile screen is built from.
 */
export function ListRow({
  icon: Icon,
  title,
  subtitle,
  value,
  right,
  onPress,
  destructive = false,
  className,
}) {
  const { color } = useTokens();
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={title}
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-3.5 py-3.5",
        onPress && "active:opacity-60",
        className,
      )}
    >
      {Icon ? (
        <Icon
          size={20}
          strokeWidth={1.9}
          color={destructive ? color.destructive : color["muted-foreground"]}
        />
      ) : null}

      <View className="flex-1 gap-0.5">
        <Text variant="h3" tone={destructive ? "destructive" : "foreground"} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body-sm" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text variant="body-sm" tone="muted" numberOfLines={1} className="shrink-0">
          {value}
        </Text>
      ) : null}
      {right ?? (onPress ? <ChevronRight size={17} color={color["muted-foreground"]} /> : null)}
    </Wrapper>
  );
}
