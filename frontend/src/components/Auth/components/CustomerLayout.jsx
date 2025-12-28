import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import MainHeader from "@/components/Discover/MainHeader";
import CartSidebar from "@/components/Discover/CartSidebar";

const CustomerLayout = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <MainHeader setIsCartOpen={setIsCartOpen} />
      <Outlet />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default CustomerLayout;
