export { generateTsDump } from './ts.ts';
export { generatePyDump } from './py.ts';
export { generateRustDump } from './rust.ts';
export { generateGoDump } from './go.ts';
export { generateKotlinDump } from './kotlin.ts';
export { generateDartDump } from './dart.ts';
export { generateSwiftDump } from './swift.ts';

import { generateTsDump } from './ts.ts';
import { generatePyDump } from './py.ts';
import { generateRustDump } from './rust.ts';
import { generateGoDump } from './go.ts';
import { generateKotlinDump } from './kotlin.ts';
import { generateDartDump } from './dart.ts';
import { generateSwiftDump } from './swift.ts';
import { Lang } from '../field-naming.ts';

export function generateDump(lang: Lang): string {
  switch (lang) {
    case 'ts': return generateTsDump();
    case 'py': return generatePyDump();
    case 'rust': return generateRustDump();
    case 'go': return generateGoDump();
    case 'kotlin': return generateKotlinDump();
    case 'dart': return generateDartDump();
    case 'swift': return generateSwiftDump();
    default: throw new Error(`No dump generator for ${lang}`);
  }
}