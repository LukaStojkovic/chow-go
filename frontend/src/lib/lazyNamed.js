import { lazy } from "react";

const RELOAD_FLAG = "chowgo:chunk-reload";

const isChunkLoadError = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    String(error?.message ?? error),
  );

// After a deploy an open tab still asks for the previous build's chunk names,
// which 404. React caches the rejected lazy() promise, so the boundary's Retry
// could never recover. Reload once to pick up the new build; the flag stops a
// genuinely missing chunk from reloading forever.
export function importWithReload(loader) {
  return loader()
    .then((module) => {
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        // Storage unavailable: nothing to clear.
      }
      return module;
    })
    .catch((error) => {
      if (isChunkLoadError(error)) {
        try {
          if (sessionStorage.getItem(RELOAD_FLAG) !== "1") {
            sessionStorage.setItem(RELOAD_FLAG, "1");
            window.location.reload();
            return new Promise(() => {});
          }
        } catch {
          // Storage unavailable: fall through to the boundary.
        }
      }
      throw error;
    });
}

export const lazyNamed = (loader, key) =>
  lazy(() => importWithReload(loader).then((m) => ({ default: m[key] })));

export const lazyWithReload = (loader) => lazy(() => importWithReload(loader));
