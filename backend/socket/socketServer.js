import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { isTokenVersionCurrent } from "../utils/generateToken.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Courier from "../models/Courier.js";
import Order from "../models/Order.js";
import {
  forgetCourierThrottle,
  updateCourierLocation,
} from "../services/locationTracking.service.js";
import { emitCourierLocationUpdated } from "../services/orderSocket.service.js";
import { corsOrigin } from "../config/cors.js";

export const COURIER_POOL_ROOM = "couriers:pool";

const COURIER_ACTIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

const DELIVERY_CONTEXT_TTL_MS = 60_000;

const DELIVERY_MISS_TTL_MS = 5_000;

const isEmpty = (set) => !set || set.size === 0;

function tokenFromHandshake(handshake) {
  if (handshake.auth?.token) return handshake.auth.token;

  const header = handshake.headers?.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();

  const cookies = handshake.headers?.cookie;
  if (!cookies) return null;

  const jwtCookie = cookies.split(";").find((c) => c.trim().startsWith("jwt="));
  return jwtCookie ? jwtCookie.trim().slice(4) : null;
}

class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.connections = {
      customers: new Map(),
      restaurants: new Map(),
      couriers: new Map(),
    };

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = tokenFromHandshake(socket.handshake);

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.typ && decoded.typ !== "access") {
          return next(new Error("Authentication error: Invalid token"));
        }

        const user = await User.findById(decoded.userId);

        if (!user || user.isDeleted) {
          return next(new Error("Authentication error: User not found"));
        }

        if (!isTokenVersionCurrent(decoded, user)) {
          return next(new Error("Authentication error: Token revoked"));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.userName = user.name;

        next();
      } catch (err) {
        next(new Error("Authentication error: Invalid token"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(
        `✅ User connected: ${socket.userName} (${socket.userRole}) - Socket ID: ${socket.id}`,
      );

      socket.on("register", async (data) => {
        await this.handleRegistration(socket, data);
      });

      socket.on("courier:location_update", async (data) => {
        await this.handleCourierLocationUpdate(socket, data);
      });

      socket.on("disconnect", () => {
        this.handleDisconnection(socket);
      });

      socket.on("ping", () => {
        socket.emit("pong");
      });
    });
  }

  async handleCourierLocationUpdate(socket, data) {
    if (!socket.courierId) {
      socket.emit("location:error", { message: "Not registered as courier" });
      return;
    }

    try {
      const { shouldBroadcast, coordinates, timestamp } =
        await updateCourierLocation({
          courierId: socket.courierId,
          coordinates: data?.coordinates,
        });

      if (!shouldBroadcast) return;

      const context = await this.resolveDeliveryContext(socket, data?.orderId);
      if (!context) return;

      emitCourierLocationUpdated({
        orderId: context.orderId,
        customerId: context.customerId,
        restaurantId: context.restaurantId,
        courierId: socket.courierId,
        coordinates,
        timestamp,
      });
    } catch (err) {
      socket.emit("location:error", { message: err.message });
    }
  }

  async resolveDeliveryContext(socket, hintedOrderId) {
    const key = hintedOrderId ? String(hintedOrderId) : "";
    const now = Date.now();

    const cached = socket.deliveryContext;
    if (cached && cached.key === key && cached.expiresAt > now) {
      return cached.value;
    }

    let order = null;
    if (key) {
      order = await Order.findOne({
        _id: key,
        courier: socket.courierId,
        status: { $in: COURIER_ACTIVE_STATUSES },
      })
        .select("customer restaurant")
        .lean();
    } else {
      const courier = await Courier.findById(socket.courierId)
        .select("currentOrder")
        .lean();
      if (courier?.currentOrder) {
        order = await Order.findOne({
          _id: courier.currentOrder,
          status: { $in: COURIER_ACTIVE_STATUSES },
        })
          .select("customer restaurant")
          .lean();
      }
    }

    const value = order
      ? {
          orderId: String(order._id),
          customerId: order.customer ? String(order.customer) : null,
          restaurantId: order.restaurant ? String(order.restaurant) : null,
        }
      : null;

    socket.deliveryContext = {
      key,
      value,
      expiresAt: now + (value ? DELIVERY_CONTEXT_TTL_MS : DELIVERY_MISS_TTL_MS),
    };

    return value;
  }

  async handleRegistration(socket, data) {
    try {
      const { role, restaurantId } = data;

      if (role !== socket.userRole) {
        console.error(
          `🚨 Authorization bypass attempt: Client role "${role}" does not match authenticated role "${socket.userRole}" for user ${socket.userId}`,
        );
        socket.emit("registration_error", {
          success: false,
          message: "Role mismatch: Unauthorized role provided",
        });
        socket.disconnect(true);
        return;
      }

      switch (role) {
        case "customer":
          this.addConnection("customers", socket.userId, socket.id);
          socket.join(`customer:${socket.userId}`);
          console.log(`👤 Customer registered: ${socket.userId}`);
          break;

        case "seller":
          if (!restaurantId) {
            console.error(
              `🚨 Seller registration failed: No restaurantId provided for user ${socket.userId}`,
            );
            socket.emit("registration_error", {
              success: false,
              message: "Restaurant ID is required for seller registration",
            });
            socket.disconnect(true);
            return;
          }

          const restaurant = await Restaurant.findOne({
            _id: restaurantId,
            ownerId: socket.userId,
          }).select("_id");

          if (!restaurant) {
            console.error(
              `🚨 Authorization bypass attempt: User ${socket.userId} attempted to register unauthorized restaurant ${restaurantId}`,
            );
            socket.emit("registration_error", {
              success: false,
              message: "Restaurant not found or unauthorized for this user",
            });
            socket.disconnect(true);
            return;
          }

          this.addConnection("restaurants", restaurantId, socket.id);
          socket.join(`restaurant:${restaurantId}`);
          socket.restaurantId = restaurantId;
          console.log(`🏪 Restaurant registered: ${restaurantId}`);
          break;

        case "courier":
          const courier = await Courier.findOne({
            userId: socket.userId,
          }).select("_id");
          if (!courier) {
            console.error(
              `🚨 Courier registration failed: No courier profile for user ${socket.userId}`,
            );
            socket.emit("registration_error", {
              success: false,
              message: "Courier profile not found",
            });
            socket.disconnect(true);
            return;
          }

          socket.courierId = courier._id.toString();
          this.addConnection("couriers", socket.courierId, socket.id);
          socket.join(`courier:${socket.courierId}`);
          socket.join(COURIER_POOL_ROOM);
          console.log(`🛵 Courier registered: ${socket.courierId}`);
          break;

        default:
          console.error(
            `🚨 Invalid role provided: ${role} for user ${socket.userId}`,
          );
          socket.emit("registration_error", {
            success: false,
            message: "Invalid role provided",
          });
          socket.disconnect(true);
          return;
      }

      socket.emit("registered", {
        success: true,
        role,
        message: `Successfully registered as ${role}`,
      });
    } catch (error) {
      console.error("Registration error:", error);
      socket.emit("registration_error", {
        success: false,
        message: "Failed to register socket connection",
      });
      socket.disconnect(true);
    }
  }

  handleDisconnection(socket) {
    console.log(
      `❌ User disconnected: ${socket.userName} (${socket.userRole})`,
    );

    if (socket.userRole === "customer") {
      this.removeConnection("customers", socket.userId, socket.id);
    }
    if (socket.restaurantId) {
      this.removeConnection("restaurants", socket.restaurantId, socket.id);
    }
    if (socket.courierId) {
      this.removeConnection("couriers", socket.courierId, socket.id);
      if (isEmpty(this.connections.couriers.get(socket.courierId))) {
        forgetCourierThrottle(socket.courierId);
      }
    }
  }

  addConnection(kind, key, socketId) {
    const id = key.toString();
    const existing = this.connections[kind].get(id);
    if (existing) existing.add(socketId);
    else this.connections[kind].set(id, new Set([socketId]));
  }

  removeConnection(kind, key, socketId) {
    const id = key.toString();
    const existing = this.connections[kind].get(id);
    if (!existing) return;
    existing.delete(socketId);
    if (existing.size === 0) this.connections[kind].delete(id);
  }

  emitToRoom(room, event, data, label) {
    const size = this.io.sockets.adapter.rooms.get(room)?.size ?? 0;
    if (size === 0) {
      console.log(`⚠️  ${label} not connected`);
      return false;
    }
    this.io.to(room).emit(event, data);
    console.log(`📤 Emitted ${event} to ${label}`);
    return true;
  }

  emitToCustomer(userId, event, data) {
    return this.emitToRoom(
      `customer:${userId}`,
      event,
      data,
      `customer ${userId}`,
    );
  }

  emitToRestaurant(restaurantId, event, data) {
    return this.emitToRoom(
      `restaurant:${restaurantId}`,
      event,
      data,
      `restaurant ${restaurantId}`,
    );
  }

  emitToCourier(courierId, event, data) {
    return this.emitToRoom(
      `courier:${courierId}`,
      event,
      data,
      `courier ${courierId}`,
    );
  }

  emitToCourierPool(event, data) {
    return this.emitToRoom(
      COURIER_POOL_ROOM,
      event,
      data,
      "the courier pool",
    );
  }

  /**
   * Courier ids with at least one live socket. The pool push uses this to skip
   * couriers who are already watching, the same way deliverToCustomer uses an
   * empty room as its signal.
   */
  connectedCourierIds() {
    const ids = new Set();
    for (const [courierId, sockets] of this.connections.couriers) {
      if (sockets && sockets.size > 0) ids.add(String(courierId));
    }
    return ids;
  }

  getStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      customers: this.connections.customers.size,
      restaurants: this.connections.restaurants.size,
      couriers: this.connections.couriers.size,
      courierPool: this.io.sockets.adapter.rooms.get(COURIER_POOL_ROOM)?.size ?? 0,
    };
  }
}

let socketServerInstance = null;

export const initializeSocketServer = (httpServer) => {
  if (!socketServerInstance) {
    socketServerInstance = new SocketServer(httpServer);
    console.log("🚀 Socket.IO server initialized");
  }
  return socketServerInstance;
};

export const getSocketServer = () => {
  if (!socketServerInstance) {
    throw new Error("Socket server not initialized");
  }
  return socketServerInstance;
};

export default SocketServer;
