import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "use-debounce";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";

import {
  COLLECTION_KINDS,
  COLLECTION_LIMITS,
  COLLECTION_SORTS,
  normalizeCollectionInput,
  slugify,
} from "@chowgo/shared/collections";
import { categoryOptions, cuisineOptions } from "@chowgo/shared/constants";
import { CURRENCIES, DEFAULT_CURRENCY } from "@chowgo/shared/currency";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@chowgo/shared/i18n/config";
import { formatPrice } from "@chowgo/shared/format";

import { apiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import {
  useCollectionPinNames,
  useCollectionPinSearch,
  useCollectionPreview,
} from "@/hooks/Admin/useAdminCollections";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FIELD_FOR_CODE = {
  COLLECTION_TITLE: "title",
  COLLECTION_SLUG: "slug",
  COLLECTION_SLUG_TAKEN: "slug",
  COLLECTION_KIND: "kind",
  COLLECTION_PINS: "pins",
  COLLECTION_DATES: "endsAt",
  COLLECTION_RULE: "rules",
};

const collectionErrorKey = (code) =>
  `errors:collection.${code.replace(/^COLLECTION_/, "").toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase())}`;

function collectionServerError(err) {
  const code = err?.response?.data?.code;
  return { field: err?.response?.data?.details?.field ?? FIELD_FOR_CODE[code] ?? null, message: apiErrorMessage(err) };
}

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
const numberOrNull = (value) => (value === "" || value === null || value === undefined ? null : Number(value));
const text = (value) => (value === null || value === undefined ? "" : String(value));
const perLocale = (value) => Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, value?.[locale] ?? ""]));

function initialState(collection) {
  const rules = collection?.rules ?? {};
  const kind = collection?.kind ?? "restaurants";
  return {
    kind,
    title: perLocale(collection?.title),
    subtitle: perLocale(collection?.subtitle),
    slug: collection?.slug ?? "",
    slugEdited: Boolean(collection?.slug),
    coverImage: collection?.coverImage ?? "",
    cuisines: rules.cuisines ?? [],
    categories: rules.categories ?? [],
    minRating: text(rules.minRating),
    maxPrice: text(rules.maxPrice),
    currency: rules.currency ?? DEFAULT_CURRENCY,
    onlyDeals: Boolean(rules.onlyDeals),
    openNow: Boolean(rules.openNow),
    newWithinDays: text(rules.newWithinDays),
    sort: rules.sort ?? COLLECTION_SORTS[kind][0],
    maxItems: text(collection?.maxItems ?? COLLECTION_LIMITS.defaultItems),
    startsAt: toLocalInput(collection?.startsAt),
    endsAt: toLocalInput(collection?.endsAt),
    manualOnly: Boolean(collection?.manualOnly),
    pins: (collection?.pins ?? []).map(String),
  };
}

function buildCollectionPayload(form) {
  const dishes = form.kind === "dishes";
  return {
    kind: form.kind,
    slug: form.slug.trim() || slugify(form.title[DEFAULT_LOCALE]),
    title: form.title,
    subtitle: form.subtitle,
    coverImage: form.coverImage.trim() || null,
    manualOnly: form.manualOnly,
    pins: form.pins,
    maxItems: numberOrNull(form.maxItems),
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
    rules: {
      cuisines: form.cuisines,
      categories: form.categories,
      minRating: numberOrNull(form.minRating),
      maxPrice: dishes ? numberOrNull(form.maxPrice) : null,
      currency: dishes && form.maxPrice !== "" ? form.currency : null,
      onlyDeals: form.onlyDeals,
      openNow: form.openNow,
      newWithinDays: numberOrNull(form.newWithinDays),
      sort: form.sort,
    },
  };
}

function validate(form, t) {
  if (form.coverImage.trim() && !/^https:\/\/\S+$/.test(form.coverImage.trim())) {
    return { field: "coverImage", message: t("admin:collections.errors.coverImage") };
  }
  const payload = buildCollectionPayload(form);
  const result = normalizeCollectionInput(payload);
  if (result.error) {
    const { code, field, ...params } = result.error;
    return { field: field ?? FIELD_FOR_CODE[code], message: t(collectionErrorKey(code), params) };
  }
  return { payload };
}

function Field({ id, label, hint, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-caption text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ToggleChips({ label, hint, options, value, onChange, error }) {
  const toggle = (option) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-label">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = value.includes(option.value);
          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={active ? "primary" : "outline"}
              aria-pressed={active}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-caption text-muted-foreground">{hint}</p>
      )}
    </fieldset>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-h3 border-border border-t pt-4">{children}</h3>;
}

