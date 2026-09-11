import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { errorMessage } from "@/api/client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { resetPasswordSchema } from "@/features/auth/schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

export default function ResetPassword() {
  const { email } = useLocalSearchParams();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit({ password }) {
    try {
      await resetPassword(email, password);
      toast.success("Password updated", { description: "Sign in with your new password." });
      router.replace("/(auth)/login");
    } catch (error) {
      toast.error("Could not update password", { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen title="Set a new password" subtitle="Choose something you haven't used before.">
      {[
        { name: "password", label: "New password", hint: "At least 6 characters" },
        { name: "confirmPassword", label: "Confirm new password" },
      ].map((item) => (
        <Controller
          key={item.name}
          control={control}
          name={item.name}
          render={({ field }) => (
            <Input
              label={item.label}
              hint={item.hint}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={formState.errors[item.name]?.message}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
          )}
        />
      ))}

      <Button size="lg" fullWidth loading={formState.isSubmitting} onPress={handleSubmit(onSubmit)}>
        Update password
      </Button>
    </AuthScreen>
  );
}
