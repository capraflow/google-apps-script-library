declare namespace Lib {
  namespace Utils {
    /**
     * Valid date value types that can be converted to Date
     */
    type DateValue = Date | number | string | null | undefined

    interface Utils {
      /**
       * Returns a Date from the specified argument.
       * @param value - The value to convert to Date
       * @param defaultValue - Default Date to return if conversion fails
       * @returns Date object or defaultValue if conversion fails
       */
      toDate(value: DateValue, defaultValue?: Date): Date | undefined

      /**
       * Returns a Date from the specified argument, throwing if conversion fails.
       * @param value - The value to convert to Date
       * @param defaultValue - Default Date to return if conversion fails
       * @returns Date object
       * @throws TypeError if value cannot be converted to Date and no default provided
       */
      toDateStrict(value: DateValue, defaultValue?: Date): Date
    }
  }
}

declare var Utils: Lib.Utils.Utils
