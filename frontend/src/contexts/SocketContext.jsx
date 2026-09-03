import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [connectionEpoch, setConnectionEpoch] = useState(0);

  const { authUser } = useAuthStore();
  const socketRef = useRef(null);
  const registrationDataRef = useRef(null);

  const userId = authUser?._id ?? null;
  const userRole = authUser?.role ?? null;

  useEffect(() => {
    if (!userId) {
      registrationDataRef.current = null;
      return;
    }

    console.log("🔌 Connecting to Socket.IO server...");

    const newSocket = io(
      import.meta.env.VITE_API_URL || "http://localhost:8000",
      {
        withCredentials: true,
        transports: ["websocket"],
        reconnection: true,
      },
    );

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);
      setConnectionEpoch((n) => n + 1);

      if (registrationDataRef.current) {
        newSocket.emit("register", registrationDataRef.current);
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
      setIsRegistered(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("registered", (data) => {
      console.log("✅ Socket registered:", data);
      setIsRegistered(true);
    });

    newSocket.on("registration_error", (data) => {
      console.error("❌ Socket registration error:", data.message);
      setIsRegistered(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log("🔌 Cleaning up socket connection");
      newSocket.removeAllListeners();
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setIsRegistered(false);
    };
  }, [userId, userRole]);

  const register = useCallback((data) => {
    registrationDataRef.current = data;
    if (socketRef.current?.connected) {
      console.log("📝 Registering socket with data:", data);
      socketRef.current.emit("register", data);
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      socketRef.current?.emit("ping");
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const value = {
    socket,
    isConnected,
    isRegistered,
    connectionEpoch,
    register,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
