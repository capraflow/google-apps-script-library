/**
 * @namespace Utils
 */

/**
 * @typedef {Date | number | string | null | undefined} Utils.DateValue
 */

/**
 * Returns a Date from the specified argument.
 * @param {Utils.DateValue} value
 * @param {Date} [defaultValue]
 * @returns {Date | void}
 */
function toDate(value, defaultValue) {
  if (value == null || value === undefined) return defaultValue
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? defaultValue : value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? defaultValue : date
  }
  return defaultValue
}

/**
 * Returns a Date from the specified argument.
 * @param {Utils.DateValue} value
 * @param {Date} [defaultValue]
 * @returns {Date}
 */
function toDateStrict(value, defaultValue) {
  const date = toDate(value, defaultValue)
  if (date === void 0) throw new TypeError('Value cannot be converted to Date')
  return date
}
