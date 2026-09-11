import { Controller, useForm } from "react-hook-form";
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

const FIELDS = [
  {
    name: "name",
    label: "Full name",
    props: { autoComplete: "name", textContentType: "name", placeholder: "Alex Rivera" },
  },
  {
    name: "email",
    label: "Email",
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
    label: "Phone number",
    props: {
      keyboardType: "phone-pad",
      autoComplete: "tel",
      textContentType: "telephoneNumber",
      placeholder: "+1 555 234 8901",
    },
  },
  {
    name: "password",
    label: "Password",
    hint: "At least 6 characters",
    props: {
      secureTextEntry: true,
      autoComplete: "new-password",
      textContentType: "newPassword",
      placeholder: "Create a password",
    },
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    props: {
      secureTextEntry: true,
      autoComplete: "new-password",
      textContentType: "newPassword",
      placeholder: "Repeat your password",
    },
  },
];

const SIGN_IN_OPTION = {
  icon: LogIn,
  title: "Sign in instead",
  description: "You already have a Chow account",
  href: "/(auth)/login",
};

export default function Register() {
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
      toast.error("Could not create account", { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Order from restaurants near you and follow every delivery to your door."
      footer={
        <>
          <AuthDivider />
          <GoogleButton />
          <AuthOptions
            label="Other ways to use Chow"
            options={[SIGN_IN_OPTION, ...PARTNER_OPTIONS]}
          />
          <AuthLegal verb="creating an account" />
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
              label={item.label}
              hint={item.hint}
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
        Create account
      </Button>
    </AuthScreen>
  );
}
