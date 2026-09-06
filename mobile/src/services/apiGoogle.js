import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { api } from "@/api/client";
import { API_URL } from "@/lib/config";

WebBrowser.maybeCompleteAuthSession();

/**
 * Opens the backend's own Google route in the system browser.
 *
 * The app never talks to Google directly, which is why no iOS/Android OAuth
 * client id is needed and why chowgo:// never appears in Google's console -
 * the only registered redirect stays the backend's callback URL.
 */
export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "chowgo",
    path: "auth/google",
  });

  const result = await WebBrowser.openAuthSessionAsync(
    `${API_URL}/auth/google?client=mobile`,
    redirectUri,
  );

  if (result.type !== "success") return { status: "cancelled" };

  const { queryParams } = Linking.parse(result.url);
  if (queryParams?.error) return { status: "failed" };
  if (!queryParams?.code) return { status: "failed" };

  // The deep link carries a 90-second code, never the session itself.
  const { data } = await api.post("/auth/google/exchange", { code: queryParams.code });
  return data.status === "authenticated"
    ? { status: "authenticated", token: data.token, user: data.user }
    : { status: "newUser", signupToken: data.signupToken, profile: data.profile };
}

export async function completeGoogleProfile({ signupToken, role, ...fields }) {
  const { data } = await api.post("/auth/google/complete-profile", {
    signupToken,
    role,
    ...fields,
  });
  return data;
}
