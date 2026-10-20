import { describe, it, expect } from "vitest";
import { durationBetween, occurrenceDates, defaultRecurrence, slotOverlaps } from "@/lib/admin-appointments";
describe("admin appointment times and optional recurrence", () => {
  it("blocks half-hour slots overlapping an arbitrary start and end", () => expect(["10:00", "10:30", "11:00"].filter(s => slotOverlaps(s, "10:15", "10:45"))).toEqual(["10:00", "10:30"]));
  it("accepts explicit 10:15 to 10:45", () => expect(durationBetween("10:15", "10:45")).toBe(30));
  it("accepts 13:00 to 15:00 without presets", () => expect(durationBetween("13:00", "15:00")).toBe(120));
  it("rejects end before start", () => expect(() => durationBetween("15:00", "13:00")).toThrow());
  it("creates only one appointment by default", () => expect(occurrenceDates(new Date(2026, 9, 20), defaultRecurrence())).toEqual(["2026-10-20"]));
  it("repeats daily", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "daily", interval: 1, count: 3, weekdays: [], monthDay: 0 })).toEqual(["2026-10-20", "2026-10-21", "2026-10-22"]));
  it("repeats every two weeks with local dates across DST", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "weekly", interval: 2, count: 3, weekdays: [], monthDay: 0 })).toEqual(["2026-10-20", "2026-11-03", "2026-11-17"]));
  it("repeats yearly", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "yearly", interval: 1, count: 3, weekdays: [], monthDay: 0 })).toEqual(["2026-10-20", "2027-10-20", "2028-10-20"]));
  it("repeats monthly", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "monthly", interval: 1, count: 3, weekdays: [], monthDay: 0 })).toEqual(["2026-10-20", "2026-11-20", "2026-12-20"]));
  it("repeats weekly on chosen weekdays only", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "weekly", interval: 1, count: 4, weekdays: [1, 3], monthDay: 0 })).toEqual(["2026-10-20", "2026-10-22", "2026-10-27", "2026-10-29"]));
  it("repeats monthly on the chosen day of month", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "monthly", interval: 1, count: 3, weekdays: [], monthDay: 5 })).toEqual(["2026-11-05", "2026-12-05", "2027-01-05"]));
  it("skips months without the chosen day", () => expect(occurrenceDates(new Date(2026, 0, 31), { enabled: true, frequency: "monthly", interval: 1, count: 3, weekdays: [], monthDay: 31 })).toEqual(["2026-01-31", "2026-03-31", "2026-05-31"]));
});
