import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Check, PackageX, SlidersHorizontal } from "lucide-react-native";
import { soldOutState } from "@chowgo/shared/stock";
import { PressableScale } from "@/components/motion/Pressable";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Dialog";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import { usePendingStock } from "@/hooks/Restaurants/useMenuStock";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";

function UntilChoice({ onConfirm }) {
  const { t } = useTranslation("seller");
  const { color } = useTokens();
  const [until, setUntil] = useState("endOfDay");
  const choices = [
    { value: "endOfDay", title: t("stock.endOfDay"), hint: t("stock.endOfDayHint") },
    { value: "indefinite", title: t("stock.indefinite"), hint: t("stock.indefiniteHint") },
  ];

  return (
    <View className="gap-3">
      {choices.map((choice) => {
        const active = until === choice.value;
        return (
          <PressableScale
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            haptic="selection"
            onPress={() => setUntil(choice.value)}
            className={cn(
              "flex-row items-center gap-3 rounded-lg border-[1.5px] p-4",
              active ? "border-primary bg-primary-subtle" : "border-border bg-card",
            )}
          >
            <View className="flex-1 gap-0.5">
              <Text variant="label">{choice.title}</Text>
              <Text variant="caption" tone="muted">
                {choice.hint}
              </Text>
            </View>
            <View
              className={cn(
                "h-6 w-6 items-center justify-center rounded-full border-[1.5px]",
                active ? "border-primary bg-primary" : "border-border-strong",
              )}
            >
              {active ? (
                <Check size={14} strokeWidth={3} color={color["primary-foreground"]} />
              ) : null}
            </View>
          </PressableScale>
        );
      })}
      <Button variant="destructive" size="lg" fullWidth onPress={() => onConfirm(until)}>
        {t("stock.markSoldOut")}
      </Button>
    </View>
  );
}

function OptionList({ item, onToggle }) {
  const { t } = useTranslation("seller");
  const pending = usePendingStock(item._id);
  const busy = (optionId) =>
    pending.some((variables) => String(variables.optionId) === String(optionId));

  return (
    <ScrollView style={{ maxHeight: 420 }} contentContainerClassName="gap-4">
      {(item.optionGroups ?? []).map((group) => (
        <View key={group._id ?? group.name} className="gap-1">
          <Text variant="overline" tone="muted">
            {group.name}
          </Text>
          {(group.options ?? []).map((option) => {
            const soldOut = soldOutState(option);
            return (
              <View key={option._id} className="flex-row items-center gap-3 py-2">
                <View className={soldOut ? "flex-1 opacity-60" : "flex-1"}>
                  <Text variant="body" numberOfLines={1}>
                    {option.name}
                  </Text>
                  {soldOut ? (
                    <Text variant="caption" tone="destructive">
                      {soldOut.until
                        ? `${t("stock.soldOut")} · ${t("stock.backTomorrow")}`
                        : t("stock.soldOut")}
                    </Text>
                  ) : null}
                </View>
                <Toggle
                  value={!soldOut}
                  disabled={busy(option._id)}
                  onValueChange={(next) => onToggle(option, next)}
                  accessibilityLabel={t("stock.switchLabel", { name: option.name })}
                />
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

export function MenuStockSheet({ target, item, onClose, onSet }) {
  const { t } = useTranslation("seller");
  const [option, setOption] = useState(null);

  useEffect(() => {
    if (!target) setOption(null);
  }, [target]);

  const visible = Boolean(target && item);
  const choosingOption = target?.mode === "options" && option;

  let config;
  if (target?.mode === "options" && !option) {
    config = {
      icon: SlidersHorizontal,
      tone: "mint",
      title: t("stock.optionsTitle", { name: item?.name ?? "" }),
      description: t("stock.optionsDescription"),
    };
  } else {
    config = {
      icon: PackageX,
      tone: "danger",
      title: t("stock.durationTitle"),
      description: choosingOption ? option.name : item?.name,
    };
  }

  return (
    <Sheet visible={visible} onClose={onClose} {...config}>
      {!visible ? null : target.mode === "dish" ? (
        <UntilChoice
          onConfirm={(until) => {
            onSet({ menuItemId: item._id, available: false, until, name: item.name });
            onClose();
          }}
        />
      ) : choosingOption ? (
        <UntilChoice
          onConfirm={(until) => {
            onSet({
              menuItemId: item._id,
              optionId: option._id,
              available: false,
              until,
              name: option.name,
            });
            setOption(null);
          }}
        />
      ) : (
        <OptionList
          item={item}
          onToggle={(entry, next) => {
            if (next) {
              onSet({ menuItemId: item._id, optionId: entry._id, available: true, name: entry.name });
            } else {
              setOption(entry);
            }
          }}
        />
      )}
    </Sheet>
  );
}
