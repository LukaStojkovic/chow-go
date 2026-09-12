/**
 * English catalog.
 *
 * Namespaces are separate modules so a screen imports the copy it needs by
 * name, and a change to the seller dashboard cannot conflict with checkout.
 *
 * They are `.js` rather than `.json` deliberately: Node's ESM loader needs an
 * `with { type: "json" }` import attribute that Metro's transform does not
 * accept, and the backend imports this catalog to render push copy. A plain
 * module is the one form all three bundlers agree on.
 *
 * `sr/index.js` must export exactly the same namespaces and keys -
 * `npm run check:locales` fails if the two ever drift.
 */

import auth from "./auth.js";
import basket from "./basket.js";
import common from "./common.js";
import courier from "./courier.js";
import discover from "./discover.js";
import errors from "./errors.js";
import order from "./order.js";
import profile from "./profile.js";
import restaurant from "./restaurant.js";
import seller from "./seller.js";
import validation from "./validation.js";

export default {
  auth,
  basket,
  common,
  courier,
  discover,
  errors,
  order,
  profile,
  restaurant,
  seller,
  validation,
};
