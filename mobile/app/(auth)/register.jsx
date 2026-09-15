import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { LogIn } from "lucide-react-native";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  AuthDivider,
  AuthLegal,
  AuthOptions,
  AuthScreen,
  PARTNER_OPTIONS,
} from "@/features/auth/AuthScreen";
import { GoogleButton } from "@/features/auth/GoogleButton";
import { registerSchema } from "@/features/auth/schemas";
import { homeForRole } from "@/navigation/homeForRole";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

// Keys rather than copy: module scope runs before a language is picked.
const FIELDS = [
  {
    name: "name",
    labelKey: "fields.fullName",
    placeholderKey: "fields.namePlaceholder",
    props: { autoComplete: "name", textContentType: "name" },
  },
  {
    name: "email",
    labelKey: "fields.email",
    props: {
      autoCapitalize: "none",
      autoComplete: "email",
      keyboardType: "email-address",
      textContentType: "emailAddress",
      placeholder: "you@example.com",
    },
  },
  {
    name: "phoneNumber",
    labelKey: "fields.phone",
    props: {
      keyboardType: "phone-pad",
      autoComplete: "tel",
      textContentType: "telephoneNumber",
      placeholder: "+1 555 234 8901",
    },
  },
  {
    name: "password",
    labelKey: "fields.password",
    hintKey: "fields.passwordHint",
    hintParams: { count: 8 },
    placeholderKey: "fields.newPasswordPlaceholder",
    props: {
      secureTextEntry: true,
      autoComplete: "new-password",
      textContentType: "newPassword",
    },
  },
  {
    name: "confirmPassword",
    labelKey: "fields.confirmPassword",
    placeholderKey: "fields.confirmPasswordPlaceholder",
    props: {
      secureTextEntry: true,
      autoComplete: "new-password",
      textContentType: "newPassword",
    },
  },
];

const SIGN_IN_OPTION = {
  icon: LogIn,
  titleKey: "auth:register.signInInstead",
  descriptionKey: "auth:register.signInInsteadHint",
  href: "/(auth)/login",
};

export default function Register() {
  const { t } = useTranslation(["auth", "common"]);
  const { register, isSubmitting } = useAuthStore();
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phoneNumber: "", password: "", confirmPassword: "" },
  });

  async function onSubmit({ confirmPassword, ...payload }) {
    try {
      const user = await register(payload);
      router.replace(homeForRole(user?.role));
    } catch (error) {
      toast.error(t("register.createFailed"), { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen
      title={t("register.title")}
      subtitle={t("register.shortDescription")}
      footer={
        <>
          <AuthDivider />
          <GoogleButton />
          <AuthOptions
            label={t("register.otherWays")}
            options={[SIGN_IN_OPTION, ...PARTNER_OPTIONS]}
          />
          <AuthLegal action="creatingAccount" />
        </>
      }
    >
      {FIELDS.map((item) => (
        <Controller
          key={item.name}
          control={control}
          name={item.name}
          render={({ field }) => (
            <Input
              label={t(item.labelKey)}
              hint={item.hintKey ? t(item.hintKey, item.hintParams) : undefined}
              placeholder={item.placeholderKey ? t(item.placeholderKey) : undefined}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={formState.errors[item.name]?.message}
              {...item.props}
            />
          )}
        />
      ))}

      <Button size="lg" fullWidth loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t("register.submit")}
      </Button>
    </AuthScreen>
  );
}
