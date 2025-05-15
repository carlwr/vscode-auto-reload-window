import { createVSIX } from "@vscode/vsce";
import { build as buildTs } from 'tsup';
import { getFlag } from "type-flag";

const packageFlag = getFlag("--package", Boolean);
const packagePath = './extension.vsix';

async function compile(): Promise<void> {
  await buildTs({
    entry: ['src/extension.ts'],
    outDir: 'out',
    format: ['cjs'],
    sourcemap: true,
    clean: true,
    target: 'node22',
    external: ['vscode'],
  });
}

async function mk_VSIX(): Promise<void> {
  await createVSIX({ dependencies: false, packagePath });
}

async function run(): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (!packageFlag) { tasks.push(compile()); }
  if ( packageFlag) { tasks.push(mk_VSIX()); }

  await Promise.all(tasks);
}

(async (): Promise<void> => {
  await run();
})().catch((err: unknown) => {
  console.error(
    'Unhandled error:',
    err instanceof Error ? err.message : String(err)
  );
  process.exit(1);
});
