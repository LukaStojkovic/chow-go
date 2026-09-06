# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Independent npm projects (not workspaces — each has its own `package.json` and `node_modules`):

- `backend/` — Express 5 + Mongoose API, Socket.IO server, node-cron jobs. ESM (`"type": "module"`), so all imports need file extensions.
- `frontend/` — Vite + React 19 SPA (plain JS, no TypeScript).
- `shared/` — `@chowgo/shared`, platform-neutral business logic consumed by `frontend/` (and, in time, `mobile/`) via a `file:../shared` dependency. See below.
- `mobile/` — Expo SDK 57 / React Native 0.86 app, plain JS, Expo Router, NativeWind. Foundation only so far (theme, primitives, API client, providers); no product screens yet. Two earlier abandoned attempts are parked in `git stash` on `feature/mobile-migration` — inspect with `git stash show -p 'stash@{N}'` rather than popping.

The root `package.json` exists only for single-service deploys: `npm run build` installs both sides and builds the frontend, `npm start` runs the backend. In production (`NODE_ENV=production`) the backend serves `../frontend/dist` as static files with an SPA fallback.

## Commands

```bash
cd backend && npm run dev      # nodemon index.js
cd frontend && npm run dev     # vite --host
cd frontend && npm run lint    # eslint (the only automated check in the repo)
cd frontend && npm run build   # vite build -> frontend/dist
cd mobile && npm start         # expo start (needs a dev build, not Expo Go)
cd mobile && npm run sync-theme  # regenerate the theme from frontend/src/index.css
node backend/scripts/smokeRealtime.js   # end-to-end realtime check (server must be running)
node backend/scripts/checkPushFallback.js   # push-vs-socket delivery (needs --keep fixtures)
node backend/scripts/checkGoogleAuth.js     # web + native Google flow (no server needed)
node backend/scripts/checkMenuCrud.js       # seller menu CRUD + multipart promotions
node backend/scripts/checkSellerSettings.js # partial restaurant update + schedule merge
node backend/scripts/menuItemSeeds.js   # seed menu items for existing restaurants
node backend/scripts/backfillSchedule.js --dry-run   # report legacy-hours migration
node backend/scripts/backfillSchedule.js             # apply it (idempotent, already run)
```

There is **no test framework and no CI** anywhere in the repo. Do not invent a `npm test` invocation; verify changes by running the dev servers.

The one exception is `backend/scripts/smokeRealtime.js`, which drives a single order through the full lifecycle over HTTP while customer, seller and courier sockets listen, and asserts each event lands in the right room. Realtime is the only surface where a regression is completely silent — a renamed event or a broken room mapping just stops updating the UI. It needs the server already running, creates everything it needs under an `@smoke.test` email suffix, and removes it afterwards even on failure (`--keep` to inspect). Run it against a dev database, and after any change to `orderSocket.service.js`, the socket rooms, or the order lifecycle.

`shared/` has no build step and no lint. It does need its own `npm install` (it depends on `zod`): Vite resolves the linked package through its real path, so a missing `shared/node_modules` breaks the frontend build rather than the shared package alone.

**On Windows, `frontend/node_modules/@chowgo/shared` is a directory junction.** A recursive delete of that path follows the junction and wipes the real `shared/` directory — delete the junction itself (`cmd /c rmdir`) instead. Run `npm install` from PowerShell, not Git Bash; npm invoked from bash writes a POSIX path into the link that Windows cannot follow, producing a package that silently fails to resolve.

`frontend/src/lib/axios.js` hardcodes `http://localhost:8000/api` in dev mode, so `backend/.env`'s `PORT` must be `8000` locally. The socket URL comes from `VITE_API_URL` instead. `GET /api/socket/stats` returns live connection counts per role — useful for debugging realtime issues.

## Domain model

Three roles live on one `User` document (`role: customer | seller | courier`), each with a 1:1 satellite profile:

- **seller → Restaurant** via `Restaurant.ownerId` (unique), exposed as the `restaurant` populate virtual. It populates as an **array**, which is why the frontend reads `authUser.restaurant[0]._id`. `authController` does `user.restaurant = restaurant._id` — that assignment is a no-op (virtuals have no setter); the real link is `ownerId`.
- **courier → Courier** via `Courier.userId` (unique). `protectedRoute` attaches it as `req.user.courier`.
- **customer** owns `Addresses` (max 5, enforced in a pre-save hook), `Cart`, and `favouriteRestaurants`.

