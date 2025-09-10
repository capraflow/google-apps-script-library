/**
 * Returns true if the value is a valid Date object
 * @param value - The value to convert to Date
 */
export function isDate(value: unknown): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime())
}
