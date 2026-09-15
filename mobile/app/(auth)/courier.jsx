import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";

import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DockedBar } from "@/components/ui/FloatingBar";
import { Inset } from "@/components/ui/Card";

import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
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

// Keys rather than titles: module scope runs before a language is picked.
const STEPS = [
  { key: "account", titleKey: "courier:signup.stepAccount", schema: courierAccountStep },
  { key: "vehicle", titleKey: "courier:signup.stepVehicle", schema: courierVehicleStep },
];

export default function CourierSignup() {
  const { t } = useTranslation(["courier", "auth", "common"]);
  const [index, setIndex] = useState(0);
  const [collected, setCollected] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);

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
      toast.error(t("courier:signup.submitFailed"), { description: errorMessage(error) });
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
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader
        onBack={() => (index > 0 ? setIndex((current) => current - 1) : router.back())}
      />

      <View className="gap-4 px-5 pb-1">
        <View className="flex-row gap-1.5">
          {STEPS.map((entry, position) => (
            <View
              key={entry.key}
              className={`h-1.5 flex-1 rounded-full ${position <= index ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </View>
        <View className="gap-1.5">
          <Text variant="overline" tone="muted">
            {t("auth:register.partnerCourier")} ·{" "}
            {t("common:meta.stepOf", { current: index + 1, total: STEPS.length })}
          </Text>
          <Text variant="h1">{t(step.titleKey)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-6 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        {step.key === "account" ? (
          <>
            {field("name", t("auth:fields.yourName"), { autoComplete: "name" })}
            {field("email", t("auth:fields.email"), {
              autoCapitalize: "none",
              keyboardType: "email-address",
              autoComplete: "email",
            })}
            {field("phoneNumber", t("auth:fields.phone"), { keyboardType: "phone-pad" })}
            {field("password", t("auth:fields.password"), {
              secureTextEntry: true,
              hint: t("auth:fields.passwordHint", { count: 6 }),
            })}
            {field("confirmPassword", t("auth:fields.confirmPassword"), {
              secureTextEntry: true,
            })}
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="vehicleType"
              render={({ field: input }) => (
                <View className="gap-2">
                  <Text
                    variant="label-sm"
                    tone={formState.errors.vehicleType ? "destructive" : "muted"}
                  >
                    {t("courier:profile.vehicleQuestion")}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {VEHICLE_TYPES.map((value) => (
                      <Chip
                        key={value}
                        label={t(`common:taxonomy.vehicle.${value}`)}
                        active={input.value === value}
                        showCheck
                        onPress={() => input.onChange(value)}
                      />
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

            {field("vehicleModel", t("courier:profile.vehicleModel"), {
              placeholder: t("common:state.optional"),
            })}
            {field("vehicleNumber", t("courier:signup.registration"), {
              placeholder: t("common:state.optional"),
            })}

            <Inset tone="info" className="flex-row items-start gap-3 p-4">
              <View className="flex-1 gap-1">
                <Text variant="caption" tone="info">
                  {t("courier:signup.whatNext")}
                </Text>
                <Text variant="body-sm">
                  {t("courier:signup.whatNextBody")}
                </Text>
              </View>
            </Inset>
          </>
        )}
      </ScrollView>

      <DockedBar className="flex-row items-center gap-2.5">
        {index > 0 ? (
          <Button variant="outline" size="lg" onPress={() => setIndex((current) => current - 1)}>
            {t("common:actions.back")}
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
          {index < STEPS.length - 1
            ? t("common:actions.continue")
            : t("courier:signup.applyToDeliver")}
        </Button>
      </DockedBar>
    </Screen>
  );
}
