// Website-owned policy snapshot matching the approved testing-20260915-v1 rate card.
// Display benefit only. This does not authorize an invoice, charge, preparation or call.
export const REPAIR_CREDIT_POLICY = "testing-20260915-v1";
export function getRepairCredit(
  service: unknown,
  property: unknown,
  count: unknown,
) {
  if (
    service !== "Testing" ||
    ![
      "Residential",
      "Commercial / Business",
      "Apartment/Multi-Family",
      "Industrial",
    ].includes(String(property))
  )
    return null;
  if (
    typeof count !== "number" ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 100
  )
    return null;
  const unit = property === "Residential" ? 10900 : count === 1 ? 17900 : 11900;
  return Math.min(50000, count * unit);
}
