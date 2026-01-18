import React, { useState } from "react";
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

const MOCK_ADDRESSES = [
  {
    id: 1,
    label: "Home",
    address: "Bulevar Nemanjića 12, Niš",
    type: "home",
    isDefault: true,
  },
  {
    id: 2,
    label: "Office",
    address: "Obrenovićeva 45, Niš",
    type: "work",
    isDefault: false,
  },
];

const MOCK_ORDERS = [
  {
    id: "ORD-7721",
    restaurant: "Burger House",
    date: "Today, 14:30",
    total: "1.250 RSD",
    status: "Delivered",
    items: "2x Smash Burger, 1x Fries",
  },
  {
    id: "ORD-7720",
    restaurant: "Pizza Bar",
    date: "Yesterday, 20:15",
    total: "980 RSD",
    status: "Delivered",
    items: "1x Capricciosa 32cm",
  },
];

const MOCK_FAVORITES = [
  { id: 1, name: "Sushi Star", rating: 4.8, img: "🍣", category: "Japanese" },
  { id: 2, name: "Walter BBQ", rating: 4.9, img: "🍖", category: "Balkan" },
];

export default function ProfilePage() {
  const { authUser, logout } = useAuthStore();
  const { isDark, toggle } = useDarkMode();
  const { addDeliveryAddress, isAddingDeliveryAddress } =
    useAddDeliveryAddress();
  const { deliveryAddresses, isLoadingAddresses } = useGetDeliveryAddresses();

  const [view, setView] = useState("map");
  const [name, setName] = useState(authUser?.name || "Unknown Name");
  const [phone, setPhone] = useState(authUser?.phoneNumber || "Unkown Number");
  const [addresses, setAddresses] = useState(MOCK_ADDRESSES);
  const [openAddAddressModal, setOpenAddAddressModal] = useState(false);

  const handleSetDefaultAddress = (id) => {
    setAddresses(
      addresses.map((addr) => ({ ...addr, isDefault: addr.id === id }))
    );
  };

  const handleDeleteAddress = (id) => {
    setAddresses(addresses.filter((addr) => addr.id !== id));
  };

  const handleAddNewAddress = (data) => {
    addDeliveryAddress({ data });
  };

  const handleReorder = (orderId) => {
    console.log("Reorder:", orderId);
  };

  const handleViewAllOrders = () => {
    console.log("View all orders");
  };

  if (isLoadingAddresses) return <Spinner fullScreen />;

  console.log(deliveryAddresses.data);

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
              onAddNew={() => setOpenAddAddressModal(true)}
              onDelete={handleDeleteAddress}
            />

            <Modal
              isOpen={openAddAddressModal}
              onClose={() => setOpenAddAddressModal(false)}
              size="lg"
              title={"Add new address"}
            >
              <AddAddressModal
                isOpen={openAddAddressModal}
                onSave={handleAddNewAddress}
                onClose={() => setOpenAddAddressModal(false)}
              />
            </Modal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RecentOrders
                orders={MOCK_ORDERS}
                onViewAll={handleViewAllOrders}
                onReorder={handleReorder}
              />

              <Favorites favorites={MOCK_FAVORITES} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
