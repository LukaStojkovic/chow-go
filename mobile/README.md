# Chow & Go — mobile

Expo SDK 57 / React Native 0.86, plain JavaScript, Expo Router, NativeWind.
Talks to the same `backend/` as the web app.

## Status

Foundation only. Theme, UI primitives, API client and providers are in place and
both platforms bundle; there are no product screens yet. `/dev` is a kitchen sink
that renders every primitive, both themes, the alpha ramp and a live API probe.

## Running it

**A development build is required.** Expo Go cannot load `react-native-maps`,
background location, custom permission strings or remote push — on Android,
`expo-notifications` remote push does not work in Expo Go at all.

```bash
npm install
npx eas-cli login          # an Expo account is required
npx eas-cli init           # links this app and writes extra.eas.projectId
npx eas-cli build --profile development --platform android
npm start                  # then open the build in the dev client
```

`npx eas` does not work — the package is `eas-cli` and npx cannot resolve the
binary from that name. Either use `npx eas-cli` as above or install it globally
with `npm install -g eas-cli`.

`eas init` is not optional: it writes `extra.eas.projectId` into app.json, and
`getExpoPushTokenAsync` refuses to issue a token without it, so push stays off
until that step has run.

Rebuild only when native code changes — a new package with native modules, or an
edit to app.json. JavaScript-only changes reach the existing dev client through
`npm start`.

Point it at a backend by leaving `EXPO_PUBLIC_API_URL` unset — `src/lib/config.js`
derives the host from Expo's packager, and falls back to `10.0.2.2` on the Android
emulator. Set it explicitly for a tunnel, staging or production (see `.env.example`).
Google sign-in on a physical device needs an HTTPS tunnel, because Google rejects
private-network redirect URIs.

## Theme

`global.css` and `src/theme/tokens.js` are **generated** from `frontend/src/index.css`:

```bash
npm run sync-theme
```

Run it after any change to the web palette. It converts hex to space-separated RGB
channels (so `bg-primary/10` compiles) and fails if a web token has no mapping in
`tailwind.config.js`. Do not hand-edit either generated file.

Use `<Text variant="h1">` rather than raw type classes — Inter ships no static 550
or 650 face, so those weights collapse onto 600 in one place. For APIs that take a
colour value rather than a className (maps, bottom sheets, StatusBar, charts), read
`useTokens()`; nothing else should hardcode a hex.

## Shared logic

Pricing, promotions, formatters and the API→view-model adapters come from
`@chowgo/shared` (the `shared/` package at the repo root), which the web uses too.
Do not re-implement them here. Metro needs `unstable_enablePackageExports` and the
`../shared` watch folder — both already set in `metro.config.js`.
