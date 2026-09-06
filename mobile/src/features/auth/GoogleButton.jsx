import Svg, { Path } from "react-native-svg";
import { View } from "react-native";
import { router } from "expo-router";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { homeForRole } from "@/navigation/homeForRole";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

// Google's brand mark. Inline rather than an asset so it stays crisp and needs
// no bundling; the four colours are Google's and must not be themed.
function GoogleMark({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export function GoogleButton() {
  const { signInWithGoogle, isSubmitting } = useAuthStore();

  async function start() {
    try {
      const result = await signInWithGoogle();

      if (result.status === "authenticated") {
        router.replace(homeForRole(result.user?.role));
        return;
      }
      if (result.status === "newUser") {
        // Google gives us a name and email but not a role or a phone number,
        // which the account genuinely needs.
        router.push({
          pathname: "/(auth)/google-complete",
          params: { signupToken: result.signupToken, ...result.profile },
        });
        return;
      }
      if (result.status === "failed") {
        toast.error("Google sign-in failed", { description: "Please try again." });
      }
    } catch (error) {
      toast.error("Google sign-in failed", { description: errorMessage(error) });
    }
  }

  return (
    <Button variant="outline" size="lg" disabled={isSubmitting} onPress={start}>
      <View className="flex-row items-center gap-2.5">
        <GoogleMark />
        <Text variant="label">Continue with Google</Text>
      </View>
    </Button>
  );
}
