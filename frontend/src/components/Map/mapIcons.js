import L from "leaflet";

export const restaurantIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2.5px solid #fff;box-shadow:0 0 0 2px #10b981;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const deliveryIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2.5px solid #fff;box-shadow:0 0 0 2px #ef4444;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const courierIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 2px #3b82f6;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
