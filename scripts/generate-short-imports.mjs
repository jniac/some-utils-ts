// This script generates short import files for all directories containing an `index.js` file.  
// Original file from `some-utils-ts`.  
// https://github.com/jniac/some-utils-ts/blob/main/scripts/generate-short-imports.mjs

import fs from "fs/promises"
import path from "path"

async function doGenerateShortImports(dir, head = { logs: [], parent: null }) {
  const items = await fs.readdir(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)

    if (item.isDirectory()) {

      try {
        // Check if `index.js` exists in this directory
        const indexPath = path.join(fullPath, 'index.js')
        await fs.access(indexPath)

        // Get the relative path from the base dir
        const relativePath = path.relative(dir, fullPath)

        {
          // JS file
          const filepath = path.join(dir, `${relativePath}.js`)
          const content = `export * from './${relativePath}/index.js';\n`
          await fs.writeFile(filepath, content)
        }

        {
          // DTS file
          const filepath = path.join(dir, `${relativePath}.d.ts`)
          const content = `export * from './${relativePath}/index';\n`
          await fs.writeFile(filepath, content)
        }

        head.logs.push(` - ✅ ${relativePath} (.js|.d.ts)`)
      } catch {
        // No index.js found, continue without creating a file
      }

      // Recursively process subdirectories
      await doGenerateShortImports(fullPath, {
        logs: head.logs,
        parent: item.name,
      })
    }
  }

  if (head.parent === null) {
    // If this is the top-level call, print the logs
    if (head.logs.length === 0) {
      console.log('✅ No short imports generated.')
    }
    else {
      console.log(`✅ Short imports generated:\n${head.logs.join("\n")}`)
    }
  }
}

/**
 * Recursively scans a directory for `index.js` files and creates corresponding `path.js` files.
 * @param {string} dir - The root directory to scan.
 */
export async function generateShortImports(dir) {
  return doGenerateShortImports(dir)
}

// Run the script in the `dist/` directory (or wherever your compiled JS files are)
// const OUTPUT_DIR = "./dist" // Adjust this if needed
// await generateShortImports(OUTPUT_DIR)
// console.log("🎉 Short import files generated successfully!")