import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, UserRound } from "lucide-react-native";

import { errorMessage } from "@/api/client";
import { pickImages } from "@/api/uploads";
import { Card } from "@/components/ui/Card";
import { DockedBar } from "@/components/ui/FloatingBar";

import { Button, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { updateProfile } from "@/services/apiAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

export default function EditProfile() {
  const { authUser, setAuthUser } = useAuthStore();
  const { color } = useTokens();

  const [name, setName] = useState(authUser?.name ?? "");
  const [phone, setPhone] = useState(authUser?.phoneNumber ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [preview, setPreview] = useState(null);

  const changingPassword = newPassword.length > 0;
  const mismatch = changingPassword && newPassword !== confirmPassword;

  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        // The backend only touches the password when all three are present.
        ...(changingPassword ? { currentPassword, newPassword, confirmPassword } : {}),
      }),
    onSuccess: (data) => {
      if (data?.data) setAuthUser(data.data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Profile updated");
    },
    onError: (error) =>
      toast.error("Could not update your profile", { description: errorMessage(error) }),
  });

  // The photo saves on pick rather than waiting for the Save button: it is the
  // one field with no draft state worth keeping, and holding the upload back
  // would mean sending it in the same request as a password change.
  const uploadPhoto = useMutation({
    mutationFn: (image) => updateProfile({ profilePicture: image }),
    onSuccess: (data) => {
      if (data?.data) setAuthUser(data.data);
      toast.success("Photo updated");
    },
    onError: (error) =>
      toast.error("Could not update your photo", { description: errorMessage(error) }),
    onSettled: () => setPreview(null),
  });

  async function changePhoto() {
    const result = await pickImages({ limit: 1 });
    if (result.status === "denied") {
      toast.warning("Photo access needed", { description: "Turn it on in Settings." });
      return;
    }

    const [image] = result.images;
    if (!image) return;

    setPreview(image.uri);
    uploadPhoto.mutate(image);
  }

  const photo = preview ?? authUser?.profilePicture;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title="Your details" subtitle={authUser?.email} />
      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card className="flex-row items-center gap-4">
          <View className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
            {photo ? (
              <Image source={photo} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <UserRound size={26} color={color["muted-foreground"]} />
              </View>
            )}
            {uploadPhoto.isPending ? (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <ActivityIndicator size="small" color={color["scrim-foreground"]} />
              </View>
            ) : null}
          </View>

          <View className="flex-1 gap-0.5">
            <Text variant="h3" numberOfLines={1}>
              Profile photo
            </Text>
            <Text variant="caption" tone="muted">
              Couriers see this when they pick your order up
            </Text>
          </View>

          <IconButton
            icon={ImagePlus}
            variant="mint"
            label="Change photo"
            onPress={changePhoto}
            disabled={uploadPhoto.isPending}
          />
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text variant="h3" className="flex-1">
              Your details
            </Text>
          </View>
          <Input label="Name" value={name} onChangeText={setName} autoComplete="name" />

          <Input
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Input
            label="Email"
            value={authUser?.email ?? ""}
            editable={false}
            hint="Email cannot be changed."
          />
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3">Change password</Text>
              <Text variant="caption" tone="muted">
                Leave blank to keep your current one
              </Text>
            </View>
          </View>
          <Input
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            textContentType="password"
          />

          <Input
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            textContentType="newPassword"
            hint="At least 6 characters"
          />

          <Input
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            error={mismatch ? "Passwords do not match" : undefined}
          />
        </Card>
      </ScrollView>

      <DockedBar>
        <Button
          size="lg"
          fullWidth
          loading={save.isPending}
          disabled={mismatch || (changingPassword && !currentPassword)}
          onPress={() => save.mutate()}
        >
          Save changes
        </Button>
      </DockedBar>
    </Screen>
  );
}
