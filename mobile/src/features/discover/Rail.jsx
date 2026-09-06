import { FlatList, View } from "react-native";
import { Text } from "@/components/ui/Text";

// Horizontal section. FlatList rather than FlashList: these are short, bounded
// lists where FlashList's recycling buys nothing and its sizing estimate is
// another thing to keep correct.
export function Rail({ title, data, renderItem, keyExtractor, action }) {
  if (!data?.length) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-5">
        <Text variant="h2">{title}</Text>
        {action}
      </View>
      <FlatList
        horizontal
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-5"
      />
    </View>
  );
}
