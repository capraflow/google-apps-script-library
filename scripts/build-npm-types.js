#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Project } from 'ts-morph'

async function buildTypes() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  })

  const sourceFiles = project.getSourceFiles('./app/**/*.ts')
  const outputDir = './dist/npm-types'

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

  await writeFile(join(outputDir, 'types.d.ts'), outputContent)

  console.log(`Generated TypeScript declarations in ${outputDir}`)
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

buildTypes().catch(console.error)
