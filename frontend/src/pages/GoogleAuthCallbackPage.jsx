import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { GoogleRoleSelection } from "@/components/Auth/forms/GoogleRoleSelection";

function navigateByRole(role, navigate) {
  if (role === "seller") {
    navigate("/seller/dashboard", { replace: true });
  } else if (role === "courier") {
    navigate("/courier/dashboard", { replace: true });
  } else {
    navigate("/discovery", { replace: true });
  }
}

export default function GoogleAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    const newUser = searchParams.get("newUser");

    if (error) {
      toast.error("Google authentication failed. Please try again.");
      navigate("/", { replace: true });
      return;
    }

    if (newUser === "true") {
      setShowRoleSelection(true);
      setLoading(false);
      return;
    }

    if (success === "true") {
      checkAuth().then((user) => {
        navigateByRole(user?.role, navigate);
      });
      return;
    }

    navigate("/", { replace: true });
  }, [searchParams, navigate, checkAuth]);

  if (loading) {
    return <Spinner fullScreen />;
  }

  if (showRoleSelection) {
    return <GoogleRoleSelection />;
  }

  return <Spinner fullScreen />;
}
