import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

export default function MenuItemCard({ menuItem, onDelete }) {
  return (
    <Card
      key={menuItem._id}
      className="group overflow-hidden border-border/60 bg-card hover:shadow-xl transition-all duration-300"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={menuItem.imageUrls?.[0] || "/placeholder-menu.jpg"}
          alt={menuItem.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
      </div>

      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1">
            {menuItem.name}
          </h3>
          <span className="font-bold text-emerald-600 whitespace-nowrap">
            {menuItem.price} $
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {menuItem.description || "Nema opisa."}
        </p>
        <div className="flex items-center justify-between pt-4">
          <div
            className={`flex items-center gap-2 text-sm font-medium ${
              menuItem.available ? "text-emerald-600" : "text-destructive"
            }`}
          >
            {menuItem.available ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {menuItem.available ? "In Stock" : "Out of Stock"}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="link"
              className="text-red-500  hover:bg-red-500  hover:text-white"
              onClick={() => onDelete(menuItem)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
