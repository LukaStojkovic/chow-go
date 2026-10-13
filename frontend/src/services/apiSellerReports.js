import { axiosInstance } from "@/lib/axios";
import { filenameFromDisposition, saveBlob, withJsonErrorBody } from "@/lib/download";

async function downloadCsv(url, params, fallbackName) {
  try {
    const res = await axiosInstance.get(url, { params, responseType: "blob" });
    const filename = filenameFromDisposition(res.headers?.["content-disposition"], fallbackName);
    saveBlob(res.data, filename);
    return filename;
  } catch (err) {
    console.error("Error downloading CSV:", err);
    throw await withJsonErrorBody(err);
  }
}

export function downloadOrdersCsv({ from, to }) {
  return downloadCsv("/restaurant/reports/orders.csv", { from, to }, `orders_${from}_${to}.csv`);
}

export function downloadPayoutCsv(weekStart) {
  return downloadCsv(`/restaurant/payouts/${weekStart}/orders.csv`, undefined, `payout_${weekStart}.csv`);
}

export async function getPayouts(page = 1) {
  const res = await axiosInstance.get("/restaurant/payouts", { params: { page } });
  return res.data.data;
}

export async function getClosures() {
  const res = await axiosInstance.get("/restaurant/closures");
  return res.data.data;
}

export async function saveClosures(closures) {
  const res = await axiosInstance.put("/restaurant/closures", { closures });
  return res.data.data;
}
