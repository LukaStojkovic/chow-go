import L from "leaflet";

/**
 * Leaflet map markers.
 *
 * Leaflet's `DivIcon` takes an HTML string, so these cannot use React icon
 * components - the glyphs are inlined as SVG paths taken from the same Lucide
 * set the rest of the product uses, at the same 2px stroke width. Emoji were
 * the previous approach and rendered differently on every platform, could not
 * inherit the marker colour, and were announced by their unicode name.
 *
 * Colours are read from the CSS custom properties so markers follow the theme
 * rather than pinning three more literal hex values into the product.
 */

/** Lucide `utensils-crossed`, `map-pin` and `bike`, as inline path data. */
const GLYPHS = {
  restaurant:
    '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="M2.1 21.8 13 11"/><path d="m9 8-1.8 1.8"/>',
  dropoff:
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  courier:
    '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
};

/**
 * Read a theme token, with a fallback for the brief window before the
 * stylesheet has applied.
 *
 * @param {string} name
 * @param {string} fallback
 */
function token(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value.trim() || fallback;
}

/**
 * @param {Object} options
 * @param {keyof typeof GLYPHS} options.glyph
 * @param {string} options.bg
 * @param {string} options.shadow
 * @param {string} options.label Rendered under the pin and used as its title.
 * @param {number} [options.size]
 * @param {boolean} [options.pulse] Only the live courier marker pulses.
 */
function createLabeledIcon({ glyph, bg, shadow, label, size = 36, pulse = false }) {
  const half = size / 2;
  const surface = token("--card", "#ffffff");

  const pulseRing = pulse
    ? `<span aria-hidden="true" style="
        position:absolute;inset:-4px;border-radius:50%;
        border:2.5px solid ${bg};opacity:.45;
        animation:markerPing 1.8s cubic-bezier(0,0,.2,1) infinite;
      "></span>`
    : "";

  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(size * 0.5)}" height="${Math.round(size * 0.5)}" viewBox="0 0 24 24" fill="none" stroke="${surface}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[glyph]}</svg>`;

  const html = `
    <div role="img" aria-label="${label}" title="${label}" style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
      ${pulseRing}
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${bg};
        border:3px solid ${surface};
        box-shadow:0 2px 8px ${shadow};
        display:flex;align-items:center;justify-content:center;
      ">${icon}</div>
      <span aria-hidden="true" style="
        margin-top:3px;
        padding:1px 6px;
        border-radius:6px;
        background:${bg};
        color:${surface};
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

if (typeof document !== "undefined" && !document.getElementById("marker-ping-style")) {
  const style = document.createElement("style");
  style.id = "marker-ping-style";
  // Suppressed under reduced motion: a marker that never stops moving is
  // exactly the kind of animation that rule exists for.
  style.textContent = `
    @keyframes markerPing {
      0%   { transform:scale(1);   opacity:.55; }
      75%  { transform:scale(1.8); opacity:0;   }
      100% { transform:scale(1.8); opacity:0;   }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes markerPing { 0%,100% { transform:scale(1); opacity:.45; } }
    }`;
  document.head.appendChild(style);
}

export const restaurantIcon = createLabeledIcon({
  glyph: "restaurant",
  bg: token("--primary", "#0e7a4b"),
  shadow: "rgba(14,122,75,.35)",
  label: "Restaurant",
});

export const deliveryIcon = createLabeledIcon({
  glyph: "dropoff",
  bg: token("--destructive", "#c4342b"),
  shadow: "rgba(196,52,43,.35)",
  label: "Drop-off",
});

export const courierIcon = createLabeledIcon({
  glyph: "courier",
  bg: token("--info", "#1e6fa8"),
  shadow: "rgba(30,111,168,.35)",
  label: "Courier",
  pulse: true,
});
