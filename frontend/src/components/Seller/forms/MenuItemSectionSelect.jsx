import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";

export function MenuItemSectionSelect({ sections, value, onChange }) {
  const { t } = useTranslation(["seller"]);

  return (
    <div>
      <Label htmlFor="sectionId">{t("menuLayout.section")}</Label>
      <select
        id="sectionId"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="">{t("menuLayout.noSection")}</option>
        {sections.map((section) => (
          <option key={section._id} value={section._id}>
            {section.name}
          </option>
        ))}
      </select>
    </div>
  );
}
