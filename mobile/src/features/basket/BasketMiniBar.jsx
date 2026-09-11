import { Pressable, View } from "react-native";
import { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname, useSegments } from "expo-router";
import { ArrowRight, ShoppingBag } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { FloatingBar } from "@/components/ui/FloatingBar";
import { Text } from "@/components/ui/Text";
import { tabBarHeight } from "@/navigation/tabBar";
import { useCartStore } from "@/store/useCartStore";
import { useTokens } from "@/theme/useTokens";

/**
 * Persistent bar rather than a pushed route: the basket stays one thumb-reach
 * away while browsing, which is what a pushed screen cannot do.
 *
 * It is a dark pill, not a green one - the green pill is reserved for the
 * action that actually places the order, so the two are never confused at the
 * bottom of a screen.
 */
export function BasketMiniBar() {
  const { items, totalPrice, restaurant } = useCartStore();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { color } = useTokens();

  const count = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  // Hidden where it would be noise or duplicate the screen's own CTA.
  const hidden = count === 0 || pathname.startsWith("/basket") || pathname.startsWith("/checkout");
  if (hidden) return null;

  // This bar is mounted by the customer stack, above the tab navigator rather
  // than inside it, so `useBottomTabBarHeight` is not available here. Segments
  // still carry the group names that `usePathname` strips, which is how we know
  // whether there is a tab bar underneath to clear.
  const overTabs = segments.includes("(tabs)");

  return (
    <FloatingBar
      tone="dark"
      bottomOffset={overTabs ? tabBarHeight(insets) : 0}
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(150)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View basket, ${count} items, ${formatPrice(totalPrice)}`}
        onPress={() => router.push("/(customer)/basket")}
        className="flex-1 flex-row items-center gap-3 active:opacity-80"
      >
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <ShoppingBag size={19} color={color.background} />
          <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-primary-bright px-1">
            <Text variant="caption" className="text-primary-foreground">
              {count}
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <Text variant="label" className="text-background" numberOfLines={1}>
            {restaurant?.name ?? "Your basket"}
          </Text>
          <Text variant="caption" className="text-background opacity-70">
            {count} {count === 1 ? "item" : "items"} · {formatPrice(totalPrice)}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 rounded-full bg-primary px-4 py-2.5">
          <Text variant="label" tone="inverse">
            View basket
          </Text>
          <ArrowRight size={15} strokeWidth={2.6} color={color["primary-foreground"]} />
        </View>
      </Pressable>
    </FloatingBar>
  );
}
