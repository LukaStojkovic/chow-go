import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Edit2, Trash2, Tag, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { formatPrice } from "@chowgo/shared/format";
import { isPromotionLive, resolvePromotion } from "@chowgo/shared/promotion";
import { cloudinaryUrl } from "@chowgo/shared/image";
import { soldOutOptionCount, soldOutState } from "@chowgo/shared/stock";
import { useMenuItemStock } from "./hooks/useMenuItemStock";
import StockSwitch from "./Stock/StockSwitch";
import OptionStockSheet from "./Stock/OptionStockSheet";
import { soldOutLabel } from "./Stock/soldOutLabel";

export default function MenuItemCard({ menuItem, restaurantId, onDelete, onEdit, index }) {
  const { t, i18n } = useTranslation(["seller", "common"]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const { setStock, isPending } = useMenuItemStock(restaurantId);
  // This screen reads raw MenuItem documents, so the promoted price is resolved
  // here rather than read off the response the way customer screens do.
  const { price, basePrice, discountPercent } = resolvePromotion(
    menuItem.price,
    menuItem.promotion,
  );
  // Set but not yet running (or already finished): worth showing, because the
  // seller needs to know the deal exists even while it is dormant.
  const isScheduled =
    Boolean(menuItem.promotion?.isActive) && !isPromotionLive(menuItem.promotion);

  const now = new Date();
  const soldOut = soldOutState(menuItem, now);
  const optionCount = (menuItem.optionGroups ?? []).reduce(
    (sum, group) => sum + (group.options?.length ?? 0),
    0,
  );
  const optionsSoldOut = soldOutOptionCount(menuItem, now);
  const changeStock = (input) => setStock({ menuItemId: menuItem._id, ...input });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      data-testid={`menu-item-${menuItem._id}`}
      className="group relative overflow-hidden rounded-2xl bg-card shadow-sm transition-all hover:shadow-xl"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={cloudinaryUrl(menuItem.imageUrls?.[0], { width: 640 }) || "/placeholder-menu.jpg"}
          alt={menuItem.name}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            soldOut ? "opacity-50 grayscale" : ""
          }`}
        />

        <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
          <Badge variant="secondary" className="uppercase text-xs tracking-wide">
            {menuItem.category}
          </Badge>

          {discountPercent > 0 && (
            <Badge variant="promo">
              <Tag aria-hidden="true" />
              {menuItem.promotion?.label
                ? `${menuItem.promotion.label} · -${discountPercent}%`
                : `-${discountPercent}%`}
            </Badge>
          )}

          {isScheduled && (
            <Badge variant="outline" className="bg-card/90 backdrop-blur-sm">
              {t("promotion.scheduled")}
            </Badge>
          )}
        </div>

        {soldOut ? (
          <Badge className="absolute top-3 right-3 flex-col items-end gap-0 bg-destructive py-1 text-right">
            <span>{t("stock.soldOut")}</span>
            <span className="text-[11px] font-normal opacity-90">
              {soldOutLabel(soldOut, t, i18n.language, now)}
            </span>
          </Badge>
        ) : (
          <Badge className="absolute top-3 right-3 bg-primary">{t("menu.available")}</Badge>
        )}

        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-xs font-bold shadow-md backdrop-blur-md">
          {basePrice != null && (
            <span className="text-muted-foreground tabular font-medium line-through">
              {formatPrice(basePrice)}
            </span>
          )}
          <span className={basePrice != null ? "text-primary tabular" : "text-foreground tabular"}>
            {formatPrice(price)}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3
            className={`text-lg font-bold line-clamp-1 ${
              soldOut ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {menuItem.name}
          </h3>

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-muted px-2.5 py-1">
            <span className="text-xs font-bold">
              {soldOut ? t("menu.outOfStock") : t("menu.inStock")}
            </span>
            <StockSwitch
              inStock={!soldOut}
              disabled={isPending}
              label={t("stock.switchLabel", { name: menuItem.name })}
              onChange={changeStock}
            />
          </div>
        </div>

        <p className={`mb-3 text-sm text-muted-foreground line-clamp-2 ${soldOut ? "opacity-60" : ""}`}>
          {menuItem.description || t("menu.noDescription")}
        </p>

        <div className="flex items-center justify-between border-t border-border pt-3 text-sm ">
          <div className="flex items-center gap-2 text-muted-foreground ">
            {optionCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className={`h-7 rounded-full text-xs ${
                  optionsSoldOut > 0 ? "border-destructive text-destructive hover:text-destructive" : ""
                }`}
                onClick={() => setOptionsOpen(true)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                {optionsSoldOut > 0
                  ? t("stock.optionsSoldOut", { count: optionsSoldOut })
                  : t("stock.options")}
              </Button>
            ) : (
              <Badge variant="outline" className="text-xs">
                {menuItem.category}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
              aria-label={t("common:a11y.editItem", { name: menuItem.name })}
            >
              <Edit2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive-subtle hover:text-destructive"
              onClick={() => onDelete()}
              aria-label={t("common:a11y.deleteItem", { name: menuItem.name })}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>

      {optionCount > 0 && (
        <OptionStockSheet
          menuItem={menuItem}
          open={optionsOpen}
          onOpenChange={setOptionsOpen}
          onChange={changeStock}
          pending={isPending}
        />
      )}
    </motion.div>
  );
}
