# gas-utils-library-types

TypeScript type declarations for the Google Apps Script Utility Library. This package provides full IntelliSense and type checking support when using the deployed GAS library in your IDE.

## 📦 Installation

```bash
npm install gas-utils-library-types
```

## 🚀 Usage

This package is designed to be used alongside the deployed Google Apps Script library. It provides TypeScript definitions without any runtime code.

### Setup

1. **Install this package** for TypeScript support
2. **Add the GAS library** to your Apps Script project:
   - Go to Libraries in your GAS project
   - Add library with Script ID: `YOUR_SCRIPT_ID`
   - Set identifier (e.g., `GasUtils`)

### Code Example

```typescript
// Import types for IntelliSense
import type { DateValue } from 'gas-utils-library-types'

function myFunction() {
  // Full type support in your IDE
  const inputDate: DateValue = '2023-01-01'

  // Use the deployed library (GasUtils is your library identifier)
  const result = GasUtils.toDate(inputDate)

  if (GasUtils.isDate(result)) {
    console.log(result.toISOString())
  }
}
```

## 📚 Available Types

### `DateValue`
Union type for values that can be converted to Date:
```typescript
type DateValue = Date | number | string | null | undefined
```

### Functions

- **`toDate(value: DateValue, defaultValue?: Date | null): Date | null`**
- **`toDateStrict(value: DateValue): Date`**
- **`isDate(value: unknown): value is Date`**

## 🔗 Related Packages

- **[Main Repository](https://github.com/your-org/gas-utils)** - Complete documentation and source code
- **[gas-utils-library](https://npmjs.com/package/gas-utils-library)** - Self-contained package with bundled code (no GAS library needed)

## 📋 Requirements

- Requires the deployed Google Apps Script library
- Compatible with TypeScript 4.0+
- Node.js 18+ for development

## ⚖️ License

MIT License - see [LICENSE](https://github.com/your-org/gas-utils/blob/main/LICENSE) for details.