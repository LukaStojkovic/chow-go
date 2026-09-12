import { ScrollView, View } from "react-native";
import {
  Briefcase,
  Building2,
  Heart,
  Home,
  Hotel,
  House,
  MapPin,
  Pencil,
} from "lucide-react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { t } from "@chowgo/shared/i18n";
import {
  ADDRESS_TYPE_VALUES,
  addressLabels,
  addressTypes,
  matchAddressLabelValue,
} from "@chowgo/shared/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

// The shared taxonomy stores icons as string keys so the same data drives the
// web; this is the native half of that map.
const TYPE_ICONS = {
  apartment: Building2,
  house: House,
  office: Briefcase,
  hotel: Hotel,
  other: MapPin,
};

const LABEL_ICONS = { home: Home, work: Briefcase, partner: Heart, other: MapPin };

// Which catalog keys each of the shared `fields` keys renders from. Which
// fields a type asks for is the shared taxonomy's decision; the wording is the
// product's, and is shared with the web so both clients ask the same question.
const FIELDS = {
  buildingName: ["address.buildingName", "address.buildingNamePlaceholder"],
  floor: ["address.floor", "address.floorPlaceholder"],
  apartment: ["address.apartment", "address.apartmentPlaceholder"],
  entrance: ["address.entrance", "address.entrancePlaceholder"],
  doorCode: ["address.doorCode", "address.doorCodePlaceholder"],
};

/**
 * Rows written before the label chips existed carry "home" rather than "Home".
 *
 * The stored value stays English in the database - only the chip's label is
 * translated - which is what keeps a saved address meaningful to a user who
 * switches language.
 */
export const matchLabel = matchAddressLabelValue;

/**
 * Everything about an address that is not its position: what kind of building
 * it is, how a courier gets to the door, and what the customer calls it.
 *
 * The type picker is what drives the rest - a courier delivering to a house
 * needs a gate number, one delivering to a flat needs a floor and an entrance,
 * and asking everyone for all of it is how a form stops being filled in.
 */
export function AddressForm({
  value,
  onChange,
  address,
  onEditLocation,
  onSubmit,
  submitLabel,
  isSubmitting = false,
}) {
  const { color } = useTokens();
  const { t, i18n } = useTranslation(["profile", "common"]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const types = useMemo(() => addressTypes(t), [i18n.language]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const labels = useMemo(() => addressLabels(t), [i18n.language]);

  const type = types.find((option) => option.value === value.type) ?? types[0];
  const update = (field, next) => onChange({ ...value, [field]: next });

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-subtle">
            <MapPin size={18} color={color.primary} />
          </View>
          <View className="flex-1">
            <Text variant="label-sm" tone="muted">
              {t("profile:address.selectedLocation")}
            </Text>
            <Text variant="body" numberOfLines={2}>
              {address || t("profile:address.droppedPin")}
            </Text>
          </View>
          <Button variant="mint" size="sm" onPress={onEditLocation}>
            <View className="flex-row items-center gap-1.5">
              <Pencil size={14} color={color.primary} />
              <Text variant="label-sm" tone="primary">
                {t("common:actions.change")}
              </Text>
            </View>
          </Button>
        </Card>

        <View className="gap-2.5">
          <Text variant="label-sm" tone="muted">
            {t("profile:address.typeLabel")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {types.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                icon={TYPE_ICONS[option.icon] ?? MapPin}
                active={option.value === type.value}
                onPress={() => update("type", option.value)}
              />
            ))}
          </View>
        </View>

        {type.fields.map((field) => (
          <Input
            key={field}
            label={t(`profile:${FIELDS[field][0]}`)}
            placeholder={t(`profile:${FIELDS[field][1]}`)}
            value={value[field] ?? ""}
            onChangeText={(next) => update(field, next)}
            maxLength={60}
          />
        ))}

        <View className="gap-2.5">
          <Text variant="label-sm" tone="muted">
            {t("profile:address.saveAs")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {labels.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                icon={LABEL_ICONS[option.icon] ?? MapPin}
                active={option.value === value.label}
                onPress={() => update("label", option.value)}
              />
            ))}
          </View>
          {value.label === "Other" ? (
            <Input
              placeholder={t("profile:address.customLabelPlaceholder")}
              value={value.customLabel ?? ""}
              onChangeText={(next) => update("customLabel", next)}
              maxLength={30}
            />
          ) : null}
        </View>

        <Input
          label={t("profile:address.notes")}
          placeholder={t("profile:address.notesPlaceholder")}
          value={value.notes ?? ""}
          onChangeText={(next) => update("notes", next)}
          multiline
          maxLength={200}
        />

        <Button size="lg" fullWidth loading={isSubmitting} onPress={onSubmit}>
          {submitLabel}
        </Button>
      </ScrollView>
    </View>
  );
}

/**
 * The form's state as the API wants it. Fields the chosen type does not ask
 * for are cleared rather than carried over, so switching a flat to a house
 * does not save a floor nobody entered for it.
 */
export function toAddressPayload(form, location) {
  const type =
    ADDRESS_TYPE_VALUES.find((option) => option.value === form.type) ??
    ADDRESS_TYPE_VALUES[0];
  const extras = Object.fromEntries(
    Object.keys(FIELDS).map((field) => [
      field,
      type.fields.includes(field) ? form[field]?.trim() || undefined : undefined,
    ]),
  );

  const label =
    form.label === "Other" && form.customLabel?.trim() ? form.customLabel.trim() : form.label;

  return {
    ...extras,
    // The backend rejects an address with no text. A pin dropped somewhere the
    // geocoder has no street for is still a valid delivery point, so it gets
    // its own coordinates as the label rather than a failed save.
    address: location.address?.trim() || describePin(location),
    label: label || "Home",
    type: type.value,
    notes: form.notes?.trim() || undefined,
    location: { lat: location.lat, lng: location.lng },
  };
}

const describePin = ({ lat, lng }) =>
  t("profile:address.pinnedLocation", { lat: lat.toFixed(5), lng: lng.toFixed(5) });

/** A blank form, or one filled in from a saved address. */
export function toAddressForm(existing) {
  return {
    type: existing?.addressType ?? "apartment",
    label: existing ? matchLabel(existing.label) : "Home",
    customLabel: existing && matchLabel(existing.label) === "Other" ? (existing.label ?? "") : "",
    buildingName: existing?.buildingName ?? "",
    floor: existing?.floor ?? "",
    apartment: existing?.apartment ?? "",
    entrance: existing?.entrance ?? "",
    doorCode: existing?.doorCode ?? "",
    notes: existing?.notes ?? "",
  };
}
