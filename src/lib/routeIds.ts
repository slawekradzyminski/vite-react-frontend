/**
 * Parses a numeric id from a route segment. Only positive integers that JavaScript can represent
 * exactly are accepted: a larger id would be rounded (9223372036854775807 becomes
 * 9223372036854776000) and the request would ask for a different resource.
 */
export function parseRouteId(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
