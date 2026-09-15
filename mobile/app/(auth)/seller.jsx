import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { cuisineOptions } from "@chowgo/shared/constants";
import { translateFieldError } from "@chowgo/shared/i18n/fieldErrors";

import { errorMessage } from "@/api/client";
import { CheckCircle2 } from "lucide-react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DockedBar } from "@/components/ui/FloatingBar";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { MenuItemImages } from "@/features/seller/MenuItemImages";
import { accountStep, locationStep, restaurantStep } from "@/features/auth/sellerSchemas";
import { useDetectLocation } from "@/hooks/Location/useDetectLocation";
import { registerSeller } from "@/services/apiAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { toast } from "@/store/useToastStore";

// Keys rather than titles: module scope runs before a language is picked.
const STEPS = [
  { key: "account", titleKey: "restaurant.stepAccount", schema: accountStep },
  { key: "restaurant", titleKey: "restaurant.stepRestaurant", schema: restaurantStep },
  { key: "location", titleKey: "restaurant.stepLocation", schema: locationStep },
  { key: "images", titleKey: "restaurant.stepPhotos", schema: null },
];

function Progress({ index }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {STEPS.map((step, position) => {
        const done = position < index;
        const live = position === index;
        return (
          <View
            key={step.key}
            className={`h-1.5 flex-1 rounded-full ${done || live ? "bg-primary" : "bg-muted"}`}
          />
        );
      })}
    </View>
  );
}

