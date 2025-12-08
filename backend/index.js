import express from "express";
import authRoutes from "./routes/authRoutes.js";
import locationRoutes from "./routes/locationRouter.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
dotenv.config();

// MIDDLEWARES
app.use(express.json());
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);

app.get("/", (_, res) => {
  res.send("Backend is Running");
});

mongoose.connect(process.env.MONGODB_URL).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
});
