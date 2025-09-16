# gas-utils-library

A self-contained Google Apps Script utility library with TypeScript support. This package bundles all utility functions and types, requiring no external GAS library setup.

## 📦 Installation

```bash
npm install gas-utils-library
```

## 🚀 Usage

This package includes both runtime code and TypeScript declarations. Perfect for projects using build tools like Webpack, Rollup, or esbuild.

### Import Specific Functions

```typescript
import { toDate, isDate, DateValue } from 'gas-utils-library'

function myGASFunction() {
  const date = toDate('2023-01-01')
  if (isDate(date)) {
    console.log(date.toISOString())
  }
}
```

### Import Everything

```typescript
import * as GasUtils from 'gas-utils-library'

function myGASFunction() {
  const date = GasUtils.toDate('2023-01-01')
  if (GasUtils.isDate(date)) {
    console.log(date.toISOString())
  }
}
```

### Build Process

When deploying to Google Apps Script, use a bundler to combine your code:

```bash
# Example with esbuild
npx esbuild src/main.ts --bundle --outfile=dist/Code.js --format=iife

# Then push to GAS
clasp push
```

## 📚 API Reference

### Type Utilities

#### `toDate(value: DateValue, defaultValue?: Date | null): Date | null`

Converts various types to Date with optional fallback.

```typescript
import { toDate } from '@your-org/gas-utils'

const date1 = toDate('2023-01-01')          // Date object
const date2 = toDate('invalid', new Date()) // Returns defaultValue
const date3 = toDate(null)                  // Returns null
```

#### `toDateStrict(value: DateValue): Date`

Converts to Date or throws error.

```typescript
import { toDateStrict } from 'gas-utils-library'

const date = toDateStrict('2023-01-01')  // Date object
// const invalid = toDateStrict('invalid')  // Throws Error
```

#### `isDate(value: unknown): value is Date`

Type guard for Date objects.

```typescript
import { isDate } from 'gas-utils-library'

if (isDate(someValue)) {
  // TypeScript knows someValue is Date here
  console.log(someValue.toISOString())
}
```

### Types

#### `DateValue`

Union type for values convertible to Date:

```typescript
import type { DateValue } from 'gas-utils-library'

type DateValue = Date | number | string | null | undefined
```

## 🔗 Related Packages

- **[Main Repository](https://github.com/your-org/gas-utils)** - Complete documentation and source code
- **[gas-utils-library-types](https://npmjs.com/package/gas-utils-library-types)** - TypeScript declarations only (for use with deployed GAS library)

## 🛠️ Development Requirements

- Node.js 18+
- TypeScript 4.0+
- A bundler for Google Apps Script deployment (esbuild, webpack, rollup, etc.)

## 💡 Why Use This Package?

- **No GAS Library Setup**: Functions are bundled directly into your project
- **Full TypeScript Support**: Complete type definitions included
- **Tree Shaking**: Import only the functions you need
- **Modern Development**: Works with standard Node.js tooling

## ⚖️ License

MIT License - see [LICENSE](https://github.com/your-org/gas-utils/blob/main/LICENSE) for details.