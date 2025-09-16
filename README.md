# Google Apps Script Utility Library

A comprehensive utility library for Google Apps Script development, providing common functions for type checking, type casting, HTTP operations, and more.

## Installation Methods

Choose the method that best fits your development workflow:

### Method 1: Copy JSDoc Types (GAS IDE Only)

Perfect for users working directly in the Google Apps Script IDE with basic IntelliSense support.

1. **Copy JSDoc types**: Copy the type definitions from [`docs/gas-types.js`](./docs/gas-types.js) into your GAS project
2. **Add library**: In your GAS project, go to Libraries � Add a library � Enter Script ID: `YOUR_SCRIPT_ID`
3. **Use the library**: Access functions via the library identifier

```javascript
// Copy the JSDoc types from docs/gas-types.js into your project first

/**
 * @type {Utils}
 */
var Utils = Utils || {}

function myFunction() {
  const date = MyLibrary.toDate('2023-01-01')
  if (MyLibrary.isDate(date)) {
    console.log(date.toISOString())
  }
}
```

### Method 2: NPM Types Package (IDE + GAS Library)

Best for developers using VS Code or other IDEs who want full TypeScript support while still using the deployed GAS library.

```bash
npm install gas-utils-library-types
```

```typescript
import type { DateValue } from 'gas-utils-library-types'

function myGASFunction() {
  // Full type support in your IDE
  const date: DateValue = '2023-01-01'
  const result = MyLibrary.toDate(date) // MyLibrary is the deployed GAS library

  if (MyLibrary.isDate(result)) {
    console.log(result.toISOString())
  }
}
```

**Setup:**
1. Install the types package
2. Add the GAS library to your project (Script ID: `YOUR_SCRIPT_ID`)
3. Enjoy full TypeScript support in your IDE

### Method 3: NPM Bundled Package (Self-Contained)

Ideal for projects using build tools like Webpack, Rollup, or esbuild. No GAS library linking required.

```bash
npm install gas-utils-library
```

```typescript
// Import specific functions
import { toDate, isDate } from 'gas-utils-library'

function myGASFunction() {
  const date = toDate('2023-01-01')
  if (isDate(date)) {
    console.log(date.toISOString())
  }
}
```

Or import everything:

```typescript
import * as Utils from 'gas-utils-library'

function myGASFunction() {
  const date = Utils.toDate('2023-01-01')
  if (Utils.isDate(date)) {
    console.log(date.toISOString())
  }
}
```

## =� Features

### Type Utilities
- **`toDate(value, defaultValue?)`** - Convert various types to Date with fallback
- **`toDateStrict(value)`** - Convert to Date or throw error
- **`isDate(value)`** - Check if value is a valid Date object

### HTTP Utilities
- **Headers implementation** - Web-standard Headers API for GAS
- **MIME type helpers** - Common MIME type constants and utilities

### Runtime Type Checking
- Robust type validation and conversion utilities
- Null-safe operations with sensible defaults

## =� Documentation

### API Reference

#### `toDate(value: DateValue, defaultValue?: Date | null): Date | null`

Converts a value to a Date object with optional fallback.

```typescript
const date1 = toDate('2023-01-01')          // Date object
const date2 = toDate('invalid', new Date()) // Returns defaultValue
const date3 = toDate(null)                  // Returns null
```

#### `toDateStrict(value: DateValue): Date`

Converts a value to a Date object, throwing an error if conversion fails.

```typescript
const date = toDateStrict('2023-01-01')  // Date object
const invalid = toDateStrict('invalid')  // Throws Error
```

#### `isDate(value: unknown): value is Date`

Type guard that checks if a value is a valid Date object.

```typescript
if (isDate(someValue)) {
  // TypeScript knows someValue is Date here
  console.log(someValue.toISOString())
}
```

## =� Development

This library supports multiple build targets and consumption methods. See the development documentation for details on:

- Building for different distribution formats
- Contributing guidelines
- Testing procedures

## =� Package-Specific Documentation

- **[gas-utils-library-types](https://npmjs.com/package/gas-utils-library-types)** - TypeScript declarations only
- **[gas-utils-library](https://npmjs.com/package/gas-utils-library)** - Self-contained library

## � License

MIT License - see [LICENSE](./LICENSE) for details.

## > Contributing

Contributions are welcome! Please see our contributing guidelines and feel free to submit issues and pull requests.
