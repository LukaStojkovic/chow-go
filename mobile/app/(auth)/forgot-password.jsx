import { Controller, useForm } from "react-hook-form";
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
      toast.error("Could not send the code", { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen title="Reset your password" subtitle="We'll email you a six-digit code.">
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.email?.message}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            onSubmitEditing={handleSubmit(onSubmit)}
            returnKeyType="send"
          />
        )}
      />

      <Button size="lg" loading={formState.isSubmitting} onPress={handleSubmit(onSubmit)}>
        Send code
      </Button>
    </AuthScreen>
  );
}
