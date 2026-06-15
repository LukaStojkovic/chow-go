import L from "leaflet";

function createLabeledIcon({
  emoji,
  bg,
  shadow,
  label,
  size = 36,
  pulse = false,
}) {
  const half = size / 2;
  const pulseRing = pulse
    ? `<span style="
        position:absolute;inset:-4px;border-radius:50%;
        border:2.5px solid ${bg};opacity:.45;
        animation:markerPing 1.8s cubic-bezier(0,0,.2,1) infinite;
      "></span>`
    : "";

  const html = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
      ${pulseRing}
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${bg};
        border:3px solid #fff;
        box-shadow:0 2px 8px ${shadow}, 0 0 0 2px ${bg}33;
        display:flex;align-items:center;justify-content:center;
        font-size:${size * 0.44}px;line-height:1;
      ">${emoji}</div>
      <span style="
        margin-top:3px;
        padding:1px 6px;
        border-radius:6px;
        background:${bg};
        color:#fff;
        font-size:10px;
        font-weight:700;
        letter-spacing:.3px;
        white-space:nowrap;
        box-shadow:0 1px 4px ${shadow};
        text-transform:uppercase;
      ">${label}</span>
    </div>`;

  return new L.DivIcon({
    className: "",
    html,
    iconSize: [size, size + 18],
    iconAnchor: [half, half],
    popupAnchor: [0, -(half + 4)],
  });
}

if (
  typeof document !== "undefined" &&
  !document.getElementById("marker-ping-style")
) {
  const style = document.createElement("style");
  style.id = "marker-ping-style";
  style.textContent = `
    @keyframes markerPing {
      0%   { transform:scale(1);   opacity:.55; }
      75%  { transform:scale(1.8); opacity:0;   }
      100% { transform:scale(1.8); opacity:0;   }
    }`;
  document.head.appendChild(style);
}

export const restaurantIcon = createLabeledIcon({
  emoji: "🍽️",
  bg: "#10b981",
  shadow: "rgba(16,185,129,.35)",
  label: "Restaurant",
});

export const deliveryIcon = createLabeledIcon({
  emoji: "📍",
  bg: "#ef4444",
  shadow: "rgba(239,68,68,.35)",
  label: "Drop-off",
});

export const courierIcon = createLabeledIcon({
  emoji: "🛵",
  bg: "#3b82f6",
  shadow: "rgba(59,130,246,.35)",
  label: "Courier",
  pulse: true,
});
