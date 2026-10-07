import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { UtensilsCrossed } from "lucide-react-native";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantView, unavailableReason } from "@chowgo/shared/adapters/restaurant";
import { formatPrice } from "@chowgo/shared/format";
import { MAX_ORDER_NOTES } from "@chowgo/shared/constants";
import { resolveOptionSelection } from "@chowgo/shared/menuOptions";
import { lineTotal, sumMoney } from "@chowgo/shared/money";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Inset } from "@/components/ui/Card";
import { DockedBar } from "@/components/ui/FloatingBar";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { OptionGroupPicker, toggleOption } from "@/features/restaurant/OptionGroupPicker";
import { useRestaurant } from "@/hooks/Restaurants/useRestaurant";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";
import { cloudinaryUrl } from "@chowgo/shared/image";

export default function ItemCustomization() {
  const { t } = useTranslation(["order", "restaurant", "basket", "profile", "auth", "errors", "validation", "courier", "common"]);
  const { menuItemId, restaurantId } = useLocalSearchParams();
  const { info, menu } = useRestaurant(restaurantId);
  const addItem = useCartStore((state) => state.addItem);

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  // The restaurant's menu, not a single-dish endpoint (there is no public
  // one): opened from its restaurant page this is already cached; opened cold
  // from a link or a notification it is fetched here.
  const dish = useMemo(() => {
    const all = toDishViews((menu.data ?? []).flatMap((group) => group.items ?? []));
    return all.find((item) => item.id === menuItemId) ?? null;
  }, [menu.data, menuItemId]);
  const closedReason = unavailableReason(info.data ? toRestaurantView(info.data) : null);

  async function add() {
    setBusy(true);
    const result = await addItem(menuItemId, quantity, notes.trim() || undefined, selected);
    setBusy(false);

    if (result.status === "added") {
      router.back();
      return;
    }
    if (result.status === "unauthenticated") {
      router.push("/(auth)/login");
      return;
    }
    if (result.status === "error") {
      info.refetch();
      return;
    }
    if (result.status === "conflict") {
      router.back();
      // The dialog lives above the tab bar so it survives this sheet closing.
      toast.info(t("basket:heading"));
    }
  }

  if (!dish && (menu.isLoading || (menu.isFetching && !menu.data))) {
    return (
      <Screen>
        <ScreenHeader />
        <View className="gap-4 px-5">
          <Skeleton className="aspect-[16/10] w-full rounded-lg" />
          <Skeleton className="h-8 w-2/3 rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </View>
      </Screen>
    );
  }

  if (!dish && menu.isError) {
    return (
      <Screen>
        <ScreenHeader />
        <EmptyState
          tone="danger"
          title={t("restaurant:error.title")}
          description={t("restaurant:error.description")}
          actionLabel={t("common:actions.retry")}
          onAction={() => menu.refetch()}
        />
      </Screen>
    );
  }

  if (!dish) {
    return (
      <Screen>
        <ScreenHeader />
        <EmptyState
          icon={UtensilsCrossed}
          title={t("restaurant:menu.soldOut")}
          description={t("errors:cart.menuItemNotFound")}
          actionLabel={t("common:actions.goBack")}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const { currency } = dish;
  const selection = resolveOptionSelection(dish.optionGroups, selected);
  const optionsDelta = sumMoney(
    ...dish.optionGroups.flatMap((group) =>
      group.options.filter((option) => selected.includes(option.id)).map((option) => option.priceDelta),
    ),
  );
  const unitPrice = sumMoney(dish.price, optionsDelta);
  const total = lineTotal(unitPrice, quantity);
  const blocker = selection.ok
    ? null
    : selection.code === "OPTION_REQUIRED"
      ? t("restaurant:options.pickRequired", { group: selection.group })
      : selection.code === "OPTION_TOO_MANY"
        ? t("restaurant:options.pickAtMost", { max: selection.max, group: selection.group })
        : selection.code === "OPTION_UNAVAILABLE"
          ? t("errors:menuOption.unavailable", { option: selection.option })
          : t("errors:menuOption.unknown");

  return (
    <Screen edges={["top", "bottom"]}>
      <ScrollView
        contentContainerClassName="pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="aspect-[16/10] bg-muted">
          {dish.image ? (
            <Image source={cloudinaryUrl(dish.image, { width: 1440 })} style={{ flex: 1 }} contentFit="cover" transition={500} />
          ) : null}

          {dish.discountPercent > 0 ? (
            <View className="absolute left-5 top-5">
              <Badge tone="solid-citrus">
                {dish.promoLabel ?? t("common:units.percentOff", { value: dish.discountPercent })}
              </Badge>
            </View>
          ) : null}
        </View>

        {/* The white sheet lifts over the photograph, the same move the
             restaurant hero makes, so the two screens feel continuous. */}
        <View className="-mt-6 gap-5 rounded-t-3xl bg-background px-5 pt-6">
          <View className="gap-2">
            <Text variant="h1">{dish.name}</Text>
            {dish.description ? (
              <Text variant="body-lg" tone="muted">
                {dish.description}
              </Text>
            ) : null}
            <View className="flex-row items-baseline gap-2 pt-1">
              <Text variant="price-lg" tone="primary">
                {formatPrice(unitPrice, { currency })}
              </Text>
              {dish.basePrice ? (
                <Text variant="body" tone="muted" className="line-through">
                  {formatPrice(sumMoney(dish.basePrice, optionsDelta), { currency })}
                </Text>
              ) : null}
            </View>
          </View>

          {dish.optionGroups.map((group) => (
            <OptionGroupPicker
              key={group.id}
              group={group}
              selected={selected}
              currency={currency}
              onToggle={(groupId, optionId) =>
                setSelected((current) => toggleOption(dish.optionGroups, current, groupId, optionId))
              }
            />
          ))}

          <Input
            label={t("basket:line.instructions")}
            hint={t("basket:kitchenNoteHint")}
            value={notes}
            onChangeText={setNotes}
            maxLength={MAX_ORDER_NOTES}
            multiline
            placeholder={t("basket:kitchenNoteShortPlaceholder")}
          />
        </View>
      </ScrollView>

      <DockedBar className="gap-2">
        {closedReason ? (
          <Inset tone="warning" accessibilityLiveRegion="polite">
            <Text variant="body-sm">{closedReason}</Text>
          </Inset>
        ) : blocker ? (
          <Text variant="label-sm" tone="tertiary" className="text-center" accessibilityLiveRegion="polite">
            {blocker}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-3">
          <Stepper value={quantity} onChange={setQuantity} />
          <Button
            className="flex-1"
            size="lg"
            loading={busy}
            disabled={!selection.ok || Boolean(closedReason)}
            onPress={add}
          >
            {closedReason
              ? t("restaurant:availability.closedNow")
              : t("basket:addItem", { price: formatPrice(total, { currency }) })}
          </Button>
        </View>
      </DockedBar>
    </Screen>
  );
}
