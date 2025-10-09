import fs from 'fs/promises'
import path from 'path'

async function getSomeUtilsVersion() {
  return '1.0.0' // Placeholder for actual version retrieval logic
}

/**
 * Replace pnpm workspace references with actual versions.
 * @param {object} scope 
 */
async function replacePnpmWorkspaceReferences(scope) {
  for (const key of Object.keys(scope)) {
    const value = scope[key]

    if (key === 'exports')
      continue

    if (!value)
      continue

    switch (typeof value) {
      case 'object': {
        await replacePnpmWorkspaceReferences(value)
        break
      }

      case 'string': {
        if (key.startsWith('some-utils-') && value.startsWith('workspace:')) {
          const version = await getSomeUtilsVersion()
          scope[key] = version
        }
      }
    }
  }
}

export async function getExportsMap(distDir) {
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

  return exportsMap
}

export async function generateDistPackage(distDir, {
  dryRun = false,
} = {}) {


  // Update package.json
  const originalPackageJsonPath = path.join(distDir, '../package.json')
  const pkgRaw = await fs.readFile(originalPackageJsonPath, 'utf-8')
  const pkg = JSON.parse(pkgRaw)

  delete pkg.main
  delete pkg.module
  delete pkg.types
  delete pkg.devDependencies
  delete pkg.scripts
  delete pkg.files

  await replacePnpmWorkspaceReferences(pkg)

  pkg.type = 'module'
  pkg.exports = await getExportsMap(distDir)


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
