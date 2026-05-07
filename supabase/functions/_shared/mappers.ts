export type DbCaseType =
  | "motor_vehicle"
  | "premises_liability"
  | "work_injury"
  | "product_liability"
  | "other";

export type DbFaultStatus =
  | "not_at_fault"
  | "partial_fault"
  | "at_fault"
  | "unknown";

export function mapCaseType(display: string): DbCaseType {
  switch (display) {
    case "Motor Vehicle Accident":
      return "motor_vehicle";
    case "Premises Liability":
      return "premises_liability";
    case "Work Injury":
      return "work_injury";
    case "Product Liability":
      return "product_liability";
    default:
      return "other";
  }
}

export function mapFault(display: string | undefined): DbFaultStatus {
  switch (display) {
    case "Not my fault":
    case "Mostly other driver":
      return "not_at_fault";
    case "Shared / unclear":
      return "partial_fault";
    case "Mostly me":
      return "at_fault";
    default:
      return "unknown";
  }
}

// Nevada ZIP prefixes per USPS: 889, 890, 891, 893, 894, 895, 897, 898.
const NV_ZIP_PREFIXES = [
  "889",
  "890",
  "891",
  "893",
  "894",
  "895",
  "897",
  "898",
];

export function isNonNvZip(zip: string | undefined): boolean {
  if (!zip) return false;
  const prefix = zip.slice(0, 3);
  return !NV_ZIP_PREFIXES.includes(prefix);
}
