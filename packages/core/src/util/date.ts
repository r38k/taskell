import { Temporal } from "temporal-polyfill";

export function isDate(year: number, month: number, day: number): boolean {
  try {
    Temporal.PlainDate.from(`${year}-${month}-${day}`);
    return true;
  } catch {
    return false;
  }
}

export function parseDate(date: string): Temporal.PlainDate {
  const now = Temporal.Now.plainDateISO();
  const currentYear = now.year;
  const currentMonth = now.month;

  switch (date.length) {
    case 2: {
      const day = parseInt(date, 10);
      if (isNaN(day)) {
        throw new Error(`Invalid day: ${date}`);
      }
      return Temporal.PlainDate.from({
        year: currentYear,
        month: currentMonth,
        day: day,
      });
    }
    case 4: {
      const month = parseInt(date.substring(0, 2), 10);
      const day = parseInt(date.substring(2, 4), 10);
      if (isNaN(month) || isNaN(day)) {
        throw new Error(`Invalid date: ${date}`);
      }
      return Temporal.PlainDate.from({
        year: currentYear,
        month: month,
        day: day,
      });
    }
    case 8: {
      const year = parseInt(date.substring(0, 4), 10);
      const month = parseInt(date.substring(4, 6), 10);
      const day = parseInt(date.substring(6, 8), 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        throw new Error(`Invalid date: ${date}`);
      }
      return Temporal.PlainDate.from({
        year: year,
        month: month,
        day: day,
      });
    }
    default:
      throw new Error(`Invalid date format: ${date}. Expected dd, mmdd, or yyyymmdd.`);
  }
}
