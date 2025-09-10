/**
 * Valid date value types that can be converted to Date
 */
export type DateValue = Date | number | string | null | undefined

/**
 * Returns a Date from the specified argument.
 * @param value - The value to convert to Date
 * @param defaultValue - Default Date to return if conversion fails
 */
export function toDate(value: DateValue, defaultValue?: Date): Date | undefined {
  if (value == null || value === undefined) return defaultValue
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? defaultValue : value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? defaultValue : date
  }
  return defaultValue
}

/**
 * Returns a Date from the specified argument, throwing if conversion fails.
 * @param value - The value to convert to Date
 * @param defaultValue - Default Date to return if conversion fails
 */
export function toDateStrict(value: DateValue, defaultValue?: Date): Date {
  const date = toDate(value, defaultValue)
  if (date === undefined) throw new TypeError('Value cannot be converted to Date')
  return date
}
