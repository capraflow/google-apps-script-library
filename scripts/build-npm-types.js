#!/usr/bin/env node

import { copyFileSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Project } from 'ts-morph'

async function buildTypes() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  })

  const sourceFiles = project.getSourceFiles('./app/**/*.ts')
  const outputDir = './dist/npm-types'

  // Clean output directory
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  // Collect all exports from all source files
  const allTypes = []
  const allInterfaces = []

  for (const sourceFile of sourceFiles) {
    // Process type aliases
    const typeAliases = sourceFile.getTypeAliases().filter((t) => t.isExported())
    for (const typeAlias of typeAliases) {
      allTypes.push({
        name: typeAlias.getName(),
        definition: typeAlias.getTypeNode()?.getText() || 'any',
        comment: extractJSDocComment(typeAlias),
      })
    }

    // Process exported functions
    const functions = sourceFile.getFunctions().filter((f) => f.isExported())
    for (const func of functions) {
      const name = func.getName()
      const params = func.getParameters()
      const returnType = func.getReturnTypeNode()?.getText() || 'any'
      const comment = extractJSDocComment(func)

      const paramSignatures = params
        .map((param) => {
          const paramName = param.getName()
          const paramType = param.getTypeNode()?.getText() || 'any'
          const isOptional = param.hasQuestionToken()
          return `${paramName}${isOptional ? '?' : ''}: ${paramType}`
        })
        .join(', ')

      allInterfaces.push({
        name,
        signature: `${name}(${paramSignatures}): ${returnType}`,
        comment,
      })
    }
  }

  const outputContent = generateTypeDeclarations(allTypes, allInterfaces)

  await writeFile(join(outputDir, 'index.d.ts'), outputContent)

  // Generate package.json
  const packageJson = generatePackageJson()
  await writeFile(join(outputDir, 'package.json'), JSON.stringify(packageJson, null, 2))

  // Copy README.md from docs template
  copyFileSync('./docs/npm-types-readme.md', join(outputDir, 'README.md'))

  // Generate .npmignore
  const npmignore = generateNpmignore()
  await writeFile(join(outputDir, '.npmignore'), npmignore)

  console.log(`Generated TypeScript declarations and npm package files in ${outputDir}`)
}

function generateTypeDeclarations(types, interfaces) {
  const lines = []

  lines.push('declare namespace Lib {')
  lines.push('  namespace Utils {')

  // Add type definitions
  for (const type of types) {
    if (type.comment) {
      const cleanComment = extractCleanComment(type.comment)

      if (cleanComment.trim()) {
        lines.push('    /**')
        lines.push(`     * ${cleanComment}`)
        lines.push('     */')
      }
    }
    lines.push(`    type ${type.name} = ${type.definition}`)
    lines.push('')
  }

  // Add interface with all functions
  lines.push('    interface Utils {')
  for (const func of interfaces) {
    if (func.comment) {
      lines.push('      /**')

      // Add main description
      const cleanComment = extractCleanComment(func.comment)
      if (cleanComment.trim()) {
        lines.push(`       * ${cleanComment}`)
      }

      // Extract and add @param and @returns documentation
      const originalLines = func.comment
        .replace(/\/\*\*|\*\//g, '')
        .replace(/^\s*\*\s?/gm, '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line)

      for (const line of originalLines) {
        if (
          line.startsWith('@param') ||
          line.startsWith('@returns') ||
          line.startsWith('@throws')
        ) {
          lines.push(`       * ${line}`)
        }
      }

      lines.push('       */')
    }
    lines.push(`      ${func.signature}`)

    if (interfaces.indexOf(func) < interfaces.length - 1) {
      lines.push('')
    }
  }
  lines.push('    }')

  lines.push('  }')
  lines.push('}')
  lines.push('')
  lines.push('declare var Utils: Lib.Utils.Utils')
  lines.push('')

  return lines.join('\n')
}

function extractJSDocComment(node) {
  const jsDoc = node.getJsDocs()
  if (jsDoc.length > 0) {
    return jsDoc[0].getText()
  }
  return null
}

function extractCleanComment(jsdocComment) {
  if (!jsdocComment) return ''

  return jsdocComment
    .replace(/\/\*\*|\*\//g, '')
    .replace(/^\s*\*\s?/gm, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('@'))
    .join(' ')
    .trim()
}

function generatePackageJson() {
  // Read the main package.json for version and basic info
  const mainPackageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

  return {
    name: 'gas-utils-library-types',
    version: mainPackageJson.version || '1.0.0',
    description: 'TypeScript type declarations for Google Apps Script utility library',
    author: {
      name: 'Daniel Reichl',
      email: 'daniel@capraflow.com',
    },
    license: 'MIT',
    main: '',
    types: 'index.d.ts',
    keywords: [
      'google-apps-script',
      'gas',
      'typescript',
      'types',
      'definitions',
      'utilities',
    ],
    repository: {
      type: 'git',
      url: 'https://github.com/your-org/gas-utils-library.git',
    },
    bugs: {
      url: 'https://github.com/your-org/gas-utils-library/issues',
    },
    homepage: 'https://github.com/your-org/gas-utils-library#readme',
    engines: {
      node: '>=18.0.0',
    },
    files: ['index.d.ts', 'README.md'],
    scripts: {},
    dependencies: {},
    peerDependencies: {},
    typeScriptVersion: '5.0',
  }
}

function generateNpmignore() {
  return `# Source files
src/
app/
scripts/

# Development files
*.ts
!*.d.ts
tsconfig.json
biome.json

# Build artifacts
dist/
node_modules/

# IDE files
.vscode/
.idea/

# Version control
.git/
.gitignore

# Documentation (except README)
docs/
*.md
!README.md

# Testing
test/
tests/
__tests__/
*.test.*
*.spec.*

# Logs
logs
*.log
npm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
node_modules/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# macOS
.DS_Store

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini
`
}

buildTypes().catch(console.error)
