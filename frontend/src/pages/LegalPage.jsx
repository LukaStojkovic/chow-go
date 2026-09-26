import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { getLegalDocument } from "@chowgo/shared/legal";
import { formatDate } from "@chowgo/shared/format";

import { PageContainer } from "@/components/layout/primitives";

/**
 * The Terms of Service and Privacy Policy. Public, and deliberately plain:
 * the text comes from @chowgo/shared/legal so the web and the app can never
 * show different versions, and each section has an anchor (#section-7) so
 * other screens can link straight to it.
 */
export default function LegalPage({ kind }) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage || i18n.language;
  const doc = useMemo(() => getLegalDocument(kind, locale), [kind, locale]);
  const other = kind === "terms" ? "privacy" : "terms";
  const { hash } = useLocation();

  // A client-side navigation to /privacy#section-7 does not scroll by itself.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, doc]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${doc.title} - Chow & Go`;
    return () => {
      document.title = previous;
    };
  }, [doc.title]);

  return (
    <PageContainer width="narrow" withBottomNav={false} className="py-10">
      <article className="space-y-8">
        <header className="space-y-2">
          <Link to="/" className="text-body-sm text-primary">
            {t("legal.backHome")}
          </Link>
          <h1 className="text-h1">{doc.title}</h1>
          <p className="text-body-sm text-muted-foreground">
            {t("legal.updated", { date: formatDate(doc.updated) })}
          </p>
          {doc.intro.map((paragraph) => (
            <p key={paragraph} className="text-body">
              {paragraph}
            </p>
          ))}
        </header>

        <nav aria-label={t("legal.contents")} className="rounded-md bg-muted p-4">
          <p className="text-label mb-2">{t("legal.contents")}</p>
          <ol className="space-y-1 text-body-sm">
            {doc.sections.map((section, index) => (
              <li key={section.heading}>
                <a href={`#section-${index + 1}`} className="text-primary hover:underline">
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {doc.sections.map((section, index) => (
          <section key={section.heading} id={`section-${index + 1}`} className="scroll-mt-24 space-y-3">
            <h2 className="text-h2">{section.heading}</h2>
            {section.blocks.map((block, blockIndex) =>
              Array.isArray(block) ? (
                <ul key={blockIndex} className="list-disc space-y-1.5 pl-5 text-body">
                  {block.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p key={blockIndex} className="text-body">
                  {block}
                </p>
              ),
            )}
          </section>
        ))}

        <footer className="border-t border-border pt-6 text-body-sm">
          <Link to={`/${other}`} className="text-primary hover:underline">
            {t(`legal.${other}`)}
          </Link>
        </footer>
      </article>
    </PageContainer>
  );
}
