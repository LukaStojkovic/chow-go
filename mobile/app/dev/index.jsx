import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ScrollView, View } from "react-native";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, Inset } from "@/components/ui/Card";
import { Chip, ChipRow, TabSwitch } from "@/components/ui/Chip";
import { IconTile } from "@/components/ui/IconTile";
import { Input, SearchInput } from "@/components/ui/Input";
import { ListRow } from "@/components/ui/ListRow";
import { Screen } from "@/components/ui/Screen";
import { Divider, SectionHeader } from "@/components/ui/Section";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { AppearanceSettings } from "@/features/settings/AppearanceSettings";
import { Bike, Heart, Search, Star, Store } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { formatDistance } from "@chowgo/shared/geo";
import { CATEGORY_VALUES } from "@chowgo/shared/constants";
import { PRICING } from "@chowgo/shared/adapters/pricing";
import { api, errorMessage } from "@/api/client";
import { API_URL, SOCKET_URL } from "@/lib/config";
import { getToken } from "@/lib/secureToken";
import { useSocket } from "@/realtime/SocketProvider";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useTokens } from "@/theme/useTokens";

const TYPE_ROLES = [
  "display",
  "h1",
  "h2",
  "h3",
  "label",
  "label-sm",
  "overline",
  "body-lg",
  "body",
  "body-sm",
  "caption",
  "price",
  "price-lg",
  "price-xl",
];

const SWATCHES = [
  ["bg-primary", "text-primary-foreground", "primary"],
  ["bg-primary-bright", "text-primary-foreground", "primary-bright"],
  ["bg-primary-subtle", "text-primary-subtle-foreground", "primary-subtle"],
  ["bg-tertiary", "text-tertiary-foreground", "tertiary"],
  ["bg-tertiary-subtle", "text-tertiary-subtle-foreground", "tertiary-subtle"],
  ["bg-secondary", "text-secondary-foreground", "secondary"],
  ["bg-muted", "text-muted-foreground", "muted"],
  ["bg-destructive", "text-destructive-foreground", "destructive"],
  ["bg-success", "text-success-foreground", "success"],
  ["bg-warning", "text-warning-foreground", "warning"],
  ["bg-info", "text-info-foreground", "info"],
];

// Written out rather than built with `bg-primary/${step}`: Tailwind scans for
// whole class strings, so an interpolated one is never generated.
const ALPHA_RAMP = [
  "bg-primary/10",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/70",
  "bg-primary",
];

const RADII = [
  "rounded-xs",
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-full",
];

const BUTTON_VARIANTS = [
  "primary",
  "mint",
  "tertiary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "inverse",
];

const BADGE_TONES = [
  "neutral",
  "mint",
  "citrus",
  "info",
  "warning",
  "danger",
  "solid",
  "solid-citrus",
  "dark",
];

function Group({ title, children }) {
  return (
    <View className="gap-3">
      <Text variant="overline" tone="muted">
        {title}
      </Text>
      {children}
    </View>
  );
}

// This route reads the session token out of SecureStore and runs a live API
// probe. Expo Router has no dev-only route exclusion, so the redirect is the
// gate: in a release build the screen is unreachable.
export default function DevRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <KitchenSink />;
}

