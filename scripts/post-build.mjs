// https://github.com/jniac/some-utils-ts/edit/main/scripts/post-build.mjs

import fs from 'fs/promises'
import path from 'path'

/**
 * Adds .js extensions to relative imports in a single file.
 * 
 * Features:
 * - ignores existing .js imports
 * - ignores .json imports
 * - adds .js to regular files
 * - adds /index.js to directories with an index file
 * 
 * @param {string} filePath - The path to the file.
 */
async function addJsExtensionsToFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  const re = /from\s+['"](\.\.?\/[^'"]+)['"]/g
  const matches = content.matchAll(re)

  let replaced = false
  let index = 0
  const chunks = []
  for (const m of matches) {
    const [m0, m1] = m

    if (m1.endsWith('.js'))
      continue

    if (m1.endsWith('.json'))
      continue

    chunks.push(content.slice(index, m.index))

    const regularFileExists = await fs.access(path.join(path.dirname(filePath), m1 + '.js'))
      .then(() => true)
      .catch(() => false)

    if (regularFileExists) {
      chunks.push(m0.replace(m1, `${m1}.js`))
    } else {
      const indexFileExists = await fs.access(path.join(path.dirname(filePath), m1, 'index.js'))
        .then(() => true)
        .catch(() => false)

      if (indexFileExists) {
        chunks.push(m0.replace(m1, `${m1}/index.js`))
      } else {
        console.warn(`File not found: ${m1}.js or ${m1}/index.js`)
        chunks.push(m0)
      }
    }

    replaced = true

    index = m.index + m0.length
  }

  if (replaced === false)
    return 0

  chunks.push(content.slice(index))
  const newContent = chunks.join('')
  await fs.writeFile(filePath, newContent, 'utf8')

  return chunks.length - 1
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
