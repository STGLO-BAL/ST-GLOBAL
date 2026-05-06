import * as esbuild from 'esbuild';

async function build() {
  await esbuild.build({
    entryPoints: ['server/routers.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'api/index.js',
    format: 'esm',
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
    external: ['mysql2', 'express', 'cors', 'cookie-parser', 'jsonwebtoken', 'bcryptjs', 'zod', 'drizzle-orm', 'jose'],
  });
  console.log('Backend bundled successfully');
}
build().catch(console.error);
