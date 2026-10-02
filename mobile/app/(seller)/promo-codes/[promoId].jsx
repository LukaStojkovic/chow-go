import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, ScrollView, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { formatDate, formatPrice } from "@chowgo/shared/format";
import { PROMO_LIMITS, RESTAURANT_PROMO_TYPES } from "@chowgo/shared/promoCode";
import { normalizeCurrency } from "@chowgo/shared/currency";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Card, Inset } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { DockedBar } from "@/components/ui/FloatingBar";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import { useCreateSellerPromo, useSellerPromoStats, useUpdateSellerPromo } from "@/hooks/Promo/usePromo";
import { useOwnRestaurant } from "@/hooks/Restaurants/useOwnRestaurant";
import { toast } from "@/store/useToastStore";

const EMPTY = {
  code: "",
  label: "",
  type: "percentage",
  value: "",
  maxDiscount: "",
  minSubtotal: "",
  startsAt: null,
  endsAt: null,
  maxRedemptions: "",
  perCustomerLimit: "1",
  firstOrderOnly: false,
};

const text = (value) => (value === null || value === undefined || value === 0 ? "" : String(value));
const numberOrNull = (value) => (String(value).trim() === "" ? null : Number(value));

function fromPromo(promo) {
  return {
    code: promo.code,
    label: promo.label ?? "",
    type: promo.type,
    value: text(promo.value),
    maxDiscount: text(promo.maxDiscount),
    minSubtotal: text(promo.minSubtotal),
    startsAt: promo.startsAt ? new Date(promo.startsAt) : null,
    endsAt: promo.endsAt ? new Date(promo.endsAt) : null,
    maxRedemptions: text(promo.maxRedemptions),
    perCustomerLimit: String(promo.perCustomerLimit ?? 1),
    firstOrderOnly: Boolean(promo.firstOrderOnly),
  };
}

