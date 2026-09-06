import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

/**
 * Picks images and normalises them for Cloudinary.
 *
 * Two traps this exists to avoid. iOS camera-roll assets are HEIC, which the
 * upload middleware's allowed_formats rejects with a Cloudinary 400 that
 * surfaces as a generic 500 — so everything is transcoded to JPEG and labelled
 * as such. And a phone photo is easily 8MB, which is a slow upload on cellular
 * for an image displayed at a few hundred pixels, so it is resized first.
 */
const MAX_WIDTH = 1600;

export async function pickImages({ limit = 1 } = {}) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: "denied", images: [] };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 1,
  });
  if (result.canceled) return { status: "cancelled", images: [] };

  const images = [];
  for (const asset of result.assets) {
    const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
    if (asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });

    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    images.push({
      uri: saved.uri,
      name: `photo-${Date.now()}-${images.length}.jpg`,
      type: "image/jpeg",
    });
  }

  return { status: "picked", images };
}

/**
 * React Native must generate the multipart boundary itself, so Content-Type is
 * deliberately never set here — passing it, as the web service does, breaks the
 * boundary and the server sees an empty body.
 */
export function toFormData(fields, files = {}) {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    form.append(key, typeof value === "boolean" ? String(value) : value);
  }

  for (const [key, list] of Object.entries(files)) {
    for (const file of list ?? []) form.append(key, file);
  }

  return form;
}