All GeoJSON is `[lng, lat]`. 2dsphere indexes exist on `Restaurant.location`, `Addresses.location`, `Courier.currentLocation`, and `Order.deliveryAddressSnapshot.location`.

## Order lifecycle — the core of the app

`pending → confirmed → preparing → ready → assigned → picked_up → in_transit → delivered`, plus terminal `cancelled` / `rejected`. Ownership of each leg is split across three services, and each actor's routes are scoped to their own id:

| Actor | Service | Transitions |
|---|---|---|
| customer | `controllers/orderController.js` | create (`pending`), cancel while pending/confirmed/ready |
| seller | `services/restaurantOrder.service.js` | confirm/reject from `pending`; `preparing`/`ready` gated by `isValidTransition`; cancel while confirmed/preparing/ready |
| courier | `services/courierOrder.service.js` | claim a `ready` order → `assigned`, release back to pool, `picked_up`, `in_transit`, `delivered` |

`utils/orderStatus.js` is the single source of truth for restaurant-side transitions, `ACTIVE_STATUSES`, and `parseStatusFilter` (accepts `"active"` or a comma-separated list from query params). Courier claiming is the one race-safe write in the codebase: a single `findOneAndUpdate` filtered on `{status: "ready", courier: null}`.

Order creation snapshots data deliberately — item name/price are copied into `order.items`, and the address is copied into `deliveryAddressSnapshot` — then the cart document is deleted. Pricing is hardcoded in `createOrder` (delivery 2.50, service 1.50, priority +1.99, tax 0).

## Realtime (Socket.IO)

`socket/socketServer.js` is a singleton class. It authenticates from the same `jwt` cookie in the handshake headers, then requires the client to emit `register` with `{role, restaurantId?}`; the handler re-checks that the claimed role matches the JWT and that the seller actually owns the restaurant, disconnecting on mismatch. Rooms are `customer:<userId>`, `restaurant:<restaurantId>`, `courier:<courierId>`, mirrored in in-memory `connections` Maps.

**All emits go through `services/orderSocket.service.js`** — never touch `io` from a controller. Each function re-fetches and populates the order, and swallows its own errors so a socket failure never fails the HTTP request. `emitToX` returns `false` when the target isn't connected; events are dropped, not queued.

Courier GPS: the client emits `courier:location_update`, throttled to one DB write per 3s per courier in `locationTracking.service.js`, which then re-broadcasts `courier:location` to the customer, restaurant, and courier on that order.

Persisted notifications (`models/OrderNotification.js`, registered as model `"Notification"`, templated in `orderNotification.service.js`) are written on every transition but **no endpoint reads them back** — the in-app UI is driven entirely by sockets and toasts.

Those same templates are the source of push copy via `pushPayloadFor`, so the two can't drift. `services/orderSocket.service.js#deliverToCustomer` emits, and sends an Expo push only when `emitToCustomer` returns false — an empty room. iOS suspends the socket ~30s after backgrounding, which makes that a good proxy for "the app isn't in front of them"; Android can hold a socket open while hidden, so a notification is occasionally skipped there. Making it exact needs the client to leave its rooms on background. `courier:location` deliberately never pushes — that would be thousands of notifications per delivery. Device tokens live on `User.pushTokens` with `select: false`, because `toJSON` runs with virtuals on and they would otherwise ride along in every `checkAuth` response.

## Opening hours and `isOpenNow`

`Restaurant.schedule` holds a per-day `{isOpen, openingTime, closingTime}` entry (24-hour `HH:MM`, regex-validated in the schema). Two conventions matter: `openingTime === closingTime` means open around the clock, and a `closingTime` earlier than `openingTime` is an overnight window that runs into the next morning.