function pinDetail(item, t) {
  if (item.restaurantName) {
    return [item.restaurantName, item.price !== undefined ? formatPrice(item.price) : null].filter(Boolean).join(" · ");
  }
  return item.isActive === false ? t("admin:collections.pins.inactive") : null;
}

function PinsPicker({ kind, pins, onChange, initialIds, error }) {
  const { t } = useTranslation(["admin"]);
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 300);
  const [known, setKnown] = useState({});
  const named = useCollectionPinNames(kind, initialIds);
  const { results } = useCollectionPinSearch(kind, debounced);

  const names = useMemo(() => {
    const map = { ...known };
    for (const item of named) map[item.id] ??= item;
    return map;
  }, [known, named]);

  const add = (item) => {
    setKnown((prev) => ({ ...prev, [item.id]: item }));
    if (!pins.includes(item.id) && pins.length < COLLECTION_LIMITS.pins) onChange([...pins, item.id]);
  };
  const move = (index, delta) => {
    const next = [...pins];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-caption text-muted-foreground">{t("collections.fields.pinsHint")}</p>
      {pins.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{t("collections.pins.none")}</p>
      ) : (
        <ol className="space-y-1.5" aria-label={t("collections.sections.pins")}>
          {pins.map((id, index) => {
            const item = names[id];
            const name = item?.name ?? id;
            const detail = item ? pinDetail(item, t) : null;
            return (
              <li key={id} className="border-border flex items-center gap-2 rounded-md border px-3 py-1.5">
                <span className="text-caption text-muted-foreground tabular w-5">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="text-body-sm block truncate font-medium">{name}</span>
                  {detail && <span className="text-caption text-muted-foreground block truncate">{detail}</span>}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={index === 0}
                  aria-label={t("collections.pins.moveUp", { name })}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={index === pins.length - 1}
                  aria-label={t("collections.pins.moveDown", { name })}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("collections.pins.remove", { name })}
                  onClick={() => onChange(pins.filter((pin) => pin !== id))}
                >
                  <X aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ol>
      )}
      {error && (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}
      <Field id="collection-pin-search" label={t("collections.fields.pinSearch")}>
        <Input
          id="collection-pin-search"
          type="search"
          autoComplete="off"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Field>
      {debounced.trim().length >= 2 && (
        <ul className="divide-border border-border max-h-56 divide-y overflow-y-auto rounded-md border">
          {results.length === 0 ? (
            <li className="text-body-sm text-muted-foreground px-3 py-2">{t("collections.pins.noResults")}</li>
          ) : (
            results.map((item) => {
              const detail = pinDetail(item, t);
              const pinned = pins.includes(item.id);
              return (
                <li key={item.id} className="flex items-center gap-2 px-3 py-1.5">
                  <span className="min-w-0 flex-1">
                    <span className="text-body-sm block truncate">{item.name}</span>
                    {detail && <span className="text-caption text-muted-foreground block truncate">{detail}</span>}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={pinned}
                    aria-label={t("collections.pins.add", { name: item.name })}
                    onClick={() => add(item)}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

function PreviewPanel({ form, kind }) {
  const { t } = useTranslation(["admin", "common"]);
  const { coordinates } = useDeliveryStore();
  const preview = useCollectionPreview();
  const [error, setError] = useState(null);
  const hasLocation = Boolean(coordinates?.lat && coordinates?.lon);

  const run = () => {
    const checked = validate(form, t);
    if (!checked.payload) {
      setError(checked.message);
      return;
    }
    setError(null);
    preview.mutate(
      { lat: coordinates.lat, lon: coordinates.lon, input: checked.payload },
      { onError: (err) => setError(apiErrorMessage(err, { fallbackKey: "admin:collections.preview.failed" })) },
    );
  };

  const items = preview.data?.items ?? [];

  return (
    <div className="space-y-3">
      {hasLocation ? (
        <Button type="button" variant="outline" onClick={run} isLoading={preview.isPending}>
          {t("collections.preview.run")}
        </Button>
      ) : (
        <p className="text-body-sm text-muted-foreground">{t("collections.preview.noLocation")}</p>
      )}
      <p className="text-caption text-muted-foreground">{t("collections.preview.hiddenHint")}</p>
      {error && (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}
      {preview.data && !error && (
        <div className="space-y-2" aria-live="polite">
          <p className="text-body-sm font-medium">{t("collections.preview.total", { count: preview.data.total })}</p>
          {items.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">{t("collections.preview.empty")}</p>
          ) : (
            <ol className="text-body-sm list-decimal space-y-0.5 pl-5" data-testid="collection-preview">
              {items.map((item) => (
                <li key={item._id}>
                  {item.name}
                  {kind === "dishes" && item.restaurant?.name && (
                    <span className="text-muted-foreground"> · {item.restaurant.name}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export function CollectionFormDialog({ collection, isSaving, onSubmit, onClose }) {
  const { t } = useTranslation(["admin", "common", "errors"]);
  const [form, setForm] = useState(() => initialState(collection));
  const [error, setError] = useState(null);
  const [initialPins] = useState(() => (collection?.pins ?? []).map(String));
  const isEdit = Boolean(collection?.id);

  const errorFor = (field) => (error?.field === field ? error.message : null);
  const ruleError = (name) => errorFor(`rules.${name}`);

  const update = (patch) => {
    setError(null);
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const setKind = (kind) =>
    update({
      kind,
      pins: kind === form.kind ? form.pins : [],
      sort: COLLECTION_SORTS[kind].includes(form.sort) ? form.sort : COLLECTION_SORTS[kind][0],
      maxPrice: kind === "dishes" ? form.maxPrice : "",
    });

  const setTitle = (locale, value) => {
    const title = { ...form.title, [locale]: value };
    update(
      locale === DEFAULT_LOCALE && !form.slugEdited ? { title, slug: slugify(value) } : { title },
    );
  };

  const cuisines = useMemo(() => cuisineOptions(t), [t]);
  const categories = useMemo(
    () =>
      categoryOptions(t)
        .filter((option) => option.id !== "all")
        .map((option) => ({ value: option.value, label: option.label })),
    [t],
  );

  const submit = (publish) => (event) => {
    event?.preventDefault();
    const checked = validate(form, t);
    if (!checked.payload) {
      setError({ field: checked.field, message: checked.message });
      return;
    }
    Promise.resolve(onSubmit(publish ? { ...checked.payload, status: "published" } : checked.payload)).catch((err) =>
      setError(collectionServerError(err)),
    );
  };

  const dishes = form.kind === "dishes";
  const generalRuleError = errorFor("rules");
  const unplacedError =
    error && !error.field
      ? error.message
      : null;

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" aria-describedby={undefined}>
        <form onSubmit={submit(false)} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? t("collections.edit") : t("collections.create")}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="collection-kind" label={t("collections.fields.kind")} error={errorFor("kind")}>
              <Select value={form.kind} onValueChange={setKind}>
                <SelectTrigger id="collection-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {t(`collections.kind.${kind}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              id="collection-slug"
              label={t("collections.fields.slug")}
              hint={t("collections.fields.slugHint", { slug: form.slug || "…" })}
              error={errorFor("slug")}
            >
              <Input
                id="collection-slug"
                value={form.slug}
                maxLength={COLLECTION_LIMITS.slugLength}
                autoComplete="off"
                onChange={(event) => update({ slug: event.target.value.toLowerCase(), slugEdited: true })}
              />
            </Field>

            {SUPPORTED_LOCALES.map((locale) => (
              <Field
                key={`title-${locale}`}
                id={`collection-title-${locale}`}
                label={t("collections.fields.title", { locale: locale.toUpperCase() })}
                error={locale === DEFAULT_LOCALE ? errorFor("title") : null}
              >
                <Input
                  id={`collection-title-${locale}`}
                  value={form.title[locale]}
                  maxLength={COLLECTION_LIMITS.titleLength}
                  required={locale === DEFAULT_LOCALE}
                  onChange={(event) => setTitle(locale, event.target.value)}
                />
              </Field>
            ))}

            {SUPPORTED_LOCALES.map((locale) => (
              <Field
                key={`subtitle-${locale}`}
                id={`collection-subtitle-${locale}`}
                label={t("collections.fields.subtitle", { locale: locale.toUpperCase() })}
                error={locale === DEFAULT_LOCALE ? errorFor("subtitle") : null}
              >
                <Input
                  id={`collection-subtitle-${locale}`}
                  value={form.subtitle[locale]}
                  maxLength={COLLECTION_LIMITS.subtitleLength}
                  onChange={(event) => update({ subtitle: { ...form.subtitle, [locale]: event.target.value } })}
                />
              </Field>
            ))}

            <Field
              id="collection-cover"
              className="sm:col-span-2"
              label={t("collections.fields.coverImage")}
              hint={t("collections.fields.coverImageHint")}
              error={errorFor("coverImage")}
            >
              <Input
                id="collection-cover"
                type="url"
                inputMode="url"
                value={form.coverImage}
                onChange={(event) => update({ coverImage: event.target.value })}
              />
            </Field>
          </div>

          <SectionTitle>{t("collections.sections.rules")}</SectionTitle>
          {generalRuleError && (
            <p role="alert" className="text-caption text-destructive">
              {generalRuleError}
            </p>
          )}
          <ToggleChips
            label={t("collections.fields.cuisines")}
            hint={t("collections.fields.anyHint")}
            options={cuisines}
            value={form.cuisines}
            error={ruleError("cuisines")}
            onChange={(value) => update({ cuisines: value })}
          />
          <ToggleChips
            label={t("collections.fields.categories")}
            hint={t("collections.fields.anyHint")}
            options={categories}
            value={form.categories}
            error={ruleError("categories")}
            onChange={(value) => update({ categories: value })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="collection-rating" label={t("collections.fields.minRating")} error={ruleError("minRating")}>
              <Input
                id="collection-rating"
                type="number"
                inputMode="decimal"
                min={1}
                max={5}
                step={0.1}
                value={form.minRating}
                onChange={(event) => update({ minRating: event.target.value })}
              />
            </Field>

            <Field id="collection-new" label={t("collections.fields.newWithinDays")} error={ruleError("newWithinDays")}>
              <Input
                id="collection-new"
                type="number"
                min={1}
                max={COLLECTION_LIMITS.maxNewWithinDays}
                step={1}
                value={form.newWithinDays}
                onChange={(event) => update({ newWithinDays: event.target.value })}
              />
            </Field>

            {dishes && (
              <>
                <Field id="collection-price" label={t("collections.fields.maxPrice")} error={ruleError("maxPrice")}>
                  <Input
                    id="collection-price"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    step="any"
                    value={form.maxPrice}
                    onChange={(event) => update({ maxPrice: event.target.value })}
                  />
                </Field>
                <Field id="collection-currency" label={t("collections.fields.currency")}>
                  <Select value={form.currency} onValueChange={(currency) => update({ currency })}>
                    <SelectTrigger id="collection-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CURRENCIES).map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            <Field id="collection-sort" label={t("collections.fields.sort")} error={ruleError("sort")}>
              <Select value={form.sort} onValueChange={(sort) => update({ sort })}>
                <SelectTrigger id="collection-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_SORTS[form.kind].map((sort) => (
                    <SelectItem key={sort} value={sort}>
                      {t(`collections.sort.${sort}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              id="collection-max-items"
              label={t("collections.fields.maxItems")}
              hint={t("collections.fields.maxItemsHint", { min: COLLECTION_LIMITS.minItems, max: COLLECTION_LIMITS.maxItems })}
              error={ruleError("maxItems")}
            >
              <Input
                id="collection-max-items"
                type="number"
                min={COLLECTION_LIMITS.minItems}
                max={COLLECTION_LIMITS.maxItems}
                step={1}
                value={form.maxItems}
                onChange={(event) => update({ maxItems: event.target.value })}
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch id="collection-deals" checked={form.onlyDeals} onCheckedChange={(onlyDeals) => update({ onlyDeals })} />
              <Label htmlFor="collection-deals">{t("collections.fields.onlyDeals")}</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="collection-open" checked={form.openNow} onCheckedChange={(openNow) => update({ openNow })} />
              <Label htmlFor="collection-open">{t("collections.fields.openNow")}</Label>
            </div>
          </div>

          <SectionTitle>{t("collections.sections.pins")}</SectionTitle>
          <div className="flex items-center gap-3">
            <Switch id="collection-manual" checked={form.manualOnly} onCheckedChange={(manualOnly) => update({ manualOnly })} />
            <Label htmlFor="collection-manual">{t("collections.fields.manualOnly")}</Label>
          </div>
          <PinsPicker
            key={form.kind}
            kind={form.kind}
            pins={form.pins}
            initialIds={form.kind === (collection?.kind ?? form.kind) ? initialPins : []}
            error={errorFor("pins")}
            onChange={(pins) => update({ pins })}
          />

          <SectionTitle>{t("collections.sections.schedule")}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="collection-starts" label={t("collections.fields.startsAt")}>
              <Input
                id="collection-starts"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => update({ startsAt: event.target.value })}
              />
            </Field>
            <Field id="collection-ends" label={t("collections.fields.endsAt")} error={errorFor("endsAt")}>
              <Input
                id="collection-ends"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => update({ endsAt: event.target.value })}
              />
            </Field>
          </div>

          <SectionTitle>{t("collections.sections.preview")}</SectionTitle>
          <PreviewPanel form={form} kind={form.kind} />

          {unplacedError && (
            <p role="alert" className="text-body-sm text-destructive">
              {unplacedError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("collections.cancel")}
            </Button>
            {!isEdit && (
              <Button type="button" variant="outline" disabled={isSaving} onClick={submit(true)}>
                {t("collections.saveAndPublish")}
              </Button>
            )}
            <Button type="submit" isLoading={isSaving}>
              {t("collections.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
