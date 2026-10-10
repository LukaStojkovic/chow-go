import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { ArrowDown, ArrowUp, FolderInput, Plus, Trash2 } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { cloudinaryUrl } from "@chowgo/shared/image";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, Inset } from "@/components/ui/Card";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { DockedBar } from "@/components/ui/FloatingBar";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import {
  MENU_LAYOUT_LIMITS,
  addSection,
  deleteSection,
  isLayoutDirty,
  moveDish,
  moveDishTo,
  moveSection,
  renameSection,
  sectionOfDish,
  toLayoutDraft,
  toLayoutPayload,
  validateLayoutDraft,
} from "@/features/seller/menuLayoutDraft";
import { useMenuLayout, useSaveMenuLayout } from "@/hooks/Restaurants/useMenuLayout";
import { useOwnRestaurant } from "@/hooks/Restaurants/useOwnRestaurant";
import { cn } from "@/lib/cn";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

function SmallIconButton({ disabled, className, ...props }) {
  return (
    <IconButton
      size={34}
      variant="muted"
      disabled={disabled}
      accessibilityState={{ disabled: Boolean(disabled) }}
      className={cn(disabled && "opacity-45", className)}
      {...props}
    />
  );
}

function DishRow({ item, currency, isFirst, isLast, onMoveUp, onMoveDown, onMoveTo }) {
  const { t } = useTranslation(["seller"]);
  const image = item.imageUrls?.[0];
  const reorderable = Boolean(onMoveUp);

  return (
    <View className="flex-row items-center gap-3 py-2">
      <View className="h-12 w-12 overflow-hidden rounded-sm bg-muted">
        {image ? (
          <Image
            source={cloudinaryUrl(image, { width: 144, height: 144, crop: "fill" })}
            style={{ flex: 1, opacity: item.available === false ? 0.45 : 1 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : null}
      </View>

      <View className="flex-1 gap-0.5">
        <Text variant="label" numberOfLines={1} tone={item.available === false ? "muted" : "foreground"}>
          {item.name}
        </Text>
        <Text variant="caption" tone="muted">
          {formatPrice(item.price, { currency })}
        </Text>
      </View>

      <View className="flex-row gap-1.5">
        {reorderable ? (
          <>
            <SmallIconButton
              icon={ArrowUp}
              label={t("menuLayout.moveUp")}
              accessibilityHint={item.name}
              disabled={isFirst}
              onPress={onMoveUp}
            />
            <SmallIconButton
              icon={ArrowDown}
              label={t("menuLayout.moveDown")}
              accessibilityHint={item.name}
              disabled={isLast}
              onPress={onMoveDown}
            />
          </>
        ) : null}
        <SmallIconButton
          icon={FolderInput}
          variant="mint"
          label={t("menuLayout.moveTo")}
          accessibilityHint={item.name}
          onPress={onMoveTo}
        />
      </View>
    </View>
  );
}

export default function MenuLayoutScreen() {
  const { t } = useTranslation(["seller", "common", "errors"]);
  const layout = useMenuLayout();
  const save = useSaveMenuLayout();
  const currency = useOwnRestaurant().data?.currency;
  const { color } = useTokens();

  const [draft, setDraft] = useState(null);
  const [newName, setNewName] = useState("");
  const [moving, setMoving] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const dirty = isLayoutDirty(draft, layout.data);

  useEffect(() => {
    if (layout.data && (!draft || !dirty)) setDraft(toLayoutDraft(layout.data));
  }, [layout.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const sections = draft?.sections ?? [];
  const unsectioned = draft?.unsectioned ?? [];
  const atLimit = sections.length >= MENU_LAYOUT_LIMITS.maxSections;

  function add() {
    const name = newName.trim();
    if (!name || atLimit) return;
    setDraft((current) => addSection(current, name));
    setNewName("");
  }

  async function onSave() {
    const problem = validateLayoutDraft(draft, t);
    if (problem) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(t("menuLayout.saveFailed"), { description: problem });
      return;
    }
    try {
      const saved = await save.mutateAsync(toLayoutPayload(draft));
      setDraft(toLayoutDraft(saved));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(t("menuLayout.saved"));
    } catch (error) {
      toast.error(t("menuLayout.saveFailed"), { description: errorMessage(error) });
    }
  }

  const movingFrom = moving && draft ? sectionOfDish(draft, moving._id) : null;
  const deletingSection = sections.find((section) => section.key === deleting);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("menuLayout.title")} />

      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="body-sm" tone="muted">
          {t("menuLayout.hint")}
        </Text>

        {layout.isError ? (
          <EmptyState
            tone="danger"
            title={t("common:error.generic")}
            actionLabel={t("common:actions.retry")}
            onAction={layout.refetch}
          />
        ) : !draft ? (
          <View className="gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-lg" />
            ))}
          </View>
        ) : (
          <>
            <Card className="gap-3">
              <Input
                label={t("menuLayout.sectionName")}
                value={newName}
                onChangeText={setNewName}
                placeholder={t("menuLayout.sectionNamePlaceholder")}
                maxLength={MENU_LAYOUT_LIMITS.maxNameLength}
                returnKeyType="done"
                onSubmitEditing={add}
              />
              <Button variant="mint" disabled={!newName.trim() || atLimit} onPress={add}>
                <View className="flex-row items-center gap-1.5">
                  <Plus size={16} strokeWidth={2.6} color={color["primary-subtle-foreground"]} />
                  <Text variant="label" className="text-primary-subtle-foreground">
                    {t("menuLayout.addSection")}
                  </Text>
                </View>
              </Button>
            </Card>

            {sections.length === 0 ? (
              <Inset>
                <Text variant="body-sm" tone="muted">
                  {t("menuLayout.empty")}
                </Text>
              </Inset>
            ) : null}

            {sections.map((section, sectionIndex) => (
              <Card key={section.key} className="gap-2">
                <Input
                  value={section.name}
                  onChangeText={(name) => setDraft((current) => renameSection(current, section.key, name))}
                  accessibilityLabel={t("menuLayout.sectionName")}
                  placeholder={t("menuLayout.sectionNamePlaceholder")}
                  maxLength={MENU_LAYOUT_LIMITS.maxNameLength}
                />

                <View className="flex-row items-center gap-1.5">
                  <Text variant="caption" tone="muted" className="flex-1">
                    {t("common:count.dishes", { count: section.items.length })}
                  </Text>
                  <SmallIconButton
                    icon={ArrowUp}
                    label={t("menuLayout.moveUp")}
                    accessibilityHint={section.name}
                    disabled={sectionIndex === 0}
                    onPress={() => setDraft((current) => moveSection(current, section.key, -1))}
                  />
                  <SmallIconButton
                    icon={ArrowDown}
                    label={t("menuLayout.moveDown")}
                    accessibilityHint={section.name}
                    disabled={sectionIndex === sections.length - 1}
                    onPress={() => setDraft((current) => moveSection(current, section.key, 1))}
                  />
                  <SmallIconButton
                    icon={Trash2}
                    label={t("menuLayout.deleteSection")}
                    accessibilityHint={section.name}
                    onPress={() => setDeleting(section.key)}
                  />
                </View>

                {section.items.length === 0 ? (
                  <Text variant="body-sm" tone="muted" className="py-2">
                    {t("menuLayout.emptySection")}
                  </Text>
                ) : (
                  section.items.map((item, index) => (
                    <DishRow
                      key={item._id}
                      item={item}
                      currency={currency}
                      isFirst={index === 0}
                      isLast={index === section.items.length - 1}
                      onMoveUp={() => setDraft((current) => moveDish(current, section.key, item._id, -1))}
                      onMoveDown={() => setDraft((current) => moveDish(current, section.key, item._id, 1))}
                      onMoveTo={() => setMoving(item)}
                    />
                  ))
                )}
              </Card>
            ))}

            <Card className="gap-2">
              <View className="gap-0.5">
                <Text variant="h3">{t("menuLayout.unsectioned")}</Text>
                <Text variant="caption" tone="muted">
                  {t("menuLayout.unsectionedHint")}
                </Text>
              </View>
              {unsectioned.map((item) => (
                <DishRow key={item._id} item={item} currency={currency} onMoveTo={() => setMoving(item)} />
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      <DockedBar>
        {dirty ? (
          <Text variant="caption" tone="warning" className="text-center">
            {t("menuLayout.unsaved")}
          </Text>
        ) : null}
        <View className="flex-row gap-2.5">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={!dirty || save.isPending}
            onPress={() => setDraft(toLayoutDraft(layout.data))}
          >
            {t("menuLayout.discard")}
          </Button>
          <Button size="lg" className="flex-1" disabled={!dirty} loading={save.isPending} onPress={onSave}>
            {t("menuLayout.save")}
          </Button>
        </View>
      </DockedBar>

      <Sheet
        visible={Boolean(moving)}
        onClose={() => setMoving(null)}
        icon={FolderInput}
        tone="mint"
        title={t("menuLayout.moveTo")}
        description={moving?.name}
      >
        <SheetActions>
          {sections
            .filter((section) => section.key !== movingFrom)
            .map((section) => (
              <Button
                key={section.key}
                variant="outline"
                size="lg"
                fullWidth
                onPress={() => {
                  setDraft((current) => moveDishTo(current, moving._id, section.key));
                  setMoving(null);
                }}
              >
                {section.name.trim() || t("menuLayout.section")}
              </Button>
            ))}
          {movingFrom ? (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onPress={() => {
                setDraft((current) => moveDishTo(current, moving._id, null));
                setMoving(null);
              }}
            >
              {t("menuLayout.unsectioned")}
            </Button>
          ) : null}
          <Button variant="ghost" size="lg" fullWidth onPress={() => setMoving(null)}>
            {t("common:actions.cancel")}
          </Button>
        </SheetActions>
      </Sheet>

      <Sheet
        visible={Boolean(deletingSection)}
        onClose={() => setDeleting(null)}
        icon={Trash2}
        title={t("menuLayout.deleteSection")}
        description={t("menuLayout.deleteSectionHint")}
      >
        <SheetActions>
          <Button
            variant="destructive"
            size="lg"
            fullWidth
            onPress={() => {
              setDraft((current) => deleteSection(current, deleting));
              setDeleting(null);
            }}
          >
            {t("menuLayout.deleteSection")}
          </Button>
          <Button variant="outline" size="lg" fullWidth onPress={() => setDeleting(null)}>
            {t("common:actions.cancel")}
          </Button>
        </SheetActions>
      </Sheet>
    </Screen>
  );
}
