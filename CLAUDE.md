# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent npm projects (not workspaces — each has its own `package.json` and `node_modules`):

- `backend/` — Express 5 + Mongoose API, Socket.IO server, node-cron jobs. ESM (`"type": "module"`), so all imports need file extensions.
- `frontend/` — Vite + React 19 SPA (plain JS, no TypeScript).
- `mobile/` — abandoned, empty Expo scaffold (untracked, only `.env` + `.expo/`). Ignore it; there is no mobile app.

The root `package.json` exists only for single-service deploys: `npm run build` installs both sides and builds the frontend, `npm start` runs the backend. In production (`NODE_ENV=production`) the backend serves `../frontend/dist` as static files with an SPA fallback.

## Commands

```bash
cd backend && npm run dev      # nodemon index.js
cd frontend && npm run dev     # vite --host
cd frontend && npm run lint    # eslint (the only automated check in the repo)
cd frontend && npm run build   # vite build -> frontend/dist
node backend/scripts/menuItemSeeds.js   # seed menu items for existing restaurants
node backend/scripts/backfillSchedule.js --dry-run   # report legacy-hours migration
node backend/scripts/backfillSchedule.js             # apply it (idempotent, already run)
```

There is **no test framework, no test files, and no CI** anywhere in the repo. Do not invent a `npm test` invocation; verify changes by running both dev servers.

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

Persisted notifications (`models/OrderNotification.js`, registered as model `"Notification"`, templated in `orderNotification.service.js`) are written on every transition but **no endpoint reads them back** — the UI is driven entirely by sockets and toasts.

## Opening hours and `isOpenNow`

`Restaurant.schedule` holds a per-day `{isOpen, openingTime, closingTime}` entry (24-hour `HH:MM`, regex-validated in the schema). Two conventions matter: `openingTime === closingTime` means open around the clock, and a `closingTime` earlier than `openingTime` is an overnight window that runs into the next morning.

`utils/schedule.js` is the single source of truth — `DAYS_OF_WEEK` (indexed to match `Date#getDay()`, and the model's `schedule` fields are generated from it), `isOpenAt` (checks today's window *and* yesterday's overnight spill), `normalizeScheduleInput` (validates partial payloads, coerces the `"true"`/`"false"` strings that arrive over multipart), and `buildScheduleFromRange` (signup collects one range and expands it across all 7 days).

`isOpenNow` is precomputed, not derived: `services/cron.service.js` runs every minute and bulk-writes it via `isOpenAt` using **server-local time**. Discovery and nearby queries filter on that boolean, so state can lag up to a minute — `restaurant.service.updateRestaurantInfo` therefore recomputes it inline whenever the schedule changes. The job starts inside the Mongoose connect callback, so every backend instance runs its own copy.

The seller edits hours per day in `SellerSettings.jsx`, which autosaves nested multipart fields (`schedule[monday][isOpen]`); multer's `append-field` rebuilds them into an object, and the service merges day-by-day so a partial payload never wipes untouched days. `frontend/src/utils/scheduleUtils.js` holds the display-side ordering and formatting shared by the settings form and `RestaurantInfoModal`.

## Backend conventions

Layering is `routes → controllers → services → models`, but only partly migrated. Newer code (courier, restaurantOrder, restaurant, menuItem, stats, analytics) keeps controllers thin and puts logic in `services/*.service.js` that `throw new AppError(msg, status)`. Older code (`orderController`, `cartController`, `favouriteController`, `discoverController`, `authController`) does DB work inline. **Follow the service pattern for new work.**

Express 5 forwards async rejections to error middleware automatically, so many handlers deliberately omit `try/catch`; older ones wrap and call `next(error)`. Both are fine — match the file you're editing.

`controllers/errorController.js` returns the full stack in development and only `err.message` for `isOperational` errors in production. Note that in production the SPA fallback `app.use` is registered before the error handler, so unmatched `/api/*` paths return `index.html` rather than a 404 JSON.

Auth is a JWT in an httpOnly cookie named `jwt` (`sameSite: strict`, `secure` unless `NODE_ENV=development`), minted by `utils/generateToken.js`. `middlewares/authMiddleware.js#protectedRoute` loads the user and hydrates the role satellite; `middlewares/roleMiddleware.js` gates by role.

Google OAuth is two-phase and easy to misread: the passport callback does **not** create a user for a new email. It stashes the profile in `req.session.googleProfile` and redirects to `${FRONTEND_URL}/auth/google/callback?newUser=true`; the frontend then POSTs `/api/auth/google/complete-profile` with the chosen role and role-specific fields to actually create the account.

Every upload goes straight to Cloudinary via `middlewares/upload.js#createUpload(folder)`; the resulting `req.file.path` **is** the Cloudinary URL and is stored directly on the document. `services/image.service.js` handles deletes and add/remove diffing by parsing the public id back out of the URL.

## Frontend conventions

- `@/*` → `src/*` (`jsconfig.json`). Tailwind v4 via `@tailwindcss/vite` — there is **no `tailwind.config`**; the theme lives in `src/index.css`. shadcn/ui (new-york, JSX) lands in `src/components/ui`.
- Data flow: `services/api*.js` (thin axios wrappers that log and rethrow) → `hooks/<Domain>/use*.js` (React Query) → components. Keep new fetches in that chain.
- Zustand covers cross-cutting state: `useAuthStore` (session + the global auth modal), `useCartStore` (mirror of the server cart), `useDeliveryStore` (persisted address/coords), `useDiscoverStore` (feed pagination and search — this one bypasses React Query and calls axios directly).
- `QueryClient` is configured with `staleTime: 0`, so freshness depends on socket-driven invalidation. `hooks/Sockets/useGlobalSocketEvents.js` is the **single place** that registers the socket role and invalidates caches — keys in use are `["order", id]`, `["customerOrders"]`, `["restaurantOrders"]`, `["courierAvailableOrders"]`, `["courierOrders"]`, `["courierOrder"]`. New realtime state must be wired there or the UI won't update.
- `contexts/SocketContext.jsx` creates the socket only once `authUser` exists, websocket transport only.
- Guards in `App.jsx`: `PublicRoute` and `CustomerRoute` render an `<Outlet />`; `SellerRoute` and `CourierRoute` wrap `children`. Unauthenticated users get the auth modal opened plus a `<Navigate to="/">` — there is no `/login` route.

## Known drift — check before touching these

1. **`serviceFee` is not on the Order schema.** `createOrder` adds 1.50 into `total` and passes `serviceFee` to the constructor, where Mongoose drops it — stored line items don't reconcile with `total`.
2. The `express-rate-limit` limiter in `backend/index.js` is constructed but its `app.use` is commented out (`TO-DO: find better approach`). CORS there is hardcoded to `localhost:5173` while the socket server uses `FRONTEND_URL`.
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
