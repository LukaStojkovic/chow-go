import { motion } from "framer-motion";
import { Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

export default function MenuItemCard({ menuItem, onDelete, onEdit, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl dark:bg-zinc-900"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={menuItem.imageUrls?.[0] || "/placeholder-menu.jpg"}
          alt={menuItem.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <Badge
          variant="secondary"
          className="absolute top-3 left-3 uppercase text-xs tracking-wide"
        >
          {menuItem.category}
        </Badge>

        <Badge
          className={`absolute top-3 right-3 ${
            menuItem.available ? "bg-emerald-600" : "bg-destructive"
          }`}
        >
          {menuItem.available ? "Available" : "Sold Out"}
        </Badge>

        <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black shadow-md backdrop-blur-md">
          ${menuItem.price}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
            {menuItem.name}
          </h3>

          <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-zinc-800">
            {menuItem.available ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <XCircle className="h-3 w-3 text-destructive" />
            )}
            <span className="text-xs font-bold">
              {menuItem.available ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        </div>

        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {menuItem.description || "No description available."}
        </p>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-zinc-800">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
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
              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
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
