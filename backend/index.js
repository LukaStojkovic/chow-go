import express from "express";
import http from "http";
import authRoutes from "./routes/authRoutes.js";
import locationRoutes from "./routes/locationRouter.js";
import restaurantsRoutes from "./routes/restaurantsRoutes.js";
import deliveryAddressRoute from "./routes/deliveryAddressRoute.js";
import orderRoutes from "./routes/orderRoutes.js";
import restaurantOrderRoutes from "./routes/restaurantOrderRoutes.js";
import courierOrderRoutes from "./routes/courierOrderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { handleError } from "./controllers/errorController.js";
import { initializeSocketServer } from "./socket/socketServer.js";
import path from "path";

const app = express();
const httpServer = http.createServer(app);
const __dirname = path.resolve();

dotenv.config();

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

// MIDDLEWARES
app.use("/api", limiter);
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

const socketServer = initializeSocketServer(httpServer);

app.set("socketServer", socketServer);

app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/restaurants", restaurantsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/delivery-address", deliveryAddressRoute);
app.use("/api/orders", orderRoutes);
app.use("/api/restaurant/orders", restaurantOrderRoutes);
app.use("/api/courier/orders", courierOrderRoutes);

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
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
app.use(handleError);

export { socketServer };
