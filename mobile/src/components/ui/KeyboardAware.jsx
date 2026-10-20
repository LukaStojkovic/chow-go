import { forwardRef } from "react";
import { cssInterop } from "nativewind";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

cssInterop(KeyboardAwareScrollView, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

// Room a sticky DockedBar takes above the keyboard: its top pad, a large button
// and the 16pt it keeps underneath once the safe-area inset is under the keys.
export const DOCK_CLEARANCE = 100;

export const KeyboardScroll = forwardRef(function KeyboardScroll(
  { docked = false, bottomOffset = docked ? DOCK_CLEARANCE : 24, ...props },
  ref,
) {
  return (
    <KeyboardAwareScrollView
      ref={ref}
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
});

export function KeyboardDock({ children }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardStickyView offset={{ closed: 0, opened: Math.max(insets.bottom - 16, 0) }}>
      {children}
    </KeyboardStickyView>
  );
}
