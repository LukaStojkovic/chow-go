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


