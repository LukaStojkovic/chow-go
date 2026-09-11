import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/IconTile";
import { Text } from "@/components/ui/Text";

export function EmptyState({ title, description, actionLabel, onAction, icon, tone = "muted" }) {
  return (
    <View className="items-center gap-4 px-8 py-14">
      {icon ? <IconTile icon={icon} tone={tone} size={64} round /> : null}
      <View className="items-center gap-1.5">
        <Text variant="h2" className="text-center">
          {title}
        </Text>
        {description ? (
          <Text variant="body" tone="muted" className="text-center">
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Button variant="mint" size="md" onPress={onAction} className="mt-1">
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
