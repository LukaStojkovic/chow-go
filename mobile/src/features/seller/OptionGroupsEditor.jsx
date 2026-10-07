import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react-native";
import { OPTION_LIMITS, normalizeOptionGroups } from "@chowgo/shared/menuOptions";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, Inset } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import { useTokens } from "@/theme/useTokens";

let nextKey = 0;
const newKey = () => `draft-${++nextKey}`;

const draftOption = (option = {}) => ({
  key: option._id ? String(option._id) : newKey(),
  _id: option._id ? String(option._id) : undefined,
  name: option.name ?? "",
  priceDelta: option.priceDelta ? String(option.priceDelta) : "",
  available: option.available !== false,
});

const draftGroup = (group = {}) => ({
  key: group._id ? String(group._id) : newKey(),
  _id: group._id ? String(group._id) : undefined,
  name: group.name ?? "",
  minSelect: String(group.minSelect ?? 0),
  maxSelect: String(group.maxSelect ?? 1),
  options: (group.options?.length ? group.options : [{}]).map(draftOption),
});

export function toOptionDrafts(groups) {
  return Array.isArray(groups) ? groups.map(draftGroup) : [];
}

const ERROR_MESSAGES = {
  OPTION_GROUPS_INVALID: (t, params) => t("errors:menuOption.invalid", params),
  OPTION_GROUP_NAME: (t, params) => t("errors:menuOption.groupName", params),
  OPTION_GROUP_EMPTY: (t, params) => t("errors:menuOption.groupEmpty", params),
  OPTION_GROUP_RANGE: (t, params) => t("errors:menuOption.groupRange", params),
  OPTION_NAME: (t, params) => t("errors:menuOption.name", params),
  OPTION_PRICE: (t, params) => t("errors:menuOption.price", params),
  OPTION_TOO_MANY_GROUPS: (t, params) => t("errors:menuOption.tooManyGroups", params),
  OPTION_TOO_MANY_OPTIONS: (t, params) => t("errors:menuOption.tooManyOptions", params),
};

export function validateOptionDrafts(drafts, t) {
  const payload = drafts.map(({ _id, name, minSelect, maxSelect, options }) => ({
    ...(_id ? { _id } : {}),
    name,
    minSelect: minSelect.trim() === "" ? 0 : Number(minSelect),
    maxSelect: maxSelect.trim() === "" ? 1 : Number(maxSelect),
    options: options.map((option) => ({
      ...(option._id ? { _id: option._id } : {}),
      name: option.name,
      priceDelta: option.priceDelta.trim() === "" ? 0 : Number(option.priceDelta.replace(",", ".")),
      available: option.available,
    })),
  }));
  const result = normalizeOptionGroups(payload);
  if (!result.error) return { groups: result.groups };

  const { code, group, max } = result.error;
  return {
    error: {
      group,
      message: (ERROR_MESSAGES[code] ?? ERROR_MESSAGES.OPTION_GROUPS_INVALID)(t, {
        group: group === undefined ? "" : group + 1,
        max,
      }),
    },
  };
}

