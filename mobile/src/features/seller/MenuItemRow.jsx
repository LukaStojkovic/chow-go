import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { ChevronRight, EyeOff } from "lucide-react-native";
import { isPromotionLive, resolvePromotion } from "@chowgo/shared/promotion";
import { formatPrice } from "@chowgo/shared/format";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

// Seller screens read raw documents, unlike every customer-facing read which
// arrives already decorated, so the promotion is resolved here.
export function SellerMenuItemRow({ item, onPress }) {
  const promo = resolvePromotion(item.price, item.promotion);
  const live = isPromotionLive(item.promotion);
  const unavailable = item.available === false;
  const { color, elevation, scheme } = useTokens();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.name}
      onPress={onPress}
      style={elevation.subtle[scheme]}
      className="flex-row items-center gap-3 rounded-lg bg-card p-3 active:opacity-90"
    >
      <View className="h-16 w-16 overflow-hidden rounded-sm bg-muted">
        {item.imageUrls?.[0] ? (
          <Image
            source={item.imageUrls[0]}
            style={{ flex: 1, opacity: unavailable ? 0.45 : 1 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : null}
      </View>

      <View className="flex-1 gap-1">
        <Text variant="h3" numberOfLines={1} tone={unavailable ? "muted" : "foreground"}>
          {item.name}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1} className="capitalize">
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

      <View className="items-end gap-1.5">
        {unavailable ? (
          <Badge tone="neutral" size="sm" icon={EyeOff}>
            Hidden
          </Badge>
        ) : null}
        {live ? (
          <Badge tone="solid-citrus" size="sm">
            {`-${promo.discountPercent}%`}
          </Badge>
        ) : null}
        {!unavailable && !live ? (
          <ChevronRight size={18} color={color["muted-foreground"]} />
        ) : null}
      </View>
    </Pressable>
  );
}
