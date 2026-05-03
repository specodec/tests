export { generateTsRunner } from './ts.ts';
export { generatePyRunner } from './py.ts';
export { generateRustRunner } from './rust.ts';
export { generateGoRunner } from './go.ts';
export { generateKotlinRunner } from './kotlin.ts';
export { generateDartRunner } from './dart.ts';
export { generateSwiftRunner } from './swift.ts';

import { generateTsRunner } from './ts.ts';
import { generatePyRunner } from './py.ts';
import { generateRustRunner } from './rust.ts';
import { generateGoRunner } from './go.ts';
import { generateKotlinRunner } from './kotlin.ts';
import { generateDartRunner } from './dart.ts';
import { generateSwiftRunner } from './swift.ts';
import { Lang } from '../field-naming.ts';

export function generateRunner(lang: Lang): string {
  switch (lang) {
    case 'ts': return generateTsRunner();
    case 'py': return generatePyRunner();
    case 'rust': return generateRustRunner();
    case 'go': return generateGoRunner();
    case 'kotlin': return generateKotlinRunner();
    case 'dart': return generateDartRunner();
    case 'swift': return generateSwiftRunner();
    default: throw new Error(`No runner generator for ${lang}`);
  }
}