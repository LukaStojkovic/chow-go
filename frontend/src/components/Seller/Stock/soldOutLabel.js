export function soldOutLabel(state, t, locale, now = new Date()) {
  if (!state) return null;
  if (!state.until) return t("seller:stock.untilTurnedOn");
  const until = state.until;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(until, tomorrow) && until.getHours() === 0 && until.getMinutes() === 0) {
    return t("seller:stock.backTomorrow");
  }
  if (sameDay(until, now)) {
    const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(until);
    return t("seller:stock.backAt", { time });
  }
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(until);
  return t("seller:stock.backOn", { date });
}
