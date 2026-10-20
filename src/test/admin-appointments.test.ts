import { describe, it, expect } from "vitest";
import { durationBetween, slotOverlaps, defaultRepeat, buildRRule, rruleDates, truncateRRule, parseRRule, repeatSummary, type Repeat } from "@/lib/admin-appointments";

const rep = (p: Partial<Repeat>): Repeat => ({ ...defaultRepeat(), ...p });
const TODAY = "2026-10-20"; // Tuesday

describe("admin appointment times", () => {
  it("blocks half-hour slots overlapping an arbitrary start and end", () => expect(["10:00", "10:30", "11:00"].filter(s => slotOverlaps(s, "10:15", "10:45"))).toEqual(["10:00", "10:30"]));
  it("accepts 13:00 to 15:00", () => expect(durationBetween("13:00", "15:00")).toBe(120));
  it("rejects end before start", () => expect(() => durationBetween("15:00", "13:00")).toThrow());
});

describe("RRULE repetition", () => {
  it("Nicht wiederholen stores no rule", () => expect(buildRRule(TODAY, defaultRepeat())).toBeNull());
  it("Jede Woche am Dienstag", () => {
    const r = buildRRule(TODAY, rep({ preset: "weekly", end: { type: "count", until: "", count: 3 } }))!;
    expect(r).toContain("BYDAY=TU");
    expect(rruleDates(r, TODAY, TODAY)).toEqual(["2026-10-20", "2026-10-27", "2026-11-03"]);
  });
  it("Alle 2 Wochen across DST", () => expect(rruleDates(buildRRule(TODAY, rep({ preset: "biweekly", end: { type: "count", until: "", count: 3 } }))!, TODAY, TODAY)).toEqual(["2026-10-20", "2026-11-03", "2026-11-17"]));
  it("Jeden Monat am 20.", () => expect(rruleDates(buildRRule(TODAY, rep({ preset: "monthly", end: { type: "count", until: "", count: 3 } }))!, TODAY, TODAY)).toEqual(["2026-10-20", "2026-11-20", "2026-12-20"]));
  it("Bis Datum includes the end date", () => expect(rruleDates(buildRRule(TODAY, rep({ preset: "weekly", end: { type: "until", until: "2026-11-03", count: 10 } }))!, TODAY, TODAY)).toEqual(["2026-10-20", "2026-10-27", "2026-11-03"]));
  it("Für immer is materialized only up to 1 year ahead", () => {
    const d = rruleDates(buildRRule(TODAY, rep({ preset: "weekly" }))!, TODAY, TODAY);
    expect(d.length).toBe(53);
    expect(d[d.length - 1] <= "2027-10-20").toBe(true);
  });
  it("custom weekly on Tue + Thu", () => expect(rruleDates(buildRRule(TODAY, rep({ preset: "custom", frequency: "weekly", weekdays: [1, 3], end: { type: "count", until: "", count: 4 } }))!, TODAY, TODAY)).toEqual(["2026-10-20", "2026-10-22", "2026-10-27", "2026-10-29"]));
  it("dieser und folgende: old rule ends the day before", () => {
    const r = buildRRule(TODAY, rep({ preset: "weekly" }))!;
    expect(rruleDates(truncateRRule(r, "2026-11-03"), TODAY, TODAY)).toEqual(["2026-10-20", "2026-10-27"]);
  });
  it("reads presets back from the stored rule", () => {
    expect(parseRRule(buildRRule(TODAY, rep({ preset: "biweekly" })))).toMatchObject({ preset: "biweekly", end: { type: "forever" } });
    expect(parseRRule(buildRRule(TODAY, rep({ preset: "monthly", end: { type: "count", until: "", count: 5 } })))).toMatchObject({ preset: "monthly", end: { type: "count", count: 5 } });
  });
});

describe("month-end fallback and summary", () => {
  it("day 31 falls back to the last day of shorter months", () => expect(rruleDates(buildRRule("2026-01-31", rep({ preset: "monthly", end: { type: "count", until: "", count: 4 } }))!, "2026-01-31", "2026-01-31")).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]));
  it("day 30 uses Feb 28", () => expect(rruleDates(buildRRule("2026-01-30", rep({ preset: "monthly", end: { type: "count", until: "", count: 2 } }))!, "2026-01-30", "2026-01-30")).toEqual(["2026-01-30", "2026-02-28"]));
  it("monthly day 31 is read back as the monthly preset", () => expect(parseRRule(buildRRule("2026-01-31", rep({ preset: "monthly" }))).preset).toBe("monthly"));
  it("summary: Jeden Dienstag, für immer", () => expect(repeatSummary(TODAY, rep({ preset: "weekly" }), true)).toBe("Jeden Dienstag, für immer"));
});
