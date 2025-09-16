/**
 * @namespace Utils
 */

/**
 * Valid date value types that can be converted to Date
 * @typedef {Date | number | string | null | undefined} Utils.DateValue
 */

/**
 * Returns a Date from the specified argument.
 * @function Utils.toDate
 * @param {Utils.DateValue} value - The value to convert to Date
 * @param {Date} [defaultValue=null] - Default Date to return if conversion fails
 * @returns {Date | null} The converted Date or null if the value is invalid
 */

/**
 * Returns a Date from the specified argument, throwing if conversion fails.
 * @function Utils.toDateStrict
 * @param {Utils.DateValue} value - The value to convert to Date
 * @param {Date} [defaultValue=null] - Default Date to return if conversion fails
 * @returns {Date} The converted Date
 */

/**
 * Returns true if the value is a valid Date object
 * @function Utils.isDate
 * @param {unknown} value - The value to convert to Date
 * @returns {boolean} True if the value is a valid Date object
 */

/**
 * @typedef {Object} Utils
 * @property {function} toDate
 * @property {function} toDateStrict
 * @property {function} isDate
 */

/**
 * @type {Utils}
 */
var Utils = Utils || {}
