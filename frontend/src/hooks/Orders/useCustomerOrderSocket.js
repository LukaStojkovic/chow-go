import { useSocket } from "@/contexts/SocketContext";

export const useCustomerOrderSocket = (orderId) => {
  const { isConnected } = useSocket();

  return { isConnected };
};
