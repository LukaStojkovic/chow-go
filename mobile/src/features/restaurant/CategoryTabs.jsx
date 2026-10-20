import { useEffect, useRef } from "react";
import { Pressable, ScrollView } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/Text";

export const TABS_HEIGHT = 64;

export function CategoryTabs({ sections, active, onSelect, hidden = false }) {
  const scrollRef = useRef(null);
  const offsets = useRef({});

  useEffect(() => {
    const x = offsets.current[active];
    if (x != null) scrollRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, [active]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      aria-hidden={hidden}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
      style={{ height: TABS_HEIGHT, flexGrow: 0 }}
      className="bg-background"
      contentContainerClassName="items-center gap-2 px-5"
    >
      {sections.map((section) => {
        const selected = active === section.key;
        return (
          <Pressable
            key={section.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onLayout={(event) => {
              offsets.current[section.key] = event.nativeEvent.layout.x;
            }}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(section.key);
            }}
            className={cn(
              "h-10 justify-center rounded-full border px-4 active:opacity-70",
              selected ? "border-primary bg-primary" : "border-border bg-card",
            )}
          >
            <Text
              variant="label"
              className={selected ? "text-primary-foreground" : "text-foreground"}
            >
              {section.title}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function PinnedCategoryTabs({ scrollY, pinAt, top, pinned, ...props }) {
  const style = useAnimatedStyle(() => ({
    opacity: pinAt > 0 && scrollY.value >= pinAt ? 1 : 0,
  }));

  return (
    <Animated.View
      pointerEvents={pinned ? "auto" : "none"}
      style={[{ position: "absolute", left: 0, right: 0, top }, style]}
      className="border-b border-border bg-background"
    >
      <CategoryTabs {...props} hidden={!pinned} />
    </Animated.View>
  );
}
