import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY = "chow_go_installation_id";

// A random id that only this install knows. The backend lets a push token move
// between accounts only when the same id is presented, so knowing someone's
// token is not enough to redirect their notifications.
export async function getInstallationId() {
  try {
    const existing = await SecureStore.getItemAsync(KEY);
    if (existing) return existing;
    const created = `inst_${Crypto.randomUUID()}`;
    await SecureStore.setItemAsync(KEY, created);
    return created;
  } catch {
    return undefined;
  }
}
