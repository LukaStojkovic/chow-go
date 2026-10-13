import { useLocalSearchParams } from "expo-router";
import { CollectionScreen } from "@/features/collections/CollectionScreen";

export default function Collection() {
  const { slug } = useLocalSearchParams();
  return <CollectionScreen slug={Array.isArray(slug) ? slug[0] : slug} />;
}
