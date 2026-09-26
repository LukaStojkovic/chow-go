import { useEffect } from "react";
import { Navigate } from "react-router-dom";

import Spinner from "@/components/Spinner";
import { useAuthStore } from "@/store/useAuthStore";

// Cosmetic only: every /api/admin route checks isAdmin itself and answers a
// non-admin with a 404.
export default function AdminRoute({ children }) {
  const { authUser, isCheckingAuth, openAuthModal } = useAuthStore();

  useEffect(() => {
    if (!authUser && !isCheckingAuth) openAuthModal();
  }, [authUser, isCheckingAuth, openAuthModal]);

  if (isCheckingAuth) return <Spinner fullScreen />;
  if (!authUser) return <Navigate to="/" replace />;
  if (!authUser.isAdmin) return <Navigate to="/" replace />;
  return children;
}
