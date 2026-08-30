import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useDarkMode } from "@/hooks/useDarkMode";
import BackNavbar from "@/components/Navbar/BackNavbar";
import ProfileHeader from "@/components/Profile/ProfileHeader";
import AccountSettings from "@/components/Profile/AccountSettings";
import SavedAddresses from "@/components/Profile/SavedAddresses";
import RecentOrders from "@/components/Profile/RecentOrders";
import Favorites from "@/components/Profile/Favorites";
import AddAddressModal from "@/components/Profile/AddAddressModal";
import Modal from "@/components/Modal";
import useAddDeliveryAddress from "@/hooks/DeliveryAddress/useAddDeliveryAddress";
import useGetDeliveryAddresses from "@/hooks/DeliveryAddress/useGetDeliveryAddresses";
import Spinner from "@/components/Spinner";
import useDeleteDeliveryAddress from "@/hooks/DeliveryAddress/useDeleteDeliveryAddress";
import useSetDefaultDeliveryAddress from "@/hooks/DeliveryAddress/useSetDefaultDeliveryAdress";
import { useGetCustomerOrders } from "@/hooks/Orders/useGetCustomerOrders";
import useGetFavourites from "@/hooks/Favourites/useGetFavourites";
import useToggleFavourite from "@/hooks/Favourites/useToggleFavourite";

import useUpdateDeliveryAddress from "@/hooks/DeliveryAddress/useUpdateDeliveryAddress";

export default function ProfilePage() {
  const { authUser, logout } = useAuthStore();
  const { isDark, toggle } = useDarkMode();
  const { addDeliveryAddressAsync, isAddingDeliveryAddress } =
    useAddDeliveryAddress();
  const { updateDeliveryAddressAsync, isUpdatingDeliveryAddress } =
    useUpdateDeliveryAddress();
  const { deliveryAddresses, isLoadingAddresses } = useGetDeliveryAddresses();
  const { setDefaultAddress, loadingAddressId: settingDefaultAddressId } =
    useSetDefaultDeliveryAddress();
  const { deleteAddress, loadingAddressId: deletingAddressId } =
    useDeleteDeliveryAddress();

  const navigate = useNavigate();
  const { orders, isLoadingOrders } = useGetCustomerOrders({ limit: 3 });
  const { favourites } = useGetFavourites();
  const { toggleFav, isTogglingFavourite } = useToggleFavourite();

  const [name, setName] = useState(authUser?.name || "Unknown Name");
  const [phone, setPhone] = useState(authUser?.phoneNumber || "Unkown Number");
  const [openAddAddressModal, setOpenAddAddressModal] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);

  const handleSetDefaultAddress = (id) => {
    setDefaultAddress({ addressId: id });
  };

  const handleDeleteAddress = (id) => {
    deleteAddress({ addressId: id });
  };

  const handleEditAddress = (address) => {
    setAddressToEdit(address);
    setOpenAddAddressModal(true);
  };

  const handleAddNewAddress = (data) => {
    if (addressToEdit) {
      updateDeliveryAddressAsync({ addressId: addressToEdit._id, data }).then(() => {
        setAddressToEdit(null);
        setOpenAddAddressModal(false);
      });
    } else {
      addDeliveryAddressAsync({ data }).then(() => {
        setOpenAddAddressModal(false);
      });
    }
  };

  const handleCloseAddressModal = () => {
    setOpenAddAddressModal(false);
    setTimeout(() => setAddressToEdit(null), 300); // clear after animation
  };

  const handleReorder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleViewAllOrders = () => {
    navigate("/orders");
  };

  const handleRemoveFavourite = (restaurantId) => {
    toggleFav(restaurantId);
  };

  if (isLoadingAddresses) return <Spinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 pb-20 transition-colors duration-300">
      <BackNavbar title="My Profile" />

      <main className="container mx-auto max-w-5xl px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="w-full lg:col-span-4 space-y-6">
            <ProfileHeader
              authUser={authUser}
              name={name}
              setName={setName}
              phone={phone}
              setPhone={setPhone}
            />

            <AccountSettings
              authUser={authUser}
              isDark={isDark}
              toggle={toggle}
              onLogout={logout}
            />
          </div>

          <div className="w-full lg:col-span-8 space-y-6">
            <SavedAddresses
              addresses={deliveryAddresses.data}
              onSetDefaultAddress={handleSetDefaultAddress}
              onAddNew={() => {
                setAddressToEdit(null);
                setOpenAddAddressModal(true);
              }}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              settingDefaultAddressId={settingDefaultAddressId}
              deletingAddressId={deletingAddressId}
            />

            <Modal
              isOpen={openAddAddressModal}
              onClose={handleCloseAddressModal}
              size="lg"
              title={addressToEdit ? "Edit address" : "Add new address"}
            >
              <AddAddressModal
                isOpen={openAddAddressModal}
                onSave={handleAddNewAddress}
                onClose={handleCloseAddressModal}
                isLoading={isAddingDeliveryAddress || isUpdatingDeliveryAddress}
                initialData={addressToEdit}
              />
            </Modal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RecentOrders
                orders={orders}
                onViewAll={handleViewAllOrders}
                onReorder={handleReorder}
                isLoading={isLoadingOrders}
              />

              <Favorites
                favourites={favourites}
                onRemoveFavourite={handleRemoveFavourite}
                isToggling={isTogglingFavourite}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
