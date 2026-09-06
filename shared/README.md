# @chowgo/shared

Platform-neutral business logic consumed by both `frontend/` and `mobile/`.

Several of these modules mirror backend rules — `adapters/pricing.js` carries
the delivery, service and priority fees, `promotion.js` carries the discount
floor and ceiling. Duplicating them per client means a pricing change has to
land in three places and the failure mode is a wrong total on a customer's
screen, so they live here instead.

## Rules

- No React, no DOM, no `import.meta`, no icon libraries, no HTTP client.
  Anything here must run unchanged under Vite and under Metro/Hermes.
- Subpath exports only, no barrel: `format.js` and `geo.js` both export a
  `formatDistance` with deliberately different rounding, and a flat barrel
  would silently resolve one of them everywhere.
- `constants.js` holds taxonomy **data**. Category icons are string keys
  (`icon: "pizza"`); each client maps them to its own icon components —
  `lucide-react` on web, `lucide-react-native` on mobile.

## Usage

```js
import { formatPrice } from "@chowgo/shared/format";
import { buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
```
