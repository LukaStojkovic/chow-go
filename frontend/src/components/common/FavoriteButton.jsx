/**
 * Favourite toggle.
 *
 * Optimistic: the heart fills the moment it is pressed, because waiting on a
 * round trip for a low-stakes toggle feels broken. `useToggleFavourite` owns
 * the rollback if the request fails.
 */

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { IconButton } from "./IconButton";

/**
 * @param {Object} props
 * @param {boolean} props.isFavorite
 * @param {() => void} props.onToggle
 * @param {string} props.restaurantName Named in the accessible label so a
 *   screen-reader user scanning a grid knows which card they are on.
 * @param {boolean} [props.isPending]
 * @param {"card"|"header"} [props.placement] `card` sits on top of a photo.
 */
export function FavoriteButton({
  isFavorite,
  onToggle,
  restaurantName,
  isPending = false,
  placement = "card",
  className,
}) {
  const label = isFavorite
    ? `Remove ${restaurantName} from favourites`
    : `Save ${restaurantName} to favourites`;

  return (
    <IconButton
      label={label}
      aria-pressed={isFavorite}
      disabled={isPending}
      variant={placement === "card" ? "secondary" : "ghost"}
      size={placement === "card" ? "icon-sm" : "icon"}
      onClick={(event) => {
        // Favourite buttons sit inside link cards; without this the press
        // navigates to the restaurant instead of toggling.
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        placement === "card" && "bg-card/92 hover:bg-card shadow-subtle backdrop-blur-sm",
        className,
      )}
    >
      <motion.span
        // A single, short pop on activation. Framer removes the scale entirely
        // under reduced motion, leaving the colour change to carry the state.
        animate={{ scale: isFavorite ? [1, 1.25, 1] : 1 }}
        transition={transitions.micro}
        className="flex"
      >
        <Heart
          className={cn(
            "size-4 transition-colors duration-(--duration-micro)",
            isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
      </motion.span>
    </IconButton>
  );
}
