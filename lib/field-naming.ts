export type Lang = 'ts' | 'py' | 'rust' | 'go' | 'kotlin' | 'dart' | 'swift';
export const LANGS: Lang[] = ['ts', 'py', 'rust', 'go', 'kotlin', 'dart', 'swift'];

export function toSnakeRust(name: string): string {
  return name.replace(/([A-Z])/g, (m, c, i) => (i ? '_' : '') + c.toLowerCase());
}

export function toScreamingRust(name: string): string {
  return toSnakeRust(name).toUpperCase();
}

export function toRustCodecName(name: string): string {
  return toScreamingRust(name) + '_CODEC';
}

export function toRustDumpFn(name: string): string {
  return 'dump_' + toSnakeRust(name);
}

export function toGoField(fieldName: string): string {
  return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
}

export function toGoTypeName(name: string): string {
  return name;
}

export function toKotlinField(fieldName: string): string {
  return fieldName;
}

export function toDartField(fieldName: string): string {
  return fieldName;
}

export function toSwiftField(fieldName: string): string {
  return fieldName;
}

export function getFieldName(lang: Lang, fieldName: string): string {
  switch (lang) {
    case 'go': return toGoField(fieldName);
    default: return fieldName;
  }
}

export function getDumpFnName(lang: Lang, modelName: string): string {
  switch (lang) {
    case 'rust': return toRustDumpFn(modelName);
    default: return `dump${modelName}`;
  }
}

export function getCodecName(lang: Lang, modelName: string): string {
  switch (lang) {
    case 'rust': return toRustCodecName(modelName);
    case 'go': return `${modelName}Codec`;
    case 'kotlin': return `${modelName}Codec`;
    case 'dart': return `${modelName}Codec`;
    case 'swift': return `${modelName}Codec`;
    case 'ts': return `${modelName}Codec`;
    case 'py': return `${modelName}Codec`;
    default: return `${modelName}Codec`;
  }
}