import { Modal, Pressable, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";
import { IconTile } from "./IconTile";
import { Text } from "./Text";

/**
 * A confirmation, presented as a sheet from the bottom edge.
 *
 * Bottom rather than centred because every one of these is answered with a
 * thumb, and a centred dialog puts its buttons where a thumb is not. The grab
 * handle and the rounded top are what make it read as dismissible.
 */
export function Sheet({ visible, onClose, icon, tone = "danger", title, description, children }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onClose}
          className="absolute inset-0 bg-black/55"
        />

        <Animated.View
          entering={FadeInDown.duration(240)}
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          className="gap-4 rounded-t-3xl bg-popover px-5 pt-3"
        >
          <View className="h-1 w-10 self-center rounded-full bg-border-strong" />

          <View className="items-center gap-3 pt-2">
            {icon ? <IconTile icon={icon} tone={tone} size={56} round /> : null}
            <View className="items-center gap-1.5">
              <Text variant="h1" className="text-center">
                {title}
              </Text>
              {description ? (
                <Text variant="body" tone="muted" className="text-center">
                  {description}
                </Text>
              ) : null}
            </View>
          </View>

          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// The action stack every sheet ends with: the decision, then the way out.
export function SheetActions({ children, className }) {
  return <View className={cn("gap-2.5 pt-1", className)}>{children}</View>;
}
