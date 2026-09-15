import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { msg } from "@chowgo/shared/i18n/fieldErrors";
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
  phoneNumber: z.string().trim().min(6, msg("validation:auth.phoneRequired")),
});

export default function GoogleComplete() {
  const { t } = useTranslation(["auth", "common"]);
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
      toast.error(t("google.finishFailed"), { description: errorMessage(error) });
    }
  }

  return (
    <AuthScreen
      title={t("google.oneLastThing")}
      subtitle={t("google.signingInAs", { email: name || email })}
    >
      <Controller
        control={control}
        name="phoneNumber"
        render={({ field }) => (
          <Input
            label={t("fields.phone")}
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
        {t("google.finish")}
      </Button>
    </AuthScreen>
  );
}
