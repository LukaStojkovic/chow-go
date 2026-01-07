import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCartStore from "@/store/useCartStore";
import BackNavbar from "@/components/Navbar/BackNavbar";
import Spinner from "@/components/Spinner";
import DeliveryAddressSectionPicker from "@/components/Checkout/DeliveryAddressSectionPicker";
import DeliveryTimeSectionPicker from "@/components/Checkout/DeliveryTimeSectionPicker";
import PaymentMethodSectionPicker from "@/components/Checkout/PaymentMethodSectionPicker";
import TipCourierSectionPicker from "@/components/Checkout/TipCourierSectionPicker";
import CheckoutCard from "@/components/Checkout/CheckoutCard";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const {
    items,
    totalPrice: subtotal,
    restaurant,
    fetchCart,
    isLoading,
  } = useCartStore();

  const [tipAmount, setTipAmount] = useState(0);
  const [deliveryType, setDeliveryType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [customTip, setCustomTip] = useState("");

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const baseDeliveryFee = 2.5;
  const serviceFee = 1.5;
  const priorityFee = deliveryType === "priority" ? 1.99 : 0;

  const total =
    subtotal +
    baseDeliveryFee +
    serviceFee +
    priorityFee +
    (tipAmount > 0 ? tipAmount : 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 cursor-pointer font-medium hover:underline"
        >
          Go back to menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
      <BackNavbar title="Checkout" />

      <main className="container mx-auto grid max-w-5xl gap-4 sm:gap-6 lg:gap-8 px-3 sm:px-4 py-4 sm:py-8 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <DeliveryAddressSectionPicker />

          <DeliveryTimeSectionPicker
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
          />

          <PaymentMethodSectionPicker
            setPaymentMethod={setPaymentMethod}
            paymentMethod={paymentMethod}
          />

          <TipCourierSectionPicker
            tipAmount={tipAmount}
            setTipAmount={setTipAmount}
            setCustomTip={setCustomTip}
            customTip={customTip}
          />
        </div>

        <CheckoutCard
          items={items}
          restaurant={restaurant}
          subtotal={subtotal}
          baseDeliveryFee={baseDeliveryFee}
          serviceFee={serviceFee}
          tipAmount={tipAmount}
          priorityFee={priorityFee}
          total={total}
        />
      </main>
    </div>
  );
}
