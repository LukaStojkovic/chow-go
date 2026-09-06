import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { getLocationPredictions } from "@/services/apiLocation";
import { useTokens } from "@/theme/useTokens";

/**
 * Typing an address instead of standing at it.
 *
 * "Use my current location" only helps someone ordering from where they are —
 * setting a delivery address for home while at work, or pinning a restaurant
 * before opening it, needs search. Predictions carry lat/lon, so choosing one
 * sets the coordinates the geo-scoped endpoints require.
 */
export function AddressAutocomplete({ label = "Search for an address", onSelect, hint }) {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const { color } = useTokens();

  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), 400);
    return () => clearTimeout(timer);
  }, [text]);

  const { data = [], isFetching } = useQuery({
    queryKey: ["locationPredictions", term],
    queryFn: () => getLocationPredictions(term),
    enabled: term.length >= 3,
    staleTime: 60_000,
  });

  const visible = !dismissed && term.length >= 3 && data.length > 0;

  return (
    <View className="gap-2">
      <Input
        label={label}
        value={text}
        onChangeText={(next) => {
          setText(next);
          setDismissed(false);
        }}
        placeholder="Street and number"
        autoCorrect={false}
        hint={isFetching && term.length >= 3 ? "Searching…" : hint}
      />

      {visible ? (
        <View className="overflow-hidden rounded-sm border border-border bg-card">
          {data.slice(0, 5).map((prediction, index) => (
            <Pressable
              key={`${prediction.display_name}-${index}`}
              accessibilityRole="button"
              onPress={() => {
                setText(prediction.display_name);
                setDismissed(true);
                onSelect({
                  address: prediction.display_name,
                  lat: parseFloat(prediction.lat),
                  lon: parseFloat(prediction.lon),
                });
              }}
              className="flex-row items-start gap-2.5 border-b border-border p-3 last:border-b-0 active:bg-accent"
            >
              <MapPin size={15} color={color["muted-foreground"]} style={{ marginTop: 2 }} />
              <Text variant="body-sm" className="flex-1" numberOfLines={2}>
                {prediction.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
