import { Text, View, StyleSheet } from "react-native";
import "../../global.css";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView className="bg-card">
      <Text className="text-primary">
        Edit src/app/index.tsx to edit this screen.
      </Text>
    </SafeAreaView>
  );
}
