import { Trans } from "react-i18next";

/**
 * The "by continuing you agree to..." line, with both documents linked. New
 * tabs, because the places this appears (the sign-in modal, checkout) would
 * lose what was typed if the link replaced the page.
 *
 * @param {{ i18nKey: string, className?: string }} props
 */
export function LegalConsent({ i18nKey, className }) {
  const link = (to) => (
    <a href={to} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2" />
  );
  return (
    <p className={className}>
      <Trans i18nKey={i18nKey} components={{ terms: link("/terms"), privacy: link("/privacy") }} />
    </p>
  );
}
