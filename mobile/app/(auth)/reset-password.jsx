import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["auth", "common"]);
  const { resetToken } = useLocalSearchParams();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit({ password }) {
    try {
      await resetPassword(resetToken, password);
      toast.success(t("register.passwordUpdated"), {
        description: t("reset.signInWithNew"),
      });
      router.replace("/(auth)/login");
    } catch (error) {
      toast.error(t("register.passwordUpdateFailed"), { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen title={t("reset.setPassword")} subtitle={t("reset.newPasswordDescription")}>
      {[
        {
          name: "password",
          label: t("fields.newPassword"),
          hint: t("fields.passwordHint", { count: 8 }),
        },
        { name: "confirmPassword", label: t("fields.confirmNewPassword") },
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
        {t("reset.setPassword")}
      </Button>
    </AuthScreen>
  );
}
