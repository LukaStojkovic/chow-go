import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

const CustomerRoute = () => {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <Spinner fullScreen />;

  if (!authUser) {
    return <Navigate to="/" replace />;
  }

  if (authUser.role !== "customer") {
    return <Navigate to="/seller/dashboard" replace />;
  }

  return <Outlet />;
};

export default CustomerRoute;
