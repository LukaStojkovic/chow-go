/**
 * The lazy chunks behind the seller and courier sidebars, keyed by the path
 * that renders them.
 *
 * Keeping the loaders in one place lets the sidebar warm a chunk on hover:
 * a dynamic `import()` is cached by the module registry, so the `lazy()` call
 * a moment later resolves from memory and the screen appears without a
 * placeholder at all. The skeleton is the floor, not the usual case.
 */

export const routeChunks = {
  "/seller/dashboard": () => import("@/pages/seller/dashboard/SellerDashboard"),
  "/seller/orders": () => import("@/pages/seller/SellerOrders"),
  "/seller/menu": () => import("@/pages/seller/SellerMenu"),
  "/seller/analytics": () => import("@/pages/seller/SellerAnalytics"),
  "/seller/settings": () => import("@/pages/seller/SellerSettings"),
  "/courier/dashboard": () => import("@/pages/courier/CourierDashboard"),
  "/courier/orders": () => import("@/pages/courier/CourierOrders"),
  "/courier/profile": () => import("@/pages/courier/CourierProfile"),
};

/** Best effort: a failed warm-up is retried for real by `lazy()`. */
export function prefetchRoute(path) {
  routeChunks[path]?.().catch(() => {});
}
