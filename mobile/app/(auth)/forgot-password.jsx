import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { errorMessage } from "@/api/client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { forgotPasswordSchema } from "@/features/auth/schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

export default function ForgotPassword() {
  const { t } = useTranslation(["auth", "common"]);
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit({ email }) {
    try {
      await requestPasswordReset(email);
      // The email is carried forward rather than re-typed at each step.
      router.push({ pathname: "/(auth)/verify-otp", params: { email } });
    } catch (error) {
      toast.error(t("register.sendCodeFailed"), { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen
      title={t("reset.title")}
      subtitle={t("reset.emailDescription")}
    >
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label={t("fields.email")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.email?.message}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder={t("fields.emailPlaceholder")}
            onSubmitEditing={handleSubmit(onSubmit)}
            returnKeyType="send"
          />
        )}
      />

      <Button size="lg" fullWidth loading={formState.isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t("reset.sendCode")}
      </Button>
    </AuthScreen>
  );
}
