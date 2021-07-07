import * as esbuild from 'https://deno.land/x/esbuild@v0.12.9/mod.js'
import { denoPlugin } from 'https://deno.land/x/esbuild_deno_loader@0.1.1/mod.ts'

await esbuild.build({
  plugins: [denoPlugin()],
  entryPoints: ['./framework/index.ts'],
  outfile: './dist/index.js',
  bundle: true,
  format: 'esm',
  minify: Deno.args.includes('--minify'),
  sourcemap: true,
  logLevel: 'verbose',
})

esbuild.stop()
