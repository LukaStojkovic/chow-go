import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/lib/config";
import { getToken } from "@/lib/secureToken";
import { useAuthStore } from "@/store/useAuthStore";

const SocketContext = createContext(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  // Bumped on every connect. Anything >= 2 is a *re*connect, meaning events
  // were missed while offline and caches need a resync.
  const [connectionEpoch, setConnectionEpoch] = useState(0);

  const authUser = useAuthStore((state) => state.authUser);
  const socketRef = useRef(null);
  const registrationRef = useRef(null);

  const register = useCallback((data) => {
    registrationRef.current = data;
    if (socketRef.current?.connected) socketRef.current.emit("register", data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (!authUser) return;

      const token = await getToken();
      if (!token || cancelled) return;

      const next = io(SOCKET_URL, {
        auth: { token },
        // Tunnels and some carrier networks break the websocket upgrade; the
        // web can stay websocket-only, a phone cannot.
        transports: ["websocket", "polling"],
        reconnection: true,
      });

      next.on("connect", () => {
        setIsConnected(true);
        setConnectionEpoch((epoch) => epoch + 1);
        if (registrationRef.current) next.emit("register", registrationRef.current);
      });
      next.on("disconnect", () => {
        setIsConnected(false);
        setIsRegistered(false);
      });
      next.on("connect_error", () => setIsConnected(false));
      next.on("registered", () => setIsRegistered(true));
      next.on("registration_error", () => setIsRegistered(false));

      socketRef.current = next;
      if (!cancelled) setSocket(next);
    }

    connect();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setIsRegistered(false);
    };
  }, [authUser?._id, authUser?.role]);

  // iOS suspends the socket within ~30s of backgrounding and does not always
  // fire a disconnect, so returning to the foreground has to force the issue.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status !== "active") return;
      const current = socketRef.current;
      if (current && !current.connected) current.connect();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => socketRef.current?.emit("ping"), 30000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, isRegistered, connectionEpoch, register }}
    >
      {children}
    </SocketContext.Provider>
  );
}
