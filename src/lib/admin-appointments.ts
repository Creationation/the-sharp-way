import { RRule, Weekday, Frequency } from "rrule";

/** How far ahead copies of a repeating appointment are kept in the calendar. */
export const HORIZON_DAYS = 365;

export type RepeatPreset = "none" | "weekly" | "biweekly" | "monthly" | "custom";
export type RepeatEnd = { type: "forever" | "until" | "count"; until: string; count: number };
export type Repeat = {
  preset: RepeatPreset;
  /** Used only when preset = custom. */
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  /** 0 = Monday … 6 = Sunday. Empty = weekday of the start date. */
  weekdays: number[];
  /** 1–31. 0 = day of the start date. */
  monthDay: number;
  end: RepeatEnd;
};

export const defaultRepeat = (): Repeat => ({ preset: "none", frequency: "weekly", interval: 1, weekdays: [], monthDay: 0, end: { type: "forever", until: "", count: 10 } });

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

const RDAYS: Weekday[] = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
const noonUTC = (ymd: string) => { const [y, m, d] = ymd.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); };
const ymdUTC = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
export const localYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (ymd: string, n: number) => { const d = noonUTC(ymd); d.setUTCDate(d.getUTCDate() + n); return ymdUTC(d); };
export const weekdayOf = (ymd: string) => (noonUTC(ymd).getUTCDay() + 6) % 7;

/** Builds an RFC 5545 RRULE string (with DTSTART) or null when not repeating. */
export function buildRRule(start: string, r: Repeat): string | null {
  if (r.preset === "none") return null;
  const wd = weekdayOf(start);
  const day = Number(start.slice(8, 10));
  const opts: Partial<ConstructorParameters<typeof RRule>[0]> = { dtstart: noonUTC(start), interval: 1 };
  if (r.preset === "weekly" || r.preset === "biweekly") Object.assign(opts, { freq: RRule.WEEKLY, interval: r.preset === "biweekly" ? 2 : 1, byweekday: [RDAYS[wd]] });
  else if (r.preset === "monthly") Object.assign(opts, { freq: RRule.MONTHLY, bymonthday: day });
  else {
    if (!Number.isInteger(r.interval) || r.interval < 1 || r.interval > 100) throw new Error("invalid_recurrence");
    const freq = { daily: RRule.DAILY, weekly: RRule.WEEKLY, monthly: RRule.MONTHLY, yearly: RRule.YEARLY }[r.frequency];
    Object.assign(opts, { freq, interval: r.interval });
    if (r.frequency === "weekly") opts.byweekday = (r.weekdays.length ? r.weekdays : [wd]).map(d => RDAYS[d]);
    if (r.frequency === "monthly") opts.bymonthday = r.monthDay >= 1 && r.monthDay <= 31 ? r.monthDay : day;
  }
  if (r.end.type === "count") {
    if (!Number.isInteger(r.end.count) || r.end.count < 2 || r.end.count > 400) throw new Error("invalid_recurrence");
    opts.count = r.end.count;
  } else if (r.end.type === "until") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.end.until) || r.end.until <= start) throw new Error("invalid_recurrence");
    opts.until = new Date(Date.UTC(+r.end.until.slice(0, 4), +r.end.until.slice(5, 7) - 1, +r.end.until.slice(8, 10), 23, 59, 59));
  }
  return new RRule(opts as ConstructorParameters<typeof RRule>[0]).toString();
}

/** Occurrence dates (yyyy-MM-dd) of a rule between `from` and the horizon after `today`. */
export function rruleDates(rrule: string, from: string, today: string = localYmd(new Date()), horizonDays = HORIZON_DAYS): string[] {
  const rule = RRule.fromString(rrule);
  const end = noonUTC(addDays(today, horizonDays));
  return rule.between(new Date(noonUTC(from).getTime() - 1), new Date(end.getTime() + 1), true).map(ymdUTC);
}

/** Same rule, ending on the day before `beforeDate` (for "this and following"). */
export function truncateRRule(rrule: string, beforeDate: string): string {
  const o = RRule.fromString(rrule).origOptions;
  const last = addDays(beforeDate, -1);
  return new RRule({ ...o, count: undefined, until: new Date(Date.UTC(+last.slice(0, 4), +last.slice(5, 7) - 1, +last.slice(8, 10), 23, 59, 59)) }).toString();
}

export const ruleStart = (rrule: string) => ymdUTC(RRule.fromString(rrule).origOptions.dtstart!);

/** Reads a stored rule back into the form state. */
export function parseRRule(rrule: string | null | undefined): Repeat {
  const r = defaultRepeat();
  if (!rrule) return r;
  const o = RRule.fromString(rrule).origOptions;
  const days = (Array.isArray(o.byweekday) ? o.byweekday : o.byweekday != null ? [o.byweekday] : []).map(d => typeof d === "number" ? d : (d as Weekday).weekday);
  const mdays = Array.isArray(o.bymonthday) ? o.bymonthday : o.bymonthday != null ? [o.bymonthday] : [];
  const interval = o.interval ?? 1;
  const freqName = ({ [Frequency.DAILY]: "daily", [Frequency.WEEKLY]: "weekly", [Frequency.MONTHLY]: "monthly", [Frequency.YEARLY]: "yearly" } as Record<number, Repeat["frequency"]>)[o.freq!] ?? "weekly";
  const start = o.dtstart ? ymdUTC(o.dtstart) : "";
  r.frequency = freqName; r.interval = interval; r.weekdays = days; r.monthDay = mdays[0] ?? 0;
  const sameDay = start && days.length === 1 && days[0] === weekdayOf(start);
  if (freqName === "weekly" && sameDay && interval === 1) r.preset = "weekly";
  else if (freqName === "weekly" && sameDay && interval === 2) r.preset = "biweekly";
  else if (freqName === "monthly" && interval === 1 && start && mdays[0] === Number(start.slice(8, 10))) r.preset = "monthly";
  else r.preset = "custom";
  if (o.count) r.end = { type: "count", until: "", count: o.count };
  else if (o.until) r.end = { type: "until", until: ymdUTC(o.until), count: 10 };
  return r;
}
