#!/usr/bin/env node

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Project } from 'ts-morph'

async function buildJSDoc() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  })

  const sourceFiles = project.getSourceFiles('./app/**/*.ts')
  const outputDir = './dist/gas-types'

  // Clean output directory
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  // Collect all exports from all source files
  const allTypes = []
  const allFunctions = []

  for (const sourceFile of sourceFiles) {
    const { types, functions } = extractExportsFromFile(sourceFile)
    allTypes.push(...types)
    allFunctions.push(...functions)
  }

  const outputContent = generateJSDocFromExports(allTypes, allFunctions)

  await writeFile(join(outputDir, 'types.js'), outputContent)

  // Also create the file in docs/ for GitHub README reference
  await mkdir('./docs', { recursive: true })
  await writeFile('./docs/gas-types.js', outputContent)

  console.log(`Generated JSDoc types in ${outputDir}`)
  console.log(`Generated JSDoc types reference in ./docs/gas-types.js`)
}

function extractExportsFromFile(sourceFile) {
  const types = []
  const functions = []

  // Process type aliases
  const typeAliases = sourceFile.getTypeAliases().filter((t) => t.isExported())
  for (const typeAlias of typeAliases) {
    types.push({
      name: typeAlias.getName(),
      definition: typeAlias.getTypeNode()?.getText() || 'any',
      comment: extractJSDocComment(typeAlias),
    })
  }

  // Process exported functions
  const exportedFunctions = sourceFile.getFunctions().filter((f) => f.isExported())
  for (const func of exportedFunctions) {
    functions.push({
      name: func.getName(),
      parameters: func.getParameters(),
      returnType: func.getReturnTypeNode()?.getText() || 'any',
      comment: extractJSDocComment(func),
      funcNode: func,
    })
  }

  return { types, functions }
}

function generateJSDocFromExports(allTypes, allFunctions) {
  const lines = []

  lines.push('/**')
  lines.push(' * @namespace Utils')
  lines.push(' */')
  lines.push('')

  // Process all type aliases
  for (const type of allTypes) {
    lines.push('/**')
    if (type.comment) {
      const cleanComment = extractCleanComment(type.comment)
      lines.push(` * ${cleanComment}`)
    }
    lines.push(` * @typedef {${type.definition}} Utils.${type.name}`)
    lines.push(' */')
    lines.push('')
  }

  // Process all exported functions
  const functionDeclarations = []

  for (const func of allFunctions) {
    lines.push('/**')

    // Add description from JSDoc
    if (func.comment) {
      const cleanComment = extractCleanComment(func.comment)
      if (cleanComment.trim()) {
        lines.push(` * ${cleanComment}`)
      }
    }

    lines.push(` * @function Utils.${func.name}`)

    // Add parameters
    for (const param of func.parameters) {
      const paramName = param.getName()
      const paramType = param.getTypeNode()?.getText() || 'any'
      const isOptional = param.hasQuestionToken()

      // Use Utils.TypeName for custom types
      const formattedParamType = paramType.includes('DateValue')
        ? `Utils.${paramType}`
        : paramType
      let paramStr = paramName

      if (isOptional) {
        if (paramName === 'defaultValue') {
          paramStr = `[${paramName}=null]`
        } else {
          paramStr = `[${paramName}]`
        }
      }

      lines.push(
        ` * @param {${formattedParamType}} ${paramStr} - ${getParamDescription(func.comment, paramName)}`,
      )
    }

    // Add return type
    const formattedReturnType = func.returnType.includes('Date')
      ? func.returnType.replace('undefined', 'null')
      : func.returnType
    lines.push(
      ` * @returns {${formattedReturnType}} ${getReturnDescription(func.comment, func.name)}`,
    )

    if (func.name === 'toDateStrict' && func.comment?.includes('@throws')) {
      lines.push(` * @throws {Error} If the value cannot be converted to a valid Date`)
    }

    lines.push(' */')
    lines.push('')

    functionDeclarations.push(func.name)
  }

  // Generate Utils typedef
  if (functionDeclarations.length > 0) {
    lines.push('/**')
    lines.push(' * @typedef {Object} Utils')
    for (const funcName of functionDeclarations) {
      lines.push(` * @property {function} ${funcName}`)
    }
    lines.push(' */')
    lines.push('')
  }

  // Generate Utils variable declaration
  lines.push('/**')
  lines.push(' * @type {Utils}')
  lines.push(' */')
  lines.push('var Utils = Utils || {}')
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

function getParamDescription(jsdocComment, paramName) {
  if (!jsdocComment) {
    if (paramName === 'value') return 'The value to convert to a Date'
    if (paramName === 'defaultValue')
      return 'The default value to return if the value is invalid'
    return `The ${paramName} parameter`
  }

  const paramMatch = jsdocComment.match(
    new RegExp(`@param[^\\n]*${paramName}[^\\n]*-\\s*([^\\n]+)`, 'i'),
  )
  if (paramMatch) return paramMatch[1].trim()

  if (paramName === 'defaultValue')
    return 'The default value to return if the value is invalid'
  return 'The value to convert to a Date'
}

function getReturnDescription(jsdocComment, functionName) {
  if (!jsdocComment) {
    if (functionName === 'toDate')
      return 'The converted Date or null if the value is invalid'
    if (functionName === 'toDateStrict') return 'The converted Date'
    if (functionName === 'isDate') return 'True if the value is a valid Date object'
    return 'The return value'
  }

  const returnMatch = jsdocComment.match(/@returns?[^\\n]*-\\s*([^\\n]+)/i)
  if (returnMatch) return returnMatch[1].trim()

  if (functionName === 'toDate')
    return 'The converted Date or null if the value is invalid'
  if (functionName === 'isDate') return 'True if the value is a valid Date object'
  return 'The converted Date'
}

buildJSDoc().catch(console.error)
