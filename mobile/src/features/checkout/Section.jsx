import { View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";

/**
 * One block of the checkout.
 *
 * A card, a title, and the controls. There was an icon tile fronting each
 * heading; five coloured squircles down one form turned a short sequence of
 * decisions into something that looked like a settings app, so they are gone.
 */
export function Section({ title, subtitle, action, children, className }) {
  return (
    <Card className={className}>
      <View className="mb-3.5 flex-row items-center gap-3">
        <View className="flex-1">
          <Text variant="h3" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body-sm" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action ? <View className="shrink-0">{action}</View> : null}
      </View>
      {children}
    </Card>
  );
}
