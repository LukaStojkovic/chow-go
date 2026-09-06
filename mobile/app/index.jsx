import { Redirect } from "expo-router";
import { homeForRole } from "@/navigation/homeForRole";
import { useAuthStore } from "@/store/useAuthStore";

export default function Index() {
  const authUser = useAuthStore((state) => state.authUser);

  // Browsing is deliberately open to signed-out users, matching the web, which
  // has no /login route at all - an action that needs a session pushes the auth
  // stack instead of gating the whole app behind it.
  if (!authUser) return <Redirect href="/(auth)/welcome" />;

  return <Redirect href={homeForRole(authUser.role)} />;
}
