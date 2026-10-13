import * as reports from "../services/sellerReports.service.js";
import { sendCsv } from "../utils/csv.js";

export async function exportOrders(req, res) {
  const { filename, body } = await reports.exportOrdersCsv(req.user._id, req.query, req.locale);
  sendCsv(res, filename, body);
}

export async function listPayouts(req, res) {
  res.status(200).json({ status: "success", data: await reports.listPayouts(req.user._id, req.query) });
}

export async function exportPayoutOrders(req, res) {
  const { filename, body } = await reports.payoutOrdersCsv(req.user._id, req.params.weekStart, req.locale);
  sendCsv(res, filename, body);
}

export async function getClosures(req, res) {
  res.status(200).json({ status: "success", data: await reports.getClosures(req.user._id) });
}

export async function setClosures(req, res) {
  res.status(200).json({ status: "success", data: await reports.setClosures(req.user._id, req.body?.closures) });
}
