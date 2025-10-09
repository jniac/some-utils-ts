import fs from 'fs/promises'
import path from 'path'

export async function generateDistPackage(distDir, {
  dryRun = false,
} = {}) {
  const exportsMap = {}

  // Recursively walk dist
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.name.endsWith('.js')) {
        // Compute subpath export
        const rel = path.relative(distDir, fullPath).replace(/\\/g, '/')
        const noExt = rel.replace(/\.js$/, '')
        exportsMap[`./${noExt}`] = {
          "import": `./${noExt}.js`,
          "require": `./${noExt}.js`,
          "types": `./${noExt}.d.ts`
        }
      }
    }
  }

  await walk(distDir)

  // Update package.json
  const originalPackageJsonPath = path.join(distDir, '../package.json')
  const pkgRaw = await fs.readFile(originalPackageJsonPath, 'utf-8')
  const pkg = JSON.parse(pkgRaw)
  pkg.exports = exportsMap

  delete pkg.main
  delete pkg.module
  delete pkg.types
  delete pkg.devDependencies
  delete pkg.scripts
  delete pkg.files
  pkg.type = 'module'

  if (dryRun) {
    console.log('Dry run mode - dist/package.json would be:')
    console.log(JSON.stringify(pkg, null, 2))
  }

  else {
    await fs.writeFile(path.join(distDir, 'package.json'), JSON.stringify(pkg, null, 2))
    console.log('✅ Dist package.json generated with exports.')
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`

if (isMain) {
  const { program } = await import('./program.mjs')
  const { dir, dryRun } = program.parse().opts()
  const distDir = path.join(import.meta.dirname, '..', dir)

  generateDistPackage(distDir, { dryRun })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
