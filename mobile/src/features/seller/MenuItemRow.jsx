import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { isPromotionLive, resolvePromotion } from "@chowgo/shared/promotion";
import { formatPrice } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";

// Seller screens read raw documents, unlike every customer-facing read which
// arrives already decorated, so the promotion is resolved here.
export function SellerMenuItemRow({ item, onPress }) {
  const promo = resolvePromotion(item.price, item.promotion);
  const live = isPromotionLive(item.promotion);
  const unavailable = item.available === false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.name}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-md border border-border bg-card p-3 active:opacity-70"
    >
      <View className="h-14 w-14 overflow-hidden rounded-sm bg-muted">
        {item.imageUrls?.[0] ? (
          <Image
            source={item.imageUrls[0]}
            style={{ flex: 1, opacity: unavailable ? 0.5 : 1 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : null}
      </View>

      <View className="flex-1 gap-0.5">
        <Text variant="label" numberOfLines={1} tone={unavailable ? "muted" : "foreground"}>
          {item.name}
        </Text>
        <Text variant="caption" tone="muted">
          {item.category}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text variant="price" tone={unavailable ? "muted" : "foreground"}>
            {formatPrice(promo.price)}
          </Text>
          {live && promo.basePrice ? (
            <Text variant="caption" tone="muted" className="line-through">
              {formatPrice(promo.basePrice)}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="items-end gap-1">
        {unavailable ? (
          <View className="rounded-xs bg-muted px-1.5 py-0.5">
            <Text variant="caption" tone="muted">
              Hidden
            </Text>
          </View>
        ) : null}
        {live ? (
          <View className="rounded-xs bg-destructive px-1.5 py-0.5">
            <Text variant="caption" className="text-destructive-foreground">
              -{promo.discountPercent}%
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
