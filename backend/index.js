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
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { apiLimiter } from "./middlewares/rateLimit.js";
import { corsOrigin } from "./config/cors.js";
import { handleError } from "./controllers/errorController.js";
import { initializeSocketServer } from "./socket/socketServer.js";
import { startCronJobs } from "./services/cron.service.js";
import path from "path";
import session from "express-session";
import passport from "passport";
import { configurePassport } from "./config/passport.js";

const app = express();
const httpServer = http.createServer(app);
const __dirname = path.resolve();

dotenv.config();
configurePassport();

// Rate limiting keys off req.ip. Behind a reverse proxy (nginx, Render, Fly)
// that is the proxy's address unless Express is told how many hops to trust,
// which would put every user in one shared bucket. Set TRUST_PROXY to the
// number of proxies in front of this process; leave it unset when there are
// none, so a forged X-Forwarded-For cannot dodge the limits.
app.set("trust proxy", Number(process.env.TRUST_PROXY) || 0);

// MIDDLEWARES
app.use("/api", apiLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    exposedHeaders: ["X-Refreshed-Token"],
  }),
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
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

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.get("/", (_, res) => {
  res.send("Backend is Running");
});

app.get("/api/socket/stats", (req, res) => {
  res.json(socketServer.getStats());
});

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    httpServer.listen(process.env.PORT, () => {
      console.log(`🚀 Server is running on port ${process.env.PORT}`);
      console.log(`📡 Socket.IO ready for connections`);
      startCronJobs();
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
app.use(handleError);

export { socketServer };
