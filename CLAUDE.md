# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Independent npm projects (not workspaces — each has its own `package.json` and `node_modules`):

- `backend/` — Express 5 + Mongoose API, Socket.IO server, node-cron jobs. ESM (`"type": "module"`), so all imports need file extensions.
- `frontend/` — Vite + React 19 SPA (plain JS, no TypeScript).
- `shared/` — `@chowgo/shared`, platform-neutral business logic consumed by `frontend/` (and, in time, `mobile/`) via a `file:../shared` dependency. See below.
- `mobile/` — Expo SDK 57 / React Native 0.86 app, plain JS, Expo Router, NativeWind. All three roles are built and at feature parity with the web. Two earlier abandoned attempts are parked in `git stash` on `feature/mobile-migration` — inspect with `git stash show -p 'stash@{N}'` rather than popping.

The root `package.json` exists only for single-service deploys: `npm run build` installs both sides and builds the frontend, `npm start` runs the backend. In production (`NODE_ENV=production`) the backend serves `../frontend/dist` as static files with an SPA fallback.

## Commands

```bash
cd backend && npm run dev      # nodemon index.js
cd frontend && npm run dev     # vite --host
cd frontend && npm run lint    # eslint
cd frontend && npm run build   # vite build -> frontend/dist
cd shared && npm run check     # locale drift, shared imports, translation keys
cd mobile && npm start         # expo start (needs a dev build, not Expo Go)
cd mobile && npm run sync-theme  # regenerate the theme from mobile/src/theme/palette.js
node backend/scripts/smokeRealtime.js   # end-to-end realtime check (server must be running)
node backend/scripts/checkPushFallback.js   # push-vs-socket delivery (needs --keep fixtures)
node backend/scripts/checkGoogleAuth.js     # web + native Google flow (in-memory, part of check:all)
node backend/scripts/checkMenuCrud.js       # seller menu CRUD + multipart promotions
node backend/scripts/checkSellerSettings.js # partial restaurant update + schedule merge
node backend/scripts/checkSellerStats.js    # dashboard + analytics payload shapes
node backend/scripts/checkCourierFlow.js    # pool, atomic claim, delivery lifecycle
node backend/scripts/menuItemSeeds.js   # seed menu items for existing restaurants
node backend/scripts/backfillSchedule.js --dry-run   # report legacy-hours migration
node backend/scripts/backfillSchedule.js             # apply it (idempotent, already run)
node backend/scripts/backfillRestaurantCurrency.js --dry-run   # store Restaurant.currency on older restaurants (lean reads miss the default)
node backend/scripts/backfillCourierEarnings.js --dry-run   # recompute Courier.totalEarnings from delivered orders; idempotent
node backend/scripts/migrateIdempotencyIndex.js --dry-run   # report, then run without the flag once per database
node backend/scripts/migrateOrderGeoIndex.js --dry-run        # same; drops the single-field order geo index
node backend/scripts/grantAdmin.js --email you@example.com   # admin console access; --revoke, --list
node backend/scripts/reviewGoogleLinks.js   # report accounts auto-linked before the Google fix; --apply <id> to secure
```

There is **no test framework** and no `npm test`. `.github/workflows/ci.yml` runs the shared
guards, `check:all`, the web build, the web lint (non-blocking until its existing errors are
fixed) and a high-severity `npm audit` on every push to main and every PR. The root
`Dockerfile` builds the web app and runs the backend serving it. There is
a suite of self-contained check scripts — `cd backend && npm run check:all` runs
every one listed in its `check:all` script against a throwaway in-memory MongoDB, needing
no running server and never touching a real database. Run it after any change to the
order lifecycle, auth, or pricing. Individually: `check:observability`, `check:reset`,
`check:google-linking`, `check:google`, `check:google-link`, `check:deletion`, `check:account-data`, `check:admin`, `check:courier-access`,
`check:cancel`, `check:transitions`, `check:rating`, `check:money`, `check:earnings`, `check:checkout`, `check:cart-quantity`, `check:pagination`, `check:search`, `check:schema`,
`check:images`, `check:upload-cleanup`, `check:geocoding`, `check:sessions`, `check:auth-abuse`, `check:push`, `check:push-tokens`, `check:schedule`.
Scripts that spawn `index.js` pass `MAIL_DISABLED=true`, which makes `utils/mail.js` a no-op;
without it they send real mail through the Gmail account in `.env`.

The one exception is `backend/scripts/smokeRealtime.js`, which drives a single order through the full lifecycle over HTTP while customer, seller and courier sockets listen, and asserts each event lands in the right room. Realtime is the only surface where a regression is completely silent — a renamed event or a broken room mapping just stops updating the UI. It needs the server already running, creates everything it needs under an `@smoke.test` email suffix, and removes it afterwards even on failure (`--keep` to inspect). Run it against a dev database, and after any change to `orderSocket.service.js`, the socket rooms, or the order lifecycle.

