import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { router, useLocalSearchParams } from "expo-router";
import { errorMessage } from "@/api/client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { homeForRole } from "@/navigation/homeForRole";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

// Google gives a verified name and email but no phone number, and the backend
// requires one for customers. Seller and courier signup need more still, so
// this screen finishes the customer path only for now.
const schema = z.object({
  phoneNumber: z.string().trim().min(6, "Phone number is required"),
});

export default function GoogleComplete() {
  const { signupToken, name, email } = useLocalSearchParams();
  const { completeGoogleProfile, isSubmitting } = useAuthStore();

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: "" },
  });

  async function onSubmit({ phoneNumber }) {
    try {
      const user = await completeGoogleProfile({
        signupToken,
        role: "customer",
        phoneNumber,
      });
      router.replace(homeForRole(user?.role));
    } catch (error) {
      toast.error("Could not finish signing up", { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen
      title="One last thing"
      subtitle={`Signing in as ${name || email}. Your courier needs a number to reach you on.`}
    >
      <Controller
        control={control}
        name="phoneNumber"
        render={({ field }) => (
          <Input
            label="Phone number"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.phoneNumber?.message}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            onSubmitEditing={handleSubmit(onSubmit)}
            returnKeyType="go"
          />
        )}
      />

      <Button size="lg" fullWidth loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        Finish signing up
      </Button>
    </AuthScreen>
  );
}
