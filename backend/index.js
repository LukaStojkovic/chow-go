// Loaded first: validates the environment and runs dotenv.config() before any
// module that captures an env value at evaluation time (config/cors.js builds
// ALLOWED_ORIGINS, push.service.js constructs its Expo client).
import { env } from "./config/env.js";
import { Sentry } from "./config/sentry.js";

import { initI18n } from "@chowgo/shared/i18n";
import express from "express";
import http from "http";
import authRoutes from "./routes/authRoutes.js";
import locationRoutes from "./routes/locationRouter.js";
import restaurantsRoutes from "./routes/restaurantsRoutes.js";
import deliveryAddressRoute from "./routes/deliveryAddressRoute.js";
import orderRoutes from "./routes/orderRoutes.js";
import restaurantOrderRoutes from "./routes/restaurantOrderRoutes.js";
import courierRoutes from "./routes/courierRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import discoverRoutes from "./routes/discoverRoutes.js";
import favouriteRoutes from "./routes/favouriteRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "./middlewares/rateLimit.js";
import { corsOrigin } from "./config/cors.js";
import { rejectMongoOperators } from "./middlewares/sanitize.js";
import { attachLocale } from "./middlewares/locale.js";
import { handleError } from "./controllers/errorController.js";
import { initializeSocketServer } from "./socket/socketServer.js";
import { startCronJobs } from "./services/cron.service.js";
import { logger, httpLogger } from "./utils/logger.js";
import { AppError } from "./utils/AppError.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import path from "path";
import session from "express-session";
import passport from "passport";
import { configurePassport } from "./config/passport.js";

// Boot the catalogs before the first request: `attachLocale` and every
// `AppError` below resolve copy through them, and a lazy first init inside a
// request handler would make that request measurably slower than the rest.
initI18n({ locale: env.defaultLocale });

const app = express();
const httpServer = http.createServer(app);
const __dirname = path.resolve();

configurePassport();

app.set("trust proxy", env.trustProxy);
app.disable("x-powered-by");

app.use(httpLogger);

// This process also serves the SPA in production, so these are browser-facing
// headers, not just API ones. CSP is left off deliberately: the app loads
// Cloudinary images, Stadia map tiles, OSRM routing and Google fonts, and a
// policy written without testing those would break the product silently.
// Enabling it is tracked as its own piece of work.
app.use(
  helmet({
    contentSecurityPolicy: false,
    // Images are served cross-origin from Cloudinary.
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
  }),
);

// Liveness and readiness are registered ahead of every other route: the
// production SPA fallback below is a catch-all and would otherwise shadow them,
// which is what happened to `GET /` and `/api/socket/stats` previously.
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.get("/readyz", async (_req, res) => {
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    return res.status(503).json({ status: "unavailable", database: "disconnected" });
  }
  try {
    await mongoose.connection.db.admin().ping();
    return res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    return res.status(503).json({ status: "unavailable", database: "unreachable" });
  }
});

app.use("/api", apiLimiter);
app.use(express.json({ limit: "1mb" }));
// Without this a POST carrying a form content type leaves req.body undefined,
// and every handler that destructures it throws a 500 instead of a 400.
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
// Before the router, so error middleware can read `req.locale` even when a
// route throws before it has looked at the user.
app.use(attachLocale);
app.use(rejectMongoOperators);
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    exposedHeaders: ["X-Refreshed-Token", "X-Request-Id"],
  }),
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: env.isProduction,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

const socketServer = initializeSocketServer(httpServer);

app.set("socketServer", socketServer);

app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/restaurants", restaurantsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/delivery-address", deliveryAddressRoute);
app.use("/api/orders", orderRoutes);
app.use("/api/restaurant/orders", restaurantOrderRoutes);
app.use("/api/courier", courierRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/socket/stats", protectedRoute, (req, res) => {
  res.json(socketServer.getStats());
});

// An unmatched /api path must be a JSON 404. The SPA fallback below would
// otherwise answer it with index.html and HTTP 200, which clients parse as
// success, and which Google indexes as a soft 404.
app.use("/api", (req, _res, next) => {
  next(
    new AppError("errors:request.notFound", 404, "ROUTE_NOT_FOUND", {
      method: req.method,
      path: req.originalUrl,
    }),
  );
});

if (env.isProduction) {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.send("Backend is Running");
  });
}

if (env.sentryDsn) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(handleError);

mongoose
  .connect(env.mongoUrl, {
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    retryWrites: true,
  })
  .then(() => {
    httpServer.listen(env.port, () => {
      logger.info({ port: env.port }, "server listening");
      startCronJobs();
    });
  })
  .catch((err) => {
    logger.fatal({ err }, "initial MongoDB connection failed");
    process.exit(1);
  });

let shuttingDown = false;

// The initial connect has a failure path; a later drop previously had none.
mongoose.connection.on("disconnected", () => {
  if (shuttingDown) return;
  logger.error("MongoDB disconnected");
});
mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down");

  const failsafe = setTimeout(() => {
    logger.error("graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 15000);
  failsafe.unref();

  try {
    await new Promise((resolve) => socketServer.io.close(resolve));
    await new Promise((resolve) => httpServer.close(resolve));
    await mongoose.connection.close(false);
    clearTimeout(failsafe);
    logger.info("shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "unhandled promise rejection");
  if (env.sentryDsn) Sentry.captureException(reason);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception");
  if (env.sentryDsn) Sentry.captureException(err);
  shutdown("uncaughtException");
});

export { socketServer };
