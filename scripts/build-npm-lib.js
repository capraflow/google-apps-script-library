#!/usr/bin/env node

import { copyFileSync, readFileSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
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

  // Copy README.md from docs template
  copyFileSync('./docs/npm-lib-readme.md', join(outputDir, 'README.md'))

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
  // Read the main package.json for version
  const mainPackageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

  return {
    name: 'gas-utils-library',
    version: mainPackageJson.version || '1.0.0',
    description:
      'Self-contained Google Apps Script utility library with TypeScript support',
    author: {
      name: 'Daniel Reichl',
      email: 'daniel@capraflow.com',
    },
    license: 'MIT',
    main: 'dist/index.js',
    module: 'dist/index.js',
    types: 'dist/index.d.ts',
    bin: {
      'gas-utils': './bin/gas-utils-build.js',
    },
    keywords: [
      'google-apps-script',
      'gas',
      'utilities',
      'typescript',
      'bundler',
      'self-contained',
    ],
    files: ['dist/**/*', 'src/**/*', 'bin/**/*', 'README.md', 'package.json'],
    scripts: {
      build: 'tsc',
      prepublishOnly: 'npm run build',
    },
    engines: {
      node: '>=18.0.0',
    },
    repository: {
      type: 'git',
      url: 'https://github.com/your-org/gas-utils-library.git',
    },
    homepage: 'https://github.com/your-org/gas-utils-library#readme',
    bugs: {
      url: 'https://github.com/your-org/gas-utils-library/issues',
    },
    dependencies: {
      'ts-morph': '^27',
    },
    devDependencies: {
      '@types/google-apps-script': '^2',
      typescript: '^5',
    },
    peerDependencies: {
      '@types/google-apps-script': '^2',
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
