import { api } from "@/api/client";
import { toFormData } from "@/api/uploads";

export async function getRestaurantInfo(restaurantId) {
  const { data } = await api.get(`/restaurants/${restaurantId}`);
  return data.data;
}

export async function getRestaurantMenu(restaurantId) {
  const { data } = await api.get(`/restaurants/${restaurantId}/menu`);
  return data.menu ?? [];
}

export async function getMenuItems(restaurantId, filters = {}) {
  const { data } = await api.get(`/restaurants/${restaurantId}/menu-items`, {
    params: filters,
  });
  // { status, data: { menuItems, pagination } }
  return data.data;
}

function menuItemFields({ name, category, price, available, description, promotion = {} }) {
  const fields = {
    name,
    category,
    price: String(price),
    available: String(Boolean(available)),
    "promotion[isActive]": promotion.isActive ? "true" : "false",
  };

  if (description) fields.description = description;

  if (promotion.isActive) {
    fields["promotion[type]"] = promotion.type || "percentage";
    fields["promotion[value]"] = String(promotion.value ?? "");
    fields["promotion[label]"] = promotion.label || "";
    // Sent only when set: an empty string is not a date, and the backend reads
    // a missing bound as "runs until switched off".
    if (promotion.startsAt) fields["promotion[startsAt]"] = promotion.startsAt;
    if (promotion.endsAt) fields["promotion[endsAt]"] = promotion.endsAt;
  }

  return fields;
}

export async function createMenuItem(restaurantId, payload) {
  const form = toFormData(menuItemFields(payload), { images: payload.images });
  const { data } = await api.post(`/restaurants/${restaurantId}/menu`, form);
  return data;
}

export async function updateMenuItem(restaurantId, menuItemId, payload) {
  const form = toFormData(menuItemFields(payload), { images: payload.images });
  // Anything not resent is treated as removed by the image diffing service.
  for (const url of payload.existingImages ?? []) form.append("existingImages", url);

  const { data } = await api.put(`/restaurants/${restaurantId}/menu/${menuItemId}`, form);
  return data;
}

export async function deleteMenuItem(restaurantId, menuItemId) {
  const { data } = await api.delete(`/restaurants/${restaurantId}/menu/${menuItemId}`);
  return data;
}

export async function getOwnRestaurant(restaurantId) {
  const { data } = await api.get(`/restaurants/${restaurantId}`);
  return data.data;
}

/**
 * Partial update. Every field is optional server-side and the schedule merges
 * day by day, so an autosave can send only what changed without wiping the rest.
 */
export async function updateRestaurant({ profilePicture, schedule, address, ...fields }) {
  const flat = { ...fields };

  // multer's append-field rebuilds schedule[monday][isOpen] into a real object;
  // sending JSON would arrive as a string the service then has to parse.
  for (const [day, entry] of Object.entries(schedule ?? {})) {
    for (const [key, value] of Object.entries(entry)) {
      flat[`schedule[${day}][${key}]`] = String(value);
    }
  }
  for (const [key, value] of Object.entries(address ?? {})) {
    flat[`address[${key}]`] = String(value);
  }

  const form = toFormData(flat, profilePicture ? { profilePicture: [profilePicture] } : {});
  const { data } = await api.put("/restaurants/update", form);
  return data;
}
