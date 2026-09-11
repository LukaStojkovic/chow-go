import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { ImagePlus, Star, X } from "lucide-react-native";
import { pickImages } from "@/api/uploads";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const MAX_IMAGES = 6;

/**
 * Existing images are Cloudinary URLs; new ones are local files. The update
 * endpoint diffs on `existingImages`, so anything not resent is deleted - which
 * is why removing one here just drops it from that list.
 *
 * The first thumbnail is badged as the main photo, because that is the one that
 * ends up on every card in the customer app and the ordering is not otherwise
 * visible.
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

  const Thumb = ({ uri, onRemove, label, isMain }) => (
    <View className="h-24 w-24 overflow-hidden rounded-md bg-muted">
      <Image source={uri} style={{ flex: 1 }} contentFit="cover" />

      {isMain ? (
        <View className="absolute bottom-1 left-1">
          <Badge tone="solid" size="sm" icon={Star}>
            Main
          </Badge>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onRemove}
        hitSlop={6}
        className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-black/60 active:opacity-70"
      >
        <X size={14} strokeWidth={2.6} color={color["scrim-foreground"]} />
      </Pressable>
    </View>
  );

  return (
    <View className="gap-2">
      <Text variant="label-sm" tone={error ? "destructive" : "muted"}>
        Photos
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {existing.map((url, index) => (
          <Thumb
            key={url}
            uri={url}
            isMain={index === 0}
            label="Remove photo"
            onRemove={() => onChangeExisting(existing.filter((entry) => entry !== url))}
          />
        ))}
        {added.map((file, index) => (
          <Thumb
            key={file.uri}
            uri={file.uri}
            isMain={existing.length === 0 && index === 0}
            label="Remove photo"
            onRemove={() => onChangeAdded(added.filter((entry) => entry.uri !== file.uri))}
          />
        ))}

        {total < MAX_IMAGES ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a photo"
            onPress={add}
            className="h-24 w-24 items-center justify-center gap-1 rounded-md border-2 border-dashed border-border-strong bg-muted active:opacity-70"
          >
            <ImagePlus size={22} color={color.primary} />
            <Text variant="caption" tone="primary">
              Add
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text variant="caption" tone={error ? "destructive" : "muted"}>
        {error ?? `${total} of ${MAX_IMAGES} · the first is the main photo`}
      </Text>
    </View>
  );
}
