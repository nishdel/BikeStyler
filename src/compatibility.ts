import type {
  BikeMeasurement,
  ProductSelection,
  ProductFact,
} from "./productTypes";
export const MEASUREMENT_FIELDS = [
  ["barClampDiameter", "Bar / stem clamp", "mm"],
  ["leverClampDiameter", "Bar at lever clamp", "mm"],
  ["seatpostDiameter", "Seatpost diameter", "mm"],
  ["beadSeatDiameter", "Wheel / tyre bead-seat diameter", "mm"],
  ["tyreClearance", "Maximum measured tyre width", "mm"],
  ["axleSpacing", "Dropout spacing", "mm"],
  ["axleType", "Axle type", ""],
  ["brakeMount", "Brake mounting type", ""],
  ["brakePull", "Brake cable pull", ""],
  ["brakeReach", "Required brake reach", "mm"],
  ["cassetteInterface", "Freehub / cassette interface", ""],
  ["speeds", "Drivetrain speeds", ""],
  ["bbThread", "Bottom-bracket threading", ""],
  ["bbShellWidth", "Bottom-bracket shell width", "mm"],
  ["pedalThread", "Pedal thread", ""],
  ["railWidth", "Saddle rail width", "mm"],
  ["railHeight", "Saddle rail height", "mm"],
] as const;
const fields = new Map(
  MEASUREMENT_FIELDS.map(([k, label, unit]) => [k, { label, unit }]),
);
const aliases: Record<string, string> = {
  bar_clamp_diameter: "barClampDiameter",
  clamp_diameter: "barClampDiameter",
  clampDiameter: "barClampDiameter",
  lever_clamp_diameter: "leverClampDiameter",
  seatpost_diameter: "seatpostDiameter",
  bead_seat_diameter: "beadSeatDiameter",
  brake_pull: "brakePull",
  brake_mount: "brakeMount",
  axle_spacing: "axleSpacing",
  axle_type: "axleType",
  cassette_interface: "cassetteInterface",
  bb_thread: "bbThread",
  bb_shell_width: "bbShellWidth",
  pedal_thread: "pedalThread",
};
export type FitCheck = {
  field: string;
  label: string;
  status: "match" | "unknown" | "mismatch";
  reason: string;
  sourceId?: string;
};
const norm = (v: unknown) =>
  String(v).toLowerCase().trim().replace(/\s+/g, " ");
export function checkCompatibility(
  selection: ProductSelection,
  measurements: Record<string, BikeMeasurement> = {},
) {
  const product = selection.product,
    variant = product.variants.find((v) => v.id === selection.variantId),
    facts = [...product.facts, ...(variant?.facts || [])];
  const latest = new Map<string, ProductFact>();
  for (const f of facts) latest.set(aliases[f.key] || f.key, f);
  const checks: FitCheck[] = [];
  for (const [key, fact] of latest) {
    const bikeKey = key === "tyreWidth" ? "tyreClearance" : key;
    const field = fields.get(bikeKey as (typeof MEASUREMENT_FIELDS)[number][0]);
    if (!field) continue;
    const bike = measurements[bikeKey];
    let status: FitCheck["status"] = "unknown",
      reason = "Record and confirm this bicycle measurement first.";
    if (bike) {
      if (bike.status !== "confirmed")
        reason = `Bicycle value is ${bike.status}; it is not treated as confirmed.`;
      else if (
        (fact.unit || "") !== field.unit ||
        (bike.unit || "") !== field.unit
      )
        reason = "Units or specification scope need review.";
      else if (field.unit === "mm") {
        const a = Number(bike.value),
          b = Number(fact.value);
        if (!Number.isFinite(a) || !Number.isFinite(b))
          reason = "A range or non-numeric dimension needs manual review.";
        else {
          const pass = key === "tyreWidth" ? b <= a : Math.abs(a - b) <= 0.05;
          status = pass ? "match" : "mismatch";
          reason = `Recorded ${a} mm; product ${b} mm${key === "tyreWidth" ? " (width versus measured clearance)" : ""}.`;
        }
      } else {
        status = norm(bike.value) === norm(fact.value) ? "match" : "mismatch";
        reason = `Recorded “${String(bike.value)}”; product “${String(fact.value)}”.`;
      }
    }
    checks.push({
      field: bikeKey,
      label: field.label,
      status,
      reason,
      sourceId: fact.sourceId,
    });
  }
  const reach = measurements.brakeReach,
    min = latest.get("brakeReachMin"),
    max = latest.get("brakeReachMax");
  if (min && max) {
    let status: FitCheck["status"] = "unknown";
    if (
      reach?.status === "confirmed" &&
      min.unit === "mm" &&
      max.unit === "mm" &&
      reach.unit === "mm" &&
      [reach.value, min.value, max.value].every((v) =>
        Number.isFinite(Number(v)),
      )
    )
      status =
        Number(reach.value) >= Number(min.value) &&
        Number(reach.value) <= Number(max.value)
          ? "match"
          : "mismatch";
    checks.push({
      field: "brakeReach",
      label: "Brake reach",
      status,
      reason: `Supported product range ${String(min.value)}–${String(max.value)} mm; recorded ${reach ? String(reach.value) : "unknown"}.`,
      sourceId: min.sourceId,
    });
  }
  if (!selection.variantId && product.variants.length)
    checks.push({
      field: "variant",
      label: "Variant",
      status: "unknown",
      reason:
        "Choose a documented variant before checking variant-specific dimensions.",
    });
  const required: Record<string, string[]> = {
    handlebars: ["barClampDiameter"],
    stems: ["barClampDiameter"],
    brake_levers: ["leverClampDiameter", "brakePull"],
    seatposts: ["seatpostDiameter"],
    pedals: ["pedalThread"],
    tyres: ["beadSeatDiameter", "tyreClearance"],
    wheelsets: ["beadSeatDiameter", "axleSpacing", "axleType"],
    rims: ["beadSeatDiameter"],
    bottom_brackets: ["bbThread", "bbShellWidth"],
    cassettes: ["cassetteInterface", "speeds"],
    rim_brakes: ["brakeMount", "brakePull", "brakeReach"],
  };
  for (const key of required[product.category] || [])
    if (!checks.some((c) => c.field === key))
      checks.push({
        field: key,
        label:
          fields.get(key as (typeof MEASUREMENT_FIELDS)[number][0])?.label ||
          key,
        status: "unknown",
        reason:
          "This required product interface is not recorded in a supported, variant-specific form.",
      });
  if (!checks.length)
    checks.push({
      field: "unsupported",
      label: "No automated rule",
      status: "unknown",
      reason:
        "No supported dimensional checks are available for this record. Review the sources and related components manually.",
    });
  const status = checks.some((c) => c.status === "mismatch")
    ? "Does not match"
    : checks.some((c) => c.status === "unknown")
      ? "Check required"
      : "Matches recorded requirements";
  return {
    status,
    checks,
    scope:
      "Only the listed checks are evaluated. Coupled drivetrain, frame strength, clearance under load, routing and unlisted interfaces still require manual inspection. Appearance never proves fit.",
  };
}
