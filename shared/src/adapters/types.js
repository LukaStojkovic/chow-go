/**
 * View-model contracts for the customer app.
 *
 * These describe what components are allowed to read. Raw API documents never
 * reach a component directly - they pass through `lib/adapters/*` first, which
 * is the only place in the frontend permitted to know that
 * `restaurant.images[0]` is the cover photo or that a delivery fee is not
 * stored on the Restaurant document at all.
 *
 * JSDoc rather than TypeScript: the project is plain JSX and adding a TS
 * toolchain mid-redesign buys nothing here. Editors still typecheck these.
 *
 * @module adapters/types
 */

/**
 * @typedef {"open" | "closed" | "unavailable"} RestaurantAvailability
 * `unavailable` means the seller has deactivated the restaurant entirely -
 * distinct from being outside opening hours.
 */

/**
 * @typedef {Object} RestaurantView
 * @property {string} id
 * @property {string} name
 * @property {string} cuisine            Human-readable, e.g. "Fast food".
 * @property {string} cuisineSlug        Raw enum value, for filtering.
 * @property {string} description
 * @property {string | null} coverImage
 * @property {string | null} logo
 * @property {string[]} gallery
 * @property {number | null} rating      `null` when nobody has rated it yet.
 * @property {number} reviewCount
 * @property {string} deliveryEstimate   e.g. "30-45 min".
 * @property {number} deliveryFee        Platform flat fee - see pricing.js.
 * @property {number | null} minOrder    `null` - not modelled on the backend.
 * @property {number | null} distance    Metres. Only the nearby feed has this.
 * @property {RestaurantAvailability} availability
 * @property {boolean} isOpen
 * @property {string | null} phone
 * @property {AddressView | null} address
 * @property {WeeklySchedule | null} schedule
 */

/**
 * @typedef {Object} AddressView
 * @property {string} street
 * @property {string} city
 * @property {string | null} zipCode
 * @property {string | null} country
 * @property {string} oneLine
 */

/**
 * @typedef {Object} DayScheduleView
 * @property {string} day       Lower-case key, e.g. "monday".
 * @property {string} label     Display label, e.g. "Monday".
 * @property {boolean} isOpen
 * @property {string} opens     "HH:MM".
 * @property {string} closes    "HH:MM".
 * @property {boolean} isToday
 */

/**
 * @typedef {DayScheduleView[]} WeeklySchedule
 */

/**
 * @typedef {Object} DishView
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} price       Current price, promotion already applied.
 * @property {number | null} basePrice      Struck-through price, or null.
 * @property {number} discountPercent       0 when nothing is off.
 * @property {string | null} promoLabel     Seller copy for the deal badge.
 * @property {string} category
 * @property {string} categoryLabel
 * @property {string | null} image
 * @property {string[]} images
 * @property {boolean} isAvailable
 * @property {string | null} restaurantId
 * @property {string | null} restaurantName
 * @property {string | null} restaurantLogo
 */

/**
 * @typedef {Object} MenuSectionView
 * @property {string} id        Slug, used as the scroll anchor.
 * @property {string} label
 * @property {DishView[]} items
 * @property {number} availableCount
 */

/**
 * @typedef {Object} BasketLineView
 * @property {string} id            The menu item id - the cart's identity key.
 * @property {string} name
 * @property {string} description
 * @property {number} unitPrice
 * @property {number | null} baseUnitPrice  Undiscounted unit price, or null.
 * @property {number} savings               Amount off across the whole line.
 * @property {number} quantity
 * @property {number} lineTotal
 * @property {string | null} image
 * @property {string | null} notes
 */

/**
 * @typedef {Object} PriceBreakdownView
 * @property {number} subtotal
 * @property {number} deliveryFee
 * @property {number} serviceFee
 * @property {number} priorityFee
 * @property {number} tip
 * @property {number} discount
 * @property {number} tax
 * @property {number} total
 */

/**
 * @typedef {Object} OrderStepView
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {"complete" | "current" | "upcoming"} state
 * @property {string | null} at   ISO timestamp, when the step has happened.
 */

/**
 * @typedef {Object} OrderView
 * @property {string} id
 * @property {string} number
 * @property {string} status
 * @property {string} statusLabel
 * @property {string} statusDescription
 * @property {"pending" | "active" | "delivered" | "cancelled"} lifecycle
 * @property {boolean} isTerminal
 * @property {boolean} canCancel
 * @property {boolean} canReorder
 * @property {boolean} canRate
 * @property {string} placedAt
 * @property {string | null} etaAt
 * @property {BasketLineView[]} items
 * @property {number} itemCount
 * @property {PriceBreakdownView} pricing
 * @property {string} paymentMethod
 * @property {string} paymentMethodLabel
 * @property {RestaurantView | null} restaurant
 * @property {CourierView | null} courier
 * @property {string | null} deliveryAddress
 * @property {string | null} notes
 * @property {string | null} cancellationReason
 * @property {OrderStepView[]} steps
 */

/**
 * @typedef {Object} CourierView
 * @property {string} id
 * @property {string} name
 * @property {string | null} avatar
 * @property {string | null} phone
 * @property {string | null} vehicle
 * @property {number | null} rating
 */

export {};
