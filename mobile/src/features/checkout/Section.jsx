import { View } from "react-native";
import { Text } from "@/components/ui/Text";

export function Section({ title, action, children }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="h3">{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}
