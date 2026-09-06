import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { Link, router } from "expo-router";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { GoogleButton } from "@/features/auth/GoogleButton";
import { loginSchema } from "@/features/auth/schemas";
import { homeForRole } from "@/navigation/homeForRole";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

export default function Login() {
  const { login, isSubmitting } = useAuthStore();
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values) {
    try {
      const user = await login(values);
      router.replace(homeForRole(user?.role));
    } catch (error) {
      toast.error("Could not sign in", { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to track orders and reorder your favourites."
      footer={
        <Link href="/(auth)/register" asChild>
          <Text variant="body-sm" tone="primary">
            No account yet? Create one
          </Text>
        </Link>
      }
    >
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
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            label="Password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.password?.message}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            placeholder="Your password"
            onSubmitEditing={handleSubmit(onSubmit)}
            returnKeyType="go"
          />
        )}
      />

      <Link href="/(auth)/forgot-password" asChild>
        <Text variant="body-sm" tone="primary" className="self-end">
          Forgot password?
        </Text>
      </Link>

      <Button size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        Sign in
      </Button>

      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text variant="caption" tone="muted">
          or
        </Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <GoogleButton />
    </AuthScreen>
  );
}
