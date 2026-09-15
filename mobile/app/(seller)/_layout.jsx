import { Redirect, Stack } from "expo-router";
import { SellerAlert } from "@/features/seller/SellerAlert";
import { useAuthStore } from "@/store/useAuthStore";
import { fullScreenModalOptions, stackScreenOptions } from "@/navigation/transitions";
import { useTokens } from "@/theme/useTokens";

export default function SellerLayout() {
  const authUser = useAuthStore((state) => state.authUser);
  const { color } = useTokens();

  if (!authUser) return <Redirect href="/(auth)/welcome" />;
  if (authUser.role !== "seller") return <Redirect href="/(customer)" />;

  return (
    <>
      <Stack screenOptions={stackScreenOptions({ color })}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="incoming/[orderId]" options={fullScreenModalOptions} />
        <Stack.Screen name="order/[orderId]" />
        <Stack.Screen name="menu-item/[menuItemId]" />
      </Stack>

      <SellerAlert />
    </>
  );
}
