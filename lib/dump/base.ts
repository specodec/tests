import { FieldDef, ModelDef, models } from '../gen.ts';
import { Lang, getFieldName, getDumpFnName } from '../field-naming.ts';

export interface DumpGenerator {
  header(): string;
  helperFunctions(): string;
  dumpFunction(modelName: string, model: ModelDef): string;
  footer(): string;
  generate(): string;
}

export abstract class BaseDumpGenerator implements DumpGenerator {
  protected lang: Lang;
  
  constructor(lang: Lang) {
    this.lang = lang;
  }
  
  abstract header(): string;
  abstract helperFunctions(): string;
  abstract footer(): string;
  
  generate(): string {
    const parts: string[] = [this.header(), this.helperFunctions()];
    for (const [name, model] of Object.entries(models)) {
      parts.push(this.dumpFunction(name, model));
    }
    parts.push(this.footer());
    return parts.join('\n');
  }
  
  dumpFunction(modelName: string, model: ModelDef): string {
    const fn = getDumpFnName(this.lang, modelName);
    const lines: string[] = [];
    
    for (const field of model.fields) {
      const line = this.fieldLine(modelName, field);
      lines.push(line);
    }
    
    return this.functionBody(fn, modelName, lines);
  }
  
  abstract fieldLine(modelName: string, field: FieldDef): string;
  abstract functionBody(fnName: string, modelName: string, lines: string[]): string;
  
  protected fieldName(name: string): string {
    return getFieldName(this.lang, name);
  }
  
  protected valueExpr(field: FieldDef, deref: boolean = false): string {
    const fn = this.fieldName(field.name);
    const prefix = deref ? '*' : '';
    
    if (field.isArray) {
      return this.arrayExpr(field, prefix + fn);
    }
    
    if (field.isModel) {
      return `${getDumpFnName(this.lang, field.type)}(${prefix}${fn})`;
    }
    
    return this.scalarExpr(field, prefix + fn);
  }
  
  abstract scalarExpr(field: FieldDef, expr: string): string;
  abstract arrayExpr(field: FieldDef, expr: string): string;
}