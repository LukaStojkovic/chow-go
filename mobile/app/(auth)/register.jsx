import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { registerSchema } from "@/features/auth/schemas";
import { homeForRole } from "@/navigation/homeForRole";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

const FIELDS = [
  { name: "name", label: "Full name", props: { autoComplete: "name", textContentType: "name" } },
  {
    name: "email",
    label: "Email",
    props: {
      autoCapitalize: "none",
      autoComplete: "email",
      keyboardType: "email-address",
      textContentType: "emailAddress",
    },
  },
  {
    name: "phoneNumber",
    label: "Phone number",
    props: { keyboardType: "phone-pad", autoComplete: "tel", textContentType: "telephoneNumber" },
  },
  {
    name: "password",
    label: "Password",
    hint: "At least 6 characters",
    props: { secureTextEntry: true, autoComplete: "new-password", textContentType: "newPassword" },
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    props: { secureTextEntry: true, autoComplete: "new-password", textContentType: "newPassword" },
  },
];

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
      subtitle="Delivery to your door, in a few taps."
      footer={
        <Link href="/(auth)/login" asChild>
          <Text variant="body-sm" tone="primary">
            Already have an account? Sign in
          </Text>
        </Link>
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

      <Button size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        Create account
      </Button>
    </AuthScreen>
  );
}
