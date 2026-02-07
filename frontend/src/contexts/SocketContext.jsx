import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
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
  const { authUser } = useAuthStore();
  const socketRef = useRef(null);
  const registrationDataRef = useRef(null);

  useEffect(() => {
    if (!authUser) {
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket (user logged out)");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setIsRegistered(false);
      }
      return;
    }

    if (socketRef.current?.connected) {
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
    });

    newSocket.on("pong", () => {
      console.log("💓 Heartbeat received");
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log("🔌 Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [authUser]);

  const register = (data) => {
    if (socketRef.current && isConnected) {
      console.log("📝 Registering socket with data:", data);
      registrationDataRef.current = data;
      socketRef.current.emit("register", data);
    } else {
      console.warn("⚠️ Socket not connected, cannot register");
    }
  };

  useEffect(() => {
    if (!socketRef.current || !isConnected) return;

    const interval = setInterval(() => {
      socketRef.current.emit("ping");
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const value = {
    socket,
    isConnected,
    isRegistered,
    register,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
