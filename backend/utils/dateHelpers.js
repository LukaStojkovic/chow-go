export function getDateRanges() {
  const now = new Date();

  return {
    startOfWeek: getDateDaysAgo(now, 7),
    startOfMonth: getDateDaysAgo(now, 30),
    startOfLastWeek: getDateDaysAgo(now, 14),
    startOfLastMonth: getDateDaysAgo(now, 60),
    weekStart: getDateDaysAgo(now, 7),
  };
}

export function getDateDaysAgo(referenceDate, days) {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() - days);
  return date;
}

export function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    days.push(dateStr);
  }
  return days;
}

export function formatDateAsString(date) {
  return date.toISOString().split("T")[0];
}
