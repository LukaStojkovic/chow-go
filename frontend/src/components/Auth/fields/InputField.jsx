import { useTranslation } from "react-i18next";
import { translateFieldError } from "@chowgo/shared/i18n/fieldErrors";

import { Input } from "@/components/ui/input";

/**
 * A form input with its validation message underneath.
 *
 * Zod hands react-hook-form a translation key rather than a sentence, so the
 * message is resolved here, at render - which is what makes an error already
 * on screen switch language with the rest of the app. A message that is not a
 * key (one zod generated itself) is rendered as-is.
 */
export function InputField({ register, error, ...props }) {
  const { t } = useTranslation();
  const message = translateFieldError(error, t);

  return (
    <div>
      <Input
        {...register}
        aria-invalid={message ? "true" : undefined}
        className="h-10 sm:h-12 rounded-lg sm:rounded-xl bg-card/50 border border-border hover:border-primary focus:border-primary focus:ring-ring/20 transition-colors text-sm placeholder:text-muted-foreground "
        {...props}
      />
      {message && <p className="text-destructive text-xs mt-1.5">{message}</p>}
    </div>
  );
}
