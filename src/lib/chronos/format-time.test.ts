import { describe, expect, it } from "vitest";

import { formatSecondsAsTimer } from "./format-time";

describe("formatSecondsAsTimer", () => {
  it("formats durable totals beyond 24 hours", () => {
    expect(formatSecondsAsTimer((35 * 60 * 60) + (4 * 60) + 9)).toBe("35:04:09");
  });

  it("floors fractions and prevents negative totals", () => {
    expect(formatSecondsAsTimer(61.9)).toBe("00:01:01");
    expect(formatSecondsAsTimer(-90)).toBe("00:00:00");
  });

  it("treats missing totals as zero", () => {
    expect(formatSecondsAsTimer(null)).toBe("00:00:00");
    expect(formatSecondsAsTimer(undefined)).toBe("00:00:00");
  });
});