`shared/` has no build step and no lint. It does need its own `npm install` (it depends on `zod` and `i18next`): Vite resolves the linked package through its real path, so a missing `shared/node_modules` breaks the frontend build rather than the shared package alone.

`cd shared && npm run check` runs three static guards over **every** package, and each exists because the failure it catches is silent at runtime:

- `check:locales` — en/sr drift, mismatched `{{placeholders}}`, and duplicate keys in one object literal (the later one wins and the earlier translation is simply gone). Plural families are compared by base key, since Serbian needs three forms where English needs two.
- `check:imports` — every `@chowgo/shared/*` import across `frontend/`, `mobile/` and `backend/` resolves to a real export and a real subpath. Renaming a shared export otherwise fails at module-evaluation time, in the browser, on one route.
- `check:keys` — every literal `t("ns:key")` exists in the catalog, every file calling `t()` has it in scope, and dynamic `` t(`ns:${value}`) `` patterns without a `defaultValue` are listed as warnings. A missing key renders as the raw key and logs nothing in production.

**On Windows, `frontend/node_modules/@chowgo/shared` is a directory junction.** A recursive delete of that path follows the junction and wipes the real `shared/` directory — delete the junction itself (`cmd /c rmdir`) instead. Run `npm install` from PowerShell, not Git Bash; npm invoked from bash writes a POSIX path into the link that Windows cannot follow, producing a package that silently fails to resolve.

`frontend/src/lib/axios.js` hardcodes `http://localhost:8000/api` in dev mode, so `backend/.env`'s `PORT` must be `8000` locally. The socket URL comes from `VITE_API_URL` instead. `GET /api/socket/stats` returns live connection counts per role — useful for debugging realtime issues. Outside production any signed-in user can read it; in production it needs an `X-Stats-Token` header matching `SOCKET_STATS_TOKEN`, and is a 404 when that variable is unset.

## Domain model

Three roles live on one `User` document (`role: customer | seller | courier`), each with a 1:1 satellite profile:

- **seller → Restaurant** via `Restaurant.ownerId` (unique), exposed as the `restaurant` populate virtual. It populates as an **array**, which is why the frontend reads `authUser.restaurant[0]._id`. `authController` does `user.restaurant = restaurant._id` — that assignment is a no-op (virtuals have no setter); the real link is `ownerId`.
- **courier → Courier** via `Courier.userId` (unique). `protectedRoute` attaches it as `req.user.courier`.
- **customer** owns `Addresses` (max 5, enforced in a pre-save hook), `Cart`, and `favouriteRestaurants`.

All GeoJSON is `[lng, lat]`. 2dsphere indexes exist on `Restaurant.location`, `Addresses.location`, `Courier.currentLocation`, and `Order.deliveryAddressSnapshot.location` (compound behind `status, courier` for the courier pool, whose `$geoNear` names its `key` so an old single-field index can coexist until `migrateOrderGeoIndex.js` drops it).

## Order lifecycle — the core of the app

`pending → confirmed → preparing → ready → assigned → picked_up → in_transit → delivered`, plus terminal `cancelled` / `rejected`. Ownership of each leg is split across three services, and each actor's routes are scoped to their own id:

| Actor | Service | Transitions |
|---|---|---|
| customer | `controllers/orderController.js` | create (`pending`), cancel per `canCustomerCancel` — pending/confirmed/ready/assigned. `/api/orders` and `/api/cart` are customer-only (`isCustomerMiddleware`) |
| seller | `services/restaurantOrder.service.js` | confirm/reject from `pending`; `preparing`/`ready` gated by `isValidTransition`; cancel while confirmed/preparing/ready |
| courier | `services/courierOrder.service.js` | claim a `ready` order → `assigned`, release back to pool, `picked_up`, `in_transit`, `delivered` |

`utils/orderStatus.js` is the single source of truth for transitions on both sides:
`canCustomerCancel` (mirrored exactly by `shared/src/adapters/order.js`),
`RESTAURANT_CANCELLABLE`, `statusesThatReach` (the inverse of `VALID_TRANSITIONS`),
`ACTIVE_STATUSES`, and `parseStatusFilter`.

**Every status change is a conditional `findOneAndUpdate`** whose filter names the
statuses the write is legal from, so the guard and the write are one operation. Both
services have a private `transition()` helper for this; a caller that loses the race
gets a `409 ORDER_STATUS_CONFLICT` rather than silently overwriting. Never reintroduce
read-check-mutate-save here. Customer cancel follows the same rule (filter on
`CUSTOMER_CANCELLABLE`) and frees whichever courier the *updated* order names. A courier
claim takes the courier first (`Courier.findOneAndUpdate` on `isAvailable: true, currentOrder:
null`) and only then the order, releasing the courier if the order claim fails. That order is
what stops one courier holding two orders, and it guarantees a cancel landing after the claim
always finds the courier to free.

