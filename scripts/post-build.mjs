import fs from 'fs/promises'
import path from 'path'

/**
 * Adds .js extensions to relative imports in a single file.
 * @param {string} filePath - The path to the file.
 */
async function addJsExtensionsToFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g
  const newContent = content.replace(importRegex, (match, importPath) => {
    if (!importPath.endsWith('.js')) {
      return `from '${importPath}.js'`
    }
    return match
  })

  let count = 0
  if (newContent !== content) {
    await fs.writeFile(filePath, newContent, 'utf8')
    count++
  }
  return count
}

/**
 * Recursively processes a directory to add .js extensions to relative imports in .js files.
 * @param {string} dir - The directory to process.
 */
async function processDirectory(dir) {
  let count = 0
  for (const item of await fs.readdir(dir)) {
    const itemPath = path.join(dir, item)
    const stat = await fs.stat(itemPath)

    if (stat.isDirectory()) {
      count += await processDirectory(itemPath)
    } else if (stat.isFile() && item.endsWith('.js')) {
      count += await addJsExtensionsToFile(itemPath)
    }
  }
  return count
}

// Start processing from the current directory (or specify a folder)
const targetFolder = process.argv[2] || './dist' // Default to './dist' if no folder is provided
const count = await processDirectory(targetFolder)
console.log(`Changed ${count} import paths in ${targetFolder}`)