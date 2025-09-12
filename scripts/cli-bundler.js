#!/usr/bin/env node

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function buildProject() {
  const cwd = process.cwd()
  const srcDir = join(cwd, 'src')
  const outputDir = join(cwd, 'dist')

  console.log('🔍 Analyzing project structure...')

  // Initialize TypeScript project for user code
  const userProject = new Project({
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'node',
      allowJs: true,
      declaration: false,
      outDir: outputDir,
    },
  })

  // Add user source files
  const userFiles = userProject.addSourceFilesAtPaths(`${srcDir}/**/*.ts`)

  if (userFiles.length === 0) {
    console.error('❌ No TypeScript files found in src/ directory')
    process.exit(1)
  }

  // Clean output directory
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })
  await mkdir(join(outputDir, 'lib'), { recursive: true })

  console.log(`📁 Found ${userFiles.length} user files`)

  // Analyze imports to find used utility functions
  const usedUtilExports = findUsedUtilityExports(userFiles)
  console.log(
    `🌳 Tree shaking: found ${usedUtilExports.size} used utilities`,
    Array.from(usedUtilExports),
  )

  // Build user files (1:1 mapping for perfect debugging)
  console.log('🔨 Building user files with 1:1 mapping...')
  for (const sourceFile of userFiles) {
    const fileName = basename(sourceFile.getFilePath(), '.ts')
    const jsContent = convertUserTSToJS(sourceFile)
    await writeFile(join(outputDir, `${fileName}.js`), jsContent)
  }

  // Build tree-shaken utility bundle
  if (usedUtilExports.size > 0) {
    console.log('📦 Creating tree-shaken utility bundle...')
    const utilsBundle = await createTreeShakenUtilsBundle(usedUtilExports)
    await writeFile(join(outputDir, 'lib', 'gas-utils.js'), utilsBundle)
  }

  // Generate appsscript.json
  const appsscriptJson = {
    timeZone: 'America/Chicago',
    dependencies: {},
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
  }
  await writeFile(
    join(outputDir, 'appsscript.json'),
    JSON.stringify(appsscriptJson, null, 2),
  )

  console.log('✅ Build complete! Files generated in dist/')
  console.log('📋 Copy the contents of dist/ to your Google Apps Script project')
}

function findUsedUtilityExports(userFiles) {
  const usedExports = new Set()

  for (const file of userFiles) {
    // Find all import declarations
    const imports = file.getImportDeclarations()

    for (const imp of imports) {
      const moduleSpecifier = imp.getModuleSpecifierValue()

      // Check if importing from our utility package
      if (
        moduleSpecifier === '@your-org/gas-utils' ||
        moduleSpecifier.endsWith('/gas-utils')
      ) {
        // Get named imports
        const namedImports = imp.getNamedImports()
        for (const namedImport of namedImports) {
          usedExports.add(namedImport.getName())
        }

        // Handle namespace imports (import * as Utils)
        const namespaceImport = imp.getNamespaceImport()
        if (namespaceImport) {
          // If they import everything, we'll need all exports
          usedExports.add('*')
        }
      }
    }
  }

  return usedExports
}

function convertUserTSToJS(sourceFile) {
  let content = sourceFile.getFullText()

  // Replace imports from our utility package to use the bundled version
  content = content.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]@your-org\/gas-utils['"];?/g,
    'import { $1 } from "./lib/gas-utils.js";',
  )

  content = content.replace(
    /import\s*\*\s*as\s*(\w+)\s*from\s*['"]@your-org\/gas-utils['"];?/g,
    'import * as $1 from "./lib/gas-utils.js";',
  )

  // Remove TypeScript-specific syntax
  return convertTSToJS(content)
}

function convertTSToJS(content) {
  // Remove optional parameter markers (?)
  content = content.replace(/(\w+)\?(?=\s*[,)}{])/g, '$1')

  // Remove type annotations from function parameters and return types
  // More precise regex that won't eat opening braces
  content = content.replace(/:\s*[A-Za-z[\]|<>\s?,'"]+(?=\s*[=,)])/g, '')
  content = content.replace(/:\s*[A-Za-z[\]|<>\s?,'"]+(?=\s*\{)/g, '')

  // Remove 'as' type assertions
  content = content.replace(/\s+as\s+[A-Za-z[\]|<>\s]+/g, '')

  // Remove type aliases (export type ...)
  content = content.replace(/^export\s+type\s+[^\n]+$/gm, '')

  // Remove interface declarations
  content = content.replace(/^export\s+interface\s+[^}]+}\s*$/gm, '')

  // Remove import statements for types only
  content = content.replace(/^import\s+type\s+[^\n]+$/gm, '')

  // Remove empty lines that were left by removed type declarations
  content = content.replace(/^\s*\n/gm, '\n')

  return content.trim()
}

async function createTreeShakenUtilsBundle(usedExports) {
  // Get the path to our utility source files
  const utilsPackageDir = dirname(__dirname) // Go up from bin/ to package root
  const utilsSrcDir = join(utilsPackageDir, 'src')

  // Initialize project for utility files
  const utilsProject = new Project()
  const utilsSourceFiles = utilsProject.addSourceFilesAtPaths(`${utilsSrcDir}/**/*.ts`)

  const bundleContent = []
  bundleContent.push('// Tree-shaken Google Apps Script utilities')
  bundleContent.push('// Generated by @your-org/gas-utils')
  bundleContent.push('')

  // If they imported everything (*), include all exports
  const includeAll = usedExports.has('*')

  for (const sourceFile of utilsSourceFiles) {
    const functions = sourceFile.getFunctions().filter((f) => f.isExported())

    // Filter to only used exports (unless importing all)
    const neededFunctions = includeAll
      ? functions
      : functions.filter((f) => usedExports.has(f.getName()))

    if (neededFunctions.length > 0) {
      bundleContent.push(`// From ${basename(sourceFile.getFilePath())}`)

      // Add functions
      for (const func of neededFunctions) {
        const funcText = func.getText()
        // Convert TS to JS
        const jsFunc = convertTSToJS(funcText)
        bundleContent.push(jsFunc)
        bundleContent.push('')
      }
    }
  }

  return bundleContent.join('\n')
}

// Run the build
buildProject().catch((error) => {
  console.error('❌ Build failed:', error)
  process.exit(1)
})
