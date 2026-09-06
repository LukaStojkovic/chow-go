import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { formatPrice } from "@chowgo/shared/format";
import { formatDistance } from "@chowgo/shared/geo";
import { CATEGORIES } from "@chowgo/shared/constants";
import { PRICING } from "@chowgo/shared/adapters/pricing";
import { api, errorMessage } from "@/api/client";
import { API_URL, SOCKET_URL } from "@/lib/config";
import { getToken } from "@/lib/secureToken";
import { useThemeStore } from "@/store/useThemeStore";
import { useTokens } from "@/theme/useTokens";

const TYPE_ROLES = [
  "display", "h1", "h2", "h3", "body-lg", "body",
  "body-sm", "label", "caption", "price", "price-lg",
];

const SWATCHES = [
  ["bg-primary", "text-primary-foreground", "primary"],
  ["bg-primary-subtle", "text-primary-subtle-foreground", "primary-subtle"],
  ["bg-secondary", "text-secondary-foreground", "secondary"],
  ["bg-muted", "text-muted-foreground", "muted"],
  ["bg-destructive", "text-destructive-foreground", "destructive"],
  ["bg-success", "text-success-foreground", "success"],
  ["bg-warning", "text-warning-foreground", "warning"],
  ["bg-info", "text-info-foreground", "info"],
];

function Section({ title, children }) {
  return (
    <View className="gap-3">
      <Text variant="h3" tone="muted">{title}</Text>
      {children}
    </View>
  );
}

export default function KitchenSink() {
  const { preference, setPreference } = useThemeStore();
  const { scheme } = useTokens();
  const [probe, setProbe] = useState(null);
  const [probing, setProbing] = useState(false);

  // Exercises the whole chain: config host resolution, the axios instance, the
  // X-Client header and the Bearer interceptor.
  async function pingApi() {
    setProbing(true);
    try {
      const { data } = await api.get("/auth/check");
      setProbe({ ok: true, text: `authenticated as ${data.email} (${data.role})` });
    } catch (error) {
      const status = error.response?.status;
      setProbe({
        ok: status === 401,
        text: status === 401 ? "reachable, not signed in (401)" : errorMessage(error),
      });
    } finally {
      setProbing(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-8 p-5 pb-16">
        <View className="gap-1">
          <Text variant="display">Chow &amp; Go</Text>
          <Text variant="body-sm" tone="muted">
            Design tokens — {scheme} ({preference})
          </Text>
        </View>

        <Section title="Theme">
          <View className="flex-row gap-2">
            {["light", "dark", "system"].map((option) => (
              <Button
                key={option}
                size="sm"
                variant={preference === option ? "primary" : "outline"}
                onPress={() => setPreference(option)}
                className="flex-1"
              >
                {option}
              </Button>
            ))}
          </View>
        </Section>

        <Section title="Colour">
          <View className="flex-row flex-wrap gap-2">
            {SWATCHES.map(([bg, fg, name]) => (
              <View key={name} className={`${bg} min-w-[46%] flex-1 rounded-sm p-3`}>
                <Text variant="caption" className={fg}>{name}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row gap-2">
            {[10, 20, 40, 70, 100].map((step) => (
              <View key={step} className={`flex-1 rounded-xs bg-primary/${step} py-4`} />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            Alpha ramp above proves bg-primary/10 compiles — it needs RGB channels, not hex.
          </Text>
        </Section>

        <Section title="Typography">
          <Card className="gap-2">
            {TYPE_ROLES.map((role) => (
              <Text key={role} variant={role}>
                {role} — 12.50
              </Text>
            ))}
          </Card>
        </Section>

        <Section title="Buttons">
          <View className="gap-2">
            {["primary", "secondary", "outline", "ghost", "destructive"].map((variant) => (
              <Button key={variant} variant={variant}>{variant}</Button>
            ))}
            <Button loading>loading</Button>
            <Button disabled>disabled</Button>
          </View>
        </Section>

        <Section title="Radii">
          <View className="flex-row gap-2">
            {["rounded-xs", "rounded-sm", "rounded-md", "rounded-lg", "rounded-full"].map((r) => (
              <View key={r} className={`h-14 flex-1 border border-border-strong bg-card ${r}`} />
            ))}
          </View>
        </Section>

        <Section title="@chowgo/shared">
          <Card className="gap-1">
            <Text variant="body-sm">formatPrice(12.5) = {formatPrice(12.5)}</Text>
            <Text variant="body-sm">geo.formatDistance(1250) = {formatDistance(1250)}</Text>
            <Text variant="body-sm">delivery fee = {formatPrice(PRICING.deliveryFee)}</Text>
            <Text variant="body-sm">{CATEGORIES.length} categories</Text>
          </Card>
        </Section>

        <Section title="Environment">
          <Button variant="outline" onPress={pingApi} loading={probing}>
            Ping API
          </Button>
          {probe ? (
            <Card className={probe.ok ? "border-success" : "border-destructive"}>
              <Text variant="body-sm" tone={probe.ok ? "success" : "destructive"}>
                {probe.text}
              </Text>
            </Card>
          ) : null}
          <Card className="gap-1">
            <Text variant="caption" tone="muted">API_URL</Text>
            <Text variant="body-sm">{API_URL}</Text>
            <Text variant="caption" tone="muted" className="mt-2">SOCKET_URL</Text>
            <Text variant="body-sm">{SOCKET_URL}</Text>
            <Text variant="caption" tone="muted" className="mt-2">stored token</Text>
            <TokenState />
          </Card>
        </Section>
      </ScrollView>
    </Screen>
  );
}

function TokenState() {
  const [token, setToken] = useState("checking...");
  useEffect(() => {
    getToken().then((value) => setToken(value ? `present (${value.length} chars)` : "none"));
  }, []);
  return <Text variant="body-sm">{token}</Text>;
}
