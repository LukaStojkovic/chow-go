export const MENU_LAYOUT_LIMITS = { maxSections: 30, maxNameLength: 40 };

let nextKey = 0;
const newKey = () => `new-${++nextKey}`;

export function toLayoutDraft(layout) {
  return {
    sections: (layout?.sections ?? []).map((section) => ({
      key: String(section._id),
      _id: String(section._id),
      name: section.name ?? "",
      items: section.items ?? [],
    })),
    unsectioned: layout?.unsectioned ?? [],
  };
}

export function toLayoutPayload(draft) {
  return draft.sections.map((section) => ({
    ...(section._id ? { _id: section._id } : {}),
    name: section.name.trim(),
    itemIds: section.items.map((item) => String(item._id)),
  }));
}

export function isLayoutDirty(draft, layout) {
  if (!draft || !layout) return false;
  return JSON.stringify(toLayoutPayload(draft)) !== JSON.stringify(toLayoutPayload(toLayoutDraft(layout)));
}

function move(list, index, delta) {
  const target = index + delta;
  if (index < 0 || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function addSection(draft, name) {
  return {
    ...draft,
    sections: [...draft.sections, { key: newKey(), name: name.trim(), items: [] }],
  };
}

export function renameSection(draft, key, name) {
  return {
    ...draft,
    sections: draft.sections.map((section) => (section.key === key ? { ...section, name } : section)),
  };
}

export function deleteSection(draft, key) {
  const removed = draft.sections.find((section) => section.key === key);
  if (!removed) return draft;
  return {
    sections: draft.sections.filter((section) => section.key !== key),
    unsectioned: [...draft.unsectioned, ...removed.items],
  };
}

export function moveSection(draft, key, delta) {
  const index = draft.sections.findIndex((section) => section.key === key);
  return { ...draft, sections: move(draft.sections, index, delta) };
}

export function moveDish(draft, sectionKey, itemId, delta) {
  return {
    ...draft,
    sections: draft.sections.map((section) => {
      if (section.key !== sectionKey) return section;
      const index = section.items.findIndex((item) => String(item._id) === String(itemId));
      return { ...section, items: move(section.items, index, delta) };
    }),
  };
}

export function moveDishTo(draft, itemId, targetKey) {
  const matches = (item) => String(item._id) === String(itemId);
  const dish =
    draft.unsectioned.find(matches) ??
    draft.sections.flatMap((section) => section.items).find(matches);
  if (!dish) return draft;

  return {
    sections: draft.sections.map((section) => {
      const items = section.items.filter((item) => !matches(item));
      return { ...section, items: section.key === targetKey ? [...items, dish] : items };
    }),
    unsectioned: targetKey
      ? draft.unsectioned.filter((item) => !matches(item))
      : [...draft.unsectioned.filter((item) => !matches(item)), dish],
  };
}

export function sectionOfDish(draft, itemId) {
  return (
    draft.sections.find((section) => section.items.some((item) => String(item._id) === String(itemId)))
      ?.key ?? null
  );
}

export function validateLayoutDraft(draft, t) {
  const { maxSections, maxNameLength } = MENU_LAYOUT_LIMITS;
  if (draft.sections.length > maxSections) {
    return t("errors:menuLayout.tooManySections", { max: maxSections });
  }

  const seen = new Set();
  for (const [index, section] of draft.sections.entries()) {
    const name = section.name.trim();
    if (!name || name.length > maxNameLength) {
      return t("errors:menuLayout.sectionName", { section: index + 1, max: maxNameLength });
    }
    const folded = name.toLocaleLowerCase();
    if (seen.has(folded)) return t("errors:menuLayout.duplicateName", { name });
    seen.add(folded);
  }
  return null;
}
