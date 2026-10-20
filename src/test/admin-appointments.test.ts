import { describe, it, expect } from "vitest";
import { durationBetween, occurrenceDates, defaultRecurrence } from "@/lib/admin-appointments";
describe("admin appointment times and optional recurrence", () => {
  it("accepts explicit 10:15 to 10:45", () => expect(durationBetween("10:15", "10:45")).toBe(30));
  it("accepts 13:00 to 15:00 without presets", () => expect(durationBetween("13:00", "15:00")).toBe(120));
  it("rejects end before start", () => expect(() => durationBetween("15:00", "13:00")).toThrow());
  it("creates only one appointment by default", () => expect(occurrenceDates(new Date(2026, 9, 20), defaultRecurrence())).toEqual(["2026-10-20"]));
  it("repeats daily", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "daily", interval: 1, count: 3 })).toEqual(["2026-10-20", "2026-10-21", "2026-10-22"]));
  it("repeats every two weeks with local dates across DST", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "weekly", interval: 2, count: 3 })).toEqual(["2026-10-20", "2026-11-03", "2026-11-17"]));
  it("repeats yearly", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "yearly", interval: 1, count: 3 })).toEqual(["2026-10-20", "2027-10-20", "2028-10-20"]));
  it("repeats monthly", () => expect(occurrenceDates(new Date(2026, 9, 20), { enabled: true, frequency: "monthly", interval: 1, count: 3 })).toEqual(["2026-10-20", "2026-11-20", "2026-12-20"]));
});