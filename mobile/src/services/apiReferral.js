import { api } from "@/api/client";

export async function getMyReferral() {
  const { data } = await api.get("/referrals/me");
  return data.data;
}

export async function applyReferralCode(code) {
  const { data } = await api.post("/referrals/apply", { code });
  return data.data;
}
