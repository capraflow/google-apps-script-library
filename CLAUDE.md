# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important**: This project uses pnpm so all script calls should keep that in mind.

## Development Commands

### Core Development
- **Build TypeScript**: `pnpm run build` - Compiles TypeScript to generate type definitions
- **Format & Lint**: `pnpm run check` - Runs Biome formatter and linter with auto-fix
- **Audit Code**: `pnpm run audit` - Runs Biome CI checks (used for validation)

### Google Apps Script Deployment
- **Deploy to GAS**: `pnpm run push` - Pushes code to Google Apps Script using clasp
- **Pull from GAS**: `pnpm run pull` - Pulls latest code from Google Apps Script
- **Authenticate**: `pnpm run login` - Login to Google Apps Script via clasp

### Distribution Build Commands
- **Generate JSDoc Types**: `pnpm run build:jsdoc` - Creates single `.js` file with JSDoc `@typedef` comments (Method 1)
- **Build NPM Types Package**: `pnpm run build:types` - Generates `.d.ts` files for NPM distribution (Method 2)
- **Build All Distribution Formats**: `pnpm run build:all` - Generates both JSDoc and TypeScript declaration files
- **Build NPM Bundle Package**: TBD - Creates self-contained NPM package with code + types (Method 3)
- **Package for NPM**: TBD - Prepares package.json and files for NPM publishing

## Project Architecture

This is a **Google Apps Script utility library** that provides convenient access to commonly used utility methods. The library is designed to support **three distinct consumption methods**:

### Library Consumption Methods

1. **Direct GAS IDE Usage** (JSDoc Types)
   - Single `.js` file with JSDoc `@typedef` comments for type definitions
   - Users copy/paste JSDoc comments into their GAS IDE project
   - Requires linking to the deployed library in Google Apps Script
   - Works with the barebones Monaco Editor in GAS IDE

2. **NPM Package with Type Declarations** (DefinitelyTyped Style)
   - NPM package providing TypeScript declaration files (`.d.ts`)
   - Modeled after `@types/google-apps-script` from DefinitelyTyped
   - Requires linking to the deployed library in Google Apps Script
   - Allows developers to use their preferred IDE with full TypeScript support

3. **NPM Package with Bundled Code** (Self-Contained)
   - NPM package containing both utility code and type declarations
   - Code gets bundled directly into the user's project (no GAS library linking)
   - Requires a bundler to combine code when pushing to Google Apps Script
   - Full IDE support with embedded utility functions

**Note**: Methods 1 and 2 require linking to the deployed GAS library, while method 3 bundles the code directly.

### Key Components

- **`app/` directory**: Contains all Google Apps Script source files that get deployed
- **HTTP utilities**:
  - `headers.js` - Headers implementation for HTTP operations
  - `http.js` - MIME type utilities and Headers factory functions
- **Type utilities**: `type-check.js` and `type-cast.js` for runtime type validation
- **Google Apps Script configuration**: `appsscript.json` with V8 runtime and Chicago timezone

### Build & Distribution Setup

- **TypeScript**: Configured for type checking only (`emitDeclarationOnly: true`) with strict settings
- **Biome**: Used for formatting and linting with specific rules for GAS compatibility
- **Clasp**: Google's CLI tool for GAS development, configured to deploy from `app/` directory

#### Distribution Configurations
- **Method 1 (JSDoc)**: Build script to extract TypeScript types and convert to JSDoc `@typedef` format
- **Method 2 (NPM Types)**: Generate `.d.ts` files following DefinitelyTyped conventions
- **Method 3 (NPM Bundle)**: Package both source code and declarations for bundler consumption

### Code Style

- 2-space indentation
- Single quotes for strings
- Trailing commas enabled
- Line width: 88 characters
- Semicolons only when needed (`asNeeded`)

### Project Structure

The project supports multiple distribution formats:

- **`app/` directory**: Contains the actual GAS code that gets deployed
- **`dist/` directory**: Generated TypeScript declaration files (`.d.ts`) for type checking
- **Distribution outputs**:
  - `dist/types-jsdoc/` - JSDoc commented files for Method 1 (GAS IDE)
  - `dist/types/` - Declaration files for Method 2 (NPM types package)  
  - `dist/bundle/` - Complete package for Method 3 (NPM bundle)

### Usage Examples

**Method 1** - Direct GAS IDE:
```javascript
// Copy JSDoc types from generated file
/**
 * @typedef {Object} HttpHeaders
 * @property {function(string, string): void} set
 */

// Link library in GAS project settings, then use:
const headers = MyUtilityLibrary.createHeaders();
```

**Method 2** - NPM Types Package:
```bash
pnpm install @your-org/gas-utils-types
```
```typescript
// In your TypeScript GAS project
import type { HttpHeaders } from '@your-org/gas-utils-types';
// Link library in GAS, then use with full type support
const headers: HttpHeaders = MyUtilityLibrary.createHeaders();
```

**Method 3** - NPM Bundle Package:
```bash
npm install @your-org/gas-utils
```
```typescript
// Import and bundle directly into your project
import { createHeaders } from '@your-org/gas-utils';
const headers = createHeaders(); // No library linking needed
```

This library provides utility functions for common Google Apps Script development tasks including HTTP operations, MIME type handling, and runtime type validation.
