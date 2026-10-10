import { useState } from "react";
import { PixelRatio, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { cloudinaryUrl } from "@chowgo/shared/image";
import { IconButton } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Rail } from "@/features/discover/Rail";
import { useCartSuggestions } from "@/hooks/Cart/useCartSuggestions";
import { cn } from "@/lib/cn";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";

const CARD_WIDTH = 144;
const IMAGE_WIDTH = PixelRatio.getPixelSizeForLayoutSize(CARD_WIDTH);

function UpsellCard({ dish, busy, onAdd }) {
  const { t } = useTranslation("basket");
  const currency = dish.currency;

  return (
    <View style={{ width: CARD_WIDTH }} className="gap-2">
      <View className="aspect-square overflow-hidden rounded-lg bg-muted">
        {dish.image ? (
          <Image
            source={cloudinaryUrl(dish.image, { width: IMAGE_WIDTH })}
            style={{ flex: 1 }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        ) : null}
        <IconButton
          icon={Plus}
          variant="primary"
          size={36}
          label={t(dish.hasOptions ? "basket:upsell.choose" : "basket:upsell.add", {
            name: dish.name,
          })}
          accessibilityState={{ busy }}
          disabled={busy}
          onPress={onAdd}
          className={cn("absolute bottom-2 right-2", busy && "opacity-50")}
        />
      </View>

      <View className="gap-0.5">
        <Text variant="h3" numberOfLines={1}>
          {dish.name}
        </Text>
        <View className="flex-row items-baseline gap-1.5">
          <Text variant="price" numberOfLines={1} className="shrink-0">
            {formatPrice(dish.price, { currency })}
          </Text>
          {dish.basePrice ? (
            <Text variant="caption" tone="muted" numberOfLines={1} className="line-through">
              {formatPrice(dish.basePrice, { currency })}
            </Text>
          ) : null}
        </View>
        {dish.reasonLabel ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {dish.reasonLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function UpsellRail({ className }) {
  const { t } = useTranslation("basket");
  const suggestions = useCartSuggestions();
  const addItem = useCartStore((state) => state.addItem);
  const cartRestaurantId = useCartStore((state) => state.restaurant?._id ?? null);
  const [pendingId, setPendingId] = useState(null);

  const dishes = suggestions.isError ? [] : (suggestions.data ?? []);
  if (dishes.length === 0) return null;

  async function add(dish) {
    if (dish.hasOptions) {
      router.push({
        pathname: "/(customer)/item/[menuItemId]",
        params: { menuItemId: dish.id, restaurantId: dish.restaurantId ?? cartRestaurantId },
      });
      return;
    }
    if (pendingId) return;
    setPendingId(dish.id);
    const result = await addItem(dish.id, 1);
    setPendingId(null);
    if (result?.status === "added") toast.success(t("basket:upsell.added", { name: dish.name }));
  }

  return (
    <View className={cn("-mx-5", className)}>
      <Rail
        title={t("basket:upsell.title")}
        data={dishes}
        keyExtractor={(dish) => dish.id}
        renderItem={({ item }) => (
          <UpsellCard dish={item} busy={pendingId === item.id} onAdd={() => add(item)} />
        )}
      />
    </View>
  );
}
