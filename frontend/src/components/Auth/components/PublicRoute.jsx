import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

const PublicRoute = () => {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <Spinner fullScreen />;

  if (authUser?.role === "seller") {
    return <Navigate to="/seller/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
