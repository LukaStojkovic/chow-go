import { useEffect, useRef } from "react";
import { Pressable, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/Text";

// Sticky rail under the hero. Scroll-spy drives `active` from the list's own
// scroll position, and the rail scrolls itself to keep that chip in view.
export function CategoryTabs({ sections, active, onSelect }) {
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
      className="bg-background"
      contentContainerClassName="gap-2 px-5 py-3"
    >
      {sections.map((section) => {
        const selected = active === section.title;
        return (
          <Pressable
            key={section.title}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onLayout={(event) => {
              offsets.current[section.title] = event.nativeEvent.layout.x;
            }}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(section.title);
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
