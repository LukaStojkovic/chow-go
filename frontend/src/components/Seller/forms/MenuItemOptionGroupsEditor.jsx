import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { OPTION_LIMITS } from "@chowgo/shared/menuOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { newGroup, newOption } from "./optionGroupsForm";

/**
 * @param {Object} props
 * @param {Array<Object>} props.value Editor state, see `optionGroupsToEditorState`.
 * @param {(next: Array<Object>) => void} props.onChange
 * @param {string | null} [props.error]
 */
export function MenuItemOptionGroupsEditor({ value, onChange, error }) {
  const { t } = useTranslation(["seller", "common"]);
  const baseId = useId();

  const updateGroup = (index, patch) =>
    onChange(value.map((group, i) => (i === index ? { ...group, ...patch } : group)));

  const updateOption = (groupIndex, optionIndex, patch) =>
    updateGroup(groupIndex, {
      options: value[groupIndex].options.map((option, i) =>
        i === optionIndex ? { ...option, ...patch } : option,
      ),
    });

  const moveGroup = (index, by) => {
    const next = [...value];
    const [group] = next.splice(index, 1);
    next.splice(index + by, 0, group);
    onChange(next);
  };

  return (
    <fieldset className="border-border space-y-4 rounded-md border p-4">
      <legend className="text-label text-foreground px-1">{t("menuOptions.title")}</legend>
      <p className="text-body-sm text-muted-foreground">{t("menuOptions.hint")}</p>

      {value.length === 0 && (
        <p className="text-body-sm text-muted-foreground">{t("menuOptions.empty")}</p>
      )}

      {value.map((group, groupIndex) => {
        const groupId = `${baseId}-g-${group.key}`;
        return (
          <section
            key={group.key}
            aria-labelledby={`${groupId}-name-label`}
            className="border-border bg-muted/30 space-y-3 rounded-md border p-3"
          >
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Label id={`${groupId}-name-label`} htmlFor={`${groupId}-name`}>
                  {t("menuOptions.groupName")} {groupIndex + 1}
                </Label>
                <Input
                  id={`${groupId}-name`}
                  className="mt-2"
                  maxLength={OPTION_LIMITS.nameLength}
                  placeholder={t("menuOptions.groupNamePlaceholder")}
                  value={group.name}
                  onChange={(event) => updateGroup(groupIndex, { name: event.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("menuOptions.moveUp")}
                disabled={groupIndex === 0}
                onClick={() => moveGroup(groupIndex, -1)}
              >
                <ChevronUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("menuOptions.moveDown")}
                disabled={groupIndex === value.length - 1}
                onClick={() => moveGroup(groupIndex, 1)}
              >
                <ChevronDown aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("menuOptions.removeGroup")}
                onClick={() => onChange(value.filter((_, i) => i !== groupIndex))}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`${groupId}-min`}>{t("menuOptions.minSelect")}</Label>
                <Input
                  id={`${groupId}-min`}
                  type="number"
                  min="0"
                  step="1"
                  className="mt-2"
                  value={group.minSelect}
                  onChange={(event) => updateGroup(groupIndex, { minSelect: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`${groupId}-max`}>{t("menuOptions.maxSelect")}</Label>
                <Input
                  id={`${groupId}-max`}
                  type="number"
                  min="1"
                  step="1"
                  className="mt-2"
                  value={group.maxSelect}
                  onChange={(event) => updateGroup(groupIndex, { maxSelect: event.target.value })}
                />
              </div>
            </div>

            <ul className="space-y-2">
              {group.options.map((option, optionIndex) => {
                const optionId = `${groupId}-o-${option.key}`;
                return (
                  <li key={option.key} className="flex flex-wrap items-end gap-2">
                    <div className="min-w-0 flex-[2_1_10rem]">
                      <Label htmlFor={`${optionId}-name`}>
                        {t("menuOptions.optionName")} {optionIndex + 1}
                      </Label>
                      <Input
                        id={`${optionId}-name`}
                        className="mt-2"
                        maxLength={OPTION_LIMITS.nameLength}
                        placeholder={t("menuOptions.optionNamePlaceholder")}
                        value={option.name}
                        onChange={(event) =>
                          updateOption(groupIndex, optionIndex, { name: event.target.value })
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-[1_1_6rem]">
                      <Label htmlFor={`${optionId}-price`}>{t("menuOptions.priceDelta")}</Label>
                      <Input
                        id={`${optionId}-price`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="mt-2"
                        value={option.priceDelta}
                        onChange={(event) =>
                          updateOption(groupIndex, optionIndex, { priceDelta: event.target.value })
                        }
                      />
                    </div>
                    <div className="flex h-10 items-center gap-2">
                      <Switch
                        id={`${optionId}-available`}
                        checked={option.available}
                        onCheckedChange={(checked) =>
                          updateOption(groupIndex, optionIndex, { available: checked })
                        }
                      />
                      <Label htmlFor={`${optionId}-available`} className="cursor-pointer">
                        {t("menuOptions.available")}
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${t("menuOptions.removeOption")} ${optionIndex + 1}`}
                      onClick={() =>
                        updateGroup(groupIndex, {
                          options: group.options.filter((_, i) => i !== optionIndex),
                        })
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={group.options.length >= OPTION_LIMITS.optionsPerGroup}
              onClick={() => updateGroup(groupIndex, { options: [...group.options, newOption()] })}
            >
              <Plus aria-hidden="true" />
              {t("menuOptions.addOption")}
            </Button>
          </section>
        );
      })}

      <Button
        type="button"
        variant="outline"
        disabled={value.length >= OPTION_LIMITS.groups}
        onClick={() => onChange([...value, newGroup()])}
      >
        <Plus aria-hidden="true" />
        {t("menuOptions.addGroup")}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
