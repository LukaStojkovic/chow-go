import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export async function checkAuth() {
  try {
    const response = await axiosInstance.get("/auth/check");

    return response.data;
  } catch (err) {
    console.error("Error checking auth:", err);
  }
}

export async function registerUser(data) {
  try {
    const response = await axiosInstance.post("/auth/register", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    toast.success(t("auth:register.accountCreated"));
    return response.data;
  } catch (err) {
    console.error("Error registerUser:", err);
    toast.error(err.response?.data?.message || t("auth:register.registrationFailed"));
  }
}

export async function loginUser(data) {
  try {
    const response = await axiosInstance.post("/auth/login", data);
    toast.success(t("auth:register.loginSuccess"));
    return response.data;
  } catch (err) {
    console.error("Error loginUser:", err);
    toast.error(err.response?.data?.message);
  }
}

export async function registerCourier(data) {
  try {
    const response = await axiosInstance.post("/auth/register/courier", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    toast.success(t("auth:register.courierSubmitted"));
    return response.data;
  } catch (err) {
    console.error("Error registerCourier:", err);
    toast.error(err.response?.data?.message || t("auth:register.registrationFailed"));
  }
}

export async function logoutUser() {
  try {
    const response = await axiosInstance.post("/auth/logout");
    toast.success(response.data.message);
    return response.data;
  } catch (err) {
    console.error("Error logoutUser:", err);
    toast.error(t("auth:register.logoutFailed"));
  }
}

export async function apiDeleteAccount(password) {
  const res = await axiosInstance.delete("/auth/account", {
    data: password ? { password } : {},
  });
  return res.data;
}

export async function apiForgotPassword(email) {
  const res = await axiosInstance.post("/auth/forgot-password", { email });
  return res.data;
}

export async function apiVerifyOtp(email, code) {
  const res = await axiosInstance.post("/auth/verify-otp", { email, code });
  return res.data;
}

// verify-otp now returns a single-use resetToken instead of flipping a sticky
// flag on the user, so reset-password identifies the account by that token
// rather than by an email anyone can supply.
export async function apiResetPassword(resetToken, password) {
  const res = await axiosInstance.post("/auth/reset-password", {
    resetToken,
    newPassword: password,
  });
  return res.data;
}

export async function updateProfile(data) {
  try {
    const isFormData = data instanceof FormData;
    const res = await axiosInstance.put(
      "/auth/update-profile",
      data,
      isFormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined,
    );
    toast.success(t("auth:register.profileUpdated"));
    return res.data;
  } catch (err) {
    console.error("Error updateProfile:", err);
    toast.error(err.response?.data?.message);
  }
}

export async function completeGoogleProfile(data) {
  try {
    const isFormData = data instanceof FormData;
    const response = await axiosInstance.post(
      "/auth/google/complete-profile",
      data,
      isFormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined,
    );
    toast.success(t("auth:register.accountCreated"));
    return response.data;
  } catch (err) {
    console.error("Error completeGoogleProfile:", err);
    toast.error(err.response?.data?.message || t("auth:register.profileCompletionFailed"));
    throw err;
  }
}