export default function SellerSignup() {
  const { t, i18n } = useTranslation(["auth", "seller", "validation", "common"]);
  const cuisines = useMemo(() => cuisineOptions(t), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [index, setIndex] = useState(0);
  const [collected, setCollected] = useState({});
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const { detect, isDetecting } = useDetectLocation();
  const coordinates = useDeliveryStore((state) => state.coordinates);
  const detectedAddress = useDeliveryStore((state) => state.address);

  const step = STEPS[index];
  const { control, handleSubmit, formState, setValue, reset } = useForm({
    resolver: step.schema ? zodResolver(step.schema) : undefined,
    defaultValues: {
      openingTime: "09:00",
      closingTime: "22:00",
      ...collected,
    },
  });

  // defaultValues only apply on mount, and the component stays mounted across
  // steps — without this, going Back loses everything already typed.
  useEffect(() => {
    reset({ openingTime: "09:00", closingTime: "22:00", ...collected });
  }, [index, collected, reset]);

  function next(values) {
    setCollected((current) => ({ ...current, ...values }));
    setIndex((current) => current + 1);
  }

  // Everything goes in one request: the backend creates the user first and
  // deletes it again if any restaurant field is missing, so a staged submit
  // would leave orphaned accounts behind on every failure.
  async function submit() {
    if (!images.length) {
      toast.warning(t("register.restaurantPhotoRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const user = await registerSeller({
        ...collected,
        role: "seller",
        images,
      });
      if (user?.token) {
        const { token, ...rest } = user;
        const { setToken } = await import("@/lib/secureToken");
        await setToken(token);
        setAuthUser(rest);
      }
      router.replace("/(seller)");
    } catch (error) {
      toast.error(t("register.restaurantCreateFailed"), { description: errorMessage(error) });
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
        <Progress index={index} />
        <View className="gap-1.5">
          <Text variant="overline" tone="muted">
            {t("restaurant.listYourRestaurant")} ·{" "}
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
            {field("name", t("fields.yourName"), { autoComplete: "name" })}
            {field("email", t("fields.email"), {
              autoCapitalize: "none",
              keyboardType: "email-address",
              autoComplete: "email",
            })}
            {field("phoneNumber", t("fields.phone"), { keyboardType: "phone-pad" })}
            {field("password", t("fields.password"), {
              secureTextEntry: true,
              hint: t("fields.passwordHint", { count: 6 }),
            })}
            {field("confirmPassword", t("fields.confirmPassword"), { secureTextEntry: true })}
          </>
        ) : null}

        {step.key === "restaurant" ? (
          <>
            {field("restaurantName", t("restaurant.namePlaceholder"))}
            <Controller
              control={control}
              name="cuisineType"
              render={({ field: input }) => (
                <View className="gap-2">
                  <Text
                    variant="label-sm"
                    tone={formState.errors.cuisineType ? "destructive" : "muted"}
                  >
                    {t("restaurant.cuisineLabel")}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {cuisines.map(({ value, label }) => (
                      <Chip
                        key={value}
                        label={label}
                        active={input.value === value}
                        showCheck
                        onPress={() => input.onChange(value)}
                      />
                    ))}
                  </View>
                  {formState.errors.cuisineType ? (
                    <Text variant="caption" tone="destructive">
                      {formState.errors.cuisineType.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
            {field("restaurantPhone", t("restaurant.phoneLabel"), {
              keyboardType: "phone-pad",
            })}
            {field("restaurantDescription", t("seller:menu.form.descriptionLabel"), {
              multiline: true,
            })}
            <View className="flex-row gap-3">
              <View className="flex-1">
                {field("openingTime", t("restaurant.opens"), { placeholder: "09:00" })}
              </View>
              <View className="flex-1">
                {field("closingTime", t("restaurant.closes"), { placeholder: "22:00" })}
              </View>
            </View>
            <Text variant="caption" tone="muted">
              {t("restaurant.hoursHint")}
            </Text>
          </>
        ) : null}

        {step.key === "location" ? (
          <>
            <Button variant="mint" size="lg" loading={isDetecting} onPress={detect}>
              {t("profile:delivery.useCurrent")}
            </Button>
            {coordinates ? (
              <Badge tone="mint" icon={CheckCircle2}>
                {detectedAddress
                  ? t("restaurant.pinnedAt", { address: detectedAddress })
                  : t("restaurant.locationPinned")}
              </Badge>
            ) : null}
            {field("restaurantAddress", t("seller:settings.location.address"))}
            {field("restaurantCity", t("seller:settings.location.city"))}
            {field("restaurantZipCode", t("seller:settings.location.zip"))}
            <Controller
              control={control}
              name="restaurantLat"
              render={() => (
                <Text
                  variant="caption"
                  tone={formState.errors.restaurantLat ? "destructive" : "muted"}
                >
                  {translateFieldError(formState.errors.restaurantLat, t) ??
                    t("restaurant.pinHint")}
                </Text>
              )}
            />
          </>
        ) : null}

        {step.key === "images" ? (
          <>
            <Text variant="body" tone="muted">
              {t("restaurant.firstPhotoHint")}
            </Text>
            <MenuItemImages
              existing={[]}
              added={images}
              onChangeExisting={() => {}}
              onChangeAdded={setImages}
            />
          </>
        ) : null}
      </ScrollView>

      <DockedBar className="flex-row items-center gap-2.5">
        {index > 0 ? (
          <Button variant="outline" size="lg" onPress={() => setIndex((current) => current - 1)}>
            {t("common:actions.back")}
          </Button>
        ) : null}

        {step.key === "images" ? (
          <Button className="flex-1" size="lg" loading={submitting} onPress={submit}>
            {t("restaurant.create")}
          </Button>
        ) : (
          <Button
            className="flex-1"
            size="lg"
            onPress={handleSubmit((values) => {
              // The pin lives in the delivery store, not the form, so it is
              // folded in before the step is validated.
              if (step.key === "location" && coordinates) {
                setValue("restaurantLat", String(coordinates.lat));
                setValue("restaurantLng", String(coordinates.lon));
                next({
                  ...values,
                  restaurantLat: String(coordinates.lat),
                  restaurantLng: String(coordinates.lon),
                });
                return;
              }
              next(values);
            })}
          >
            {t("common:actions.continue")}
          </Button>
        )}
      </DockedBar>
    </Screen>
  );
}
