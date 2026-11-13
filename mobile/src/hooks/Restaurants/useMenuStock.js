import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";
import { getMenuItems, setMenuItemStock } from "@/services/apiRestaurant";
import { useOwnRestaurantId } from "./useMenuItems";

const STOCK_KEY = ["menuStock"];
const LIST_KEY = ["menuItems"];

function nextMidnight(now = new Date()) {
  const date = new Date(now);
  date.setHours(24, 0, 0, 0);
  return date.toISOString();
}

export function applyStock(item, { available, until, optionId }) {
  const soldOutUntil = !available && until === "endOfDay" ? nextMidnight() : null;
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

function mapItems(data, menuItemId, update) {
  if (!data) return data;
  const patch = (list) =>
    list?.map((item) => (String(item._id) === String(menuItemId) ? update(item) : item));
  if (Array.isArray(data.pages)) {
    return {
      ...data,
      pages: data.pages.map((page) => (page ? { ...page, menuItems: patch(page.menuItems) } : page)),
    };
  }
  if (Array.isArray(data.menuItems)) return { ...data, menuItems: patch(data.menuItems) };
  return data;
}

export function useSetMenuItemStock() {
  const queryClient = useQueryClient();
  const restaurantId = useOwnRestaurantId();

  return useMutation({
    mutationKey: STOCK_KEY,
    mutationFn: ({ menuItemId, available, until, optionId }) =>
      setMenuItemStock(restaurantId, menuItemId, {
        available,
        ...(available ? {} : { until: until ?? "endOfDay" }),
        ...(optionId ? { optionId } : {}),
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY });
      const snapshot = queryClient.getQueriesData({ queryKey: LIST_KEY });
      queryClient.setQueriesData({ queryKey: LIST_KEY }, (data) =>
        mapItems(data, variables.menuItemId, (item) => applyStock(item, variables)),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: (menuItem, variables) => {
      if (!menuItem?._id) return;
      queryClient.setQueriesData({ queryKey: LIST_KEY }, (data) =>
        mapItems(data, variables.menuItemId, (item) => ({ ...item, ...menuItem })),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ["menuItem"] });
      queryClient.invalidateQueries({ queryKey: ["restaurantMenu", restaurantId] });
    },
  });
}

export function usePendingStock(menuItemId) {
  const pending = useMutationState({
    filters: { mutationKey: STOCK_KEY, status: "pending" },
    select: (mutation) => mutation.state.variables,
  });
  return pending.filter((variables) => String(variables?.menuItemId) === String(menuItemId));
}

export async function restockAllSoldOut(restaurantId, setStock, onProgress) {
  const first = await getMenuItems(restaurantId, { available: "false", page: 1, limit: 50 });
  const total = first?.pagination?.totalItems ?? first?.menuItems?.length ?? 0;
  let batch = first?.menuItems ?? [];
  let done = 0;
  onProgress?.(done, total);

  while (batch.length) {
    for (const item of batch) {
      await setStock({ menuItemId: item._id, available: true });
      done += 1;
      onProgress?.(done, Math.max(total, done));
    }
    const next = await getMenuItems(restaurantId, { available: "false", page: 1, limit: 50 });
    batch = (next?.menuItems ?? []).filter((item) => item.available === false);
    if (done >= total + 50) break;
  }
  return done;
}
