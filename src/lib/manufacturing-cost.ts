export type Process = "3d" | "uv" | "laser";
export type FilamentUnit = "grams" | "meters";
export interface CostInputs {
  quantity: number; hours: number; minutes: number;
  watts: number; auxiliaryWatts: number; electricityRate: number;
  laborMinutes: number; laborRate: number;
  machinePrice: number; machineLifeHours: number; maintenanceRate: number;
  spoolPrice: number; spoolGrams: number; filamentGrams: number;
  filamentMeters: number; diameter: number; density: number;
  inkPrice: number; inkBottleMl: number; inkMl: number;
  blankPrice: number; consumables: number;
  sheetPrice: number; sheetWidth: number; sheetHeight: number;
  usedWidth: number; usedHeight: number; wastePercent: number;
  packaging: number; overhead: number; margin: number; feePercent: number; taxPercent: number;
}
// Illustrative values only; not manufacturer ratings or local utility tariffs.
export const DEFAULT_COST_INPUTS: CostInputs = {
  quantity: 1, hours: 2, minutes: 0, watts: 150, auxiliaryWatts: 0, electricityRate: 0.15,
  laborMinutes: 20, laborRate: 25, machinePrice: 600, machineLifeHours: 3000, maintenanceRate: 0.2,
  spoolPrice: 30, spoolGrams: 1000, filamentGrams: 100, filamentMeters: 30, diameter: 1.75, density: 1.24,
  inkPrice: 80, inkBottleMl: 500, inkMl: 5, blankPrice: 3, consumables: 0,
  sheetPrice: 20, sheetWidth: 60, sheetHeight: 40, usedWidth: 20, usedHeight: 15,
  wastePercent: 10, packaging: 1, overhead: 0, margin: 30, feePercent: 0, taxPercent: 0,
};

export function filamentWeight(meters: number, diameterMm: number, densityGcm3: number) {
  // mm² × metres converts directly to cm³ (1000 mm / 1000 mm³).
  return Math.PI * (diameterMm / 2) ** 2 * meters * densityGcm3;
}

export function calculateCosts(process: Process, input: CostInputs, filamentUnit: FilamentUnit = "grams") {
  const errors: string[] = [];
  if (Object.values(input).some(v => !Number.isFinite(v) || v < 0)) errors.push("Todos los valores deben ser números positivos o cero.");
  if (input.quantity < 1 || !Number.isInteger(input.quantity)) errors.push("La cantidad debe ser un número entero mayor que cero.");
  if (input.machineLifeHours <= 0) errors.push("La vida útil debe ser mayor que cero.");
  if (input.margin + input.feePercent >= 100) errors.push("El margen y las comisiones deben sumar menos del 100 %.");
  if (process === "3d" && input.spoolGrams <= 0) errors.push("El peso de la bobina debe ser mayor que cero.");
  if (process === "3d" && filamentUnit === "meters" && (input.diameter <= 0 || input.density <= 0)) errors.push("El diámetro y la densidad deben ser mayores que cero.");
  if (process === "uv" && input.inkBottleMl <= 0) errors.push("El volumen de tinta debe ser mayor que cero.");
  if (process === "laser" && (input.sheetWidth <= 0 || input.sheetHeight <= 0)) errors.push("Las dimensiones de la lámina deben ser mayores que cero.");
  if (process === "laser" && (input.usedWidth > input.sheetWidth || input.usedHeight > input.sheetHeight)) errors.push("El área utilizada no puede superar las dimensiones de la lámina.");
  if (errors.length) return { errors, result: null };
  const hours = input.hours + input.minutes / 60;
  const grams = filamentUnit === "grams" ? input.filamentGrams : filamentWeight(input.filamentMeters, input.diameter, input.density);
  const baseMaterial = process === "3d" ? grams * input.spoolPrice / input.spoolGrams
    : process === "uv" ? input.inkMl * input.inkPrice / input.inkBottleMl + input.blankPrice * input.quantity
    : input.sheetPrice * input.usedWidth * input.usedHeight / (input.sheetWidth * input.sheetHeight);
  const material = baseMaterial * (1 + input.wastePercent / 100) + input.consumables;
  const kwh = (input.watts + input.auxiliaryWatts) / 1000 * hours;
  const electricity = kwh * input.electricityRate;
  const labor = input.laborMinutes / 60 * input.laborRate;
  const machine = hours * (input.machinePrice / input.machineLifeHours + input.maintenanceRate);
  const packaging = input.packaging * input.quantity;
  const cost = material + electricity + labor + machine + packaging + input.overhead;
  const sale = cost / (1 - (input.margin + input.feePercent) / 100);
  const fees = sale * input.feePercent / 100;
  const profit = sale - cost - fees;
  const tax = sale * input.taxPercent / 100;
  const unitSale = Math.ceil(sale / input.quantity * 100) / 100;
  const roundedSale = unitSale * input.quantity;
  const roundedTax = roundedSale * input.taxPercent / 100;
  return { errors, result: { grams, hours, material, kwh, electricity, labor, machine, packaging, overhead: input.overhead, cost, sale, fees, profit, tax, unitCost: cost / input.quantity, unitSale, roundedSale, roundedTax, total: roundedSale + roundedTax } };
}