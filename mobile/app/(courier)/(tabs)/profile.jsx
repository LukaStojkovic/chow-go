import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ImagePlus, LogOut, Star } from "lucide-react-native";
import { errorMessage } from "@/api/client";
import { pickImages } from "@/api/uploads";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useCourierProfile, useUpdateCourierProfile } from "@/hooks/Courier/useCourier";
import { useAuthStore } from "@/store/useAuthStore";
import { useMotionStore } from "@/store/useMotionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const VERIFICATION_TONE = { verified: "success", pending: "warning", rejected: "destructive" };

function Choice({ label, options, value, onChange }) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <View className="flex-row gap-2">
        {options.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={value === option ? "primary" : "outline"}
            className="flex-1"
            onPress={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </View>
    </View>
  );
}

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
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 p-5 pb-28" keyboardShouldPersistTaps="handled">
        <Text variant="h1">Profile</Text>

        <View className="flex-row items-center gap-3">
          <View className="h-16 w-16 overflow-hidden rounded-full bg-muted">
            {data?.profilePicture ? (
              <Image source={data.profilePicture} style={{ flex: 1 }} contentFit="cover" />
            ) : null}
          </View>
          <View className="flex-1 gap-1">
            <Text variant="h3" numberOfLines={1}>
              {data?.fullName}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Star size={13} color={color.rating} fill={color.rating} />
              <Text variant="caption" tone="muted">
                {data?.averageRating || "New"} · {data?.totalDeliveries ?? 0} deliveries
              </Text>
            </View>
          </View>
          <Button
            variant="outline"
            size="sm"
            accessibilityLabel="Change photo"
            onPress={changePhoto}
          >
            <ImagePlus size={15} color={color.foreground} />
          </Button>
        </View>

        <Card className="gap-1">
          <Text variant="caption" tone="muted">
            Verification
          </Text>
          <Text variant="label" tone={VERIFICATION_TONE[data?.verificationStatus] ?? "muted"}>
            {data?.verificationStatus ?? "unknown"}
          </Text>
          <Text variant="caption" tone="muted">
            {data?.vehicleType ? `Riding a ${data.vehicleType}` : ""}
          </Text>
        </Card>

        <View className="gap-4">
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
        </View>

        <Card className="gap-4">
          <Text variant="h3">Appearance</Text>
          <Choice
            label="Theme"
            options={["light", "dark", "system"]}
            value={theme.preference}
            onChange={theme.setPreference}
          />
          <Choice
            label="Motion"
            options={["full", "reduced", "system"]}
            value={motion.preference}
            onChange={motion.setPreference}
          />
        </Card>

        <Button
          variant="outline"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/welcome");
          }}
        >
          <View className="flex-row items-center gap-2">
            <LogOut size={16} color={color.foreground} />
            <Text variant="label">Sign out</Text>
          </View>
        </Button>
      </ScrollView>
    </Screen>
  );
}
