import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/store/useAuthStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { addUserDeliveryAddress, getUserDeliveryAddresses } from "@/services/apiAddress";
import { renderWithProviders } from "@/test/utils";
import { AddressStep } from "./AddressStep";

vi.mock("@/services/apiAddress", () => ({
  addUserDeliveryAddress: vi.fn(),
  getUserDeliveryAddresses: vi.fn(),
}));
vi.mock("@/services/apiLocation", () => ({
  getUserLocation: vi.fn(async () => ({ address: "Knez Mihailova 1, Belgrade" })),
}));
vi.mock("@/components/Location/LocationMapSelector", () => ({
  LocationMapSelector: ({ onLocationChange }) => (
    <button type="button" onClick={() => onLocationChange(44.8176, 20.4569)}>
      Drop pin
    </button>
  ),
}));

const address = (id, extra = {}) => ({
  _id: id,
  label: "home",
  fullAddress: `Street ${id}`,
  location: { type: "Point", coordinates: [20.45, 44.81] },
  ...extra,
});

let serverList;

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } });
  useDeliveryStore.setState({ selectedDeliveryAddress: null });
  serverList = [];
  getUserDeliveryAddresses.mockReset().mockImplementation(async () => ({
    status: "success",
    data: serverList,
  }));
  addUserDeliveryAddress.mockReset().mockImplementation(async (body) => {
    const created = address("new1", { label: body.label, fullAddress: body.address });
    serverList = [...serverList, created];
    return { success: true, address: created };
  });
});

function setup(props = {}) {
  renderWithProviders(<AddressStep step={1} {...props} />);
  return userEvent.setup();
}

async function fillAndSave(user, scope = document.body) {
  const q = within(scope);
  await user.click(await q.findByRole("button", { name: "Drop pin" }));
  await user.click(q.getByRole("button", { name: "Confirm location" }));
  await screen.findByText("Knez Mihailova 1, Belgrade");
  await user.click(q.getByRole("button", { name: "Save address" }));
}

describe("AddressStep", () => {
  it("adds an address from a dialog and selects it", async () => {
    serverList = [address("a1", { isDefault: true })];
    const user = setup();

    expect(await screen.findByRole("radio", { name: /home/i })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Add new address" }));
    const dialog = await screen.findByRole("dialog", { name: "Add a delivery address" });

    await fillAndSave(user, dialog);

    await waitFor(() =>
      expect(useDeliveryStore.getState().selectedDeliveryAddress?._id).toBe("new1"),
    );
    expect(addUserDeliveryAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        address: "Knez Mihailova 1, Belgrade",
        location: { lat: 44.8176, lng: 20.4569 },
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(2));
    expect(screen.getByRole("radio", { name: /Street new1|Knez Mihailova/ })).toBeChecked();
  });

  it("closes the dialog on Escape without saving", async () => {
    serverList = [address("a1", { isDefault: true })];
    const user = setup();

    await user.click(await screen.findByRole("button", { name: "Add new address" }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(addUserDeliveryAddress).not.toHaveBeenCalled();
  });

  it("opens the form inline when there are no addresses yet", async () => {
    const user = setup();

    expect(await screen.findByRole("heading", { name: "No delivery address yet" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await fillAndSave(user);

    const radio = await screen.findByRole("radio", { name: /Knez Mihailova/ });
    expect(radio).toBeChecked();
    expect(radio).toHaveFocus();
    expect(useDeliveryStore.getState().selectedDeliveryAddress?._id).toBe("new1");
  });

  it("offers to manage addresses at the limit instead of adding", async () => {
    serverList = ["a1", "a2", "a3", "a4", "a5"].map((id) => address(id));
    setup();

    expect(await screen.findByRole("link", { name: "Manage addresses" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.queryByRole("button", { name: "Add new address" })).not.toBeInTheDocument();
    expect(screen.getByText(/maximum of 5 addresses/)).toBeInTheDocument();
  });

  it("explains an address outside the delivery radius", async () => {
    serverList = [address("a1", { isDefault: true })];
    setup({ outOfRange: { addressId: "a1", message: "This restaurant doesn't deliver that far." } });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("This restaurant doesn't deliver that far.");
    expect(within(alert).getByRole("button", { name: "Add new address" })).toBeInTheDocument();
  });
});
