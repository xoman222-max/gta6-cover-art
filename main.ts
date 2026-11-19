// Vice City Cover Studio — the hand-in program (Node 22, standard library only).
//
// It copies this repository's app/ and screenshots/ beside this file into the
// output directory and writes /output/dossier.json with the vendored make.fun
// library, so the scorer and the judge can read the entry. The copy is
// deterministic: the same input files always produce the same output bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps for this bounty (see kit/RULES.txt, "The gate"): refuse to
// hand in an entry the scorer would refuse, instead of shipping it silently.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

/** Counts plain files under a directory, following no symlinks. */
function countPlainFiles(dir) {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      const sub = countPlainFiles(path);
      files += sub.files;
      bytes += sub.bytes;
    } else if (stats.isFile()) {
      files += 1;
      bytes += stats.size;
    }
  }
  return { files, bytes };
}

/** Fails the run with a plain message when the app would break the gate. */
function preflightApp() {
  const appDir = join(here, 'app');
  const index = join(appDir, 'index.html');
  if (!existsSync(index) || !statSync(index).isFile()) {
    throw new Error('app/index.html is missing: the app cannot be handed in.');
  }
  if (statSync(index).size > 1024 * 1024) {
    throw new Error('app/index.html is over the 1 MiB gate limit.');
  }
  const { files, bytes } = countPlainFiles(appDir);
  if (files > DOSSIER_LIMITS.app_max_files) {
    throw new Error(`app/ holds ${files} files, over the 993 gate limit.`);
  }
  if (bytes > DOSSIER_LIMITS.app_max_bytes) {
    throw new Error(`app/ is ${bytes} bytes, over the 48 MiB gate limit.`);
  }
}

function copyEntry() {
  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  if (existsSync(join(here, 'screenshots'))) {
    cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  }
}

preflightApp();
copyEntry();
writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_LIMITS));
const appSummary = countPlainFiles(join(out, 'app'));
const shotSummary = countPlainFiles(join(out, 'screenshots'));
console.log(
  `Vice City Cover Studio handed in to ${out} — app/: ${appSummary.files} files, ` +
  `${shotSummary.files} screenshots, dossier.json written.`,
);
