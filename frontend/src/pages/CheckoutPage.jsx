/**
 * Checkout.
 *
 * A single column of numbered steps with a sticky summary beside it on
 * desktop. Nothing about the price is revealed late: the full breakdown is
 * visible from the moment the page loads and updates as options change.
 *
 * Note on promo codes: the brief calls for one, and `Order.discount` exists on
 * the schema, but `POST /orders/create` accepts no code and no promotion model
 * exists. A field that silently discards its input is worse than no field, so
 * the step is left out until there is something behind it.
 */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { DELIVERY_TYPES, MAX_ORDER_NOTES, PAYMENT_METHODS } from "@/lib/constants";
import { toBasketLines } from "@/lib/adapters/menu";
import { PRICING, buildPriceBreakdown } from "@/lib/adapters/pricing";
import useCartStore from "@/store/useCartStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useCreateOrder } from "@/hooks/Orders/useCreateOrder";

import { ContentShell, PageContainer, StickyActionBar, Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/StateViews";
import { CheckoutSection, OptionRow } from "@/features/checkout/CheckoutSection";
import { AddressStep } from "@/features/checkout/AddressStep";
import { OrderSummaryCard } from "@/features/checkout/OrderSummaryCard";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, restaurant, isLoading, fetchCart } = useCartStore();
  const { selectedDeliveryAddress } = useDeliveryStore();
  const { createOrder, isCreatingOrder } = useCreateOrder();

  const [deliveryType, setDeliveryType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const lines = useMemo(() => toBasketLines(items), [items]);
  const pricing = useMemo(
    () => buildPriceBreakdown({ subtotal: totalPrice, deliveryType, tip: tipAmount }),
    [totalPrice, deliveryType, tipAmount],
  );

  const blockers = [];
  if (!selectedDeliveryAddress) blockers.push("Choose a delivery address to continue.");
  if (!paymentMethod) blockers.push("Choose how you would like to pay.");
  if (!restaurant?._id) blockers.push("We lost track of the restaurant - reload the page.");

  const handlePlaceOrder = () => {
    if (blockers.length > 0) return;

    createOrder({
      restaurantId: restaurant._id,
      deliveryAddressId: selectedDeliveryAddress._id,
      paymentMethod,
      customerNotes: customerNotes.trim(),
      tip: tipAmount,
      deliveryType,
    });
  };

  if (isLoading && lines.length === 0) {
    return (
      <PageContainer width="reading" withBottomNav={false} className="py-6">
        <span className="sr-only" role="status">
          Loading your order
        </span>
        <ContentShell
          main={
            <Stack gap="xl">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </Stack>
          }
          aside={<Skeleton className="h-96 w-full rounded-md" />}
        />
      </PageContainer>
    );
  }

  // An empty basket means there is nothing to check out. Redirecting silently
  // would be disorienting, so this explains itself.
  if (!isLoading && lines.length === 0) {
    return (
      <PageContainer width="narrow" withBottomNav={false} className="py-10">
        <EmptyState
          icon={ShoppingBag}
          title="There is nothing to check out"
          description="Your basket is empty. Find something you fancy and it will show up here."
          action={<Button onClick={() => navigate("/discovery")}>Browse restaurants</Button>}
        />
      </PageContainer>
    );
  }

  if (!restaurant && !isLoading) return <Navigate to="/discovery" replace />;

  return (
    <>
      <PageContainer
        width="reading"
        withBottomNav={false}
        // Room for the mobile sticky action bar.
        className="py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-10"
      >
        <ContentShell
          main={
            <Stack gap="2xl">
              <AddressStep step={1} />

              <CheckoutSection
                step={2}
                title="Delivery speed"
                isComplete
                description={`Usually ${restaurant?.estimatedDeliveryTime || "30-45 min"} from this restaurant.`}
              >
                <fieldset className="space-y-2">
                  <legend className="sr-only">Choose a delivery speed</legend>
                  {DELIVERY_TYPES.map((option) => (
                    <OptionRow
                      key={option.value}
                      id={`delivery-${option.value}`}
                      name="delivery-type"
                      checked={deliveryType === option.value}
                      onSelect={() => setDeliveryType(option.value)}
                      label={option.label}
                      description={option.description}
                      meta={
                        option.value === "priority"
                          ? `+${formatPrice(PRICING.priorityFee)}`
                          : "Included"
                      }
                    />
                  ))}
                </fieldset>
              </CheckoutSection>

              <CheckoutSection
                step={3}
                title="Payment"
                isComplete={Boolean(paymentMethod)}
                description="You pay when your order arrives."
              >
                <fieldset className="space-y-2">
                  <legend className="sr-only">Choose a payment method</legend>
                  {PAYMENT_METHODS.map((option) => (
                    <OptionRow
                      key={option.value}
                      id={`payment-${option.value}`}
                      name="payment-method"
                      checked={paymentMethod === option.value}
                      onSelect={() => setPaymentMethod(option.value)}
                      label={option.label}
                      description={option.description}
                    />
                  ))}
                </fieldset>
              </CheckoutSection>

              <CheckoutSection
                step={4}
                title="Tip your courier"
                description="Optional, and it all goes to the person who brings your order."
                isComplete
              >
                <div className="flex flex-wrap items-center gap-2">
                  {PRICING.tipPresets.map((amount) => {
                    const isActive = tipAmount === amount && customTip === "";
                    return (
                      <Button
                        key={amount}
                        type="button"
                        variant={isActive ? "primary" : "outline"}
                        size="sm"
                        aria-pressed={isActive}
                        onClick={() => {
                          setTipAmount(amount);
                          setCustomTip("");
                        }}
                      >
                        {amount === 0 ? "No tip" : formatPrice(amount)}
                      </Button>
                    );
                  })}

                  <div className="flex items-center gap-2">
                    <Label htmlFor="custom-tip" className="sr-only">
                      Custom tip amount
                    </Label>
                    <Input
                      id="custom-tip"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="0.50"
                      placeholder="Other"
                      value={customTip}
                      onChange={(event) => {
                        const raw = event.target.value;
                        setCustomTip(raw);
                        const parsed = Number.parseFloat(raw);
                        setTipAmount(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
                      }}
                      className="h-9 w-24"
                    />
                  </div>
                </div>
              </CheckoutSection>

              <CheckoutSection
                step={5}
                title="Delivery instructions"
                description="Anything the restaurant or the courier should know."
                isComplete
              >
                <div className="space-y-2">
                  <Label htmlFor="order-notes" className="sr-only">
                    Delivery instructions
                  </Label>
                  <Textarea
                    id="order-notes"
                    rows={3}
                    value={customerNotes}
                    maxLength={MAX_ORDER_NOTES}
                    placeholder="Buzzer is broken - please call. Leave at the door if there is no answer."
                    onChange={(event) => setCustomerNotes(event.target.value)}
                    aria-describedby="order-notes-count"
                  />
                  <p id="order-notes-count" className="text-caption text-muted-foreground">
                    {customerNotes.length}/{MAX_ORDER_NOTES} characters
                  </p>
                </div>
              </CheckoutSection>
            </Stack>
          }
          aside={
            <OrderSummaryCard
              lines={lines}
              restaurant={restaurant}
              pricing={pricing}
              blockers={blockers}
              isPlacing={isCreatingOrder}
              onPlaceOrder={handlePlaceOrder}
            />
          }
        />

        <p className="text-caption text-muted-foreground mt-6 text-center">
          Placing an order means you accept our Terms of Service and Privacy Policy. You
          can cancel free of charge until the courier collects your food.
        </p>
      </PageContainer>

      {/* On mobile the total travels with the button, so the amount being
          committed to is never scrolled off-screen. */}
      <StickyActionBar className="lg:hidden">
        <Button
          size="lg"
          block
          disabled={blockers.length > 0}
          isLoading={isCreatingOrder}
          loadingLabel="Placing your order"
          onClick={handlePlaceOrder}
        >
          <span>Place order</span>
          <span className="tabular ml-auto">{formatPrice(pricing.total)}</span>
        </Button>
        {blockers.length > 0 && (
          <p aria-live="polite" className="text-caption text-muted-foreground mt-2 text-center">
            {blockers[0]}
          </p>
        )}
      </StickyActionBar>
    </>
  );
}
