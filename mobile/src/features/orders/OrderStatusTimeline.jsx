import { View } from "react-native";
import { Check } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

// The happy path only. Cancelled and rejected are terminal and get their own
// treatment rather than a step that never completes.
const STEPS = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "assigned", label: "Courier assigned" },
  { key: "picked_up", label: "Picked up" },
  { key: "in_transit", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

export function OrderStatusTimeline({ status }) {
  const { color } = useTokens();
  const current = STEPS.findIndex((step) => step.key === status);

  if (current < 0) return null;

  return (
    <View className="gap-0">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const last = index === STEPS.length - 1;

        return (
          <View key={step.key} className="flex-row gap-3">
            <View className="items-center">
              <View
                className={cn(
                  "h-6 w-6 items-center justify-center rounded-full",
                  done || active ? "bg-primary" : "bg-muted",
                )}
              >
                {done ? <Check size={13} color={color["primary-foreground"]} /> : null}
                {active ? <View className="h-2 w-2 rounded-full bg-primary-foreground" /> : null}
              </View>
              {!last ? (
                <View className={cn("w-0.5 flex-1", done ? "bg-primary" : "bg-border")} />
              ) : null}
            </View>

            <View className={cn("flex-1", last ? "pb-0" : "pb-5")}>
              <Text
                variant={active ? "label" : "body-sm"}
                tone={done || active ? "foreground" : "muted"}
              >
                {step.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
