import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon }) {
  return (
    <View className="items-center gap-3 px-8 py-12">
      {Icon ? <Icon size={32} strokeWidth={1.5} className="text-muted-foreground" /> : null}
      <View className="items-center gap-1">
        <Text variant="h3" className="text-center">
          {title}
        </Text>
        {description ? (
          <Text variant="body-sm" tone="muted" className="text-center">
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Button variant="outline" size="sm" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
