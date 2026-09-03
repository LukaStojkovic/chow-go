/**
 * One step of the checkout flow.
 *
 * Numbered, titled, and always the same shape, so the page reads as a sequence
 * rather than a stack of unrelated cards. The number is decorative - the
 * heading carries the meaning - so it is hidden from assistive tech.
 */

import { cn } from "@/lib/utils";

/**
 * @param {Object} props
 * @param {number} props.step
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action] A control in the heading row.
 * @param {boolean} [props.isComplete] Draws the marker in the brand colour.
 */
export function CheckoutSection({
  step,
  title,
  description,
  action,
  isComplete = false,
  className,
  children,
}) {
  const headingId = `checkout-step-${step}`;

  return (
    <section aria-labelledby={headingId} className={cn("space-y-3", className)}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "text-label mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full tabular",
            isComplete
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {step}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 id={headingId} className="text-h2">
              {title}
            </h2>
            {action}
          </div>
          {description && (
            <p className="text-body-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>

      <div className="sm:pl-9">{children}</div>
    </section>
  );
}

/**
 * A selectable option row. Used for addresses, delivery speed and payment, so
 * all three behave identically: a real radio, a large hit area, and a clear
 * selected state that does not rely on colour alone (it also gets a border and
 * a filled control).
 *
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.name Radio group name.
 * @param {boolean} props.checked
 * @param {() => void} props.onSelect
 * @param {string} props.label
 * @param {React.ReactNode} [props.description]
 * @param {React.ReactNode} [props.meta] Right-aligned, e.g. a price.
 * @param {boolean} [props.disabled]
 */
export function OptionRow({
  id,
  name,
  checked,
  onSelect,
  label,
  description,
  meta,
  disabled = false,
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3",
        "transition-[border-color,background-color] duration-(--duration-micro) ease-(--ease-standard)",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        checked ? "border-primary bg-primary-subtle" : "border-border bg-card hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-55",
      )}
    >
      <input
        type="radio"
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className={cn(
          "mt-0.5 size-4 shrink-0 appearance-none rounded-full border-2 outline-none",
          "transition-colors duration-(--duration-micro)",
          checked
            ? "border-primary bg-primary ring-2 ring-inset ring-card"
            : "border-border-strong bg-card",
        )}
      />

      <span className="min-w-0 flex-1">
        <span className="text-label text-foreground block">{label}</span>
        {description && (
          <span className="text-body-sm text-muted-foreground mt-0.5 block">
            {description}
          </span>
        )}
      </span>

      {meta && <span className="text-label text-foreground tabular shrink-0">{meta}</span>}
    </label>
  );
}