function KitchenSink() {
  const { preference, setPreference } = useThemeStore();
  const { scheme, elevation } = useTokens();
  const [probe, setProbe] = useState(null);
  const [probing, setProbing] = useState(false);
  const [chip, setChip] = useState("All");
  const [tab, setTab] = useState("one");
  const [quantity, setQuantity] = useState(1);

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
      <ScrollView contentContainerClassName="gap-8 px-5 pb-16 pt-2">
        <SectionHeader
          title="Fast Casual Velocity"
          subtitle={`Design tokens · ${scheme} (${preference})`}
        />

        <Group title="Appearance">
          <AppearanceSettings />
        </Group>

        <Group title="Colour">
          <View className="flex-row flex-wrap gap-2">
            {SWATCHES.map(([bg, fg, name]) => (
              <View key={name} className={`${bg} min-w-[46%] flex-1 rounded-md p-3`}>
                <Text variant="label-sm" className={fg}>
                  {name}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row gap-2">
            {ALPHA_RAMP.map((cls) => (
              <View key={cls} className={`flex-1 rounded-xs py-5 ${cls}`} />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            The alpha ramp proves bg-primary/10 compiles - it needs RGB channels, not hex.
          </Text>
        </Group>

        <Group title="Typography">
          <Card className="gap-2">
            {TYPE_ROLES.map((role) => (
              <Text key={role} variant={role}>
                {role} — 12.50
              </Text>
            ))}
          </Card>
        </Group>

        <Group title="Elevation">
          <View className="flex-row gap-3">
            {["subtle", "raised", "overlay", "glow"].map((level) => (
              <View
                key={level}
                style={elevation[level][scheme]}
                className="h-20 flex-1 items-center justify-center rounded-lg bg-card"
              >
                <Text variant="overline" tone="muted">
                  {level}
                </Text>
              </View>
            ))}
          </View>
        </Group>

        <Group title="Buttons">
          <View className="gap-2">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant} size="lg" fullWidth>
                {variant}
              </Button>
            ))}
            <Button loading fullWidth>
              loading
            </Button>
            <Button disabled fullWidth>
              disabled
            </Button>
          </View>

          <View className="flex-row gap-2">
            {["surface", "muted", "mint", "primary"].map((variant) => (
              <IconButton key={variant} icon={Heart} variant={variant} label={variant} />
            ))}
          </View>
        </Group>

        <Group title="Badges">
          <View className="flex-row flex-wrap gap-2">
            {BADGE_TONES.map((tone) => (
              <Badge key={tone} tone={tone} icon={Star}>
                {tone}
              </Badge>
            ))}
          </View>
          <View className="flex-row items-center gap-2">
            <StatusDot />
            <Text variant="body-sm" tone="muted">
              live status dot
            </Text>
          </View>
        </Group>

        <Group title="Icon tiles">
          <View className="flex-row flex-wrap gap-2">
            {["muted", "mint", "citrus", "info", "warning", "danger", "primary"].map((tone) => (
              <IconTile key={tone} icon={Bike} tone={tone} size={48} />
            ))}
          </View>
        </Group>

        <Group title="Chips and tabs">
          <ChipRow className="px-0">
            {["All", "Pizza", "Burgers", "Sushi"].map((label) => (
              <Chip
                key={label}
                label={label}
                active={chip === label}
                showCheck
                onPress={() => setChip(label)}
              />
            ))}
          </ChipRow>
          <TabSwitch
            options={[
              { value: "one", label: "Sign In" },
              { value: "two", label: "Create Account" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </Group>

        <Group title="Inputs">
          <SearchInput icon={Search} placeholder="Search dishes, restaurants…" />
          <Input label="With an icon" icon={Store} placeholder="Restaurant name" />
          <Input label="With an error" error="Something is wrong" placeholder="Try again" />
          <Input label="Multiline" placeholder="A longer note" multiline />
          <View className="flex-row items-center gap-3">
            <Stepper value={quantity} onChange={setQuantity} />
            <Stepper
              value={quantity}
              onChange={setQuantity}
              onRemove={() => setQuantity(1)}
              size="sm"
            />
          </View>
        </Group>

        <Group title="Surfaces">
          <Card className="p-0">
            <View className="px-4">
              <ListRow
                icon={Store}
                title="A list row"
                subtitle="With a subtitle"
                onPress={() => {}}
              />

              <Divider />
              <ListRow icon={Bike} title="Another row" value="Trailing" onPress={() => {}} />
            </View>
          </Card>
          <View className="flex-row gap-2">
            {["muted", "mint", "citrus", "info", "warning", "danger"].map((tone) => (
              <Inset key={tone} tone={tone} className="flex-1 items-center">
                <Text variant="overline" tone="muted">
                  {tone}
                </Text>
              </Inset>
            ))}
          </View>
        </Group>

        <Group title="Radii">
          <View className="flex-row gap-2">
            {RADII.map((r) => (
              <View key={r} className={`h-14 flex-1 border border-border-strong bg-card ${r}`} />
            ))}
          </View>
        </Group>

        <Group title="Realtime">
          <SocketState />
        </Group>

        <Group title="Toast">
          <View className="flex-row flex-wrap gap-2">
            {["success", "error", "info", "warning"].map((tone) => (
              <Button
                key={tone}
                size="sm"
                variant="secondary"
                onPress={() => toast[tone](`${tone} toast`, { description: "Order #1042" })}
              >
                {tone}
              </Button>
            ))}
          </View>
        </Group>

        <Group title="@chowgo/shared">
          <Card className="gap-1">
            <Text variant="body-sm">formatPrice(12.5) = {formatPrice(12.5)}</Text>
            <Text variant="body-sm">geo.formatDistance(1250) = {formatDistance(1250)}</Text>
            <Text variant="body-sm">delivery fee = {formatPrice(PRICING.deliveryFee)}</Text>
            <Text variant="body-sm">{CATEGORY_VALUES.length} categories</Text>
          </Card>
        </Group>

        <Group title="Environment">
          <Button variant="secondary" size="lg" fullWidth onPress={pingApi} loading={probing}>
            Ping API
          </Button>
          {probe ? (
            <Inset tone={probe.ok ? "mint" : "danger"}>
              <Text variant="body-sm" tone={probe.ok ? "primary" : "destructive"}>
                {probe.text}
              </Text>
            </Inset>
          ) : null}
          <Card className="gap-1">
            <Text variant="overline" tone="muted">
              API_URL
            </Text>
            <Text variant="body-sm">{API_URL}</Text>
            <Text variant="overline" tone="muted" className="mt-2">
              SOCKET_URL
            </Text>
            <Text variant="body-sm">{SOCKET_URL}</Text>
            <Text variant="overline" tone="muted" className="mt-2">
              stored token
            </Text>
            <TokenState />
          </Card>
        </Group>
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

function SocketState() {
  const { isConnected, isRegistered, connectionEpoch } = useSocket();
  const authUser = useAuthStore((state) => state.authUser);

  return (
    <Card className="gap-1">
      <Text variant="body-sm">
        session: {authUser ? `${authUser.email} (${authUser.role})` : "signed out"}
      </Text>
      <Text variant="body-sm" tone={isConnected ? "success" : "muted"}>
        socket: {isConnected ? "connected" : "not connected"}
        {isRegistered ? " · registered" : ""}
      </Text>
      <Text variant="caption" tone="muted">
        connections this session: {connectionEpoch}
      </Text>
    </Card>
  );
}
