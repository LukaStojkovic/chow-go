/**
 * Round to cents.
 *
 * Deliberately duplicates `toMoney` in shared/src/adapters/pricing.js rather
 * than importing it: the backend does not depend on @chowgo/shared, which is
 * scoped to the clients. The pricing *constants* are duplicated the same way
 * and that is the real drift risk - if the backend ever takes the dependency,
 * both should collapse into the shared module.
 */
export function toMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
