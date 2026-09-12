import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Bike,
  ImagePlus,
  LogOut,
  Package,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react-native";
import { errorMessage } from "@/api/client";
import { pickImages } from "@/api/uploads";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { AppearanceSettings } from "@/features/settings/AppearanceSettings";
import { useCourierProfile, useUpdateCourierProfile } from "@/hooks/Courier/useCourier";
import { useAuthStore } from "@/store/useAuthStore";
import { useMotionStore } from "@/store/useMotionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const VERIFICATION = {
  verified: { tone: "mint", label: "Verified" },
  pending: { tone: "warning", label: "Awaiting verification" },
  rejected: { tone: "danger", label: "Verification rejected" },
};

export default function CourierProfile() {
  const { data, isLoading } = useCourierProfile();
  const update = useUpdateCourierProfile();
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore();
  const motion = useMotionStore();
  const { color } = useTokens();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (!data) return;
    setFullName(data.fullName ?? "");
    setPhoneNumber(data.phoneNumber ?? "");
  }, [data]);

  const dirty =
    data && (fullName !== (data.fullName ?? "") || phoneNumber !== (data.phoneNumber ?? ""));
  const verification = VERIFICATION[data?.verificationStatus] ?? {
    tone: "neutral",
    label: "Unknown",
  };

  async function changePhoto() {
    const result = await pickImages({ limit: 1 });
    if (result.status === "denied") {
      toast.warning("Photo access needed", { description: "Turn it on in Settings." });
      return;
    }
    if (!result.images.length) return;

    try {
      await update.mutateAsync({ profilePicture: result.images[0] });
      toast.success("Photo updated");
    } catch (error) {
      toast.error("Could not update your photo", { description: errorMessage(error) });
    }
  }

  if (isLoading) {
    return (
      <Screen edges={["top"]} className="gap-4 p-5">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-32 pt-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="Profile"
          size="lg"
          subtitle="How customers see you"
          className="pb-1"
        />

        <Card className="gap-4" elevation="raised">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 overflow-hidden rounded-full bg-muted">
              {data?.profilePicture ? (
                <Image source={data.profilePicture} style={{ flex: 1 }} contentFit="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <UserRound size={26} color={color["muted-foreground"]} />
                </View>
              )}
            </View>

            <View className="flex-1 gap-1">
              <Text variant="h2" numberOfLines={1}>
                {data?.fullName}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Star size={13} color={color.rating} fill={color.rating} />
                <Text variant="body-sm" tone="muted">
                  {data?.averageRating || "New"} · {data?.totalDeliveries ?? 0} deliveries
                </Text>
              </View>
            </View>

            <IconButton
              icon={ImagePlus}
              variant="mint"
              label="Change photo"
              onPress={changePhoto}
            />
          </View>

          <View className="flex-row flex-wrap gap-2">
            {/* Verification gates whether jobs can be claimed at all, so it is
                  stated plainly rather than buried in a settings list. */}
            <Badge tone={verification.tone} icon={ShieldCheck}>
              {verification.label}
            </Badge>
            {data?.vehicleType ? (
              <Badge tone="neutral" icon={Bike}>
                {data.vehicleType}
              </Badge>
            ) : null}
            <Badge tone="info" icon={Package}>
              {`${data?.totalDeliveries ?? 0} total`}
            </Badge>
          </View>
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text variant="h3" className="flex-1">
              Your details
            </Text>
          </View>

          <Input
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
          />

          <Input
            label="Phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Button
            size="lg"
            fullWidth
            disabled={!dirty}
            loading={update.isPending}
            onPress={async () => {
              try {
                await update.mutateAsync({ fullName, phoneNumber });
                toast.success("Profile updated");
              } catch (error) {
                toast.error("Could not save", { description: errorMessage(error) });
              }
            }}
          >
            Save changes
          </Button>
        </Card>

        <AppearanceSettings />

        <Button
          variant="outline"
          size="lg"
          fullWidth
          className="mt-2"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/welcome");
          }}
        >
          <View className="flex-row items-center gap-2">
            <LogOut size={17} color={color.destructive} />
            <Text variant="label" tone="destructive">
              Sign out
            </Text>
          </View>
        </Button>
      
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => router.push("/delete-account")}
          accessibilityLabel="Delete my account"
        >
          <Text variant="caption" tone="muted">
            Delete my account
          </Text>
        </Button>
      </ScrollView>
    </Screen>
  );
}
