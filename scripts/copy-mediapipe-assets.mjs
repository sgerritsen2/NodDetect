import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const assetExtensions = new Set(['.wasm', '.binarypb', '.data', '.js']);

copyPackageAssets('face_mesh');
copyPackageAssets('drawing_utils');

function copyPackageAssets(packageName) {
  const sourceDir = join(process.cwd(), 'node_modules', '@mediapipe', packageName);
  const targetDir = join(process.cwd(), 'public', 'vendor', 'mediapipe', packageName);

  if (!existsSync(sourceDir)) {
    console.warn(`MediaPipe ${packageName} package is not installed yet. Run npm install first.`);
    return;
  }

  mkdirSync(targetDir, { recursive: true });

  for (const file of readdirSync(sourceDir)) {
    const shouldCopy = [...assetExtensions].some((extension) => file.endsWith(extension));
    if (shouldCopy) {
      copyFileSync(join(sourceDir, file), join(targetDir, file));
    }
  }

  console.log(`Copied MediaPipe ${packageName} assets to ${targetDir}`);
}
