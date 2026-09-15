import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { errorMessage } from "@/api/client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { otpSchema } from "@/features/auth/schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

export default function VerifyOtp() {
  const { t } = useTranslation(["auth", "common"]);
  const { email } = useLocalSearchParams();
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  async function onSubmit({ code }) {
    try {
      const res = await verifyOtp(email, code);
      // The next screen identifies the account by this single-use token, so the
      // email no longer needs to travel with the request.
      router.push({
        pathname: "/(auth)/reset-password",
        params: { resetToken: res?.data?.resetToken ?? "" },
      });
    } catch (error) {
      toast.error(t("register.codeRejected"), { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen title={t("reset.checkEmail")} subtitle={t("reset.codeSent", { email })}>
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <Input
            label={t("fields.code")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.code?.message}
            keyboardType="number-pad"
            maxLength={6}
            // Lets iOS offer the code straight from the notification banner.
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            placeholder="123456"
            onSubmitEditing={handleSubmit(onSubmit)}
            returnKeyType="go"
          />
        )}
      />

      <Button size="lg" fullWidth loading={formState.isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t("reset.verifyCode")}
      </Button>
    </AuthScreen>
  );
}
