#!/usr/bin/env node

import { mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { basename, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function buildNPM() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  })

  const sourceFiles = project.getSourceFiles('./app/**/*.ts')
  const outputDir = './dist/npm-lib'
  const srcDir = join(outputDir, 'src')

  // Clean output directory
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(srcDir, { recursive: true })

  // Copy TypeScript source files
  for (const sourceFile of sourceFiles) {
    const fileName = basename(sourceFile.getFilePath())
    const content = sourceFile.getFullText()

    await writeFile(join(srcDir, fileName), content)
  }

  // Generate index.ts that exports everything
  const indexContent = generateIndexFile(sourceFiles)
  await writeFile(join(srcDir, 'index.ts'), indexContent)

  // Copy CLI bundler script
  const cliBundlerSource = await readFile(join(__dirname, 'cli-bundler.js'), 'utf8')
  await mkdir(join(outputDir, 'bin'), { recursive: true })
  await writeFile(join(outputDir, 'bin', 'gas-utils-build.js'), cliBundlerSource)

  // Generate package.json
  const packageJson = generatePackageJson()
  await writeFile(join(outputDir, 'package.json'), JSON.stringify(packageJson, null, 2))

  // Generate TypeScript config for the NPM package
  const tsConfig = generateTSConfig()
  await writeFile(join(outputDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2))

  // Generate README
  const readme = generateReadme()
  await writeFile(join(outputDir, 'README.md'), readme)

  // Generate .npmignore
  const npmIgnore = generateNpmIgnore()
  await writeFile(join(outputDir, '.npmignore'), npmIgnore)

  console.log(`Generated NPM package in ${outputDir}`)
}

function generateIndexFile(sourceFiles) {
  const lines = []

  lines.push('/**')
  lines.push(' * Google Apps Script Utility Library')
  lines.push(' * ')
  lines.push(
    ' * This package provides utility functions for Google Apps Script development.',
  )
  lines.push(' * It can be bundled directly into your GAS project using a build tool.')
  lines.push(' */')
  lines.push('')

  // Export all types and functions from each file
  for (const sourceFile of sourceFiles) {
    const fileName = basename(sourceFile.getFilePath(), '.ts')

    // Don't process appsscript.json or other non-TS files
    if (!sourceFile.getFilePath().endsWith('.ts')) continue

    // Get exported items
    const exportedTypes = sourceFile.getTypeAliases().filter((t) => t.isExported())
    const exportedFunctions = sourceFile.getFunctions().filter((f) => f.isExported())

    if (exportedTypes.length > 0 || exportedFunctions.length > 0) {
      const exports = [
        ...exportedTypes.map((t) => t.getName()),
        ...exportedFunctions.map((f) => f.getName()),
      ]

      lines.push(`export { ${exports.join(', ')} } from './${fileName}.js'`)
    }
  }

  lines.push('')
  lines.push('// Re-export everything as a default object for convenience')
  lines.push("export * as default from './index.js'")

  return lines.join('\n')
}

function generatePackageJson() {
  return {
    name: '@your-org/gas-utils',
    version: '1.0.0',
    description: 'Utility functions for Google Apps Script development',
    main: 'dist/index.js',
    module: 'dist/index.js',
    types: 'dist/index.d.ts',
    bin: {
      'gas-utils': './bin/gas-utils-build.js'
    },
    files: ['dist/**/*', 'src/**/*', 'bin/**/*', 'README.md', 'package.json'],
    scripts: {
      build: 'tsc',
      prepublishOnly: 'npm run build',
    },
    keywords: ['google-apps-script', 'gas', 'utilities', 'typescript', 'productivity'],
    author: 'Your Name',
    license: 'MIT',
    dependencies: {
      'ts-morph': '^27'
    },
    devDependencies: {
      '@types/google-apps-script': '^2',
      typescript: '^5',
    },
    peerDependencies: {
      '@types/google-apps-script': '^2',
    },
    repository: {
      type: 'git',
      url: 'https://github.com/your-org/gas-utils.git',
    },
    homepage: 'https://github.com/your-org/gas-utils#readme',
    bugs: {
      url: 'https://github.com/your-org/gas-utils/issues',
    },
  }
}

function generateTSConfig() {
  return {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'node',
      declaration: true,
      declarationMap: true,
      outDir: 'dist',
      rootDir: 'src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  }
}

function generateReadme() {
  return `# Google Apps Script Utilities

A utility library for Google Apps Script development with TypeScript support and **zero-config bundling**.

## Installation

\`\`\`bash
npm install @your-org/gas-utils
\`\`\`

## Quick Start

1. **Create your project structure:**
   \`\`\`
   my-gas-project/
   ├── src/
   │   ├── main.ts      ← Your business logic
   │   └── utils.ts     ← Your helper functions
   └── package.json
   \`\`\`

2. **Write your code with imports:**
   \`\`\`typescript
   // src/main.ts
   import { toDate, isDate } from '@your-org/gas-utils'

   function myGASFunction() {
     const date = toDate('2023-01-01')
     if (isDate(date)) {
       console.log(date.toISOString())
     }
   }
   \`\`\`

3. **Build for Google Apps Script:**
   \`\`\`bash
   npx gas-utils build
   \`\`\`

4. **Deploy to GAS:**
   \`\`\`
   dist/
   ├── main.js           ← 1:1 mapping for perfect debugging
   ├── utils.js          ← Your helper functions
   ├── lib/
   │   └── gas-utils.js  ← Tree-shaken utilities (only toDate & isDate!)
   └── appsscript.json
   \`\`\`

## Key Features

- ✅ **Zero-config bundling** - No webpack, no complex setup
- ✅ **Perfect debugging** - 1:1 file mapping preserves line numbers
- ✅ **Tree shaking** - Only includes utilities you actually use
- ✅ **Zero dependencies** for users - Uses existing ts-morph
- ✅ **TypeScript support** - Full type safety during development

## Usage Examples

### Import specific utilities (recommended)

\`\`\`typescript
import { toDate, isDate } from '@your-org/gas-utils'

function processDate() {
  const date = toDate('2023-01-01')
  if (isDate(date)) {
    return date.toISOString()
  }
}
\`\`\`

### Import everything

\`\`\`typescript
import * as Utils from '@your-org/gas-utils'

function processDate() {
  const date = Utils.toDate('2023-01-01')
  if (Utils.isDate(date)) {
    return date.toISOString()
  }
}
\`\`\`

## Build Process

Unlike other solutions that require complex bundlers, this package includes a **zero-dependency CLI** that:

1. **Analyzes your imports** to determine which utilities you use
2. **Builds user files with 1:1 mapping** for perfect debugging
3. **Creates tree-shaken utility bundle** with only the functions you need
4. **Generates Google Apps Script compatible output**

## Functions

### Date Utilities

#### \`toDate(value, defaultValue?): Date | undefined\`
Converts a value to a Date object, returning undefined or defaultValue if conversion fails.

#### \`toDateStrict(value, defaultValue?): Date\`
Converts a value to a Date object, throwing an error if conversion fails.

#### \`isDate(value): boolean\`
Returns true if the value is a valid Date object.

## Types

### \`DateValue\`
Union type for values that can be converted to Date: \`Date | number | string | null | undefined\`

## License

MIT
`
}


function generateNpmIgnore() {
  return `# Source files
src/
tsconfig.json

# Development files
*.log
node_modules/
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build artifacts
*.tgz
`
}

buildNPM().catch(console.error)