function DateField({ label, value, onChange, endOfDay = false }) {
  const { t } = useTranslation(["promo", "common"]);
  const [open, setOpen] = useState(false);

  return (
    <View className="flex-1 gap-2">
      <Text variant="label-sm" tone="muted">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        onLongPress={() => onChange(null)}
        className="h-14 justify-center rounded-md bg-muted px-4 active:opacity-70"
      >
        <Text variant="body">{value ? formatDate(value) : t("promo:validity.always")}</Text>
      </Pressable>
      {value ? (
        <Pressable accessibilityRole="button" onPress={() => onChange(null)} hitSlop={8}>
          <Text variant="caption" tone="muted">
            {t("common:actions.clear")}
          </Text>
        </Pressable>
      ) : null}
      {open ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          minimumDate={new Date()}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, date) => {
            if (Platform.OS === "android") setOpen(false);
            if (event.type === "dismissed" || !date) return;
            const picked = new Date(date);
            if (endOfDay) picked.setHours(23, 59, 0, 0);
            else picked.setHours(0, 0, 0, 0);
            onChange(picked);
            if (Platform.OS === "ios") setOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

export default function SellerPromoForm() {
  const { promoId } = useLocalSearchParams();
  const isNew = promoId === "new";
  const { t } = useTranslation(["promo", "common"]);
  const restaurant = useOwnRestaurant();
  const currency = normalizeCurrency(restaurant.data?.currency);
  const existing = useSellerPromoStats(isNew ? null : promoId);
  const create = useCreateSellerPromo();
  const update = useUpdateSellerPromo();
  const [form, setForm] = useState(EMPTY);
  const promo = existing.data?.promo;
  const stats = existing.data?.stats;
  const locked = Boolean(promo && promo.redemptionCount > 0);

  useEffect(() => {
    if (promo) setForm(fromPromo(promo));
  }, [promo]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const save = () => {
    const payload = {
      label: form.label.trim(),
      minSubtotal: numberOrNull(form.minSubtotal) ?? 0,
      startsAt: form.startsAt ? form.startsAt.toISOString() : null,
      endsAt: form.endsAt ? form.endsAt.toISOString() : null,
      maxRedemptions: numberOrNull(form.maxRedemptions),
      perCustomerLimit: numberOrNull(form.perCustomerLimit) ?? 1,
      firstOrderOnly: form.firstOrderOnly,
    };
    if (isNew) payload.code = form.code.trim();
    if (!locked) {
      payload.type = form.type;
      payload.value = Number(form.value);
      payload.maxDiscount = form.type === "percentage" ? numberOrNull(form.maxDiscount) : null;
    }
    const options = {
      onSuccess: () => {
        toast.success(t("promo:manage.saved"));
        router.back();
      },
      onError: (error) => toast.error(errorMessage(error)),
    };
    if (isNew) create.mutate(payload, options);
    else update.mutate({ id: promoId, ...payload }, options);
  };

  const canSave =
    (isNew ? form.code.trim().length >= PROMO_LIMITS.minCodeLength : true) &&
    (locked || Number(form.value) > 0);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={isNew ? t("promo:manage.create") : t("promo:manage.edit")} subtitle={promo?.code} />

      <ScrollView contentContainerClassName="gap-3 px-5 pb-6" keyboardShouldPersistTaps="handled">
        {stats ? (
          <Card className="flex-row gap-2">
            {[
              ["orders", stats.orders],
              ["delivered", stats.delivered],
              ["discountGiven", formatPrice(stats.discountGiven, { currency })],
            ].map(([key, value]) => (
              <Inset key={key} className="flex-1 gap-0.5 p-3">
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {t(`promo:stats.${key}`)}
                </Text>
                <Text variant="price">{value}</Text>
              </Inset>
            ))}
          </Card>
        ) : null}

        {locked ? (
          <Text variant="body-sm" tone="muted">
            {t("promo:manage.lockedNotice")}
          </Text>
        ) : null}

        <Card className="gap-4">
          <Input
            label={t("promo:fields.code")}
            hint={isNew ? t("promo:fields.codeHint") : undefined}
            value={form.code}
            editable={isNew}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={PROMO_LIMITS.maxCodeLength}
            onChangeText={(code) => set({ code: code.toUpperCase().replace(/[^A-Z0-9-]/g, "") })}
          />
          <Input
            label={t("promo:fields.label")}
            hint={t("promo:fields.labelHint")}
            value={form.label}
            maxLength={PROMO_LIMITS.maxLabelLength}
            onChangeText={(label) => set({ label })}
          />

          <View className="gap-2">
            <Text variant="label-sm" tone="muted">
              {t("promo:fields.type")}
            </Text>
            <View className="flex-row gap-2">
              {RESTAURANT_PROMO_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={t(`promo:types.${type}`)}
                  active={form.type === type}
                  onPress={() => !locked && set({ type })}
                  className="flex-1 justify-center"
                />
              ))}
            </View>
          </View>

          <Input
            label={
              form.type === "percentage"
                ? t("promo:fields.valuePercent")
                : t("promo:fields.valueAmount", { currency })
            }
            value={form.value}
            editable={!locked}
            keyboardType="decimal-pad"
            onChangeText={(value) => set({ value })}
          />
          {form.type === "percentage" ? (
            <Input
              label={t("promo:fields.maxDiscount", { currency })}
              hint={t("promo:fields.maxDiscountHint")}
              value={form.maxDiscount}
              editable={!locked}
              keyboardType="decimal-pad"
              onChangeText={(maxDiscount) => set({ maxDiscount })}
            />
          ) : null}
          <Input
            label={t("promo:fields.minSubtotal", { currency })}
            value={form.minSubtotal}
            keyboardType="decimal-pad"
            onChangeText={(minSubtotal) => set({ minSubtotal })}
          />
        </Card>

        <Card className="gap-4">
          <View className="flex-row gap-3">
            <DateField label={t("promo:fields.startsAt")} value={form.startsAt} onChange={(startsAt) => set({ startsAt })} />
            <DateField label={t("promo:fields.endsAt")} value={form.endsAt} endOfDay onChange={(endsAt) => set({ endsAt })} />
          </View>
          <Input
            label={t("promo:fields.maxRedemptions")}
            hint={t("promo:fields.maxRedemptionsHint")}
            value={form.maxRedemptions}
            keyboardType="number-pad"
            onChangeText={(maxRedemptions) => set({ maxRedemptions })}
          />
          <Input
            label={t("promo:fields.perCustomerLimit")}
            value={form.perCustomerLimit}
            keyboardType="number-pad"
            onChangeText={(perCustomerLimit) => set({ perCustomerLimit })}
          />
          <View className="flex-row items-center justify-between">
            <Text variant="body">{t("promo:fields.firstOrderOnly")}</Text>
            <Toggle
              value={form.firstOrderOnly}
              onValueChange={(firstOrderOnly) => set({ firstOrderOnly })}
              accessibilityLabel={t("promo:fields.firstOrderOnly")}
            />
          </View>
        </Card>
      </ScrollView>

      <DockedBar>
        <Button size="lg" fullWidth disabled={!canSave} loading={create.isPending || update.isPending} onPress={save}>
          {t("promo:manage.save")}
        </Button>
      </DockedBar>
    </Screen>
  );
}
