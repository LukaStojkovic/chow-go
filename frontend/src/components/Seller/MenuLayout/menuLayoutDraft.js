export const MAX_SECTIONS = 30;
export const MAX_SECTION_NAME = 40;
export const UNSECTIONED = "";

let nextKey = 0;

export function toDraft(layout) {
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

export function toPayload(draft) {
  return {
    sections: draft.sections.map(({ _id, name, items }) => ({
      ...(_id ? { _id } : {}),
      name: name.trim(),
      itemIds: items.map((item) => String(item._id)),
    })),
  };
}

export function isSameLayout(a, b) {
  return JSON.stringify(toPayload(a)) === JSON.stringify(toPayload(b));
}

function move(list, from, to) {
  if (from < 0 || to < 0 || to >= list.length) return list;
  const next = [...list];
  const [entry] = next.splice(from, 1);
  next.splice(to, 0, entry);
  return next;
}

export function addSection(draft, name) {
  nextKey += 1;
  return {
    ...draft,
    sections: [...draft.sections, { key: `new-${nextKey}`, name: name.trim(), items: [] }],
  };
}

export function renameSection(draft, key, name) {
  return {
    ...draft,
    sections: draft.sections.map((section) => (section.key === key ? { ...section, name } : section)),
  };
}

export function deleteSection(draft, key) {
  const section = draft.sections.find((entry) => entry.key === key);
  if (!section) return draft;
  return {
    sections: draft.sections.filter((entry) => entry.key !== key),
    unsectioned: [...draft.unsectioned, ...section.items],
  };
}

export function moveSection(draft, key, delta) {
  const index = draft.sections.findIndex((section) => section.key === key);
  return { ...draft, sections: move(draft.sections, index, index + delta) };
}

export function moveDish(draft, key, itemId, delta) {
  return {
    ...draft,
    sections: draft.sections.map((section) => {
      if (section.key !== key) return section;
      const index = section.items.findIndex((item) => String(item._id) === String(itemId));
      return { ...section, items: move(section.items, index, index + delta) };
    }),
  };
}

export function moveDishTo(draft, itemId, targetKey) {
  const id = String(itemId);
  const all = [...draft.unsectioned, ...draft.sections.flatMap((section) => section.items)];
  const dish = all.find((item) => String(item._id) === id);
  if (!dish) return draft;
  const without = (items) => items.filter((item) => String(item._id) !== id);
  return {
    sections: draft.sections.map((section) => {
      const items = without(section.items);
      return { ...section, items: section.key === targetKey ? [...items, dish] : items };
    }),
    unsectioned:
      targetKey === UNSECTIONED ? [...without(draft.unsectioned), dish] : without(draft.unsectioned),
  };
}

export function sectionNameError(sections, name, t, ignoreKey) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > MAX_SECTION_NAME) return null;
  const taken = sections.some(
    (section) => section.key !== ignoreKey && section.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  return taken ? t("errors:menuLayout.duplicateName", { name: trimmed }) : null;
}

export function draftError(draft, t) {
  if (draft.sections.length > MAX_SECTIONS) {
    return t("errors:menuLayout.tooManySections", { max: MAX_SECTIONS });
  }
  for (const [index, section] of draft.sections.entries()) {
    const trimmed = section.name.trim();
    if (!trimmed || trimmed.length > MAX_SECTION_NAME) {
      return t("errors:menuLayout.sectionName", { section: index + 1, max: MAX_SECTION_NAME });
    }
    const duplicate = sectionNameError(draft.sections.slice(0, index), trimmed, t);
    if (duplicate) return duplicate;
  }
  return null;
}