`utils/schedule.js` is the single source of truth — `DAYS_OF_WEEK` (indexed to match `Date#getDay()`, and the model's `schedule` fields are generated from it), `isOpenAt` (checks today's window *and* yesterday's overnight spill), `normalizeScheduleInput` (validates partial payloads, coerces the `"true"`/`"false"` strings that arrive over multipart), and `buildScheduleFromRange` (signup collects one range and expands it across all 7 days).

`isOpenNow` is precomputed, not derived: `services/cron.service.js` runs every minute and bulk-writes it via `isOpenAt` using **server-local time**. Discovery and nearby queries filter on that boolean, so state can lag up to a minute — `restaurant.service.updateRestaurantInfo` therefore recomputes it inline whenever the schedule changes. The job starts inside the Mongoose connect callback, so every backend instance runs its own copy.

The seller edits hours per day in `SellerSettings.jsx`, which autosaves nested multipart fields (`schedule[monday][isOpen]`); multer's `append-field` rebuilds them into an object, and the service merges day-by-day so a partial payload never wipes untouched days. `frontend/src/utils/scheduleUtils.js` holds the display-side ordering and formatting shared by the settings form and `RestaurantInfoModal`.

## Menu item promotions

A seller marks a single dish down via `MenuItem.promotion` — `{isActive, type: percentage|fixed, value, label, startsAt, endsAt}`. Both dates are optional; a missing bound means "no bound", so an open-ended deal runs until the seller switches it off.

`utils/promotion.js` is the single source of truth: `isPromotionLive`, `effectivePrice`, `discountPercent`, `normalizePromotionInput` (coerces the multipart strings and rejects a deal that would price a dish under 0.50 or exceed 90% off) and `withPromotion`, which decorates a **lean** document with `promotionalPrice`/`discountPercent` — virtuals do not survive `.lean()` and every discovery read is lean.

The resolved price is computed server-side everywhere it matters: the discover feed, popular, search and restaurant-menu responses all pass through `withPromotion`, and `cartController.addToCart` snapshots `effectivePrice` into `Cart.items.price` with the original in `basePrice`. A promotion ending later does not reprice a line already in a basket. `frontend/src/lib/promotion.js` mirrors the rules but is used **only** by the seller’s own menu screens (which read raw documents) and the form’s live preview — customer-facing prices always come from the server.

`GET /api/discover/promotions?lat&lon` returns `{ deals, newRestaurants }` and backs the two discovery rails. There is no "free delivery" promotion: delivery fees are a flat platform charge with no per-restaurant field, so the card would advertise something checkout could not honour.

## Backend conventions

Layering is `routes → controllers → services → models`, but only partly migrated. Newer code (courier, restaurantOrder, restaurant, menuItem, stats, analytics) keeps controllers thin and puts logic in `services/*.service.js` that `throw new AppError(msg, status)`. Older code (`orderController`, `cartController`, `favouriteController`, `discoverController`, `authController`) does DB work inline. **Follow the service pattern for new work.**

Express 5 forwards async rejections to error middleware automatically, so many handlers deliberately omit `try/catch`; older ones wrap and call `next(error)`. Both are fine — match the file you're editing.

`controllers/errorController.js` returns the full stack in development and only `err.message` for `isOperational` errors in production. Note that in production the SPA fallback `app.use` is registered before the error handler, so unmatched `/api/*` paths return `index.html` rather than a 404 JSON.

Auth is a JWT minted by `utils/generateToken.js`, carried two ways. The web gets an httpOnly cookie named `jwt` (`sameSite: strict`, `secure` unless `NODE_ENV=development`). Native clients have no usable cookie jar, so they read the token from the response body and send `Authorization: Bearer`; `middlewares/authMiddleware.js#extractToken` prefers the header and falls back to the cookie. The socket handshake mirrors this in `socket/socketServer.js#tokenFromHandshake` (`handshake.auth.token` → `Authorization` → cookie).

The token is only added to a response body when `utils/clientType.js#isMobileClient` is true — i.e. the request carried `X-Client: mobile` or `?client=mobile`. Returning it unconditionally would hand a 7–30 day bearer credential to any XSS on the web SPA, which the httpOnly cookie currently prevents. Controllers opt in by wrapping their response in `withAuthToken(req, body, token)`.

Tokens carry `typ: "access"`. `protectedRoute` and the socket middleware reject any other `typ`, but only when the claim is present, so pre-existing cookies keep working. This guard matters because other short-lived tokens are signed with the same `JWT_SECRET`.

`protectedRoute` loads the user and hydrates the role satellite; `middlewares/roleMiddleware.js` gates by role. Note it returns **401** for an expired or malformed token — that used to be a 500, which a native client cannot distinguish from an outage.

Browser origins live in `config/cors.js` (`CORS_ORIGINS`, comma-separated) and are shared by Express and the socket server; keep them one list or Expo Web sockets fail while native ones work.

Google OAuth is two-phase and easy to misread: the passport callback does **not** create a user for a new email. It stashes the profile in `req.session.googleProfile` and redirects to `${FRONTEND_URL}/auth/google/callback?newUser=true`; the frontend then POSTs `/api/auth/google/complete-profile` with the chosen role and role-specific fields to actually create the account.

Native cannot use that session: the OAuth leg runs in the system browser, a separate cookie jar the app's fetch never sees. `GET /api/auth/google?client=mobile` signs the client into the OAuth `state`, and `googleCallback` reads it back to redirect to `chowgo://auth/google?code=…` instead — the **same URL shape for new and returning users**, so the deep link is one opaque parameter. That code is a 90-second `google_handoff` token, deliberately not the session: on Android any app can claim a custom scheme. `POST /api/auth/google/exchange` trades it for either a real token or a 15-minute `google_signup` token that replaces the session in `complete-profile`. All of these are signed with `JWT_SECRET`, which is why the `typ` guard in `protectedRoute` matters. An unsigned or tampered `state` falls back to the web redirect.

**The app never talks to Google directly** — it opens the *backend's* route in a browser — so there are no iOS/Android OAuth client ids and `chowgo://` never appears in Google's console. The one sharp edge is development: Google rejects private-network redirect URIs, so a LAN IP cannot complete sign-in and a stable HTTPS tunnel must be registered as a second authorized redirect URI.

Every upload goes straight to Cloudinary via `middlewares/upload.js#createUpload(folder)`; the resulting `req.file.path` **is** the Cloudinary URL and is stored directly on the document. `services/image.service.js` handles deletes and add/remove diffing by parsing the public id back out of the URL.

## `shared/` conventions

`@chowgo/shared` holds logic that must be identical on every client. Several modules mirror backend rules — `adapters/pricing.js` carries the delivery/service/priority fees, `promotion.js` the discount floor and ceiling — so duplicating them per client means a pricing change lands in three places and the failure mode is a wrong total on a customer's screen.

- **No React, no DOM, no `import.meta`, no icon library, no HTTP client.** Everything here must run unchanged under Vite and under Metro/Hermes. `zod` is the only dependency.
- **Subpath exports only, no barrel** (`@chowgo/shared/format`, `@chowgo/shared/adapters/pricing`). `format.js` and `geo.js` both export a `formatDistance` with deliberately different rounding — discovery buckets to 50 m, map/route distance does not — and a barrel would silently resolve one of them everywhere. Adding a module means adding an `exports` entry.
- **Relative imports inside the package carry explicit `.js` extensions.**
- `constants.js` holds taxonomy **data**; category icons are string keys (`icon: "pizza"`). `frontend/src/lib/constants.js` is a thin shim that maps those keys to `lucide-react` components and re-exports the rest, which is why component imports of `@/lib/constants` were left alone.
- Do **not** move the services, React Query hooks, stores, or `useGlobalSocketEvents` here. The hooks are portable in principle but only behind injected http/toast ports; that extraction is deliberately deferred until a second client actually exists.

## Frontend conventions

- `@/*` → `src/*` (`jsconfig.json`). Tailwind v4 via `@tailwindcss/vite` — there is **no `tailwind.config`**; the theme lives in `src/index.css`. shadcn/ui (new-york, JSX) lands in `src/components/ui`.
- Data flow: `services/api*.js` (thin axios wrappers that log and rethrow) → `hooks/<Domain>/use*.js` (React Query) → components. Keep new fetches in that chain.
- Pure business logic lives in `@chowgo/shared`, not `src/`. Formatters, promotion rules, the API→view-model adapters, schedule and geo helpers and the zod schemas were moved there; `src/lib` now holds only web-specific pieces (`axios.js`, `motion.js`, `utils.js`, `lazyNamed.js`, and the `constants.js` icon shim).
- Zustand covers cross-cutting state: `useAuthStore` (session + the global auth modal), `useCartStore` (mirror of the server cart), `useDeliveryStore` (persisted address/coords), `useDiscoverStore` (feed pagination and search — this one bypasses React Query and calls axios directly).
- `QueryClient` is configured with `staleTime: 0`, so freshness depends on socket-driven invalidation. `hooks/Sockets/useGlobalSocketEvents.js` is the **single place** that registers the socket role and invalidates caches — keys in use are `["order", id]`, `["customerOrders"]`, `["restaurantOrders"]`, `["courierAvailableOrders"]`, `["courierOrders"]`, `["courierOrder"]`. New realtime state must be wired there or the UI won't update.
- `contexts/SocketContext.jsx` creates the socket only once `authUser` exists, websocket transport only.
- Guards in `App.jsx`: `PublicRoute` and `CustomerRoute` render an `<Outlet />`; `SellerRoute` and `CourierRoute` wrap `children`. Unauthenticated users get the auth modal opened plus a `<Navigate to="/">` — there is no `/login` route.

## Mobile conventions

Expo Router with `@/*` → `src/*`; `app/` holds routes only, everything else lives in `src/`.

- **A development build is required from day one** — `react-native-maps`, background location, custom permission strings and remote push all fail in Expo Go, and `expo-notifications` remote push does not work in Expo Go on Android at all. Do not plan an Expo Go phase.
- **The theme is generated, not written.** `npm run sync-theme` derives `global.css` and `src/theme/tokens.js` from `frontend/src/index.css`, converting hex to space-separated RGB channels so Tailwind's `<alpha-value>` resolves and `bg-primary/10` compiles. It fails the build if a web token has no `tailwind.config.js` mapping. Never hand-edit those two files.
- Token *names* match the web exactly, so utility classes are copy-pasteable. NativeWind v4 needs **Tailwind 3**, not the web's Tailwind 4 — that divergence is deliberate and documented at the top of `tailwind.config.js`.
- Inter has no static 550/650 face, so the web's `label` and `h2`/`h3`/`price` weights collapse onto 600. Use the `<Text variant>` primitive rather than raw type classes.
- Anything needing a colour *value* rather than a className (maps, bottom sheets, StatusBar, charts) reads `src/theme/tokens.js` via `useTokens()`. Nothing else may hardcode a hex.
- `src/api/client.js` sends `X-Client: mobile`, without which the backend omits the token from login/register bodies and every later request is silently unauthenticated.
- `src/lib/config.js` derives the dev host from Expo's packager (`10.0.2.2` on the Android emulator), so `EXPO_PUBLIC_API_URL` only needs setting for a tunnel, staging or production.
- `.npmrc` sets `legacy-peer-deps=true`; the RN dependency graph has genuinely conflicting peer ranges and installs fail without it.
- `metro.config.js` enables `unstable_enablePackageExports` and watches `../shared` — both are required to consume `@chowgo/shared`.

## Known drift — check before touching these

1. **`serviceFee` is not on the Order schema.** `createOrder` adds 1.50 into `total` and passes `serviceFee` to the constructor, where Mongoose drops it — stored line items don't reconcile with `total`.
2. Rate limits in `middlewares/rateLimit.js` all key off `req.ip`. Mobile carriers put thousands of subscribers behind one address, so `accountLimiter` (20 per 15 min, counting successes) and `loginLimiter` (10 failed logins) will collide for real cellular traffic — rekey on email before shipping a mobile client. `TRUST_PROXY` must also be set in production or every user lands in one bucket.
3. Signup (both the local and Google seller paths) still collects a single opening/closing range rather than a full week; the backend expands it across all 7 days. Per-day control lives only in seller settings.

## Single-instance assumptions (relevant to scaling)

The backend currently cannot run more than one process correctly. Anything touching these areas should account for it:

- Socket.IO has **no Redis adapter**, and `connections` is a plain in-memory Map, so a customer connected to instance B never receives an event emitted from instance A. `locationTracking.service.js`'s throttle Map has the same problem.
- `express-session` uses the default `MemoryStore`, which breaks the two-phase Google signup across instances and loses sessions on restart.
- The cron job runs per instance, so N instances race on the same `bulkWrite`.
- `emitNewOrderAvailable` / `emitOrderTaken` / `emitOrderBackToPool` loop over *every* connected courier per event.
- `orderNumber` is generated in a `pre("validate")` hook from `countDocuments()` — a full count on every order plus a duplicate-key race under concurrency.
- No multi-document transactions: courier claim is atomic but the following `courier.save()` isn't, and rating averages in `orderRating.service.js` are read-modify-write on `Restaurant`/`Courier`.
- `stats.service.fetchOrdersData` loads four unbounded `Order.find()` result sets into memory instead of aggregating.
