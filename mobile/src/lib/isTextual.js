/**
 * Whether a `children` value is text that has to be wrapped in a `<Text>`.
 *
 * A component that takes "either a string or your own elements" has a third
 * case it is easy to forget: JSX like `{price} earned` is neither, it is an
 * array of two strings. Testing `typeof children === "string"` misses it, the
 * strings land in a View, and React Native throws "Text strings must be
 * rendered within a <Text> component" - at runtime, on whichever screen
 * happened to interpolate.
 *
 * Numbers count too; `{count}` renders fine but is not a string.
 */
export function isTextual(children) {
  if (typeof children === "string" || typeof children === "number") return true;

  return (
    Array.isArray(children) &&
    children.length > 0 &&
    children.every(
      (child) =>
        child == null || child === false || typeof child === "string" || typeof child === "number",
    )
  );
}
