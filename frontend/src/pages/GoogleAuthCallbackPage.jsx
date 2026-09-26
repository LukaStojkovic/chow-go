import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

const SETTINGS_BY_ROLE = {
  seller: "/seller/settings",
  courier: "/courier/profile",
  customer: "/profile",
};

const LINK_ERRORS = {
  link_expired: "profile:account.googleLinkExpired",
  already_linked: "profile:account.googleAlreadyLinked",
  google_in_use: "profile:account.googleInUse",
};

export default function GoogleAuthCallbackPage() {
  const { t } = useTranslation(["auth", "common", "profile"]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    const newUser = searchParams.get("newUser");
    const linked = searchParams.get("linked");
    const linkError = searchParams.get("linkError");

    if (linked === "true" || linkError) {
      checkAuth().then((user) => {
        if (linkError) {
          toast.error(t("profile:account.googleLinkFailed"), {
            description: t(LINK_ERRORS[linkError] ?? "profile:account.googleLinkExpired"),
          });
        } else {
          toast.success(t("profile:account.googleLinked"));
        }
        navigate(user ? SETTINGS_BY_ROLE[user.role] ?? "/profile" : "/", { replace: true });
      });
      return;
    }

    if (error) {
      if (error === "account_exists") toast.error(t("google.accountExists"));
      else if (error === "email_unverified") toast.error(t("google.emailUnverified"));
      else if (error === "account_suspended") toast.error(t("google.accountSuspended"));
      else toast.error(t("google.webFailed"));
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
