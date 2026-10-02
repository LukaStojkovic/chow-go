import * as promoService from "../services/promoCode.service.js";

export async function validatePromo(req, res) {
  const data = await promoService.validateForCheckout({
    customerId: req.user._id,
    code: req.body?.code,
    restaurantId: req.body?.restaurantId,
  });
  res.status(200).json({ data });
}

export async function listMyVouchers(req, res) {
  res.status(200).json({ data: { vouchers: await promoService.listCustomerVouchers(req.user._id) } });
}

export async function listSellerPromos(req, res) {
  res.status(200).json(await promoService.listSellerPromos(req.user._id, req.query));
}

export async function createSellerPromo(req, res) {
  res.status(201).json({ data: await promoService.createSellerPromo(req.user._id, req.body) });
}

export async function updateSellerPromo(req, res) {
  res.status(200).json({ data: await promoService.updateSellerPromo(req.user._id, req.params.promoId, req.body) });
}

export async function setSellerPromoStatus(req, res) {
  res.status(200).json({
    data: await promoService.setSellerPromoStatus(req.user._id, req.params.promoId, req.body?.action),
  });
}

export async function sellerPromoStats(req, res) {
  res.status(200).json({ data: await promoService.sellerPromoStats(req.user._id, req.params.promoId) });
}
