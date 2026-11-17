// esbuild build script for Class Fold
// Blazing fast packaging with zero external runtime footprint

const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'info',
  });

  if (watch) {
    console.log('⚡ Watching for file changes...');
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log(`🚀 Class Fold build complete (${production ? 'production' : 'development'}).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
