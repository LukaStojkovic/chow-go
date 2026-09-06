import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";

// edges defaults to top+bottom; a screen under a tab bar should pass ["top"].
export function Screen({ children, className, edges = ["top", "bottom"], ...props }) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background" {...props}>
      <View className={cn("flex-1", className)}>{children}</View>
    </SafeAreaView>
  );
}
