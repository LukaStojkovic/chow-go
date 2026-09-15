import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OrdersTableSkeleton({ rows = 5 }) {
  const { t } = useTranslation("seller");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("orders.table.id")}</TableHead>
          <TableHead>{t("orders.table.customer")}</TableHead>
          <TableHead>{t("orders.table.items")}</TableHead>
          <TableHead>{t("orders.table.status")}</TableHead>
          <TableHead>{t("orders.table.total")}</TableHead>
          <TableHead className="text-right">{t("orders.table.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-8 w-8 ml-auto" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
