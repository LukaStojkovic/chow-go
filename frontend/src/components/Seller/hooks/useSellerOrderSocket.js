import { useSocket } from "@/contexts/SocketContext";

export const useSellerOrderSocket = (restaurantId) => {
  const { isConnected } = useSocket();

  return { isConnected };
};
