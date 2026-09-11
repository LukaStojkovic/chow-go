import { View } from "react-native";
import { Bike, Check, ChefHat, Home, PackageCheck, Receipt } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

/**
 * The order tracker, run horizontally across the top of the tracking screen.
 *
 * It renders `order.steps` straight from the shared adapter rather than
 * re-deriving stages from the raw status. That adapter already knows the two
 * awkward cases - `ready` advances "Preparing" and `in_transit` advances "On
 * the way" instead of each adding a node the customer has to decode - and
 * duplicating that logic here is how a badge and a tracker end up disagreeing
 * about the same order.
 *
 * Icons carry the stage as much as the labels do, because at 10px the labels
 * are recognised by shape long before they are read.
 */
const ICONS = {
  received: Receipt,
  confirmed: Check,
  preparing: ChefHat,
  assigned: PackageCheck,
  on_the_way: Bike,
  delivered: Home,
};

// Short forms. The adapter's labels are written for a screen reader and a
// vertical list; across six columns on a phone they have to be one word.
const SHORT = {
  received: "Placed",
  confirmed: "Confirmed",
  preparing: "Cooking",
  assigned: "Courier",
  on_the_way: "On the way",
  delivered: "Delivered",
};

export function OrderStatusTimeline({ steps }) {
  const { color } = useTokens();
  if (!steps?.length) return null;

  return (
    <View className="flex-row">
      {steps.map((step, index) => {
        const Icon = ICONS[step.id] ?? Check;
        const done = step.state === "complete";
        const current = step.state === "current";
        const reached = done || current;
        const previousReached = index > 0 && steps[index - 1].state !== "upcoming";

        return (
          <View key={step.id} className="flex-1 items-center">
            {/* The connector is drawn behind the dot rather than between
                dots, which keeps every column exactly one sixth wide however
                long its label is. */}
            <View className="h-9 w-full flex-row items-center">
              <View
                className={cn(
                  "h-[3px] flex-1 rounded-full",
                  index === 0 ? "opacity-0" : previousReached ? "bg-primary" : "bg-border",
                )}
              />
              <View
                className={cn(
                  "h-9 w-9 items-center justify-center rounded-full",
                  done ? "bg-primary" : current ? "bg-primary-bright" : "bg-muted",
                )}
              >
                <Icon
                  size={16}
                  strokeWidth={2.4}
                  color={reached ? color["primary-foreground"] : color["muted-foreground"]}
                />
              </View>
              <View
                className={cn(
                  "h-[3px] flex-1 rounded-full",
                  index === steps.length - 1 ? "opacity-0" : done ? "bg-primary" : "bg-border",
                )}
              />
            </View>

            <Text
              variant="caption"
              numberOfLines={2}
              tone={reached ? "primary" : "muted"}
              className="mt-1.5 text-center"
            >
              {SHORT[step.id] ?? step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
