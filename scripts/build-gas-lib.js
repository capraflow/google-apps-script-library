#!/usr/bin/env node

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { Project } from 'ts-morph'

async function buildGAS() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  })

  const sourceFiles = project.getSourceFiles('./app/**/*.ts')
  const outputDir = './dist/gas-lib'

  // Clean output directory
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  // Process each TypeScript file
  for (const sourceFile of sourceFiles) {
    const fileName = basename(sourceFile.getFilePath(), '.ts')
    const jsContent = convertTSToJS(sourceFile)

    await writeFile(join(outputDir, `${fileName}.js`), jsContent)
  }

  // Copy appsscript.json if it exists
  try {
    const appScriptProject = new Project()
    const appScriptFile = appScriptProject.addSourceFileAtPath('./app/appsscript.json')
    const content = appScriptFile.getFullText()
    await writeFile(join(outputDir, 'appsscript.json'), content)
  } catch (_error) {
    // appsscript.json doesn't exist, skip
  }

  console.log(`Generated Google Apps Script files in ${outputDir}`)
}

function convertTSToJS(sourceFile) {
  let content = sourceFile.getFullText()

  // Remove type aliases (export type ...)
  content = content.replace(/^export\s+type\s+[^\n]+$/gm, '')

  // Remove interface declarations
  content = content.replace(/^export\s+interface\s+[^}]+}\s*$/gm, '')

  // Remove import statements for types only
  content = content.replace(/^import\s+type\s+[^\n]+$/gm, '')

  // Remove export keywords from functions and variables (for GAS compatibility)
  content = content.replace(/^export\s+/gm, '')

  // Remove parameter type annotations and optional markers
  content = content.replace(/(\w+)\?:\s*[A-Za-z[\]|<>\s{},'"]+/g, '$1')
  content = content.replace(/(\w+):\s*[A-Za-z[\]|<>\s{},'"]+/g, '$1')

  // Remove function return type annotations
  content = content.replace(/\):\s*[A-Za-z[\]|<>\s{},'"]+\s+{/g, ') {')

  // Remove 'as' type assertions
  content = content.replace(/\s+as\s+[A-Za-z[\]|<>\s]+/g, '')

  // Remove empty lines that were left by removed type declarations
  content = content.replace(/^\s*\n/gm, '\n')

  // Remove leading/trailing whitespace but preserve internal structure
  return content.trim()
}

buildGAS().catch(console.error)
