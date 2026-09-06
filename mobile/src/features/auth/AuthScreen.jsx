import { ScrollView, View } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Text } from "@/components/ui/Text";

// Shared shell for the auth stack: keyboard handling, scroll on small screens,
// and the title/subtitle pair every step uses.
export function AuthScreen({ title, subtitle, children, footer }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="grow justify-center gap-6 p-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-1.5">
          <Text variant="h1">{title}</Text>
          {subtitle ? (
            <Text variant="body" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="gap-4">{children}</View>

        {footer ? <View className="items-center gap-2">{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
