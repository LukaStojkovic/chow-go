import { createContext, useContext } from "react";

/**
 * Whether the basket panel is open, shared across the shell.
 *
 * The context and its hook live outside `CustomerShell.jsx` so that file
 * exports only a component - which is what lets fast refresh preserve state
 * while editing the shell.
 *
 * @type {React.Context<{ isBasketOpen: boolean, openBasket: () => void, closeBasket: () => void }>}
 */
export const BasketUIContext = createContext({
  isBasketOpen: false,
  openBasket: () => {},
  closeBasket: () => {},
});

/**
 * Open or close the basket panel from anywhere inside the shell, without
 * threading a setter down through every screen.
 */
export function useBasketUI() {
  return useContext(BasketUIContext);
}
