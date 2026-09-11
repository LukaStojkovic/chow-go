import { Fragment } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bike, ChevronRight, Store, UserPlus } from "lucide-react-native";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

/**
 * Shared shell for the auth stack.
 *
 * One column, one alignment: a small mark at the top left, the ask stated
 * once underneath it, then the fields. Nothing is centred and nothing is
 * decorated - the only coloured thing on the screen is the button you came
 * here to press.
 */
export function AuthScreen({ title, subtitle, children, footer, showBack = true }) {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScreenHeader
          showBack={showBack}
          onBack={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/welcome"))}
        />

        <ScrollView
          contentContainerClassName="grow gap-8 px-5 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeading title={title} subtitle={subtitle} />

          <View className="gap-4">{children}</View>

          {footer ? <View className="gap-7">{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// The mark reads as a signature on the page rather than a badge in the middle
// of it, so it stays small and shares the left margin with the headline.
export function AuthHeading({ title, subtitle }) {
  return (
    <View className="gap-4">
      <View className="flex-row">
        <BrandLogo tight size={22} />
      </View>
      <View className="gap-2">
        <Text variant="display">{title}</Text>
        {subtitle ? (
          <Text variant="body-lg" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function AuthDivider({ label = "or" }) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-px flex-1 bg-border" />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}

/**
 * Every alternative route out of an auth screen - the other role signups, the
 * switch to the opposite form, browsing without an account - is one row in one
 * grouped list. They used to be a mix of buttons, tiles and text links, which
 * is what made the screen read as a pile of options rather than a choice.
 */
export function AuthOptions({ label, options }) {
  const { color } = useTokens();

  return (
    <View className="gap-2.5">
      {label ? (
        <Text variant="overline" tone="muted">
          {label}
        </Text>
      ) : null}

      <Card className="overflow-hidden p-0">
        {options.map(({ icon: Icon, title, description, href }, position) => (
          <Fragment key={href}>
            {position > 0 ? <View className="ml-[62px] h-px bg-border" /> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={title}
              onPress={() => router.push(href)}
              className="flex-row items-center gap-3.5 px-4 py-3.5 active:bg-muted"
            >
              <View className="h-8 w-8 items-center justify-center rounded-md bg-primary-subtle">
                <Icon size={16} color={color.primary} strokeWidth={2.2} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text variant="h3" numberOfLines={1}>
                  {title}
                </Text>
                {description ? (
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {description}
                  </Text>
                ) : null}
              </View>
              <ChevronRight size={18} color={color["muted-foreground"]} />
            </Pressable>
          </Fragment>
        ))}
      </Card>
    </View>
  );
}

// Defined once so the two partner routes are described identically wherever
// they surface - sign-in, sign-up and the welcome screen.
export const PARTNER_OPTIONS = [
  {
    icon: Bike,
    title: "Deliver with Chow",
    description: "Earn on your own schedule",
    href: "/(auth)/courier",
  },
  {
    icon: Store,
    title: "Partner your restaurant",
    description: "List your kitchen and take orders",
    href: "/(auth)/seller",
  },
];

export const CREATE_ACCOUNT_OPTION = {
  icon: UserPlus,
  title: "Create an account",
  description: "Order from restaurants near you",
  href: "/(auth)/register",
};

export function AuthLegal({ verb = "continuing" }) {
  return (
    <Text variant="caption" tone="muted">
      By {verb} you agree to the Chow &amp; Go Terms of Service and Privacy Policy.
    </Text>
  );
}
