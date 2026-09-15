import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function OrdersPagination({ pagination, currentPage, onPageChange }) {
  const { t } = useTranslation(["seller", "common"]);
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        {pagination.totalItems > 0
          ? (currentPage - 1) * pagination.limit + 1
          : 0}{" "}
        to {Math.min(currentPage * pagination.limit, pagination.totalItems)} of{" "}
        {pagination.totalItems} orders
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrev}
        >
          {t("common:a11y.previous")}
        </Button>
        <div className="flex items-center gap-2 px-3">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {pagination.totalPages}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNext}
        >
          {t("common:a11y.next")}
        </Button>
      </div>
    </div>
  );
}
