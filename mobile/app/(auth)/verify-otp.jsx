import { Controller, useForm } from "react-hook-form";
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
  const { email } = useLocalSearchParams();
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  async function onSubmit({ code }) {
    try {
      await verifyOtp(email, code);
      router.push({ pathname: "/(auth)/reset-password", params: { email } });
    } catch (error) {
      toast.error("That code didn't work", { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen title="Check your email" subtitle={`We sent a six-digit code to ${email}.`}>
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <Input
            label="Verification code"
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
        Verify
      </Button>
    </AuthScreen>
  );
}
