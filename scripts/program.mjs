const { Command } = await import('commander')

const program = new Command()

program
  // .argument('[dist]', 'Path to the dist directory', 'dist')
  .option('-d, --dir [path]', 'Path to the dist directory', 'dist')
  .option('--dry-run', 'Run the script without writing files')

export { program }