export function OptionGroupsEditor({ groups, onChange, error }) {
  const { t } = useTranslation(["seller", "errors"]);
  const { color } = useTokens();

  const updateGroup = (index, patch) =>
    onChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  const updateOption = (groupIndex, optionIndex, patch) =>
    updateGroup(groupIndex, {
      options: groups[groupIndex].options.map((option, i) =>
        i === optionIndex ? { ...option, ...patch } : option,
      ),
    });
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= groups.length) return;
    const next = [...groups];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <Card className="gap-4">
      <View className="gap-0.5">
        <Text variant="h3">{t("seller:menuOptions.title")}</Text>
        <Text variant="caption" tone="muted">
          {t("seller:menuOptions.hint")}
        </Text>
      </View>

      {error && error.group === undefined ? (
        <Inset tone="danger">
          <Text variant="body-sm" tone="destructive">
            {error.message}
          </Text>
        </Inset>
      ) : null}

      {groups.length === 0 ? (
        <Text variant="body-sm" tone="muted">
          {t("seller:menuOptions.empty")}
        </Text>
      ) : null}

      {groups.map((group, groupIndex) => (
        <View key={group.key} className="gap-3 rounded-lg bg-muted/50 p-3">
          <View className="flex-row items-end gap-2">
            <Input
              containerClassName="flex-1"
              label={t("seller:menuOptions.groupName")}
              placeholder={t("seller:menuOptions.groupNamePlaceholder")}
              value={group.name}
              maxLength={OPTION_LIMITS.nameLength}
              onChangeText={(name) => updateGroup(groupIndex, { name })}
            />
            <View className="flex-row gap-1 pb-2">
              <IconButton
                icon={ChevronUp}
                size={36}
                label={t("seller:menuOptions.moveUp")}
                disabled={groupIndex === 0}
                onPress={() => move(groupIndex, -1)}
              />
              <IconButton
                icon={ChevronDown}
                size={36}
                label={t("seller:menuOptions.moveDown")}
                disabled={groupIndex === groups.length - 1}
                onPress={() => move(groupIndex, 1)}
              />
              <IconButton
                icon={Trash2}
                size={36}
                label={t("seller:menuOptions.removeGroup")}
                onPress={() => onChange(groups.filter((_, i) => i !== groupIndex))}
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <Input
              containerClassName="flex-1"
              label={t("seller:menuOptions.minSelect")}
              keyboardType="number-pad"
              value={group.minSelect}
              onChangeText={(minSelect) => updateGroup(groupIndex, { minSelect })}
            />
            <Input
              containerClassName="flex-1"
              label={t("seller:menuOptions.maxSelect")}
              keyboardType="number-pad"
              value={group.maxSelect}
              onChangeText={(maxSelect) => updateGroup(groupIndex, { maxSelect })}
            />
          </View>

          {group.options.map((option, optionIndex) => (
            <View key={option.key} className="gap-2 rounded-md bg-card p-3">
              <View className="flex-row items-end gap-2">
                <Input
                  containerClassName="flex-1"
                  label={t("seller:menuOptions.optionName")}
                  placeholder={t("seller:menuOptions.optionNamePlaceholder")}
                  value={option.name}
                  maxLength={OPTION_LIMITS.nameLength}
                  onChangeText={(name) => updateOption(groupIndex, optionIndex, { name })}
                />
                <View className="pb-2">
                  <IconButton
                    icon={X}
                    size={36}
                    variant="muted"
                    label={t("seller:menuOptions.removeOption")}
                    onPress={() =>
                      updateGroup(groupIndex, {
                        options: group.options.filter((_, i) => i !== optionIndex),
                      })
                    }
                  />
                </View>
              </View>
              <View className="flex-row items-end gap-3">
                <Input
                  containerClassName="flex-1"
                  label={t("seller:menuOptions.priceDelta")}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  value={option.priceDelta}
                  onChangeText={(priceDelta) => updateOption(groupIndex, optionIndex, { priceDelta })}
                />
                <View className="h-14 flex-row items-center gap-2">
                  <Text variant="label-sm" tone="muted">
                    {t("seller:menuOptions.available")}
                  </Text>
                  <Toggle
                    value={option.available}
                    onValueChange={(available) => updateOption(groupIndex, optionIndex, { available })}
                    accessibilityLabel={t("seller:menuOptions.available")}
                  />
                </View>
              </View>
            </View>
          ))}

          {group.options.length < OPTION_LIMITS.optionsPerGroup ? (
            <Button
              variant="ghost"
              onPress={() => updateGroup(groupIndex, { options: [...group.options, draftOption()] })}
            >
              <View className="flex-row items-center gap-2">
                <Plus size={16} color={color.primary} />
                <Text variant="label" tone="primary">
                  {t("seller:menuOptions.addOption")}
                </Text>
              </View>
            </Button>
          ) : null}

          {error && error.group === groupIndex ? (
            <Text variant="caption" tone="destructive">
              {error.message}
            </Text>
          ) : null}
        </View>
      ))}

      {groups.length < OPTION_LIMITS.groups ? (
        <Button variant="mint" onPress={() => onChange([...groups, draftGroup()])}>
          <View className="flex-row items-center gap-2">
            <Plus size={16} color={color.primary} />
            <Text variant="label" tone="primary">
              {t("seller:menuOptions.addGroup")}
            </Text>
          </View>
        </Button>
      ) : null}
    </Card>
  );
}
