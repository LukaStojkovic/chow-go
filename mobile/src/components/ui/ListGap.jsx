import { View } from "react-native";

const GAPS = { 3: "h-3", 4: "h-4" };
const cache = {};

export function listGap(size) {
  cache[size] ??= function ListGap() {
    return <View className={GAPS[size]} />;
  };
  return cache[size];
}
