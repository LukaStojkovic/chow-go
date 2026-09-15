import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptyOrdersState({ statusFilter }) {
  const { t } = useTranslation(["seller", "common"]);
  return (
    <div className="text-center py-12">
      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{t("orders.empty.new.title")}</h3>
      <p className="text-sm text-muted-foreground">
        {statusFilter === "active"
          ? t("orders.emptyActiveLong")
          : t("orders.emptyFiltered", { status: statusFilter })}
      </p>
    </div>
  );
}
