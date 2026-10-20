import { RRule, Weekday } from "rrule";
import { format } from "date-fns";

export type Recurrence = {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  count: number;
  /** 0 = Monday … 6 = Sunday. Empty = weekday of the start date. */
  weekdays: number[];
  /** Day of month 1–31. 0 = day of the start date. */
  monthDay: number;
};
export const defaultRecurrence = (): Recurrence => ({ enabled: false, frequency: "weekly", interval: 1, count: 12, weekdays: [], monthDay: 0 });
export function durationBetween(start: string, end: string) {
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!valid.test(start) || !valid.test(end)) throw new Error("invalid_time");
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const result = minutes(end) - minutes(start);
  if (result <= 0) throw new Error("invalid_time");
  return result;
}
export function endTime(start: string, duration: number) {
  const minutes = Math.min(1439, Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5)) + duration);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function slotOverlaps(slot: string, start: string, end: string) {
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return minutes(slot) < minutes(end) && minutes(slot) + 30 > minutes(start);
}
export function occurrenceDates(date: Date, rule: Recurrence): string[] {
  if (!rule.enabled) return [format(date, "yyyy-MM-dd")];
  if (!Number.isInteger(rule.interval) || rule.interval < 1 || rule.interval > 100 || !Number.isInteger(rule.count) || rule.count < 2 || rule.count > 366) throw new Error("invalid_recurrence");
  const frequencies = { daily: RRule.DAILY, weekly: RRule.WEEKLY, monthly: RRule.MONTHLY, yearly: RRule.YEARLY };
  const options: ConstructorParameters<typeof RRule>[0] = {
    freq: frequencies[rule.frequency],
    interval: rule.interval,
    count: rule.count,
    dtstart: new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)),
  };
  if (rule.frequency === "weekly" && rule.weekdays.length > 0) {
    const rruleDays: Weekday[] = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
    options.byweekday = rule.weekdays.map(d => rruleDays[d]);
  }
  if (rule.frequency === "monthly") {
    options.bymonthday = rule.monthDay >= 1 && rule.monthDay <= 31 ? rule.monthDay : date.getDate();
  }
  const dates = new RRule(options).all();
  return dates.map(d => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
}
