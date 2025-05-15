import fs from 'fs';
import path from 'path';

// Get current directory with __dirname (CommonJS style)
// Note: In CommonJS, __dirname and __filename are globally available
const __dirname_current = __dirname;
const projectRoot = path.dirname(__dirname_current);

function resolve(pth: string): string {
  // If path starts with '..', it's relative to the project root
  // Otherwise, it's relative to the src directory
  if (pth.startsWith('../')) {
    return path.resolve(projectRoot, pth.substring(3));
  }
  return path.resolve(path.join(__dirname_current), pth);
}

type PackageJson = {
  name: string;
};

function packageJsonParse(): PackageJson {
  // todo use ctx.extension.packageJSON instead?
  const obj = JSON.parse(
    fs.readFileSync(
      resolve('../package.json'),
      'utf8')
    ) as PackageJson;
  return obj;
}

const pkg = packageJsonParse();

export const EXTENSION_NAME = pkg.name;
