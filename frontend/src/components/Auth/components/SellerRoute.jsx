import Spinner from "@/components/Spinner";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";

const SellerRoute = ({ children }) => {
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

  if (authUser.role !== "seller") {
    return <Navigate to="/discovery" replace />;
  }

  return children;
};

export default SellerRoute;
