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
 * @param {Utils.DateValue} value - The value to convert to a Date
 * @param {Date | null} [defaultValue=null] - The default value to return if the value is invalid
 * @returns {Date | null} The converted Date or null if the value is invalid
 */

/**
 * Returns a Date from the specified argument, throwing an error if the value is invalid.
 * @function Utils.toDateStrict
 * @param {Utils.DateValue} value - The value to convert to a Date
 * @param {Date | null} [defaultValue=null] - The default value to return if the value is invalid
 * @returns {Date} The converted Date
 * @throws {Error} If the value cannot be converted to a valid Date
 */

/**
 * @typedef {Object} Utils
 * @property {toDate} toDate
 * @property {toDateStrict} toDateStrict
 */

/**
 * @type {Utils}
 */
var Utils = Utils || {}
