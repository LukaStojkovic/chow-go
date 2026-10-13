import { useTranslation } from "react-i18next";

export function useTagLabel() {
  const { t } = useTranslation("restaurant");
  return (tag) => t(`restaurant:reviews.tags.${tag}`, { defaultValue: tag });
}
