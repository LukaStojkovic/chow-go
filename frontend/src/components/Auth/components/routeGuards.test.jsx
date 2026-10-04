import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import CourierRoute from "@/pages/courier/CourierRoute";
import { useAuthStore } from "@/store/useAuthStore";
import AdminRoute from "./AdminRoute";
import CustomerRoute from "./CustomerRoute";
import PublicRoute from "./PublicRoute";
import SellerRoute from "./SellerRoute";

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>landing</p>} />
        <Route element={<PublicRoute />}>
          <Route path="/discovery" element={<p>discovery</p>} />
        </Route>
        <Route element={<CustomerRoute />}>
          <Route path="/orders" element={<p>orders</p>} />
        </Route>
        <Route path="/seller/dashboard" element={<SellerRoute><p>seller</p></SellerRoute>} />
        <Route path="/courier/dashboard" element={<CourierRoute><p>courier</p></CourierRoute>} />
        <Route path="/admin" element={<AdminRoute><p>admin</p></AdminRoute>} />
      </Routes>
    </MemoryRouter>,
  );
}

const signIn = (authUser) => useAuthStore.setState({ authUser, isCheckingAuth: false, isAuthOpen: false });

beforeEach(() => {
  signIn(null);
});

describe("route guards", () => {
  it("shows a spinner while the session is being checked", () => {
    useAuthStore.setState({ isCheckingAuth: true });
    renderAt("/orders");
    expect(screen.queryByText("orders")).not.toBeInTheDocument();
    expect(screen.queryByText("landing")).not.toBeInTheDocument();
  });

  it.each(["/orders", "/seller/dashboard", "/courier/dashboard", "/admin"])(
    "sends a visitor on %s home and opens the login modal",
    (path) => {
      renderAt(path);
      expect(screen.getByText("landing")).toBeInTheDocument();
      expect(useAuthStore.getState()).toMatchObject({ isAuthOpen: true, isLoginModal: true });
    },
  );

  it("lets visitors and customers browse public pages", () => {
    renderAt("/discovery");
    expect(screen.getByText("discovery")).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthOpen).toBe(false);
  });

  it.each([
    ["customer", "/orders", "orders"],
    ["seller", "/seller/dashboard", "seller"],
    ["courier", "/courier/dashboard", "courier"],
  ])("lets a %s into their own area", (role, path, text) => {
    signIn({ role });
    renderAt(path);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each([
    ["seller", "/orders", "seller"],
    ["seller", "/discovery", "seller"],
    ["customer", "/seller/dashboard", "discovery"],
    ["customer", "/courier/dashboard", "discovery"],
    ["courier", "/seller/dashboard", "discovery"],
    ["courier", "/orders", "discovery"],
  ])("redirects a %s away from %s", (role, path, landsOn) => {
    signIn({ role });
    renderAt(path);
    expect(screen.getByText(landsOn)).toBeInTheDocument();
  });

  it("admits only admins to the console", () => {
    signIn({ role: "customer", isAdmin: false });
    renderAt("/admin");
    expect(screen.getByText("landing")).toBeInTheDocument();
  });

  it("admits an admin of any role", () => {
    signIn({ role: "courier", isAdmin: true });
    renderAt("/admin");
    expect(screen.getByText("admin")).toBeInTheDocument();
  });
});
