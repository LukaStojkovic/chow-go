import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit2, CheckCircle2, XCircle } from "lucide-react";

export const SellerMenu = () => {
  const menuItems = [
    {
      name: "Margherita Pizza",
      price: "$12.00",
      cat: "Pizza",
      stock: true,
      img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
    },
    {
      name: "Double Cheeseburger",
      price: "$14.50",
      cat: "Burger",
      stock: true,
      img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    },
    {
      name: "Caesar Salad",
      price: "$10.00",
      cat: "Salad",
      stock: false,
      img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80",
    },
    {
      name: "Sushi Platter",
      price: "$24.00",
      cat: "Japanese",
      stock: true,
      img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80",
    },
    {
      name: "Tiramisu",
      price: "$8.50",
      cat: "Dessert",
      stock: true,
      img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="default">All Items</Button>
          <Button variant="outline">Out of Stock</Button>
          <Button variant="outline">Categories</Button>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card
            key={item.name}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video relative overflow-hidden">
              <img
                src={item.img}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <Badge className="absolute top-3 right-3">{item.cat}</Badge>
            </div>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <span className="font-bold text-emerald-600">{item.price}</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div
                  className={`flex items-center gap-2 text-sm font-medium ${
                    item.stock ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {item.stock ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {item.stock ? "In Stock" : "Sold Out"}
                </div>
                <Button variant="ghost" size="icon">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
