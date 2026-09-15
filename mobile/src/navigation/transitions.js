import { Platform } from "react-native";
import { duration } from "@/theme/motion";

const PUSH = Platform.select({ ios: "ios_from_right", default: "slide_from_right" });

export function stackScreenOptions({ color }) {
  return {
    headerShown: false,
    contentStyle: { backgroundColor: color.background },
    animation: PUSH,
    animationDuration: duration.page,
    gestureEnabled: true,
    freezeOnBlur: true,
  };
}

export const sheetOptions = (detents = [0.9]) => ({
  presentation: "formSheet",
  sheetAllowedDetents: detents,
  sheetGrabberVisible: true,
  sheetCornerRadius: 26,
  gestureEnabled: true,
});

export const fullScreenModalOptions = {
  presentation: "fullScreenModal",
  animation: "slide_from_bottom",
  animationDuration: duration.panel,
  gestureEnabled: false,
};

export const fadeOptions = {
  animation: "fade",
  animationDuration: duration.standard,
};
