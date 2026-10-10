import * as menuLayoutService from "../services/menuLayout.service.js";

export async function getMenuLayout(req, res) {
  const layout = await menuLayoutService.getMenuLayout(req.user._id);
  res.status(200).json({ status: "success", data: layout });
}

export async function saveMenuLayout(req, res) {
  const layout = await menuLayoutService.saveMenuLayout(req.user._id, req.body);
  res.status(200).json({ status: "success", data: layout });
}
