import Modal from "@/components/Modal";
import { AddMenuItemForm } from "@/components/Seller/forms/AddMenuItemForm";
import useDeleteMenuItem from "@/components/Seller/hooks/useDeleteMenuItem";
import useGetMenuItems from "@/components/Seller/hooks/useGetMenuItems";
import Spinner from "@/components/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteModal } from "@/components/ui/DeleteModal";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Edit2, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const SellerMenu = () => {
  const [openAddItemModal, setOpenAddItemModal] = useState(false);
  const [openDeleteMenuItem, setOpenDeleteMenuItem] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  const { authUser } = useAuthStore();
  const restaurantId = authUser.restaurant._id;
  const { data: menuItems, isLoading } = useGetMenuItems(restaurantId);
  const { deleteMenuItem, isDeleting } = useDeleteMenuItem();

  if (isLoading) return <Spinner fullScreen />;

  function handleOpenDeleteModal(menuItem) {
    setSelectedMenuItem(menuItem);
    setOpenDeleteMenuItem(true);
  }

  function handleDeleteMenuItem() {
    deleteMenuItem({ restaurantId, menuItemId: selectedMenuItem._id });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="default">All Items</Button>
          <Button variant="outline">Out of Stock</Button>
          <Button variant="outline">Category</Button>
        </div>
        <Button onClick={() => setOpenAddItemModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card
            key={item._id}
            className="group overflow-hidden border-border/60 bg-card hover:shadow-xl transition-all duration-300"
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={item.imageUrls?.[0]}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              <Badge
                variant="secondary"
                className="absolute top-3 left-3 uppercase text-xs tracking-wide"
              >
                {item.category}
              </Badge>

              <Badge
                className={`absolute top-3 right-3  ${
                  item.available ? "bg-emerald-600" : "bg-destructive"
                }`}
              >
                {item.available ? "Available" : "Sold Out"}
              </Badge>
            </div>

            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-lg leading-tight line-clamp-1">
                  {item.name}
                </h3>
                <span className="font-bold text-emerald-600 whitespace-nowrap">
                  ${item.price}
                </span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description || "No description provided."}
              </p>

              <div className="flex items-center justify-between pt-4">
                <div
                  className={`flex items-center gap-2 text-sm font-medium ${
                    item.available ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {item.available ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {item.available ? "In stock" : "Out of stock"}
                </div>

                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted hover:text-black dark:hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="hover:bg-red-700 bg-transparent hover:text-white text-red-500"
                    onClick={() => handleOpenDeleteModal(item)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={openAddItemModal}
        onClose={() => setOpenAddItemModal(false)}
        title="Add New Menu Item"
        description="Fill in the details to add a new dish to your menu"
        size="xl"
      >
        <AddMenuItemForm onClose={() => setOpenAddItemModal(false)} />
      </Modal>

      <DeleteModal
        isOpen={openDeleteMenuItem}
        onClose={() => setOpenDeleteMenuItem(false)}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${selectedMenuItem?.name}"? This action cannot be undone.`}
        onConfirm={() => handleDeleteMenuItem(selectedMenuItem)}
      />
    </div>
  );
};
