import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { ChevronRight, SlidersHorizontal } from "lucide-react-native";
import { isPromotionLive, resolvePromotion } from "@chowgo/shared/promotion";
import { formatPrice } from "@chowgo/shared/format";
import { soldOutOptionCount, soldOutState } from "@chowgo/shared/stock";
import { PressableScale } from "@/components/motion/Pressable";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import { usePendingStock } from "@/hooks/Restaurants/useMenuStock";
import { useTokens } from "@/theme/useTokens";
import { cloudinaryUrl } from "@chowgo/shared/image";

// Seller screens read raw documents, unlike every customer-facing read which
// arrives already decorated, so the promotion is resolved here.
export function SellerMenuItemRow({ item, onPress, onToggleStock, onOpenOptions }) {
  const { t } = useTranslation(["seller", "common"]);
  const promo = resolvePromotion(item.price, item.promotion);
  const live = isPromotionLive(item.promotion);
  const soldOut = soldOutState(item);
  const optionCount = (item.optionGroups ?? []).reduce(
    (sum, group) => sum + (group.options?.length ?? 0),
    0,
  );
  const optionsOut = soldOutOptionCount(item);
  const pending = usePendingStock(item._id).some((variables) => !variables.optionId);
  const { color, elevation, scheme } = useTokens();

  return (
    <View style={elevation.subtle[scheme]} className="rounded-lg bg-card">
      <View className="flex-row items-center gap-3 p-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.name}
          onPress={onPress}
          className="flex-1 flex-row items-center gap-3 active:opacity-90"
        >
          <View className="h-16 w-16 overflow-hidden rounded-sm bg-muted">
            {item.imageUrls?.[0] ? (
              <Image
                source={cloudinaryUrl(item.imageUrls[0], { width: 240, height: 240, crop: "fill" })}
                style={{ flex: 1, opacity: soldOut ? 0.45 : 1 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : null}
          </View>

          <View className={soldOut ? "flex-1 gap-1 opacity-60" : "flex-1 gap-1"}>
            <Text variant="h3" numberOfLines={1} tone={soldOut ? "muted" : "foreground"}>
              {item.name}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1} className="capitalize">
              {item.category}
            </Text>

            <View className="flex-row items-center gap-2">
              <Text variant="price" tone={soldOut ? "muted" : "foreground"}>
                {formatPrice(promo.price)}
              </Text>
              {live && promo.basePrice ? (
                <Text variant="caption" tone="muted" className="line-through">
                  {formatPrice(promo.basePrice)}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>

        <View className="items-end gap-1.5">
          {soldOut ? (
            <Badge tone="danger" size="sm">
              {soldOut.until
                ? `${t("stock.soldOut")} · ${t("stock.backTomorrow")}`
                : t("stock.soldOut")}
            </Badge>
          ) : live ? (
            <Badge tone="solid-citrus" size="sm">
              {`-${promo.discountPercent}%`}
            </Badge>
          ) : null}
          {onToggleStock ? (
            <Toggle
              value={!soldOut}
              disabled={pending}
              onValueChange={(next) => onToggleStock(item, next)}
              accessibilityLabel={t("stock.switchLabel", { name: item.name })}
            />
          ) : (
            <ChevronRight size={18} color={color["muted-foreground"]} />
          )}
        </View>
      </View>

      {optionCount > 0 && onOpenOptions ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t("stock.optionsTitle", { name: item.name })}
          haptic="selection"
          onPress={() => onOpenOptions(item)}
          className="flex-row items-center gap-2 border-t border-border px-3 py-2.5"
        >
          <SlidersHorizontal size={15} color={color["muted-foreground"]} />
          <Text variant="label-sm" tone={optionsOut ? "destructive" : "muted"} className="flex-1">
            {optionsOut
              ? t("stock.optionsSoldOut", { count: optionsOut })
              : t("stock.options")}
          </Text>
          <ChevronRight size={16} color={color["muted-foreground"]} />
        </PressableScale>
      ) : null}
    </View>
  );
}
