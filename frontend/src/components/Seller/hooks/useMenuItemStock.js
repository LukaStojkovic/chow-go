import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";
import { isInStock, soldOutOptionCount } from "@chowgo/shared/stock";

import { getAllMenuItems, setMenuItemStock } from "@/services/apiRestaurant";

export const stockListKey = (restaurantId) => ["menuItems", restaurantId, "stock"];

function nextMidnight(now = new Date()) {
  const date = new Date(now);
  date.setHours(24, 0, 0, 0);
  return date.toISOString();
}

function applyStock(item, { available, until, optionId }) {
  const soldOutUntil = available || until === "indefinite" ? null : nextMidnight();
  if (!optionId) return { ...item, available, soldOutUntil };
  return {
    ...item,
    optionGroups: (item.optionGroups ?? []).map((group) => ({
      ...group,
      options: (group.options ?? []).map((option) =>
        String(option._id) === String(optionId) ? { ...option, available, soldOutUntil } : option,
      ),
    })),
  };
}

function patchItem(queryClient, restaurantId, menuItemId, update) {
  queryClient.setQueriesData({ queryKey: ["menuItems", restaurantId] }, (data) => {
    if (!Array.isArray(data?.menuItems)) return data;
    return {
      ...data,
      menuItems: data.menuItems.map((item) => (item._id === menuItemId ? update(item) : item)),
    };
  });
}

export function useMenuItemStock(restaurantId) {
  const queryClient = useQueryClient();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: ({ menuItemId, available, until, optionId }) =>
      setMenuItemStock(restaurantId, menuItemId, {
        available,
        ...(available ? {} : { until: until ?? "endOfDay" }),
        ...(optionId ? { optionId } : {}),
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["menuItems", restaurantId] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["menuItems", restaurantId] });
      patchItem(queryClient, restaurantId, input.menuItemId, (item) => applyStock(item, input));
      return { snapshot };
    },
    onSuccess: (menuItem, { menuItemId }) => {
      if (menuItem?._id) patchItem(queryClient, restaurantId, menuItemId, () => menuItem);
    },
    onError: (error, _input, context) => {
      for (const [key, data] of context?.snapshot ?? []) queryClient.setQueryData(key, data);
      toast.error(error?.response?.data?.message || t("seller:stock.failed"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-menu"] });
    },
  });

  return { setStock: mutate, isPending, pendingOptionId: isPending ? variables?.optionId : undefined };
}

export const isSoldOutAnywhere = (item, now = new Date()) =>
  !isInStock(item, now) || soldOutOptionCount(item, now) > 0;

export function useSoldOutMenuItems(restaurantId) {
  const { data, isLoading } = useQuery({
    queryKey: stockListKey(restaurantId),
    queryFn: () => getAllMenuItems(restaurantId),
    enabled: Boolean(restaurantId),
  });
  const soldOut = (data?.menuItems ?? []).filter((item) => isSoldOutAnywhere(item));
  return { soldOut, isLoading };
}

export function useRestockAll(restaurantId) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(null);

  const restockAll = async (items) => {
    const now = new Date();
    const jobs = items.flatMap((item) => [
      ...(isInStock(item, now) ? [] : [{ menuItemId: item._id }]),
      ...(item.optionGroups ?? []).flatMap((group) =>
        (group.options ?? [])
          .filter((option) => !isInStock(option, now))
          .map((option) => ({ menuItemId: item._id, optionId: option._id })),
      ),
    ]);
    if (jobs.length === 0) return;

    let failed = 0;
    setProgress({ done: 0, total: jobs.length });
    for (const [index, job] of jobs.entries()) {
      try {
        await setMenuItemStock(restaurantId, job.menuItemId, {
          available: true,
          ...(job.optionId ? { optionId: job.optionId } : {}),
        });
      } catch {
        failed += 1;
      }
      setProgress({ done: index + 1, total: jobs.length });
    }
    setProgress(null);
    queryClient.invalidateQueries({ queryKey: ["menuItems", restaurantId] });
    queryClient.invalidateQueries({ queryKey: ["restaurant-menu"] });
    if (failed) toast.error(t("seller:stock.restockFailed", { count: failed }));
    else toast.success(t("seller:stock.restocked"));
  };

  return { restockAll, progress, isRestocking: progress !== null };
}
