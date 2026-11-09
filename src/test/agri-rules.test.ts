import { describe, expect, it } from "vitest";
import { evaluate, recommend, SCHEMES } from "@/lib/agri-data";

describe("agri rules", () => {
  it("rainfed red soil Kharif in Srikakulam ranks groundnut first", () => {
    const r = recommend({ district: "Srikakulam", soil: "Red", season: "Kharif", irrigation: "Rainfed", landAcres: 2 });
    expect(r[0]?.crop.id).toBe("groundnut");
    expect(r).toHaveLength(3);
  });
  it("PM-KISAN: income tax payer appears ineligible", () => {
    const s = SCHEMES.find((x) => x.id === "pmkisan")!;
    expect(evaluate(s, { own: "yes", tax: "yes", govt: "no", docs: "yes" }).verdict).toBe("ineligible");
  });
  it("unsure answer means more information required", () => {
    const s = SCHEMES.find((x) => x.id === "pmkisan")!;
    expect(evaluate(s, { own: "yes", tax: "unsure", govt: "no", docs: "yes" }).verdict).toBe("more-info");
  });
});
