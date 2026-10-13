import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cuisineLabel } from "@chowgo/shared/constants";
import { formatDate, formatPrice } from "@chowgo/shared/format";
import { localizedText } from "@chowgo/shared/collections";

import { Stack } from "@/components/layout/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAction } from "@/hooks/Admin/useAdmin";
import { useAdminCollections } from "@/hooks/Admin/useAdminCollections";
import {
  createAdminCollection,
  reorderAdminCollections,
  setAdminCollectionStatus,
  updateAdminCollection,
} from "@/services/apiAdmin";
import { CollectionFormDialog } from "./CollectionFormDialog";

const STATUS_TONE = { draft: "muted", published: "success", archived: "destructive" };
const ACTIONS = {
  draft: ["publish", "archive"],
  published: ["unpublish", "archive"],
  archived: ["restore"],
};

function ruleSummary(collection, t) {
  const rules = collection.rules ?? {};
  const parts = [];
  if (collection.pins?.length) parts.push(t("admin:collections.summary.pins", { count: collection.pins.length }));
  if (collection.manualOnly) {
    parts.push(t("admin:collections.summary.manualOnly"));
    return parts;
  }
  for (const cuisine of rules.cuisines ?? []) parts.push(cuisineLabel(t, cuisine));
  for (const category of rules.categories ?? []) {
    parts.push(t(`common:taxonomy.category.${category}`, { defaultValue: category }));
  }
  if (rules.minRating) parts.push(t("admin:collections.summary.minRating", { value: rules.minRating }));
  if (rules.maxPrice) {
    parts.push(t("admin:collections.summary.maxPrice", { price: formatPrice(rules.maxPrice, { currency: rules.currency }) }));
  }
  if (rules.onlyDeals) parts.push(t("admin:collections.summary.onlyDeals"));
  if (rules.openNow) parts.push(t("admin:collections.summary.openNow"));
  if (rules.newWithinDays) parts.push(t("admin:collections.summary.newWithinDays", { count: rules.newWithinDays }));
  if (rules.sort) {
    parts.push(t("admin:collections.summary.sort", { sort: t(`admin:collections.sort.${rules.sort}`) }));
  }
  return parts;
}

export function CollectionsTab() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState(null);
  const query = useAdminCollections({ archived });
  const create = useAdminAction(createAdminCollection);
  const update = useAdminAction(updateAdminCollection);
  const status = useAdminAction(setAdminCollectionStatus);
  const reorder = useAdminAction(reorderAdminCollections);
  const { collections } = query;
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const save = async (payload) => {
    if (editing?.id) await update.mutateAsync({ id: editing.id, ...payload, expectedUpdatedAt: editing.updatedAt });
    else await create.mutateAsync(payload);
    setEditing(null);
  };

  const move = (index, delta) => {
    const ids = collections.map((collection) => collection.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    reorder.mutate(ids);
  };

  const columns = archived
    ? ["collection", "kind", "rules", "status", "actions"]
    : ["order", "collection", "kind", "rules", "status", "actions"];

  return (
    <Stack gap="sm">
      <p className="text-body-sm text-muted-foreground">{t("collections.description")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch id="collections-archived" checked={archived} onCheckedChange={setArchived} />
          <Label htmlFor="collections-archived">{t("collections.showArchived")}</Label>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setEditing({})}>
          {t("collections.create")}
        </Button>
      </div>

      {query.isError ? (
        <p className="text-body-sm text-destructive py-6">{t("loadFailed")}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{t(`collections.columns.${column}`)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.length === 0 && !query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-muted-foreground text-center py-8">
                    {t("collections.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                collections.map((collection, index) => {
                  const title = localizedText(collection.title, locale);
                  const rules = ruleSummary(collection, t);
                  return (
                    <TableRow key={collection.id}>
                      {!archived && (
                        <TableCell className="whitespace-nowrap">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={index === 0 || reorder.isPending}
                            aria-label={t("collections.moveUp", { title })}
                            onClick={() => move(index, -1)}
                          >
                            <ArrowUp aria-hidden="true" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={index === collections.length - 1 || reorder.isPending}
                            aria-label={t("collections.moveDown", { title })}
                            onClick={() => move(index, 1)}
                          >
                            <ArrowDown aria-hidden="true" />
                          </Button>
                        </TableCell>
                      )}
                      <TableCell>
                        <p className="font-medium">{title}</p>
                        <p className="text-caption text-muted-foreground">/collections/{collection.slug}</p>
                      </TableCell>
                      <TableCell>{t(`collections.kind.${collection.kind}`)}</TableCell>
                      <TableCell className="max-w-72">
                        <p className="text-body-sm">{rules.join(" · ") || "-"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_TONE[collection.status]}>
                          {t(`collections.status.${collection.status}`)}
                        </Badge>
                        {(collection.startsAt || collection.endsAt) && (
                          <p className="text-caption text-muted-foreground mt-1 whitespace-nowrap">
                            {t("collections.summary.schedule", {
                              from: collection.startsAt ? formatDate(collection.startsAt) : t("collections.summary.noStart"),
                              to: collection.endsAt ? formatDate(collection.endsAt) : t("collections.summary.noEnd"),
                            })}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2 whitespace-nowrap">
                        {collection.status !== "archived" && (
                          <Button size="sm" variant="outline" onClick={() => setEditing(collection)}>
                            {t("collections.actions.edit")}
                          </Button>
                        )}
                        {ACTIONS[collection.status]?.map((action) => (
                          <Button
                            key={action}
                            size="sm"
                            variant={action === "publish" || action === "restore" ? "default" : "outline"}
                            disabled={status.isPending}
                            onClick={() => status.mutate({ id: collection.id, action })}
                          >
                            {t(`collections.actions.${action}`)}
                          </Button>
                        ))}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <CollectionFormDialog
          key={editing.id ?? "new"}
          collection={editing}
          isSaving={create.isPending || update.isPending}
          onSubmit={save}
          onClose={() => setEditing(null)}
        />
      )}
    </Stack>
  );
}
