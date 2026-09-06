import { Modal, ScrollView, View } from "react-native";
import { Clock, MapPin, Phone, X } from "lucide-react-native";
import { WEEK_DAYS, formatDayHours, getTodayKey } from "@chowgo/shared/schedule";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

function Row({ icon: Icon, children }) {
  const { color } = useTokens();
  return (
    <View className="flex-row items-start gap-3">
      <Icon size={17} color={color["muted-foreground"]} style={{ marginTop: 2 }} />
      <View className="flex-1 gap-0.5">{children}</View>
    </View>
  );
}

export function RestaurantInfoSheet({ visible, restaurant, onClose }) {
  const { color } = useTokens();
  if (!restaurant) return null;

  const today = getTodayKey();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
          <Text variant="h2" numberOfLines={1} className="flex-1">
            {restaurant.name}
          </Text>
          <Button variant="ghost" size="sm" accessibilityLabel="Close" onPress={onClose}>
            <X size={20} color={color.foreground} />
          </Button>
        </View>

        <ScrollView contentContainerClassName="gap-6 p-5">
          {restaurant.description ? (
            <Text variant="body" tone="muted">
              {restaurant.description}
            </Text>
          ) : null}

          <Row icon={MapPin}>
            <Text variant="label">Address</Text>
            <Text variant="body-sm" tone="muted">
              {restaurant.address?.oneLine ?? "Not provided"}
            </Text>
          </Row>

          {restaurant.phone ? (
            <Row icon={Phone}>
              <Text variant="label">Phone</Text>
              <Text variant="body-sm" tone="muted">
                {restaurant.phone}
              </Text>
            </Row>
          ) : null}

          <Row icon={Clock}>
            <Text variant="label">Opening hours</Text>
            <View className="gap-1 pt-1">
              {WEEK_DAYS.map(({ key, label }) => (
                <View key={key} className="flex-row justify-between">
                  <Text variant="body-sm" tone={key === today ? "foreground" : "muted"}>
                    {label}
                  </Text>
                  <Text variant="body-sm" tone={key === today ? "foreground" : "muted"}>
                    {formatDayHours(restaurant.schedule?.[key])}
                  </Text>
                </View>
              ))}
            </View>
          </Row>
        </ScrollView>
      </View>
    </Modal>
  );
}