Order creation snapshots data deliberately — item name/price are copied into
`order.items`, and the address is copied into `deliveryAddressSnapshot` — then the cart
document is deleted. Those four writes run inside one `session.withTransaction`, so they
need a replica set (as the delivery-address endpoints already did).

`createOrder` honours an `Idempotency-Key` header (8–128 of `[A-Za-z0-9_-]`), stored on
`Order.idempotencyKey` (`select: false`, unique **per customer** via a partial compound
index): a repeat returns the original order with `idempotentReplay: true` instead of placing
a second one. Both clients generate one key per checkout attempt and clear it on success.
Without a key, the transaction's `Cart.deleteOne` must remove exactly one cart or it aborts
with `409 CART_ALREADY_ORDERED`, so a double submit still places one order. The callback
sets `order.isNew = true` because `withTransaction` retries it on a write conflict. An existing
database needs `node scripts/migrateIdempotencyIndex.js` once to drop the old global index.

Currency belongs to the **restaurant**, never the viewer: `Restaurant.currency` (from its
country at creation, Serbia → RSD, see `@chowgo/shared/currency`) is what the menu is priced in
and what the courier collects, and each order copies it. `createOrder` charges the fees from
`pricingFor(restaurant.currency)` in `@chowgo/shared/adapters/pricing` — a table per currency
(RSD: delivery 250, service 150, priority 200, max tip 5000; EUR/USD: 2.50 / 1.50 / 1.99 / 50),
the same one the checkout preview reads. `PRICING` is the default currency's table, for code with
no restaurant in hand. `formatPrice(amount, { currency })` takes the restaurant's or order's code
(RSD renders without decimals); views from the adapters carry `currency`, and seller web screens
read theirs through `hooks/useCurrency.js`. Menu cards and a few other screens still omit it and
get the default, which is right while every restaurant is Serbian.

