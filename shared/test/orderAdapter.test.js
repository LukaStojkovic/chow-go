import { describe, expect, it } from "vitest";

import { ORDER_STATUSES, estimateArrival, statusMeta, toOrderSteps, toOrderView, toOrderViews } from "../src/adapters/order.js";

const states = (order) => Object.fromEntries(toOrderSteps(order).map((s) => [s.id, s.state]));

describe("statusMeta", () => {
  it("resolves tone and lifecycle", () => {
    expect(statusMeta("delivered")).toMatchObject({ status: "delivered", tone: "success", lifecycle: "delivered" });
    expect(statusMeta("rejected")).toMatchObject({ tone: "destructive", lifecycle: "cancelled" });
  });

  it("treats an unknown status as pending", () => {
    expect(statusMeta("bogus")).toMatchObject({ status: "pending", tone: "warning" });
  });

  it("has a translated label for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(statusMeta(status).label).not.toContain("order:status");
    }
  });
});

describe("toOrderSteps", () => {
  it("marks the step for the current status as current", () => {
    expect(states({ status: "confirmed" })).toEqual({
      received: "complete",
      confirmed: "current",
      preparing: "upcoming",
      assigned: "upcoming",
      on_the_way: "upcoming",
      delivered: "upcoming",
    });
  });

  it("folds ready into preparing and in_transit into on_the_way", () => {
    expect(states({ status: "ready" })).toMatchObject({ preparing: "current", assigned: "upcoming" });
    expect(states({ status: "in_transit" })).toMatchObject({ assigned: "complete", on_the_way: "current" });
  });

  it("completes every step once delivered", () => {
    expect(Object.values(states({ status: "delivered" }))).toEqual(Array(6).fill("complete"));
  });

  it("treats a timestamp as proof a step happened", () => {
    const steps = states({ status: "cancelled", createdAt: "2026-01-01", confirmedAt: "2026-01-01" });
    expect(steps).toMatchObject({ received: "complete", confirmed: "complete", preparing: "upcoming" });
  });
});

describe("toOrderView", () => {
  const base = {
    _id: "665f1c2e9b1e8a0012abcdef",
    status: "pending",
    currency: "eur",
    createdAt: "2026-06-15T12:00:00Z",
    items: [
      { menuItem: "m1", name: "Pizza", price: 8.5, quantity: 2 },
      { menuItem: "m2", name: "Cola", price: 2, quantity: 1 },
    ],
    subtotal: 19,
    deliveryFee: 2.5,
    serviceFee: 1.5,
    priorityFee: 0,
    total: 23,
  };

  it("returns null without an id", () => {
    expect(toOrderView(null)).toBeNull();
    expect(toOrderView({ status: "pending" })).toBeNull();
    expect(toOrderViews("nope")).toEqual([]);
    expect(toOrderViews([base, null])).toHaveLength(1);
  });

  it("derives number, counts, currency and pricing", () => {
    const view = toOrderView(base);
    expect(view.number).toBe("ABCDEF");
    expect(view.currency).toBe("EUR");
    expect(view.itemCount).toBe(3);
    expect(view.pricing.total).toBe(23);
    expect(view.paymentMethod).toBe("cash");
    expect(toOrderView({ ...base, orderNumber: 1042 }).number).toBe("1042");
  });

  it("allows cancel, reorder and rating only in the right states", () => {
    const flags = (status, extra) => {
      const v = toOrderView({ ...base, status, ...extra });
      return { cancel: v.canCancel, reorder: v.canReorder, rate: v.canRate, terminal: v.isTerminal };
    };
    expect(flags("pending")).toEqual({ cancel: true, reorder: false, rate: false, terminal: false });
    expect(flags("preparing").cancel).toBe(false);
    expect(flags("delivered")).toEqual({ cancel: false, reorder: true, rate: true, terminal: true });
    expect(flags("delivered", { customerRating: { ratedAt: "2026-06-15" } }).rate).toBe(false);
    expect(flags("rejected")).toMatchObject({ reorder: true, terminal: true });
  });

  it("composes the delivery address from the snapshot", () => {
    const view = toOrderView({
      ...base,
      deliveryAddressSnapshot: { fullAddress: "Knez Mihailova 1", buildingName: "Palata", notes: "Ring twice" },
    });
    expect(view.deliveryAddress).toBe("Knez Mihailova 1 - Palata");
    expect(view.deliveryNotes).toBe("Ring twice");
    expect(toOrderView(base).deliveryAddress).toBeNull();
  });

  it("maps a populated courier", () => {
    const view = toOrderView({
      ...base,
      courier: { _id: "c1", userId: { name: "Marko", phoneNumber: "0601234567" }, vehicleType: "bike", averageRating: 0 },
    });
    expect(view.courier).toMatchObject({ id: "c1", name: "Marko", phone: "0601234567", vehicle: "bike", rating: null });
  });

  it("prefers the cancellation reason over the rejection reason", () => {
    expect(toOrderView({ ...base, status: "rejected", rejectionReason: "Closed" }).cancellationReason).toBe("Closed");
    expect(
      toOrderView({ ...base, status: "cancelled", cancellationReason: "Changed mind", rejectionReason: "x" })
        .cancellationReason,
    ).toBe("Changed mind");
  });
});

describe("estimateArrival", () => {
  const now = Date.parse("2026-10-04T18:00:00Z");
  const etaAt = "2026-10-04T18:25:00Z";

  it("uses the server estimate before pickup", () => {
    expect(estimateArrival({ status: "preparing", etaAt }, { now, routeSeconds: 120 })).toMatchObject({
      minutes: 25,
      isLate: false,
      isLive: false,
    });
  });

  it("switches to the live route once the courier has the food", () => {
    const eta = estimateArrival({ status: "in_transit", etaAt }, { now, routeSeconds: 450 });
    expect(eta).toMatchObject({ minutes: 8, isLive: true, isLate: false });
    expect(eta.at.toISOString()).toBe("2026-10-04T18:07:30.000Z");
  });

  it("falls back to the server estimate when the route is unknown", () => {
    expect(estimateArrival({ status: "picked_up", etaAt }, { now })).toMatchObject({ minutes: 25, isLive: false });
  });

  it("flags an estimate more than a minute in the past as late", () => {
    expect(estimateArrival({ status: "ready", etaAt: "2026-10-04T17:58:00Z" }, { now })).toMatchObject({
      minutes: 0,
      isLate: true,
    });
    expect(estimateArrival({ status: "ready", etaAt: "2026-10-04T17:59:30Z" }, { now }).isLate).toBe(false);
  });

  it("has nothing to say about finished orders or a missing estimate", () => {
    expect(estimateArrival({ status: "delivered", etaAt }, { now })).toBeNull();
    expect(estimateArrival({ status: "cancelled", etaAt }, { now })).toBeNull();
    expect(estimateArrival({ status: "pending", etaAt: null }, { now })).toBeNull();
    expect(estimateArrival(null)).toBeNull();
  });
});
