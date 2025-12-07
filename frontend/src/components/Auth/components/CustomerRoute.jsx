import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Spinner from "@/components/Spinner";

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
