import { Switch } from "react-native";
import { useTokens } from "@/theme/useTokens";

/**
 * The platform switch, themed once.
 *
 * Every call site set `thumbColor` to `card`, which is white in light mode and
 * near-black in dark - a black dot sliding along a green track. The thumb is
 * not a surface, it is a puck that has to read against a colour, so it takes
 * `scrim-foreground`: the one token that is white in both themes, and the same
 * one the map pins ring themselves with.
 *
 * `primary-foreground` is the trap here. It looks right and is wrong: dark
 * mode pairs a bright green primary with a near-black foreground, so it would
 * reproduce the same black dot.
 */
export function Toggle({ value, onValueChange, disabled = false, accessibilityLabel }) {
  const { color } = useTokens();

  return (
    <Switch
      value={Boolean(value)}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: color.primary, false: color["border-strong"] }}
      thumbColor={color["scrim-foreground"]}
      // iOS draws its own track behind the animation; without this the "off"
      // state falls back to the system green-grey rather than the palette.
      ios_backgroundColor={color["border-strong"]}
    />
  );
}
