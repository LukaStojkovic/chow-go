const SCALES = {
  RSD: { max: 5000, step: 50 },
};
const DEFAULT_SCALE = { max: 100, step: 1 };

export function priceFilterScale(currency) {
  return SCALES[currency] ?? DEFAULT_SCALE;
}
