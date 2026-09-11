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
import { ADDRESS_LABELS, ADDRESS_TYPES } from "@chowgo/shared/constants";
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

// What each of the shared `fields` keys renders as. The wording is the client's
// own; which fields a type asks for is not.
const FIELDS = {
  buildingName: { label: "Building name", placeholder: "e.g. Green Life Residence" },
  floor: { label: "Floor", placeholder: "e.g. 4" },
  apartment: { label: "Apartment", placeholder: "e.g. 12A" },
  entrance: { label: "Entrance / staircase", placeholder: "e.g. A, B, Left" },
  doorCode: { label: "Door / gate number", placeholder: "e.g. 42B" },
};

/** Rows written before the label chips existed carry "home" rather than "Home". */
export function matchLabel(stored) {
  const found = ADDRESS_LABELS.find(
    (option) => option.value.toLowerCase() === String(stored ?? "").toLowerCase(),
  );
  return found?.value ?? "Other";
}

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
  const type = ADDRESS_TYPES.find((option) => option.value === value.type) ?? ADDRESS_TYPES[0];
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
              Selected location
            </Text>
            <Text variant="body" numberOfLines={2}>
              {address || "Dropped pin"}
            </Text>
          </View>
          <Button variant="mint" size="sm" onPress={onEditLocation}>
            <View className="flex-row items-center gap-1.5">
              <Pencil size={14} color={color.primary} />
              <Text variant="label-sm" tone="primary">
                Change
              </Text>
            </View>
          </Button>
        </Card>

        <View className="gap-2.5">
          <Text variant="label-sm" tone="muted">
            Address type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ADDRESS_TYPES.map((option) => (
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
            label={FIELDS[field].label}
            placeholder={FIELDS[field].placeholder}
            value={value[field] ?? ""}
            onChangeText={(next) => update(field, next)}
            maxLength={60}
          />
        ))}

        <View className="gap-2.5">
          <Text variant="label-sm" tone="muted">
            Save as
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ADDRESS_LABELS.map((option) => (
              <Chip
                key={option.value}
                label={option.value}
                icon={LABEL_ICONS[option.icon] ?? MapPin}
                active={option.value === value.label}
                onPress={() => update("label", option.value)}
              />
            ))}
          </View>
          {value.label === "Other" ? (
            <Input
              placeholder="Name this address"
              value={value.customLabel ?? ""}
              onChangeText={(next) => update("customLabel", next)}
              maxLength={30}
            />
          ) : null}
        </View>

        <Input
          label="Delivery notes"
          placeholder="Buzzer code, landmarks, call before delivery…"
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
  const type = ADDRESS_TYPES.find((option) => option.value === form.type) ?? ADDRESS_TYPES[0];
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

const describePin = ({ lat, lng }) => `Pinned location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

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
