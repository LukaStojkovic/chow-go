import * as referralService from "../services/referral.service.js";

export async function getMyReferral(req, res) {
  const data = await referralService.getMyReferral(req.user);
  res.status(200).json({ status: "success", data });
}

export async function applyReferralCode(req, res) {
  const data = await referralService.applyReferralCode(req.user, req.body?.code);
  res.status(201).json({ status: "success", data });
}
