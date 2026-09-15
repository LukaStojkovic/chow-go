import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import {
  AuthDivider,
  AuthLegal,
  AuthOptions,
  AuthScreen,
  CREATE_ACCOUNT_OPTION,
  PARTNER_OPTIONS,
} from "@/features/auth/AuthScreen";
import { GoogleButton } from "@/features/auth/GoogleButton";
import { loginSchema } from "@/features/auth/schemas";
import { homeForRole } from "@/navigation/homeForRole";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

export default function Login() {
  const { t } = useTranslation(["auth", "common"]);
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
      toast.error(t("register.signInFailed"), { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen
      title={t("login.title")}
      subtitle={t("login.shortDescription")}
      footer={
        <>
          <AuthDivider />
          <GoogleButton />
          <AuthOptions label={t("login.newHere")} options={[CREATE_ACCOUNT_OPTION, ...PARTNER_OPTIONS]} />
          <AuthLegal />
        </>
      }
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
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            label={t("fields.password")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.password?.message}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            placeholder={t("fields.passwordPlaceholder")}
            onSubmitEditing={handleSubmit(onSubmit)}
            returnKeyType="go"
          />
        )}
      />

      <View className="flex-row justify-end">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(auth)/forgot-password")}
          className="py-1 active:opacity-60"
        >
          <Text variant="label-sm" tone="primary">
            {t("login.forgotPassword")}
          </Text>
        </Pressable>
      </View>

      <Button size="lg" fullWidth loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t("login.submit")}
      </Button>
    </AuthScreen>
  );
}
