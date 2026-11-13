import { describe, expect, it } from "vitest";
import { calculateCosts, DEFAULT_COST_INPUTS as defaults, filamentWeight } from "./manufacturing-cost";

const input = { ...defaults, hours: 2, minutes: 30, watts: 200, auxiliaryWatts: 100, electricityRate: 0.2, laborMinutes: 30, laborRate: 24, wastePercent: 0 };
function result(process, overrides = {}) {
  const calculation = calculateCosts(process, { ...input, ...overrides });
  if (!calculation.result) throw new Error(calculation.errors.join(", "));
  return calculation.result;
}
describe("Manufacturing costs in CAD", () => {
  it("prices filament by consumed weight and spool cost", () => expect(result("3d").material).toBe(3));
  it("converts filament length using diameter and density", () => expect(filamentWeight(100, 1.75, 1.24)).toBeCloseTo(298.25495, 4));
  it("charges measured machine and auxiliary electricity over hours and minutes", () => {
    expect(result("3d").kwh).toBeCloseTo(0.75);
    expect(result("3d").electricity).toBeCloseTo(0.15);
  });
  it("charges active labor separately from machine time", () => expect(result("3d").labor).toBe(12));
  it("prices UV ink and blank items", () => expect(result("uv", { quantity: 2 }).material).toBeCloseTo(6.8));
  it("prices laser stock by consumed sheet area", () => expect(result("laser").material).toBe(2.5));
  it("includes machine depreciation for the running duration", () => expect(result("3d").machine).toBe(1));
  it("adds material waste", () => expect(result("3d", { wastePercent: 10 }).material).toBeCloseTo(3.3));
  it("applies profit margin and fees to selling price, not cost", () => {
    const r = result("3d", { margin: 30, feePercent: 5 });
    expect(r.sale).toBeCloseTo(r.cost / 0.65);
    expect(r.profit / r.sale).toBeCloseTo(0.30);
  });
  it("splits lot costs and rounds unit CAD price upward to cents", () => {
    const r = result("3d", { quantity: 3, taxPercent: 5 });
    expect(r.unitCost).toBeCloseTo(r.cost / 3);
    expect(r.unitSale).toBe(Math.ceil(r.sale / 3 * 100) / 100);
    expect(r.total).toBeCloseTo(r.unitSale * 3 * 1.05);
  });
  it("rejects invalid quantities and impossible margin", () => {
    expect(calculateCosts("3d", { ...input, quantity: 0 }).result).toBeNull();
    expect(calculateCosts("3d", { ...input, margin: 95, feePercent: 5 }).result).toBeNull();
  });
  it("rejects zero divisors, oversized laser area and nonfinite values", () => {
    expect(calculateCosts("uv", { ...input, inkBottleMl: 0 }).result).toBeNull();
    expect(calculateCosts("laser", { ...input, usedWidth: 61 }).result).toBeNull();
    expect(calculateCosts("3d", { ...input, electricityRate: NaN }).result).toBeNull();
  });
});