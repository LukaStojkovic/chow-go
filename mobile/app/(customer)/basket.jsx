import { FlatList, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowRight, Plus, ShoppingBag } from "lucide-react-native";
import { buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import { lineTotal } from "@chowgo/shared/money";
import { optionsSummary } from "@chowgo/shared/menuOptions";
import { formatDeliveryEstimate, formatFee, formatPrice } from "@chowgo/shared/format";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DockedBar } from "@/components/ui/FloatingBar";

import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Divider } from "@/components/ui/Section";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { useCartStore } from "@/store/useCartStore";
import { useTokens } from "@/theme/useTokens";
import { cloudinaryUrl } from "@chowgo/shared/image";

function FeeRow({ label, value, tone = "muted", strong = false, currency }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text
        variant={strong ? "h3" : "body"}
        tone={strong ? "foreground" : "muted"}
        numberOfLines={1}
        className="flex-1"
      >
        {label}
      </Text>
      <Text variant={strong ? "price-lg" : "price"} tone={strong ? "foreground" : tone}>
        {typeof value === "string" ? value : formatPrice(value, { currency })}
      </Text>
    </View>
  );
}

const lineKey = (item) => String(item.lineId || (item.menuItem?._id ?? item.menuItem));

export default function Basket() {
  const { t } = useTranslation(["basket", "restaurant", "common"]);
  const { items, totalPrice, restaurant, updateItemQuantity, removeItem } = useCartStore();
  const { color } = useTokens();

  if (items.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={t("basket:title")} />
        <EmptyState
          icon={ShoppingBag}
          title={t("basket:empty.title")}
          description={t("basket:empty.description")}
          actionLabel={t("basket:empty.action")}
          onAction={() => router.replace("/(customer)/(tabs)")}
        />
      </Screen>
    );
  }

  // Fees come from the shared package, which mirrors the backend's own
  // constants - the client never invents a price.
  const breakdown = buildPriceBreakdown({ subtotal: totalPrice, currency: restaurant?.currency });
  const { currency } = breakdown;
  const count = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("basket:title")} subtitle={restaurant?.name} />

      <FlatList
        data={items}
        keyExtractor={lineKey}
        contentContainerClassName="gap-3 px-5 pb-6"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text variant="h3">{t("order:eta.label")}</Text>
                  <Text variant="body-sm" tone="muted">
                    {formatDeliveryEstimate(restaurant?.estimatedDeliveryTime)}
                  </Text>
                </View>
                <Badge tone="mint">{formatFee(breakdown.deliveryFee, { currency })}</Badge>
              </View>

              {restaurant?.name ? (
                <>
                  <Divider />
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1">
                      <Text variant="caption" tone="muted">
                        {t("basket:orderingFrom")}
                      </Text>
                      <Text variant="h3" numberOfLines={1}>
                        {restaurant.name}
                      </Text>
                    </View>
                    <IconButton
                      icon={Plus}
                      variant="mint"
                      label={t("basket:addMore")}
                      onPress={() =>
                        router.push(`/(customer)/restaurant/${restaurant._id ?? restaurant.id}`)
                      }
                    />
                  </View>
                </>
              ) : null}
            </Card>

            <View className="flex-row items-center justify-between pt-1">
              <Text variant="h1">{t("seller:orders.table.items")}</Text>
              <Text variant="label-sm" tone="muted">
                {t("common:count.items", { count })}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const id = lineKey(item);
          const optionsLabel = optionsSummary(item.options);
          return (
            <Card className="gap-3">
              <View className="flex-row items-start gap-3">
                <View className="h-16 w-16 overflow-hidden rounded-sm bg-muted">
                  {item.menuItem?.imageUrls?.[0] ? (
                    <Image
                      source={cloudinaryUrl(item.menuItem.imageUrls[0], {
                        width: 240,
                        height: 240,
                        crop: "fill",
                      })}
                      style={{ flex: 1 }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : null}
                </View>

                <View className="flex-1 gap-0.5">
                  <Text variant="h3" numberOfLines={2}>
                    {item.name}
                  </Text>
                  {optionsLabel ? (
                    <Text variant="body-sm" tone="muted" numberOfLines={3}>
                      {optionsLabel}
                    </Text>
                  ) : null}
                  <Text variant="body-sm" tone="muted">
                    {t("common:units.each", { price: formatPrice(item.price, { currency }) })}
                  </Text>
                  {item.specialInstructions ? (
                    <Text variant="caption" tone="muted" numberOfLines={2}>
                      {item.specialInstructions}
                    </Text>
                  ) : null}
                </View>

                <Text variant="price">
                  {formatPrice(lineTotal(item.price, item.quantity), { currency })}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text variant="label-sm" tone="muted">
                  {t("basket:line.quantity")}
                </Text>
                <Stepper
                  value={item.quantity}
                  min={1}
                  onChange={(next) => updateItemQuantity(id, next, item.specialInstructions)}
                  onRemove={() => removeItem(id)}
                />
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          <Card className="mt-2">
            <Text variant="h3" className="mb-2">
              {t("basket:summary.title")}
            </Text>
            <FeeRow
              currency={currency}
              label={t("basket:summary.subtotal")}
              value={breakdown.subtotal}
            />
            <FeeRow
              currency={currency}
              label={t("basket:summary.deliveryFee")}
              value={breakdown.deliveryFee}
            />
            <FeeRow
              currency={currency}
              label={t("basket:summary.serviceFee")}
              value={breakdown.serviceFee}
            />
            <Divider className="my-2" />
            <FeeRow
              currency={currency}
              label={t("basket:summary.total")}
              value={breakdown.total}
              strong
            />
            <Text variant="caption" tone="muted">
              {t("basket:summary.extrasAtCheckout")}
            </Text>
          </Card>
        }
      />

      <DockedBar>
        <Button size="lg" fullWidth onPress={() => router.push("/(customer)/checkout")}>
          <View className="flex-row items-center gap-2">
            <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
              {t("basket:goToCheckout")}
            </Text>
            <Text
              variant="body-lg"
              className="font-jakarta-bold text-primary-foreground opacity-70"
            >
              ·
            </Text>
            <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
              {formatPrice(breakdown.total, { currency })}
            </Text>
            <ArrowRight size={19} strokeWidth={2.6} color={color["primary-foreground"]} />
          </View>
        </Button>
      </DockedBar>
    </Screen>
  );
}
