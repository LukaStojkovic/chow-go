import React from "react";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationSelector({
  pagination,
  page,
  setPage,
  isFetching,
}) {
  return (
    <div>
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-8 mt-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="h-10 w-10 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages || isFetching}
            className="h-10 w-10 rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
