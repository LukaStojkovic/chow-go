/**
 * Empty, error and offline states.
 *
 * Every one of these says what happened in plain language and offers the next
 * useful action. None of them uses an emoji as an illustration, and none
 * surfaces a raw exception message to the customer.
 */

import { motion } from "framer-motion";
import { CircleAlert, Inbox, RefreshCw, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/motion";
import { Button } from "@/components/ui/button";

/**
 * Shared frame: a muted icon disc, a heading, a sentence, and up to two
 * actions. Deliberately not a card - these usually sit inside one already.
 *
 * @param {Object} props
 * @param {import("lucide-react").LucideIcon} props.icon
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {"neutral"|"danger"} [props.tone]
 * @param {"sm"|"md"} [props.size]
 * @param {React.ReactNode} [props.action]
 * @param {React.ReactNode} [props.secondaryAction]
 */
function StateFrame({
  icon: Icon,
  title,
  description,
  tone = "neutral",
  size = "md",
  action,
  secondaryAction,
  className,
  children,
  ...props
}) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "md" ? "gap-3 px-6 py-14" : "gap-2 px-4 py-8",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full",
          size === "md" ? "size-12" : "size-10",
          tone === "danger" ? "bg-destructive-subtle" : "bg-muted",
        )}
      >
        <Icon
          className={cn(
            size === "md" ? "size-6" : "size-5",
            tone === "danger" ? "text-destructive" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
      </span>

      <div className="max-w-sm space-y-1">
        <p className={cn(size === "md" ? "text-h3" : "text-label", "text-foreground")}>
          {title}
        </p>
        {description && (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {children}

      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Nothing here yet, and that is expected.
 *
 * @param {Object} props
 * @param {import("lucide-react").LucideIcon} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]
 */
export function EmptyState({ icon = Inbox, ...props }) {
  return <StateFrame icon={icon} {...props} />;
}

/**
 * Something failed. Always offers a retry, and never prints the raw error -
 * `error` is accepted so callers can log it, not display it.
 *
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {() => void} [props.onRetry]
 * @param {boolean} [props.isRetrying]
 */
export function ErrorState({
  title,
  description,
  onRetry,
  isRetrying = false,
  size = "md",
  className,
}) {
  // Defaults are resolved here rather than in the parameter list: a default
  // evaluated at call time follows the active language, a literal in the
  // signature would not.
  const { t } = useTranslation("common");

  return (
    <StateFrame
      icon={CircleAlert}
      tone="danger"
      title={title ?? t("error.generic")}
      description={description ?? t("error.genericDescription")}
      size={size}
      className={className}
      action={
        onRetry ? (
          <Button
            variant="outline"
            onClick={onRetry}
            isLoading={isRetrying}
            loadingLabel={t("state.loading")}
          >
            <RefreshCw aria-hidden="true" />
            {t("actions.retry")}
          </Button>
        ) : null
      }
    />
  );
}

/**
 * Shown when the browser reports no connection. Distinct from a failed request
 * because the recovery is different: reconnect, then retry.
 */
export function OfflineState({ onRetry }) {
  const { t } = useTranslation("common");

  return (
    <StateFrame
      icon={WifiOff}
      title={t("state.offline")}
      description={t("state.offlineDescription")}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            {t("actions.retry")}
          </Button>
        ) : null
      }
    />
  );
}

/**
 * A compact error for a single failed region inside an otherwise working page,
 * such as one section of the discovery feed.
 */
export function InlineError({ message, onRetry }) {
  const { t } = useTranslation("common");

  return (
    <div
      role="alert"
      className="border-border bg-muted flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
    >
      <span className="text-body-sm text-muted-foreground flex items-center gap-2">
        <CircleAlert className="text-destructive size-4 shrink-0" aria-hidden="true" />
        {message ?? t("error.sectionFailed")}
      </span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          {t("actions.retry")}
        </Button>
      )}
    </div>
  );
}
