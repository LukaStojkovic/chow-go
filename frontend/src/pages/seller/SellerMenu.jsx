import Modal from "@/components/Modal";
import { useTranslation } from "react-i18next";
import { AddMenuItemForm } from "@/components/Seller/forms/AddMenuItemForm";
import { EditMenuItemForm } from "@/components/Seller/forms/EditMenuItemForm";
import useDeleteMenuItem from "@/components/Seller/hooks/useDeleteMenuItem";
import useGetMenuItems from "@/components/Seller/hooks/useGetMenuItems";
import MenuItemCard from "@/components/Seller/MenuItemCard";
import MenuItemFilters from "@/components/Seller/MenuItemFilters";
import {
  useRestockAll,
  useSoldOutMenuItems,
} from "@/components/Seller/hooks/useMenuItemStock";
import { priceFilterScale } from "@/lib/priceFilter";
import { useCurrency } from "@/hooks/useCurrency";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";
import Spinner from "@/components/Spinner";

import { Button } from "@/components/ui/button";

import { DeleteModal } from "@/components/ui/DeleteModal";
import PaginationSelector from "@/components/ui/PaginationSelector";
import { useAuthStore } from "@/store/useAuthStore";
import { ListOrdered, PackageCheck, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";

export const SellerMenu = () => {
  const { t } = useTranslation(["seller", "errors", "common"]);
  const [openAddItemModal, setOpenAddItemModal] = useState(false);
  const [openDeleteMenuItem, setOpenDeleteMenuItem] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [selectedEditItem, setSelectedEditItem] = useState(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const currency = useCurrency();
  const priceMax = priceFilterScale(currency).max;
  const [tempPriceRange, setTempPriceRange] = useState(() => [0, priceMax]);
  const [availableOnly, setAvailableOnly] = useState(false);

  const [debouncedSearch] = useDebounce(searchInput, 500);
  const [debouncedPriceRange] = useDebounce(tempPriceRange, 300);

  const { authUser } = useAuthStore();
  const restaurantId = authUser?.restaurant?.[0]?._id;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, debouncedPriceRange, availableOnly]);

  const filters = useMemo(
    () => ({
      page,
      limit: 6,
      search: debouncedSearch.trim() || undefined,
      category: category === "all" ? undefined : category,
      minPrice: debouncedPriceRange[0] > 0 ? debouncedPriceRange[0] : undefined,
      maxPrice: debouncedPriceRange[1] < priceMax ? debouncedPriceRange[1] : undefined,
      available: availableOnly ? "true" : undefined,
    }),
    [page, debouncedSearch, category, debouncedPriceRange, priceMax, availableOnly],
  );

  const {
    menuItems,
    pagination,
    isLoading: isInitialLoading,
    isFetching,
    refetchMenu,
  } = useGetMenuItems(restaurantId, filters);

  const { deleteMenuItem, isDeleting } = useDeleteMenuItem();
  const [soldOutOnly, setSoldOutOnly] = useState(false);
  const { soldOut } = useSoldOutMenuItems(restaurantId);
  const { restockAll, progress, isRestocking } = useRestockAll(restaurantId);
  const visibleItems = soldOutOnly ? soldOut : menuItems;

  if (!restaurantId)
    return <div className="p-8 text-center">{t("errors:restaurant.notFound")}</div>;

  const handleOpenDeleteModal = (menuItem) => {
    setSelectedMenuItem(menuItem);
    setOpenDeleteMenuItem(true);
  };

  const handleOpenEditModal = (menuItem) => {
    setSelectedEditItem(menuItem);
    setOpenEditModal(true);
  };

  const handleDeleteSuccess = () => {
    setSelectedMenuItem(null);
    setOpenDeleteMenuItem(false);
    refetchMenu();
  };

  const handleDeleteMenuItem = () => {
    deleteMenuItem(
      { restaurantId, menuItemId: selectedMenuItem._id },
      { onSuccess: handleDeleteSuccess },
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <MenuItemFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        category={category}
        setCategory={setCategory}
        setAvailableOnly={setAvailableOnly}
        availableOnly={availableOnly}
        tempPriceRange={tempPriceRange}
        setTempPriceRange={setTempPriceRange}
        currency={currency}
      />

      <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
        <div className="mr-auto flex flex-wrap items-center gap-2">
          <Button
            variant={soldOutOnly ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            aria-pressed={soldOutOnly}
            onClick={() => setSoldOutOnly((value) => !value)}
          >
            {t("stock.filter")}
            <span className="tabular">({soldOut.length})</span>
          </Button>
          {soldOut.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={isRestocking}
              onClick={() => restockAll(soldOut)}
            >
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
              {progress
                ? t("stock.restocking", { done: progress.done, total: progress.total })
                : t("stock.restockAll")}
            </Button>
          )}
        </div>
        <Button asChild variant="ghost" size="lg" className="rounded-xl font-medium">
          <Link to="/seller/menu/arrange">
            <ListOrdered className="w-5 h-5 mr-2" />
            {t("menuLayout.open")}
          </Link>
        </Button>
        <Button
          onClick={() => setOpenAddItemModal(true)}
          variant="outline"
          size="lg"
          className="rounded-xl hover:text-primary border-primary text-primary hover:bg-primary-subtle hover:border-primary font-medium shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t("menu.addDish")}
        </Button>
      </div>

      <div className="min-h-96 relative">
        {isInitialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {visibleItems.length === 0 ? (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  {soldOutOnly ? t("stock.emptySoldOut") : t("menu.empty.title")}
                </div>
              ) : (
                visibleItems.map((item, index) => (
                  <MenuItemCard
                    key={item._id}
                    menuItem={item}
                    restaurantId={restaurantId}
                    index={index}
                    onDelete={() => handleOpenDeleteModal(item)}
                    onEdit={() => handleOpenEditModal(item)}
                  />
                ))
              )}
            </div>

            {isFetching && !isInitialLoading && !soldOutOnly && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-lg">
                <Spinner size="lg" />
              </div>
            )}
          </>
        )}
      </div>

      {!soldOutOnly && (
      <PaginationSelector
        pagination={pagination}
        page={page}
        setPage={setPage}
        isFetching={isFetching}
      />
      )}

      <Modal
        isOpen={openAddItemModal}
        onClose={() => setOpenAddItemModal(false)}
        title={t("menu.addDish")}
        description={t("menu.addDishHint")}
        size="xl"
      >
        <AddMenuItemForm
          onClose={() => setOpenAddItemModal(false)}
          onSuccess={refetchMenu}
        />
      </Modal>

      <Modal
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        title={t("menu.editDish")}
        description={t("menu.editDishHint")}
        size="xl"
      >
        <EditMenuItemForm
          menuItem={selectedEditItem}
          onClose={() => setOpenEditModal(false)}
          onSuccess={refetchMenu}
        />
      </Modal>

      <DeleteModal
        isOpen={openDeleteMenuItem}
        onClose={() => setOpenDeleteMenuItem(false)}
        title={t("menu.deleteDish")}
        description={t("menu.confirmDeleteNamed", { name: selectedMenuItem?.name })}
        onConfirm={handleDeleteMenuItem}
        isLoading={isDeleting}
      />
    </div>
  );
};
