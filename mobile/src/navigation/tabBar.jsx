import { Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";

/**
 * The bottom bar, shared by all three roles.
 *
 * The active destination is marked by a mint pill behind its icon rather than
 * by colour alone - at a glance you see a filled shape, not a hue, which is
 * what makes it readable in sunlight and to anyone who does not separate the
 * green from the grey.
 *
 * iOS gets a translucent material so content scrolls under the bar; Android
 * stays opaque, which is what Material expects.
 */

/** Bar height above the safe area. The full height is this plus insets.bottom. */
export const TAB_BAR_BASE_HEIGHT = 60;

/**
 * The bar's real height on this device.
 *
 * `android.edgeToEdgeEnabled` is on, so the app draws *underneath* the system
 * navigation bar. A fixed height therefore puts the tab row behind Android's
 * back/home/recents buttons - which is what happened on hardware with
 * three-button navigation. The inset has to be added to the height and paid
 * out again as bottom padding, or the row is centred inside a box that extends
 * under the system bar.
 */
export function tabBarHeight(insets) {
  return TAB_BAR_BASE_HEIGHT + (insets?.bottom ?? 0);
}

export function tabScreenOptions({ color, isDark, insets }) {
  const translucent = Platform.OS === "ios";
  const bottom = insets?.bottom ?? 0;

  return {
    headerShown: false,
    tabBarActiveTintColor: color.primary,
    tabBarInactiveTintColor: color["muted-foreground"],
    tabBarStyle: {
      height: TAB_BAR_BASE_HEIGHT + bottom,
      paddingBottom: bottom,
      paddingTop: 6,
      backgroundColor: translucent ? "transparent" : color.card,
      borderTopColor: color.border,
      borderTopWidth: 1,
      position: translucent ? "absolute" : "relative",
      elevation: 0,
    },
    tabBarBackground: translucent
      ? () => <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={{ flex: 1 }} />
      : undefined,
  };
}

/**
 * Options for one destination.
 *
 * The icon and the label go into react-navigation's own two slots rather than
 * both being crammed into `tabBarIcon`. The navigator measures and positions
 * those slots itself, so a long label truncates instead of being clipped by
 * the icon's box.
 */
export function tabItemOptions({ icon: Icon, title, badge }) {
  return {
    title,
    tabBarIcon: ({ color, focused }) => (
      <View
        className={cn(
          "h-7 w-12 items-center justify-center rounded-full",
          focused && "bg-primary-subtle",
        )}
      >
        <Icon size={20} strokeWidth={focused ? 2.3 : 2} color={color} />
        {badge ? (
          <View className="absolute -right-1 -top-1 min-w-[18px] items-center justify-center rounded-full bg-tertiary px-1 py-0.5">
            <Text variant="overline" className="text-tertiary-foreground">
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        ) : null}
      </View>
    ),
    // Sentence case at Inter Medium, not the uppercase Jakarta Bold used for
    // eyebrows elsewhere: a nav label is read constantly and at a glance, so it
    // should be the quietest type in the app rather than the loudest.
    tabBarLabel: ({ focused }) => (
      <Text
        variant="caption"
        numberOfLines={1}
        className={cn(
          "font-medium text-[11px]",
          focused ? "text-primary" : "text-muted-foreground",
        )}
      >
        {title}
      </Text>
    ),
  };
}
