import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { PressableScale } from "@/components/motion/Pressable";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";

export function toggleOption(groups, selected, groupId, optionId) {
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return selected;
  const inGroup = new Set(group.options.map((option) => option.id));
  const current = selected.filter((id) => inGroup.has(id));
  const others = selected.filter((id) => !inGroup.has(id));

  if (current.includes(optionId)) {
    if (group.isSingle && group.isRequired) return selected;
    return [...others, ...current.filter((id) => id !== optionId)];
  }
  if (group.isSingle) return [...others, optionId];
  if (current.length >= group.maxSelect) return selected;
  return [...others, ...current, optionId];
}

function Indicator({ single, checked, disabled }) {
  const { color } = useTokens();
  if (single) {
    return (
      <View
        className={cn(
          "h-6 w-6 items-center justify-center rounded-full border-2",
          checked ? "border-primary" : "border-border-strong",
          disabled && "opacity-50",
        )}
      >
        {checked ? <View className="h-3 w-3 rounded-full bg-primary" /> : null}
      </View>
    );
  }
  return (
    <View
      className={cn(
        "h-6 w-6 items-center justify-center rounded-xs border-2",
        checked ? "border-primary bg-primary" : "border-border-strong",
        disabled && "opacity-50",
      )}
    >
      {checked ? <Check size={14} strokeWidth={3} color={color["primary-foreground"]} /> : null}
    </View>
  );
}

export function OptionGroupPicker({ group, selected, currency, onToggle }) {
  const { t } = useTranslation(["restaurant"]);
  const chosen = group.options.filter((option) => selected.includes(option.id)).length;
  const full = !group.isSingle && chosen >= group.maxSelect;

  return (
    <View className="gap-2" accessibilityRole={group.isSingle ? "radiogroup" : undefined}>
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Text variant="h3">{group.name}</Text>
          <Text variant="caption" tone="muted">
            {group.rule}
          </Text>
        </View>
        {group.isRequired ? (
          <Badge tone={chosen >= group.minSelect ? "mint" : "citrus"} size="sm">
            {t("restaurant:options.required")}
          </Badge>
        ) : null}
      </View>

      <View className="overflow-hidden rounded-lg bg-card">
        {group.options.map((option, index) => {
          const checked = selected.includes(option.id);
          const disabled = !option.available || (full && !checked);
          return (
            <PressableScale
              key={option.id}
              haptic="selection"
              scale={0.99}
              disabled={disabled}
              onPress={() => onToggle(group.id, option.id)}
              accessibilityRole={group.isSingle ? "radio" : "checkbox"}
              accessibilityState={{ checked, disabled }}
              accessibilityLabel={option.name}
              className={cn(
                "flex-row items-center gap-3 px-4 py-3.5",
                index > 0 && "border-t border-border",
              )}
            >
              <Indicator single={group.isSingle} checked={checked} disabled={disabled} />
              <Text
                variant="body"
                tone={option.available ? "foreground" : "muted"}
                className="flex-1"
                numberOfLines={2}
              >
                {option.name}
              </Text>
              {!option.available ? (
                <Text variant="label-sm" tone="muted">
                  {t("restaurant:options.soldOut")}
                </Text>
              ) : option.priceDelta > 0 ? (
                <Text variant="label-sm" tone="muted">
                  {t("restaurant:options.priceDelta", {
                    price: formatPrice(option.priceDelta, { currency }),
                  })}
                </Text>
              ) : null}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
