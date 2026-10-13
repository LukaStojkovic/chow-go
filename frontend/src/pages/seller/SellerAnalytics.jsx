import { AlertCircle } from "lucide-react";
import { normalizeCurrency } from "@chowgo/shared/currency";

import useGetRestaurantAnalytics from "@/hooks/Restaurants/useGetRestaurantAnalytics";
import { useReportRange } from "@/hooks/SellerReports/useReportRange";
import { useExportOrdersCsv } from "@/hooks/SellerReports/useSellerReports";
import { useCurrency } from "@/hooks/useCurrency";
import { apiErrorMessage } from "@/lib/apiError";
import { useAuthStore } from "@/store/useAuthStore";
import { KpiGrid } from "@/components/Seller/Analytics/KpiGrid";
import { RangePicker } from "@/components/Seller/Analytics/RangePicker";
import { PeakHoursChart } from "@/components/Seller/Analytics/Charts/PeakHoursChart";
import { OrderBreakdownChart } from "@/components/Seller/Analytics/Charts/OrderBreakdownChart";
import { PaymentMethodChart } from "@/components/Seller/Analytics/Charts/PaymentMethodChart";
import { RevenueLineChart } from "@/components/Seller/Analytics/Charts/RevenueLineChart";
import { TopItemsSection } from "@/components/Seller/Analytics/TopItemsSection";
import { RecentRatingsSection } from "@/components/Seller/Analytics/RecentRatingsSection";
import { SellerAnalyticsSkeleton } from "@/components/skeletons/SellerSkeletons";

export const SellerAnalytics = () => {
  const { authUser } = useAuthStore();
  const restaurantId = authUser?.restaurant?.[0]?._id;
  const fallbackCurrency = useCurrency();
  const { todayKey, range, selected, request, setPreset, setCustom } = useReportRange();
  const exportCsv = useExportOrdersCsv();

  const { restaurantAnalytics, isLoadingAnalytics, isFetchingAnalytics, error } =
    useGetRestaurantAnalytics(restaurantId, request);

  const data = restaurantAnalytics?.data;
  const currency = data?.currency ? normalizeCurrency(data.currency) : fallbackCurrency;

  return (
    <div className="space-y-6">
      <RangePicker
        key={`${selected}:${range.from}:${range.to}`}
        range={range}
        selected={selected}
        todayKey={todayKey}
        onPreset={setPreset}
        onCustom={setCustom}
        onExport={() => exportCsv.mutate({ from: range.from, to: range.to })}
        isExporting={exportCsv.isPending}
      />

      {isLoadingAnalytics ? (
        <SellerAnalyticsSkeleton />
      ) : error || !data ? (
        <div className="p-4 bg-destructive-subtle border border-destructive rounded-xl flex items-center gap-3 text-destructive ">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{apiErrorMessage(error)}</p>
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${isFetchingAnalytics ? "opacity-60" : ""}`}>
          <KpiGrid summary={data.summary} currency={currency} />

          <RevenueLineChart series={data.series} granularity={(data.range ?? range).granularity} currency={currency} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PeakHoursChart data={data.peakHours} />
            <TopItemsSection items={data.topItems} currency={currency} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderBreakdownChart data={data.orderStatusBreakdown} />
            <PaymentMethodChart data={data.paymentMethodSplit} />
          </div>

          <RecentRatingsSection ratings={data.recentRatings} />
        </div>
      )}
    </div>
  );
};
