import { Redirect } from "expo-router";

// Phase 0: the customer app is not built yet, so the entry point is the
// kitchen sink. This becomes the role-based redirect in Phase 1.
export default function Index() {
  return <Redirect href="/dev" />;
}
