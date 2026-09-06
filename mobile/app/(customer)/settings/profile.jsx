import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { updateProfile } from "@/services/apiAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

export default function EditProfile() {
  const { authUser, setAuthUser } = useAuthStore();

  const [name, setName] = useState(authUser?.name ?? "");
  const [phone, setPhone] = useState(authUser?.phoneNumber ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-6 p-5" keyboardShouldPersistTaps="handled">
        <View className="gap-4">
          <Text variant="h3">Your details</Text>
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
        </View>

        <View className="gap-4">
          <Text variant="h3">Change password</Text>
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
        </View>

        <Button
          size="lg"
          loading={save.isPending}
          disabled={mismatch || (changingPassword && !currentPassword)}
          onPress={() => save.mutate()}
        >
          Save changes
        </Button>
      </ScrollView>
    </Screen>
  );
}
