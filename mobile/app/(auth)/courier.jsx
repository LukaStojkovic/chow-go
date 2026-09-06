import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { CircleCheck } from "lucide-react-native";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import {
  VEHICLE_TYPES,
  courierAccountStep,
  courierVehicleStep,
} from "@/features/auth/courierSchemas";
import { homeForRole } from "@/navigation/homeForRole";
import { registerCourier } from "@/services/apiAuth";
import { setToken } from "@/lib/secureToken";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const STEPS = [
  { key: "account", title: "Your details", schema: courierAccountStep },
  { key: "vehicle", title: "How you deliver", schema: courierVehicleStep },
];

export default function CourierSignup() {
  const [index, setIndex] = useState(0);
  const [collected, setCollected] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const { color } = useTokens();

  const step = STEPS[index];
  const { control, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(step.schema),
    defaultValues: collected,
  });

  // defaultValues only apply on mount and the component stays mounted, so
  // stepping back would otherwise lose what was already typed.
  useEffect(() => {
    reset(collected);
  }, [index, collected, reset]);

  async function submit(values) {
    const payload = { ...collected, ...values };
    setSubmitting(true);
    try {
      const user = await registerCourier(payload);
      if (user?.token) {
        const { token, ...rest } = user;
        await setToken(token);
        setAuthUser(rest);
      }
      router.replace(homeForRole("courier"));
    } catch (error) {
      toast.error("Could not submit your application", { description: errorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  const field = (name, label, props = {}) => (
    <Controller
      key={name}
      control={control}
      name={name}
      render={({ field: input }) => (
        <Input
          label={label}
          value={input.value ?? ""}
          onChangeText={input.onChange}
          onBlur={input.onBlur}
          error={formState.errors[name]?.message}
          {...props}
        />
      )}
    />
  );

  return (
    <Screen edges={["bottom"]}>
      <View className="gap-3 px-5 pt-3">
        <View className="flex-row gap-1.5">
          {STEPS.map((entry, position) => (
            <View
              key={entry.key}
              className={`h-1 flex-1 rounded-full ${position <= index ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </View>
        <Text variant="h1">{step.title}</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-5" keyboardShouldPersistTaps="handled">
        {step.key === "account" ? (
          <>
            {field("name", "Your name", { autoComplete: "name" })}
            {field("email", "Email", {
              autoCapitalize: "none",
              keyboardType: "email-address",
              autoComplete: "email",
            })}
            {field("phoneNumber", "Phone number", { keyboardType: "phone-pad" })}
            {field("password", "Password", {
              secureTextEntry: true,
              hint: "At least 6 characters",
            })}
            {field("confirmPassword", "Confirm password", { secureTextEntry: true })}
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="vehicleType"
              render={({ field: input }) => (
                <View className="gap-2">
                  <Text
                    variant="label"
                    tone={formState.errors.vehicleType ? "destructive" : "foreground"}
                  >
                    What do you deliver on?
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {VEHICLE_TYPES.map((entry) => (
                      <Button
                        key={entry.value}
                        size="sm"
                        variant={input.value === entry.value ? "primary" : "outline"}
                        onPress={() => input.onChange(entry.value)}
                      >
                        {entry.label}
                      </Button>
                    ))}
                  </View>
                  {formState.errors.vehicleType ? (
                    <Text variant="caption" tone="destructive">
                      {formState.errors.vehicleType.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
            {field("vehicleModel", "Model", { placeholder: "Optional" })}
            {field("vehicleNumber", "Registration", { placeholder: "Optional" })}

            <View className="flex-row items-start gap-2.5 rounded-md bg-info-subtle p-3">
              <CircleCheck size={16} color={color.info} style={{ marginTop: 1 }} />
              <Text variant="caption" className="flex-1 text-info">
                You can start once we've verified your details. Licence and insurance documents are
                checked separately — your profile shows where that has got to.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View className="flex-row gap-2 border-t border-border bg-card p-4">
        {index > 0 ? (
          <Button variant="outline" size="lg" onPress={() => setIndex((current) => current - 1)}>
            Back
          </Button>
        ) : null}
        <Button
          className="flex-1"
          size="lg"
          loading={submitting}
          onPress={handleSubmit((values) => {
            if (index < STEPS.length - 1) {
              setCollected((current) => ({ ...current, ...values }));
              setIndex((current) => current + 1);
              return;
            }
            submit(values);
          })}
        >
          {index < STEPS.length - 1 ? "Continue" : "Apply to deliver"}
        </Button>
      </View>
    </Screen>
  );
}
