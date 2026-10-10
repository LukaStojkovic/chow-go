import { axiosInstance } from "@/lib/axios";

export async function getMyReferral() {
  const res = await axiosInstance.get("/referrals/me");
  return res.data.data;
}

export async function applyReferralCode(code) {
  const res = await axiosInstance.post("/referrals/apply", { code });
  return res.data.data;
}
