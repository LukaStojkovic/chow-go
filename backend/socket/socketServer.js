import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";

class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:5173",
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
        const cookies = socket.handshake.headers.cookie;

        if (!cookies) {
          return next(new Error("Authentication error: No cookies"));
        }

        const tokenCookie = cookies
          .split(";")
          .find((c) => c.trim().startsWith("jwt="));

        if (!tokenCookie) {
          return next(new Error("Authentication error: No token provided"));
        }

        const token = tokenCookie.split("=")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
          return next(new Error("Authentication error: User not found"));
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

      socket.on("disconnect", () => {
        this.handleDisconnection(socket);
      });

      socket.on("ping", () => {
        socket.emit("pong");
      });
    });
  }

  async handleRegistration(socket, data) {
    try {
      const { role, restaurantId } = data;

      console.log(`📝 Registering socket for ${role}:`, socket.userId);

      switch (role) {
        case "customer":
          this.connections.customers.set(socket.userId, socket.id);
          socket.join(`customer:${socket.userId}`);
          console.log(`👤 Customer registered: ${socket.userId}`);
          break;

        case "seller":
          if (restaurantId) {
            const restaurant = await Restaurant.findOne({
              _id: restaurantId,
              ownerId: socket.userId,
            });

            if (restaurant) {
              this.connections.restaurants.set(restaurantId, socket.id);
              socket.join(`restaurant:${restaurantId}`);
              socket.restaurantId = restaurantId;
              console.log(`🏪 Restaurant registered: ${restaurantId}`);
            } else {
              console.error("Restaurant not found or unauthorized");
            }
          }
          break;

        case "courier":
          // TODO: Implement courier registration
          break;
      }

      socket.emit("registered", {
        success: true,
        role,
        message: `Successfully registered as ${role}`,
      });
    } catch (error) {
      console.error("Registration error:", error);
      socket.emit("registration_error", {
        message: "Failed to register socket connection",
      });
    }
  }

  handleDisconnection(socket) {
    console.log(
      `❌ User disconnected: ${socket.userName} (${socket.userRole})`,
    );

    this.connections.customers.delete(socket.userId);
    if (socket.restaurantId) {
      this.connections.restaurants.delete(socket.restaurantId);
    }
  }

  emitToCustomer(userId, event, data) {
    const socketId = this.connections.customers.get(userId.toString());
    if (socketId) {
      this.io.to(`customer:${userId}`).emit(event, data);
      console.log(`📤 Emitted ${event} to customer ${userId}`);
      return true;
    }
    console.log(`⚠️  Customer ${userId} not connected`);
    return false;
  }

  emitToRestaurant(restaurantId, event, data) {
    const socketId = this.connections.restaurants.get(restaurantId.toString());
    if (socketId) {
      this.io.to(`restaurant:${restaurantId}`).emit(event, data);
      console.log(`📤 Emitted ${event} to restaurant ${restaurantId}`);
      return true;
    }
    console.log(`⚠️  Restaurant ${restaurantId} not connected`);
    return false;
  }

  emitToCourier(courierId, event, data) {
    const socketId = this.connections.couriers.get(courierId.toString());
    if (socketId) {
      this.io.to(`courier:${courierId}`).emit(event, data);
      console.log(`📤 Emitted ${event} to courier ${courierId}`);
      return true;
    }
    console.log(`⚠️  Courier ${courierId} not connected`);
    return false;
  }

  getStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      customers: this.connections.customers.size,
      restaurants: this.connections.restaurants.size,
      couriers: this.connections.couriers.size,
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
