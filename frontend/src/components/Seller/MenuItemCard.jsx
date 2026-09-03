import { motion } from "framer-motion";
import { Edit2, Trash2, CheckCircle2, XCircle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { isPromotionLive, resolvePromotion } from "@/lib/promotion";

export default function MenuItemCard({ menuItem, onDelete, onEdit, index }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-card shadow-sm transition-all hover:shadow-xl "
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={menuItem.imageUrls?.[0] || "/placeholder-menu.jpg"}
          alt={menuItem.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
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
              Promotion scheduled
            </Badge>
          )}
        </div>

        <Badge
          className={`absolute top-3 right-3 ${
            menuItem.available ? "bg-primary" : "bg-destructive"
          }`}
        >
          {menuItem.available ? "Available" : "Sold Out"}
        </Badge>

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
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-lg font-bold text-foreground line-clamp-1">
            {menuItem.name}
          </h3>

          <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 ">
            {menuItem.available ? (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            ) : (
              <XCircle className="h-3 w-3 text-destructive" />
            )}
            <span className="text-xs font-bold">
              {menuItem.available ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        </div>

        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {menuItem.description || "No description available."}
        </p>

        <div className="flex items-center justify-between border-t border-border pt-3 text-sm ">
          <div className="flex items-center gap-2 text-muted-foreground ">
            <Badge variant="outline" className="text-xs">
              {menuItem.category}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive-subtle hover:text-destructive"
              onClick={() => onDelete()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </motion.div>
  );
}
