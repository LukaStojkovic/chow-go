import { useTranslation } from "react-i18next";

import { formatPrice } from "@chowgo/shared/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").DishView["optionGroups"]} props.groups
 * @param {Record<string, string[]>} props.selected Picked option ids per group id.
 * @param {(groupId: string, optionIds: string[]) => void} props.onChange
 * @param {string} [props.currency]
 * @param {boolean} [props.disabled]
 * @param {string | null} [props.invalidGroup] Name of the group still missing a pick.
 */
export function DishOptionGroups({ groups, selected, onChange, currency, disabled, invalidGroup }) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <OptionGroupField
          key={group.id}
          group={group}
          value={selected[group.id] ?? []}
          onChange={(ids) => onChange(group.id, ids)}
          currency={currency}
          disabled={disabled}
          invalid={invalidGroup === group.name}
        />
      ))}
    </div>
  );
}

function OptionGroupField({ group, value, onChange, currency, disabled, invalid }) {
  const { t } = useTranslation("restaurant");
  const legendId = `option-group-${group.id}`;
  const ruleId = `${legendId}-rule`;
  const useRadios = group.isSingle && group.isRequired;
  const atMax = value.length >= group.maxSelect;

  const toggle = (optionId, checked) => {
    if (!checked) return onChange(value.filter((id) => id !== optionId));
    if (group.maxSelect === 1) return onChange([optionId]);
    if (value.includes(optionId)) return;
    onChange([...value, optionId]);
  };

  const header = (
    <>
      <legend id={legendId} className="text-h3 text-foreground flex w-full items-start justify-between gap-3">
        <span className="min-w-0">{group.name}</span>
        {group.isRequired && (
          <Badge variant={invalid ? "warning" : "muted"} size="sm" className="shrink-0">
            {t("options.required")}
          </Badge>
        )}
      </legend>
      <p id={ruleId} className="text-caption text-muted-foreground mb-2">
        {group.rule}
      </p>
    </>
  );

  const optionRow = (option, control) => (
    <label
      key={option.id}
      htmlFor={`option-${option.id}`}
      className={cn(
        "border-border flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2",
        (!option.available || disabled) && "cursor-not-allowed opacity-60",
      )}
    >
      {control}
      <span className="text-body text-foreground min-w-0 flex-1">{option.name}</span>
      {!option.available ? (
        <span className="text-caption text-muted-foreground">{t("options.soldOut")}</span>
      ) : (
        option.priceDelta > 0 && (
          <span className="text-body-sm text-muted-foreground tabular">
            {t("options.priceDelta", { price: formatPrice(option.priceDelta, { currency }) })}
          </span>
        )
      )}
    </label>
  );

  return (
    <fieldset aria-describedby={ruleId} aria-invalid={invalid || undefined} className="min-w-0">
      {header}
      {useRadios ? (
        <RadioGroup
          aria-labelledby={legendId}
          aria-describedby={ruleId}
          aria-required="true"
          value={value[0] ?? ""}
          onValueChange={(id) => onChange([id])}
          disabled={disabled}
          className="gap-2"
        >
          {group.options.map((option) =>
            optionRow(
              option,
              <RadioGroupItem
                id={`option-${option.id}`}
                value={option.id}
                disabled={!option.available}
              />,
            ),
          )}
        </RadioGroup>
      ) : (
        <div className="grid gap-2">
          {group.options.map((option) => {
            const checked = value.includes(option.id);
            return optionRow(
              option,
              <Checkbox
                id={`option-${option.id}`}
                checked={checked}
                disabled={
                  disabled || !option.available || (!checked && atMax && group.maxSelect > 1)
                }
                onCheckedChange={(next) => toggle(option.id, next === true)}
              />,
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
