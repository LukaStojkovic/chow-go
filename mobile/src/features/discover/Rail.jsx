import { FlatList, View } from "react-native";
import { RevealItem } from "@/components/motion/Reveal";
import { SectionHeader } from "@/components/ui/Section";

// Horizontal section. FlatList rather than FlashList: these are short, bounded
// lists where FlashList's recycling buys nothing and its sizing estimate is
// another thing to keep correct.
export function Rail({ title, subtitle, data, renderItem, keyExtractor, onAction, actionLabel }) {
  if (!data?.length) return null;

  return (
    <View className="gap-3">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        onAction={onAction}
        actionLabel={actionLabel}
        className="px-5"
      />
      <FlatList
        horizontal
        data={data}
        // The cards arrive one after the other rather than all at once. The
        // stagger is capped inside RevealItem, so a long rail does not end with
        // a card waiting two seconds for its turn.
        renderItem={(info) => <RevealItem index={info.index}>{renderItem(info)}</RevealItem>}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-5 py-1"
      />
    </View>
  );
}