Money is stored and sent as decimal amounts in `Order.currency` that are always whole cents. All arithmetic goes through `@chowgo/shared/money` (`toCents`, `sumMoney`,
`lineTotal`, `toMoney`), which works in integer cents — float sums and the old `+ Number.EPSILON`
rounding (1.005 → 1.00) disagreed between server and preview. `backend/utils/money.js` re-exports it
plus `moneySetter`, which every money field on Order, Cart and MenuItem uses so a stored value is
always whole cents. A payment provider's minor units are `toCents(total)`; orders written before
`currency` existed read it from the schema default (not on `.lean()` reads). Checkout also refuses an address farther
than `DELIVERY_RADIUS_KM` (default 20, matching discovery's radius) from the restaurant, and
a subtotal under `MIN_ORDER_SUBTOTAL` (default 0 = off; if you turn it on, also set
`PRICING.minimumOrder` so the clients show it). `serviceFee` and
`priorityFee` are each stored on their own field, so the stored order itemises exactly
like the checkout preview.

Reporting splits an order three ways (`utils/earnings.js`): the restaurant earns `subtotal`, the courier `deliveryFee + priorityFee + tip`, the platform `serviceFee` — and only once `delivered`. Seller dashboards and analytics sum delivered subtotals (in-flight orders still count as orders, not revenue); courier analytics and `Courier.totalEarnings`, `$inc`ed on delivery, use the courier share. Day and hour buckets go through `utils/zonedTime.js` in the restaurant's `timezone` (couriers use `DEFAULT_TIMEZONE`), never the host clock. The payment-method split alone still sums `total`, because that is what is collected at the door.

## Realtime (Socket.IO)

`socket/socketServer.js` is a singleton class. It authenticates from the same `jwt` cookie in the handshake headers, then requires the client to emit `register` with `{role, restaurantId?}`; the handler re-checks that the claimed role matches the JWT and that the seller actually owns the restaurant, disconnecting on mismatch. Rooms are `customer:<userId>`, `restaurant:<restaurantId>`, `courier:<courierId>`, mirrored in in-memory `connections` Maps.

**All emits go through `services/orderSocket.service.js`** — never touch `io` from a controller. Each function re-fetches and populates the order, and swallows its own errors so a socket failure never fails the HTTP request. `emitToX` returns `false` when the target isn't connected; events are dropped, not queued.

Courier GPS: the client emits `courier:location_update`, throttled to one DB write per 3s per courier in `locationTracking.service.js`, which then re-broadcasts `courier:location` to the customer, restaurant, and courier on that order. With the phone locked the socket is gone, so mobile also runs a background task (`mobile/src/location/backgroundTracking.js`, `expo-task-manager`, Android foreground service) that `POST`s to `/api/courier/location` with the same throttle and broadcast. It starts when a delivery is active, survives leaving the delivery screen, and stops on delivered/unassigned/cancelled, on logout, or when the endpoint answers `tracking: false`. It needs a fresh development build and "Allow all the time" location permission.

Persisted notifications (`models/OrderNotification.js`, registered as model `"Notification"`, templated in `orderNotification.service.js`) are written on every transition but **no endpoint reads them back** — the in-app UI is driven entirely by sockets and toasts. A TTL index deletes them after 90 days.

Those same templates are the source of push copy via `pushPayloadFor`, so the two can't drift. `services/orderSocket.service.js#deliverToCustomer` emits, and sends an Expo push only when `emitToCustomer` returns false — an empty room. iOS suspends the socket ~30s after backgrounding, which makes that a good proxy for "the app isn't in front of them"; Android can hold a socket open while hidden, so a notification is occasionally skipped there. Making it exact needs the client to leave its rooms on background. `courier:location` deliberately never pushes — that would be thousands of notifications per delivery. Device tokens live on `User.pushTokens` with `select: false`, because `toJSON` runs with virtuals on and they would otherwise ride along in every `checkAuth` response. Each entry's `deviceId` is a per-install `inst_<uuid>` kept in SecureStore (`mobile/src/lib/installationId.js`); `registerDevice` only moves a token off another account when the request presents that same id, so a leaked token can't redirect someone's notifications. Older entries carry the OS build number, which proves nothing and still moves freely.

## Opening hours and `isOpenNow`

`Restaurant.schedule` holds a per-day `{isOpen, openingTime, closingTime}` entry (24-hour `HH:MM`, regex-validated in the schema). Two conventions matter: `openingTime === closingTime` means open around the clock, and a `closingTime` earlier than `openingTime` is an overnight window that runs into the next morning.

`utils/schedule.js` is the single source of truth — `DAYS_OF_WEEK` (indexed to match `Date#getDay()`, and the model's `schedule` fields are generated from it), `isOpenAt` (checks today's window *and* yesterday's overnight spill), `normalizeScheduleInput` (validates partial payloads, coerces the `"true"`/`"false"` strings that arrive over multipart), and `buildScheduleFromRange` (signup collects one range and expands it across all 7 days).

The same per-minute cron runs `services/orderRecovery.service.js#recoverStuckOrders`: pending orders unanswered for `PENDING_TIMEOUT_MINUTES` (15) are rejected, assignments not picked up within `ASSIGNED_TIMEOUT_MINUTES` (20) go back to the pool with the courier freed, and deliveries in progress longer than `STUCK_DELIVERY_MINUTES` (120) are logged as a warning. Support can end any unfinished order with `POST /api/ops/orders/:id/cancel` and an `X-Ops-Token` matching `OPS_TOKEN` (at least 32 characters; the route is a 404 without it).

`isOpenNow` is precomputed, not derived: `services/cron.service.js` runs every minute and
bulk-writes it via `isOpenAt` using **each restaurant's own `timezone`** (IANA, validated
on the model, defaulting to `DEFAULT_TIMEZONE`). `isOpenAt` resolves the local weekday and
time through `Intl`, and falls back to the host clock for an unusable zone so a bad value
can never close a restaurant. Discovery and nearby queries filter on that boolean, so state can lag up to a minute — `restaurant.service.updateRestaurantInfo` therefore recomputes it inline whenever the schedule changes. The job starts inside the Mongoose connect callback, so every backend instance runs its own copy.

The seller edits hours per day in `SellerSettings.jsx`, which autosaves nested multipart fields (`schedule[monday][isOpen]`); multer's `append-field` rebuilds them into an object, and the service merges day-by-day so a partial payload never wipes untouched days. `frontend/src/utils/scheduleUtils.js` holds the display-side ordering and formatting shared by the settings form and `RestaurantInfoModal`.

## Menu item promotions

A seller marks a single dish down via `MenuItem.promotion` — `{isActive, type: percentage|fixed, value, label, startsAt, endsAt}`. Both dates are optional; a missing bound means "no bound", so an open-ended deal runs until the seller switches it off.

`utils/promotion.js` is the single source of truth: `isPromotionLive`, `effectivePrice`, `discountPercent`, `normalizePromotionInput` (coerces the multipart strings and rejects a deal that would price a dish under 0.50 or exceed 90% off) and `withPromotion`, which decorates a **lean** document with `promotionalPrice`/`discountPercent` — virtuals do not survive `.lean()` and every discovery read is lean.

The resolved price is computed server-side everywhere it matters: the discover feed, popular, search and restaurant-menu responses all pass through `withPromotion`, and `cartController.addToCart` snapshots `effectivePrice` into `Cart.items.price` with the original in `basePrice`. That snapshot is not what gets charged: `services/cartPricing.service.js#repriceCartLines` brings every line to the current effective price on `getCart` (returning `priceChanges`) and again in `createOrder`, which refuses with `409 PRICE_CHANGED` (`details.priceChanges`) when anything moved, or `400 ITEM_UNAVAILABLE` for an unavailable or deleted dish, having saved the repriced cart. Both clients refetch the cart on those codes. A basket filled during a short deal used to check out at the deal price weeks later. `frontend/src/lib/promotion.js` mirrors the rules but is used **only** by the seller’s own menu screens (which read raw documents) and the form’s live preview — customer-facing prices always come from the server.

Deleting a dish is a soft delete: `deleteMenuItemById` sets `MenuItem.deletedAt` and `available: false`, pulls it from every cart, and keeps its images so past orders still show it. Customer-facing reads are covered by their existing `available: true` filter; anything that can see unavailable dishes (the seller's list, update, delete, `addToCart`) must also filter `deletedAt: null`. Order populates and stats deliberately still resolve deleted dishes.

`GET /api/discover/promotions?lat&lon` returns `{ deals, newRestaurants }` and backs the two discovery rails. There is no "free delivery" promotion: delivery fees are a flat platform charge with no per-restaurant field, so the card would advertise something checkout could not honour.

## Backend conventions

Layering is `routes → controllers → services → models`, but only partly migrated. Newer code (courier, restaurantOrder, restaurant, menuItem, stats, analytics) keeps controllers thin and puts logic in `services/*.service.js` that `throw new AppError(msg, status)`. Older code (`orderController`, `cartController`, `favouriteController`, `discoverController`, `authController`) does DB work inline. **Follow the service pattern for new work.**

Express 5 forwards async rejections to error middleware automatically, so many handlers deliberately omit `try/catch`; older ones wrap and call `next(error)`. Both are fine — match the file you're editing.

Every list endpoint takes `page`/`limit` through `utils/pagination.js#parsePagination` (limit 1–50, page ≥ 1). Never pass a query value to `.limit()`/`.skip()` directly: Mongo reads `limit(0)` as "no limit", so `?limit=0` on the public discover feed returned the whole menu collection.

Error tracking is Sentry on all three, and each stays off until its DSN is set: `SENTRY_DSN` (backend), `VITE_SENTRY_DSN` (web), `EXPO_PUBLIC_SENTRY_DSN` (mobile). Web builds emit `hidden` source maps for upload but never link them; EAS builds upload native maps when `SENTRY_AUTH_TOKEN` is an EAS secret and continue without it (`SENTRY_ALLOW_FAILURE`).

`controllers/errorController.js` translates `CastError`, `ValidationError`, duplicate-key,
JWT and Multer failures into 4xx with a stable machine-readable `code` and, where useful,
a `fields` map — ordinary bad input used to fall through as a 500. Every response carries
`requestId`, matching the `X-Request-Id` header and the `pino` log line.
`AppError(message, statusCode, code)` takes that code. Unmatched `/api` paths return a
JSON 404, registered ahead of the production SPA fallback.

Auth is a JWT minted by `utils/generateToken.js`, carried two ways. The web gets an httpOnly cookie named `jwt` (`sameSite: strict`, `secure` unless `NODE_ENV=development`). Native clients have no usable cookie jar, so they read the token from the response body and send `Authorization: Bearer`; `middlewares/authMiddleware.js#extractToken` prefers the header and falls back to the cookie. The socket handshake mirrors this in `socket/socketServer.js#tokenFromHandshake` (`handshake.auth.token` → `Authorization` → cookie).

The token is only added to a response body when `utils/clientType.js#isMobileClient` is true — i.e. the request carried `X-Client: mobile` or `?client=mobile`. Returning it unconditionally would hand a 7–30 day bearer credential to any XSS on the web SPA, which the httpOnly cookie currently prevents. Controllers opt in by wrapping their response in `withAuthToken(req, body, token)`.

Tokens also carry `ver`, the user's `tokenVersion` at mint time; `protectedRoute` and the
socket handshake reject a token whose `ver` is behind the user's current value, which is
how a password reset or change revokes sessions already issued. A token minted before
`ver` existed reads as 0 and keeps working until the version is actually raised.

Each token also carries a `jti`. Logout revokes only that token (a `RevokedToken` row keyed
by the jti, TTL-expired at the token's own `exp`), so signing out on the web leaves the phone
signed in; `protectedRoute` and the handshake both check it. Tokens are only checked at the
socket handshake, so every revocation also calls `socket/socketServer.js#disconnectUserSockets`:
logout drops that token's sockets, a reset or deletion drops all of them, and a password
change drops all but the current device's, which also gets a fresh token back (mobile stores
it in `apiAuth.updateProfile`). A server-side disconnect is not auto-reconnected by the client.

Tokens carry `typ: "access"`. `protectedRoute` and the socket middleware reject any other `typ`, but only when the claim is present, so pre-existing cookies keep working. This guard matters because other short-lived tokens are signed with the same `JWT_SECRET`.

`protectedRoute` loads the user and hydrates the role satellite; `middlewares/roleMiddleware.js` gates by role. Note it returns **401** for an expired or malformed token — that used to be a 500, which a native client cannot distinguish from an outage.

Browser origins live in `config/cors.js` (`CORS_ORIGINS`, comma-separated) and are shared by Express and the socket server; keep them one list or Expo Web sockets fail while native ones work.

Google sign-in never links to an existing account by email: `config/passport.js#resolveGoogleProfile` matches on `googleId` only, and refuses with `?error=account_exists` (or `email_unverified` when Google hasn't verified the address). Auto-linking let whoever registered an address first share the account with its real owner.

Google OAuth is two-phase and easy to misread: the passport callback does **not** create a user for a new email. It stashes the profile in `req.session.googleProfile` and redirects to `${FRONTEND_URL}/auth/google/callback?newUser=true`; the frontend then POSTs `/api/auth/google/complete-profile` with the chosen role and role-specific fields to actually create the account.

Native cannot use that session: the OAuth leg runs in the system browser, a separate cookie jar the app's fetch never sees. `GET /api/auth/google?client=mobile` signs the client into the OAuth `state`, and `googleCallback` reads it back to redirect to `chowgo://auth/google?code=…` instead — the **same URL shape for new and returning users**, so the deep link is one opaque parameter. That code is a 90-second `google_handoff` token, deliberately not the session: on Android any app can claim a custom scheme. It is PKCE-bound and single-use: the app opens the flow with `challenge=sha256(verifier)` (hex), the challenge rides in the signed state into the code, `/exchange` requires the matching `codeVerifier`, and the code's `jti` is recorded in `ConsumedHandoff` (as `_id`, TTL-expired) so a replay is refused. `POST /api/auth/google/exchange` trades it for either a real token or a 15-minute `google_signup` token that replaces the session in `complete-profile`. All of these are signed with `JWT_SECRET`, which is why the `typ` guard in `protectedRoute` matters. An unsigned or tampered `state` falls back to the web redirect with `error=auth_failed`. On the web, `/google` also sets a `g_oauth_nonce` cookie (httpOnly, `sameSite: lax`, scoped to `/api/auth/google`) whose value rides in the state; the callback refuses a web state whose nonce doesn't match the cookie, before contacting Google. That is the login-CSRF guard — without it an attacker's callback URL could sign a victim's browser into the attacker's account.

**The app never talks to Google directly** — it opens the *backend's* route in a browser — so there are no iOS/Android OAuth client ids and `chowgo://` never appears in Google's console. The one sharp edge is development: Google rejects private-network redirect URIs, so a LAN IP cannot complete sign-in and a stable HTTPS tunnel must be registered as a second authorized redirect URI.

A signed-in password account connects Google from settings (`ConnectGoogle` on both clients); a Google-only account never sees it. Sign-in refuses such an email, so link mode (`link: {userId, ver}` in the signed state) bypasses `resolveGoogleProfile` in the passport verify and `services/googleLink.service.js#linkGoogleAccount` writes `googleId` only while unset, only at the same `tokenVersion`, and loses to the unique index when another account holds the id. The web starts at `GET /api/auth/google/link` behind `protectedRoute` — the strict cookie is what stops a cross-site page starting a link for its visitor — and reuses the nonce cookie. Native trades its bearer token for a 2-minute ticket (`POST /google/link/ticket` with a PKCE challenge), opens `/google/link/start?ticket=`, gets back `?linkCode=` (a `google_link_handoff`, which `/exchange` refuses by `typ`) and completes with `POST /google/link/confirm`, which needs the verifier *and* the same signed-in account. Auth responses carry `authProvider` and `googleLinked` (never `googleId`) through `authController.js#publicUser`.

**Admin console.** `User.isAdmin` is orthogonal to `role` (an admin is still a customer, seller or courier) and is granted only by `scripts/grantAdmin.js`. `/api/admin/*` (`routes/adminRoutes.js` → `services/admin.service.js`) answers non-admins with a 404. It approves, rejects, suspends and reinstates restaurants (`Restaurant.approvalStatus`; a missing value reads as approved), verifies couriers, suspends accounts and force-cancels orders. Every write is a conditional update from the states it is legal from (409 on a race) and writes an `AuditLog` row with actor, reason, before/after and request id; rejecting, suspending and cancelling require a reason. A suspension sets `User.suspendedAt`, bumps `tokenVersion` and drops sockets; `protectedRoute`, the socket handshake, login (after the password check) and Google sign-in all refuse it with `ACCOUNT_SUSPENDED`. Suspending a seller also takes their restaurant offline, and suspending a courier takes them off duty; lifting it restores neither. Admins cannot suspend themselves or each other. The web console is `/admin` (`pages/admin/`); there is none on mobile. Sellers see why their restaurant is hidden (`ApprovalNotice` on both clients).

Account deletion (`services/accountDeletion.service.js`) anonymises rather than removes: orders stay for the restaurant's and courier's records, but the customer's address snapshot, notes, dish instructions, written reviews (star ratings stay), device info and cancellation reasons go, as do a courier's plate, model, photo and delivery notes and a seller's restaurant email and phone. Profile photos are destroyed on Cloudinary after the commit. `GET /api/auth/account/export` (`services/accountExport.service.js`) returns everything held about the caller as a JSON attachment, leaving out credentials, push tokens, idempotency keys and other people's data; the web downloads it, mobile hands it to the share sheet. `check:account-data` covers both.

Every upload goes straight to Cloudinary via `middlewares/upload.js#createUpload(folder)`; the resulting `req.file.path` **is** the Cloudinary URL and is stored directly on the document. Multer streams through `utils/cloudinaryStorage.js`, a small engine on `cloudinary` 2.x that replaced the unmaintained `multer-storage-cloudinary` (it pinned cloudinary 1.x, GHSA-g4mf-96x5-5m2c). Files land before the handler validates anything, so `createUpload`'s `.single/.array/.fields` each return `[cleanupUploadsOnFailure, multer]`: when the response ends ≥400, whatever the request uploaded is destroyed. A handler that accepts a file it will not store on success must refuse it instead (as signup does for `restaurantImages` on non-seller roles). `services/image.service.js` handles deletes and add/remove diffing by parsing the public id back out of the URL. An update may only keep `existingImages` the document already holds (`keepExistingImages`), and `utils/formatData.js#isOwnCloudinaryUrl` gates every delete to `res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>/…` — a substring check once let one seller adopt and then destroy another restaurant's images.

## `shared/` conventions

`@chowgo/shared` holds logic that must be identical on every client. Several modules mirror backend rules — `adapters/pricing.js` carries the delivery/service/priority fees, `promotion.js` the discount floor and ceiling — so duplicating them per client means a pricing change lands in three places and the failure mode is a wrong total on a customer's screen.

- **No React, no DOM, no `import.meta`, no icon library, no HTTP client.** Everything here must run unchanged under Vite and under Metro/Hermes. The only dependencies are `zod` and `i18next` — the latter because `src/i18n/` owns the single i18next instance every client shares, and it must be one module instance in each bundler (Vite `resolve.dedupe`, Metro `resolveRequest`) or the active language lives in two places.
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
- **The design language is the app's own, and no longer derived from the web.** `mobile/` runs *Fast Casual Velocity*: blue-cast off-white surfaces, one kelly green for every action and positive state, a citrus orange held back for promotion and urgency, generous curvature (cards at `rounded-lg`/20, sheets at `rounded-xl`/24, anything pressable a full pill), and elevation instead of borders. The web keeps its zinc theme; the two palettes are now independent by design.
- **The theme is generated, not written.** `npm run sync-theme` derives `global.css` and `src/theme/tokens.js` from **`src/theme/palette.js`** — which is the single source of truth and the only one of the three you edit. Colours become space-separated RGB channels so Tailwind's `<alpha-value>` resolves and `bg-primary/10` compiles; hex does not. The script fails if a token has no `tailwind.config.js` mapping, or if a token exists in one theme but not the other.
- Token *names* are still mostly shared with the web, so most utility classes remain copy-pasteable, but `primary-bright` and the whole `tertiary-*` family are native-only. NativeWind v4 needs **Tailwind 3**, not the web's Tailwind 4 — that divergence is deliberate and documented at the top of `tailwind.config.js`.
- **Two type families.** Plus Jakarta Sans (600/700/800) carries headings, labels, prices and CTAs — everything scanned at a glance. Inter (400/500) carries body copy. Both are loaded in `app/_layout.jsx`; a missing face renders as the system font, not as an error. Use the `<Text variant>` primitive rather than raw type classes.
- Tailwind's opacity modifiers only accept its own scale (multiples of 5). `bg-white/12` silently generates nothing and the element renders unstyled — use `bg-white/10` or bracket syntax.
- Anything needing a colour *value* rather than a className (maps, bottom sheets, StatusBar, charts) reads `src/theme/tokens.js` via `useTokens()`. Nothing else may hardcode a hex.
- `src/api/client.js` sends `X-Client: mobile`, without which the backend omits the token from login/register bodies and every later request is silently unauthenticated.
- `src/lib/config.js` derives the dev host from Expo's packager (`10.0.2.2` on the Android emulator), so `EXPO_PUBLIC_API_URL` only needs setting for a tunnel, staging or production. The socket URL defaults to the API URL minus `/api`; `EXPO_PUBLIC_SOCKET_URL` is only for a separate socket host. `app.config.js` fails a `preview`/`production` `eas build` when the API URL is unset, not https, or still the `example.invalid` placeholder in `eas.json` — set real URLs there before building.
- Maps are MapLibre against OpenFreeMap: no key, no billing, identical cartography on both platforms. `src/components/map/Map.jsx` is the only file importing the SDK, and its public API speaks `[lat, lng]` like the rest of the app — MapLibre wants GeoJSON `[lng, lat]`, and that flip happens there and nowhere else.
- **Build variants.** `app.config.js` gives each EAS profile its own id, name and URL scheme through `APP_VARIANT` (set in `eas.json`): `com.chowngo.app.dev` / `chowgo-dev`, `.preview` / `chowgo-preview`, and the store `com.chowngo.app` / `chowgo`. A plain `expo start` serves the development variant. The app sends its scheme's redirect to the backend, which accepts only those three (`utils/googleHandoff.js#mobileRedirectFor`) and carries it in the signed state. `runtimeVersion` uses the `fingerprint` policy, so an OTA update only reaches binaries with the same native code.
- Android push needs a Firebase config for each variant's package: the `GOOGLE_SERVICES_JSON` EAS file variable, or a git-ignored `google-services.json` here. Without it `getExpoPushTokenAsync` throws on Android.
- Push permission: sellers and couriers are asked at sign-in, customers after their first order (`checkout.jsx` calls `registerForPush({ prompt: true })`). Registration is keyed on the user id, not the `authUser` object.
- `.npmrc` sets `legacy-peer-deps=true`; the RN dependency graph has genuinely conflicting peer ranges and installs fail without it.
- `metro.config.js` enables `unstable_enablePackageExports` and watches `../shared` — both are required to consume `@chowgo/shared`.

## Known drift — check before touching these

1. Rate limits in `middlewares/rateLimit.js` mostly key off `req.ip`. Mobile carriers put thousands of subscribers behind one address, so `accountLimiter` (20 per 15 min, counting successes) and `loginLimiter` (10 failed logins) will collide for real cellular traffic. Login now also has `loginAccountLimiter` (10 failed logins per email, any IP), and reset codes are capped at 3 per account per hour in the controller, so the per-IP limits can be loosened without opening brute force. `TRUST_PROXY` must also be set in production or every user lands in one bucket.
2. Signup (both the local and Google seller paths) still collects a single opening/closing range rather than a full week; the backend expands it across all 7 days. Per-day control lives only in seller settings.
3. **Restaurant approval is off by default.** A seller signup creates a live restaurant (`approvalStatus: "approved"`, `isActive: true`) unless `RESTAURANT_APPROVAL_REQUIRED=true`, in which case it starts `pending` and inactive until an admin approves it at `/admin`. Couriers are always gated — `acceptOrderOperation` refuses an order unless `verificationStatus === "verified"`, set from the admin console (or `scripts/verifyCourier.js`). An unverified courier can still browse `/api/courier/available`, but `listAvailableOrders` strips the address and returns only coordinates snapped to a ~200 m grid and a distance rounded to 500 m (`approximate: true`); verified couriers get the exact dropoff.
4. **No online payment exists.** `paymentMethod` is `cash` or `card`, and both mean the courier collects at the door. `paymentStatus` never leaves `"pending"`, so nothing records that money changed hands.

## Single-instance assumptions (relevant to scaling)

The backend currently cannot run more than one process correctly. Anything touching these areas should account for it:

- Socket.IO has **no Redis adapter**, and `connections` is a plain in-memory Map, so a customer connected to instance B never receives an event emitted from instance A. `locationTracking.service.js`'s throttle Map has the same problem, as do the geocoding caches and the one-per-second Nominatim spacing in `locationController.js` (N instances make N requests per second to Nominatim).
- `express-session` uses the default `MemoryStore`, which breaks the two-phase Google signup across instances and loses sessions on restart.
- The cron job runs per instance, so N instances race on the same `bulkWrite`.
- Pool events go to one `couriers:pool` room. `emitNewOrderAvailable` also pushes to verified, free couriers within 15 km of the restaurant who are not connected, in one lookup and chunked Expo sends (`push.service.js#sendPushToUsers`); "mark ready" does not await it. A courier who has never shared a location gets no pool push.
- `stats.service.fetchOrdersData` loads four unbounded `Order.find()` result sets into memory instead of aggregating.
