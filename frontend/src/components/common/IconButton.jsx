/**
 * Icon-only button.
 *
 * An icon on its own is never self-explanatory, so this component makes the
 * accessible name mandatory: `label` becomes both the screen-reader name and
 * the desktop tooltip. There is no way to render one of these unlabelled.
 */

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

/**
 * @param {Object} props
 * @param {string} props.label Required. The action, e.g. "Add to favourites".
 * @param {React.ReactNode} props.children The icon element.
 * @param {"primary"|"secondary"|"outline"|"ghost"|"destructive"} [props.variant]
 * @param {"icon-sm"|"icon"|"icon-lg"} [props.size]
 * @param {boolean} [props.showTooltip] Set false inside a surface that already
 *   explains the control, such as a toolbar with visible labels.
 */
export const IconButton = React.forwardRef(function IconButton(
  { label, children, variant = "ghost", size = "icon", showTooltip = true, ...props },
  ref,
) {
  const button = (
    <Button ref={ref} variant={variant} size={size} aria-label={label} {...props}>
      {children}
    </Button>
  );

  if (!showTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      {/* Hidden from assistive tech: `aria-label` already names the button, and
          announcing the same string twice is noise. */}
      <TooltipContent aria-hidden="true">{label}</TooltipContent>
    </Tooltip>
  );
});
