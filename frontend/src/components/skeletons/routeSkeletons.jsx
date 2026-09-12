/**
 * Maps a seller/courier pathname to the placeholder for that screen.
 *
 * The layouts use this as the Suspense fallback for the outlet, which is what
 * keeps the sidebar, header and duty toggle on screen while a route chunk
 * downloads - previously the whole app unmounted behind one full-screen
 * spinner on every sidebar click.
 */

import {
  SellerAnalyticsSkeleton,
  SellerDashboardSkeleton,
  SellerMenuSkeleton,
  SellerOrdersSkeleton,
  SellerSettingsSkeleton,
} from "@/components/skeletons/SellerSkeletons";
import {
  CourierDashboardSkeleton,
  CourierDeliverySkeleton,
  CourierOrdersSkeleton,
  CourierProfileSkeleton,
} from "@/components/skeletons/CourierSkeletons";

const ROUTE_SKELETONS = [
  ["/seller/dashboard", SellerDashboardSkeleton],
  ["/seller/orders", SellerOrdersSkeleton],
  ["/seller/menu", SellerMenuSkeleton],
  ["/seller/analytics", SellerAnalyticsSkeleton],
  ["/seller/settings", SellerSettingsSkeleton],
  ["/courier/dashboard", CourierDashboardSkeleton],
  ["/courier/orders", CourierOrdersSkeleton],
  ["/courier/delivery", CourierDeliverySkeleton],
  ["/courier/profile", CourierProfileSkeleton],
];

/**
 * @param {Object} props
 * @param {string} props.pathname
 * @param {React.ComponentType} [props.fallback] Used for a path with no entry -
 *   the index redirects, mainly.
 */
export function RouteSkeleton({ pathname, fallback: Fallback = null }) {
  const match = ROUTE_SKELETONS.find(([prefix]) => pathname.startsWith(prefix));
  if (!match) return Fallback ? <Fallback /> : null;

  const [, Skeleton] = match;
  return <Skeleton />;
}
