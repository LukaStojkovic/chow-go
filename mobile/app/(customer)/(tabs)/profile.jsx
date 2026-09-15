import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { Image } from "expo-image";

import { Bike, LogOut, MapPin, Receipt, Store, UserRound } from "lucide-react-native";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { ListRow } from "@/components/ui/ListRow";
import { Screen } from "@/components/ui/Screen";
import { Divider, SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { AppearanceSettings } from "@/features/settings/AppearanceSettings";
import { MAX_SAVED_ADDRESSES } from "@chowgo/shared/constants";
import { useAddresses } from "@/hooks/Address/useAddresses";
import { useCustomerOrders } from "@/hooks/Orders/useOrders";
import { useFavourites } from "@/hooks/Favourites/useFavourites";
import { useAuthStore } from "@/store/useAuthStore";
import { useMotionStore } from "@/store/useMotionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useTokens } from "@/theme/useTokens";

// Three counts drawn from what the account actually holds. No invented wallet
// balance or points total: every figure on this screen is one the API returns.
function StatTile({ icon, label, value, tone }) {
  return (
    <Card className="flex-1 gap-2 p-3.5">
      <View className="flex-row items-center justify-between">
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text variant="price-lg">{value}</Text>
    </Card>
  );
}

export default function Profile() {
  const { t } = useTranslation(["profile", "order", "auth", "common"]);
  const { authUser, logout } = useAuthStore();
  const theme = useThemeStore();
  const motion = useMotionStore();
  const { color } = useTokens();

  const orders = useCustomerOrders(authUser ? { limit: 50 } : undefined);
  const favourites = useFavourites();
  const addresses = useAddresses();

  if (!authUser) {
    return (
      <Screen edges={["top"]} className="justify-center">
        <EmptyState
          icon={UserRound}
          title={t("profile:guest.title")}
          description={t("profile:guest.description")}
          actionLabel={t("auth:login.submit")}
          onAction={() => router.push("/(auth)/login")}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-44 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title={t("profile:sections.account")}
          size="lg"
          subtitle={t("profile:sections.accountHint")}
          actionLabel={t("common:actions.edit")}
          onAction={() => router.push("/(customer)/settings/profile")}
        />

        {/* Plain white. A gradient behind an avatar and three lines of contact
              detail decorates information that was already perfectly legible. */}
        <Card className="flex-row items-center gap-4">
          <View className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
            {authUser.profilePicture ? (
              <Image source={authUser.profilePicture} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <UserRound size={26} color={color["muted-foreground"]} />
              </View>
            )}
          </View>

          <View className="flex-1 gap-0.5">
            <Text variant="h2" numberOfLines={1}>
              {authUser.name}
            </Text>
            <Text variant="body-sm" tone="muted" numberOfLines={1}>
              {authUser.email}
            </Text>
            {authUser.phoneNumber ? (
              <Text variant="body-sm" tone="muted" numberOfLines={1}>
                {authUser.phoneNumber}
              </Text>
            ) : null}
          </View>
        </Card>

        <View className="flex-row gap-2.5">
          <StatTile label={t("common:nav.orders")} value={orders.data?.orders?.length ?? 0} />

          <StatTile label={t("common:nav.favourites")} value={favourites.data?.length ?? 0} />
          <StatTile
            label={t("profile:sections.addresses")}
            value={addresses.data?.length ?? 0}
          />
        </View>

        <Card className="p-0">
          <View className="px-4">
            <ListRow
              icon={UserRound}
              title={t("profile:account.personalDetails")}
              subtitle={t("profile:account.personalDetailsHint")}
              onPress={() => router.push("/(customer)/settings/profile")}
            />

            <Divider />
            <ListRow
              icon={Receipt}
              title={t("order:list.title")}
              subtitle={t("profile:sections.ordersHint")}
              onPress={() => router.push("/(customer)/(tabs)/orders")}
            />

            <Divider />
            <ListRow
              icon={MapPin}
              title={t("profile:address.deliveryHeading")}
              subtitle={t("profile:address.savedOf", {
                count: addresses.data?.length ?? 0,
                max: MAX_SAVED_ADDRESSES,
              })}
              onPress={() => router.push("/(customer)/address")}
            />
          </View>
        </Card>

        <AppearanceSettings />

        {/* The other two sides of Chow. Anyone signed in as a customer can
               still apply, and this is the only place in the app that says so. */}
        <Card className="p-0">
          <View className="px-4">
            <ListRow
              icon={Store}
              title={t("profile:partner.seller")}
              subtitle={t("profile:partner.sellerHint")}
              onPress={() => router.push("/(auth)/seller")}
            />

            <Divider />
            <ListRow
              icon={Bike}
              title={t("profile:becomeCourier.cta")}
              subtitle={t("profile:becomeCourier.description")}
              onPress={() => router.push("/(auth)/courier")}
            />
          </View>
        </Card>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          onPress={async () => {
            await logout();
            router.replace("/(auth)/welcome");
          }}
        >
          <View className="flex-row items-center gap-2">
            <LogOut size={17} color={color.destructive} />
            <Text variant="label" tone="destructive">
              {t("profile:logOut.action")}
            </Text>
          </View>
        </Button>
      
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => router.push("/delete-account")}
          accessibilityLabel={t("profile:deleteAccount.confirm")}
        >
          <Text variant="caption" tone="muted">
            {t("profile:deleteAccount.confirm")}
          </Text>
        </Button>
      </ScrollView>
    </Screen>
  );
}
