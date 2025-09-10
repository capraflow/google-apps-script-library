#!/usr/bin/env node

import { mkdir, writeFile, readdir } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import { Project } from 'ts-morph'

async function buildGAS() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  })

  const sourceFiles = project.getSourceFiles('./app/**/*.ts')
  const outputDir = './dist/gas'

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
  } catch (error) {
    // appsscript.json doesn't exist, skip
  }

  console.log(`Generated Google Apps Script files in ${outputDir}`)
}

function convertTSToJS(sourceFile) {
  const lines = []
  
  // Add JSDoc comments for better GAS IDE experience
  lines.push('/**')
  lines.push(' * Google Apps Script utility functions')
  lines.push(' * Generated from TypeScript source')
  lines.push(' */')
  lines.push('')

  // Process type aliases - convert to JSDoc
  const typeAliases = sourceFile.getTypeAliases().filter(t => t.isExported())
  for (const typeAlias of typeAliases) {
    const name = typeAlias.getName()
    const typeText = typeAlias.getTypeNode()?.getText() || 'any'
    const comment = extractJSDocComment(typeAlias)
    
    if (comment) {
      const cleanComment = extractCleanComment(comment)
      lines.push(`// ${cleanComment}`)
    }
    lines.push(`// @typedef {${typeText}} ${name}`)
    lines.push('')
  }

  // Process exported functions - convert to plain JavaScript
  const functions = sourceFile.getFunctions().filter(f => f.isExported())
  for (const func of functions) {
    const name = func.getName()
    const params = func.getParameters()
    const body = func.getBodyText() || ''
    const comment = extractJSDocComment(func)
    
    // Add JSDoc comment
    if (comment) {
      lines.push(comment.replace(/export /g, ''))
    }
    
    // Create function signature without TypeScript annotations
    const paramList = params.map(param => {
      const paramName = param.getName()
      const hasDefault = param.hasInitializer()
      const defaultValue = hasDefault ? param.getInitializer()?.getText() : null
      
      return defaultValue ? `${paramName} = ${defaultValue}` : paramName
    }).join(', ')
    
    lines.push(`function ${name}(${paramList}) {`)
    
    // Clean up the function body - remove type annotations and fix formatting
    let cleanBody = body
      .replace(/:\s*[A-Za-z\[\]|<>\s]+(?=\s*[=,)}])/g, '') // Remove type annotations
      .replace(/as\s+[A-Za-z\[\]|<>\s]+/g, '') // Remove 'as' type assertions
    
    // Properly indent and format the body
    const bodyLines = cleanBody.split('\n')
    const indentedLines = bodyLines.map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      return `  ${trimmed}`
    })
    
    cleanBody = indentedLines.join('\n')
    
    lines.push(cleanBody)
    lines.push('}')
    lines.push('')
  }

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
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('@'))
    .join(' ')
    .trim()
}

buildGAS().catch(console.error)