import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, Filter, MoreVertical, Search } from "lucide-react";

export const SellerOrders = () => {
  const orders = [
    {
      id: "#2930",
      customer: "Alex Doe",
      items: "2x Pizza, 1x Coke",
      total: "$42.50",
      status: "New",
      time: "2 min ago",
    },
    {
      id: "#2929",
      customer: "Sarah Smith",
      items: "1x Ramen, 1x Gyoza",
      total: "$28.00",
      status: "Cooking",
      time: "12 min ago",
    },
    {
      id: "#2928",
      customer: "Mike Johnson",
      items: "3x Burger Meal",
      total: "$45.90",
      status: "Ready",
      time: "25 min ago",
    },
    {
      id: "#2927",
      customer: "Emily Davis",
      items: "1x Salad Bowl",
      total: "$14.50",
      status: "Delivered",
      time: "1h ago",
    },
    {
      id: "#2926",
      customer: "Chris Wilson",
      items: "2x Pasta Carbonara",
      total: "$36.00",
      status: "Delivered",
      time: "1h 20m ago",
    },
  ];

  const getStatusVariant = (status) => {
    switch (status) {
      case "New":
        return "default";
      case "Cooking":
        return "secondary";
      case "Ready":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search order ID or customer..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-emerald-600">
                  {order.id}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{order.customer}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.time}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.items}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold">{order.total}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Mark as ready</DropdownMenuItem>
                      <DropdownMenuItem>Cancel order</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
