import { View } from "react-native";
import { Image } from "expo-image";
import { Pressable } from "react-native";
import { ImagePlus, X } from "lucide-react-native";
import { pickImages } from "@/api/uploads";
import { Text } from "@/components/ui/Text";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const MAX_IMAGES = 6;

/**
 * Existing images are Cloudinary URLs; new ones are local files. The update
 * endpoint diffs on `existingImages`, so anything not resent is deleted — which
 * is why removing one here just drops it from that list.
 */
export function MenuItemImages({ existing, added, error, onChangeExisting, onChangeAdded }) {
  const { color } = useTokens();
  const total = existing.length + added.length;

  async function add() {
    const remaining = MAX_IMAGES - total;
    if (remaining <= 0) {
      toast.info(`Up to ${MAX_IMAGES} images`);
      return;
    }

    const result = await pickImages({ limit: remaining });
    if (result.status === "denied") {
      toast.warning("Photo access needed", { description: "Turn it on in Settings." });
      return;
    }
    if (result.images.length) onChangeAdded([...added, ...result.images]);
  }

  const Thumb = ({ uri, onRemove, label }) => (
    <View className="h-20 w-20 overflow-hidden rounded-sm bg-muted">
      <Image source={uri} style={{ flex: 1 }} contentFit="cover" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onRemove}
        hitSlop={6}
        className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60"
      >
        <X size={13} color={color["scrim-foreground"]} />
      </Pressable>
    </View>
  );

  return (
    <View className="gap-2">
      <Text variant="label">Photos</Text>
      <View className="flex-row flex-wrap gap-2">
        {existing.map((url) => (
          <Thumb
            key={url}
            uri={url}
            label="Remove photo"
            onRemove={() => onChangeExisting(existing.filter((entry) => entry !== url))}
          />
        ))}
        {added.map((file) => (
          <Thumb
            key={file.uri}
            uri={file.uri}
            label="Remove photo"
            onRemove={() => onChangeAdded(added.filter((entry) => entry.uri !== file.uri))}
          />
        ))}

        {total < MAX_IMAGES ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a photo"
            onPress={add}
            className="h-20 w-20 items-center justify-center rounded-sm border border-dashed border-border-strong active:opacity-60"
          >
            <ImagePlus size={20} color={color["muted-foreground"]} />
          </Pressable>
        ) : null}
      </View>
      <Text variant="caption" tone={error ? "destructive" : "muted"}>
        {error ?? `${total}/${MAX_IMAGES} · the first is used as the main photo`}
      </Text>
    </View>
  );
}
