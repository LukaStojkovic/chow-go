import Spinner from "@/components/Spinner";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate, Outlet } from "react-router-dom";

const SellerRoute = () => {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <Spinner fullScreen />;

  if (!authUser) {
    return <Navigate to="/" replace />;
  }

  if (authUser.role !== "seller") {
    return <Navigate to="/discovery" replace />;
  }

  return <Outlet />;
};

export default SellerRoute;
