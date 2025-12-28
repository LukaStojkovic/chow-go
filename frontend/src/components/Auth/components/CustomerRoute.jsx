import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Spinner from "@/components/Spinner";
import { useEffect } from "react";

const CustomerRoute = () => {
  const { authUser, isCheckingAuth, openAuthModal } = useAuthStore();

  useEffect(() => {
    if (!authUser && !isCheckingAuth) {
      openAuthModal();
    }
  }, [authUser, isCheckingAuth, openAuthModal]);

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
