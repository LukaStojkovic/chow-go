import { Modal, ScrollView, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Clock, MapPin, Phone, X } from "lucide-react-native";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";

/**
 * Opening hours as the view model already resolved them.
 *
 * `RestaurantView.schedule` is an ordered array of
 * `{ day, label, isOpen, opens, closes, isToday }` - not a map keyed by day, and
 * not the raw `{ openingTime, closingTime }` shape the API returns. Reading it
 * directly here keeps one normalisation rather than two.
 */
function hoursLabel(entry) {
  if (!entry?.isOpen) return "Closed";
  if (entry.opens === entry.closes) return "Open 24 hours";
  return `${entry.opens} – ${entry.closes}`;
}

function Section({ icon, title, children }) {
  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <Text variant="h3" className="flex-1">
          {title}
        </Text>
      </View>
      {children}
    </Card>
  );
}

/**
 * A `Modal` is its own window, and the insets the rest of the app sees are the
 * root window's. Inside a `pageSheet` - which already starts below the notch -
 * they are too large, and on Android, where `presentationStyle` is ignored and
 * the modal fills an edge-to-edge screen, the header would otherwise sit under
 * the status bar. Re-providing the context measures the sheet's own frame, so
 * one set of edges is right on both platforms.
 */
export function RestaurantInfoSheet({ visible, restaurant, onClose }) {
  if (!restaurant) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SheetBody restaurant={restaurant} onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

function SheetBody({ restaurant, onClose }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 py-4">
        <View className="flex-1">
          <Text variant="h2" numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Text variant="body-sm" tone="muted" numberOfLines={1}>
            {restaurant.cuisine}
          </Text>
        </View>
        <IconButton icon={X} variant="muted" label="Close" onPress={onClose} />
      </View>

      <ScrollView
        contentContainerClassName="gap-3 px-5"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {restaurant.description ? (
          <Card>
            <Text variant="body" tone="muted">
              {restaurant.description}
            </Text>
          </Card>
        ) : null}

        <Section icon={MapPin} title="Address">
          <Text variant="body" tone="muted">
            {restaurant.address?.oneLine ?? "Not provided"}
          </Text>
        </Section>

        {restaurant.phone ? (
          <Section icon={Phone} title="Phone">
            <Text variant="body" tone="muted">
              {restaurant.phone}
            </Text>
          </Section>
        ) : null}

        <Section icon={Clock} title="Opening hours">
          <View className="gap-0.5">
            {(restaurant.schedule ?? []).map((entry, index) => (
              <View key={entry.day}>
                {index > 0 ? <Divider className="my-1" /> : null}
                <View className="flex-row items-center justify-between py-1.5">
                  <View className="flex-row items-center gap-2">
                    <Text
                      variant={entry.isToday ? "label" : "body"}
                      tone={entry.isToday ? "foreground" : "muted"}
                      numberOfLines={1}
                    >
                      {entry.label}
                    </Text>
                    {entry.isToday ? (
                      <Badge tone="mint" size="sm">
                        Today
                      </Badge>
                    ) : null}
                  </View>
                  <Text
                    variant={entry.isToday ? "label" : "body"}
                    tone={entry.isOpen ? (entry.isToday ? "primary" : "muted") : "muted"}
                    numberOfLines={1}
                    className="shrink-0"
                  >
                    {hoursLabel(entry)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}
