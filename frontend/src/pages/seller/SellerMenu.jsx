import Modal from "@/components/Modal";
import { AddMenuItemForm } from "@/components/Seller/forms/AddMenuItemForm";
import { EditMenuItemForm } from "@/components/Seller/forms/EditMenuItemForm";
import useDeleteMenuItem from "@/components/Seller/hooks/useDeleteMenuItem";
import useGetMenuItems from "@/components/Seller/hooks/useGetMenuItems";
import MenuItemCard from "@/components/Seller/MenuItemCard";
import MenuItemFilters from "@/components/Seller/MenuItemFilters";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";
import Spinner from "@/components/Spinner";

import { Button } from "@/components/ui/button";

import { DeleteModal } from "@/components/ui/DeleteModal";
import PaginationSelector from "@/components/ui/PaginationSelector";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";

export const SellerMenu = () => {
  const [openAddItemModal, setOpenAddItemModal] = useState(false);
  const [openDeleteMenuItem, setOpenDeleteMenuItem] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [selectedEditItem, setSelectedEditItem] = useState(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const [tempPriceRange, setTempPriceRange] = useState([0, 200]);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [availableOnly, setAvailableOnly] = useState(false);

  const [debouncedSearch] = useDebounce(searchInput, 500);
  const [debouncedPriceRange] = useDebounce(tempPriceRange, 300);

  const { authUser } = useAuthStore();
  const restaurantId = authUser?.restaurant[0]?._id;

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
      maxPrice:
        debouncedPriceRange[1] < 3000 ? debouncedPriceRange[1] : undefined,
      available: availableOnly ? "true" : undefined,
    }),
    [page, debouncedSearch, category, debouncedPriceRange, availableOnly],
  );

  const {
    menuItems,
    pagination,
    isLoading: isInitialLoading,
    isFetching,
    refetchMenu,
  } = useGetMenuItems(restaurantId, filters);

  const { deleteMenuItem, isDeleting } = useDeleteMenuItem();

  if (!restaurantId)
    return <div className="p-8 text-center">Restaurant not found.</div>;

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
        setPriceRange={setPriceRange}
      />

      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setOpenAddItemModal(true)}
          variant="outline"
          size="lg"
          className="rounded-xl hover:text-emerald-600 border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-700 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/30 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Menu Item
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
              {menuItems.length === 0 ? (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  No menu items found.
                </div>
              ) : (
                menuItems.map((item, index) => (
                  <MenuItemCard
                    key={item._id}
                    menuItem={item}
                    index={index}
                    onDelete={() => handleOpenDeleteModal(item)}
                    onEdit={() => handleOpenEditModal(item)}
                  />
                ))
              )}
            </div>

            {isFetching && !isInitialLoading && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-lg">
                <Spinner size="lg" />
              </div>
            )}
          </>
        )}
      </div>

      <PaginationSelector
        pagination={pagination}
        page={page}
        setPage={setPage}
        isFetching={isFetching}
      />

      <Modal
        isOpen={openAddItemModal}
        onClose={() => setOpenAddItemModal(false)}
        title="Add Menu Item"
        description="Fill out the form below to add a new item to your menu."
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
        title="Edit Menu Item"
        description="Update the details of your menu item."
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
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${selectedMenuItem?.name}"?`}
        onConfirm={handleDeleteMenuItem}
        isLoading={isDeleting}
      />
    </div>
  );
};
