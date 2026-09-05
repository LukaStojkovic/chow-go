import { lazy } from "react";

export const lazyNamed = (loader, key) =>
  lazy(() => loader().then((m) => ({ default: m[key] })));
