import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";
import { Text } from "./Text";

// edges defaults to top+bottom; a screen under a tab bar should pass ["top"].
export function Screen({ children, className, edges = ["top", "bottom"], ...props }) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background" {...props}>
      <View className={cn("flex-1", className)}>{children}</View>
    </SafeAreaView>
  );
}

/**
 * Navigation header. A circular back button on the left, the title optically
 * centred with an optional subtitle under it, and one action on the right.
 *
 * Every stack in the app sets `headerShown: false` and draws this instead. The
 * native bar cannot produce a two-line centred title or a filled circular back
 * button, and a stack that mixes the two ends up showing two back buttons on
 * whichever screens draw their own - which is exactly what happened to the
 * seller and courier signups.
 *
 * `center` replaces the title block for headers whose middle is not text, so
 * the auth stack can put its trust indicator there and still inherit the same
 * height, padding and 40pt side slots.
 */
export function ScreenHeader({
  title,
  subtitle,
  center,
  onBack,
  showBack = true,
  right,
  left,
  className,
  ...props
}) {
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")));

  return (
    <View
      className={cn("h-16 flex-row items-center justify-between gap-3 px-5", className)}
      {...props}
    >
      <View className="w-10 items-start">
        {left ??
          (showBack ? (
            <IconButton icon={ArrowLeft} variant="muted" label="Go back" onPress={back} />
          ) : null)}
      </View>

      <View className="flex-1 items-center">
        {center ?? (
          <>
            {title ? (
              <Text variant="h2" numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </>
        )}
      </View>

      <View className="w-10 items-end">{right}</View>
    </View>
  );
}
