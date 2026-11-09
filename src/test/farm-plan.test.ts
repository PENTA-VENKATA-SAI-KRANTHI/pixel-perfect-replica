import { describe, expect, it } from "vitest";
import { CROPS, DISTRICTS, IRRIGATIONS, SEASONS, SOILS } from "@/lib/agri-data";
import { explainCrop, matchSchemes, CHECKLIST } from "@/lib/farm-plan";

describe("farm plan rules", () => {
  it("explained factor points always add up to the displayed score", () => {
    for (const c of CROPS) for (const soil of SOILS) for (const season of SEASONS) for (const irrigation of IRRIGATIONS) {
      const e = explainCrop(c, { district: DISTRICTS[0]!, soil, season, irrigation, landAcres: 2 });
      expect(e.factors.reduce((s, f) => s + f.points, 0)).toBe(e.score.total);
    }
  });
  it("paddy on a rainfed field flags water as needing attention with 0 points", () => {
    const paddy = CROPS.find((c) => c.id === "paddy")!;
    const e = explainCrop(paddy, { district: "Krishna", soil: "Alluvial", season: "Kharif", irrigation: "Rainfed", landAcres: 2 });
    expect(e.water.status).toBe("attention");
    expect(e.water.points).toBe(0);
  });
  it("unverified schemes never show a benefit amount", () => {
    const m = matchSchemes({ district: "Srikakulam", soil: "Red", season: "Kharif", irrigation: "Rainfed", landAcres: 2 }, CROPS[1]!);
    for (const x of m) if (!x.scheme.verified) expect(x.benefit).toBeNull();
    expect(m[0]?.scheme.id).toBe("pmfby");
  });
  it("checklist has the four required next steps", () => {
    expect(CHECKLIST.map((c) => c.id)).toEqual(["crop-fit", "sowing-calendar", "verify-schemes", "documents"]);
  });
});
