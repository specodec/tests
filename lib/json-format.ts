import { Buffer } from 'node:buffer';

export function specodecJson(data: unknown): string {
  function v(val: unknown): string {
    if (typeof val === 'bigint') return '"' + val.toString() + '"';
    if (Buffer.isBuffer(val)) return '"' + val.toString('base64') + '"';
    if (val === null || val === undefined) return 'null';
    if (Array.isArray(val)) return '[' + val.map(v).join(',') + ']';
    if (typeof val === 'object') return encodeObj(val as Record<string, unknown>);
    if (typeof val === 'number' && Object.is(val, -0)) return '-0';
    return JSON.stringify(val);
  }
  
  function encodeObj(o: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const [k, val] of Object.entries(o)) {
      parts.push('"' + k + '":' + v(val));
    }
    return '{' + parts.join(',') + '}';
  }
  
  return encodeObj(data as Record<string, unknown>);
}

export function specodecPrettyJson(data: unknown): string {
  const sp = (n: number): string => n > 0 ? ' '.repeat(n) : '';
  
  function v(val: unknown, ind: number): string {
    if (typeof val === 'bigint') return '"' + val.toString() + '"';
    if (Buffer.isBuffer(val)) return '"' + val.toString('base64') + '"';
    if (val === null || val === undefined) return 'null';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      const items = val.map(item => sp(ind + 2) + v(item, ind + 2));
      return '[\n' + items.join(',\n') + '\n' + sp(ind) + ']';
    }
    if (typeof val === 'object') return encodeObj(val as Record<string, unknown>, ind + 2);
    if (typeof val === 'number' && Object.is(val, -0)) return '-0';
    return JSON.stringify(val);
  }
  
  function encodeObj(o: Record<string, unknown>, ind: number): string {
    const parts: string[] = [];
    for (const [k, val] of Object.entries(o)) {
      parts.push(sp(ind) + '"' + k + '": ' + v(val, ind));
    }
    if (parts.length === 0) return '{}';
    return '{\n' + parts.join(',\n') + '\n' + sp(ind > 2 ? ind - 2 : 0) + '}';
  }
  
  return encodeObj(data as Record<string, unknown>, 0);
}

export function specodecGron(data: unknown): string {
  const lines: string[] = [];
  
  function v(val: unknown, path: string): void {
    if (val === null || val === undefined) {
      lines.push(path + ' = null;');
      return;
    }
    if (typeof val === 'bigint') {
      lines.push(path + ' = "' + val.toString() + '";');
      return;
    }
    if (Buffer.isBuffer(val)) {
      lines.push(path + ' = "' + val.toString('base64') + '";');
      return;
    }
    if (typeof val === 'boolean') {
      lines.push(path + ' = ' + val + ';');
      return;
    }
    if (typeof val === 'number') {
      if (Object.is(val, -0)) {
        lines.push(path + ' = -0;');
        return;
      }
      lines.push(path + ' = ' + val + ';');
      return;
    }
    if (typeof val === 'string') {
      lines.push(path + ' = ' + JSON.stringify(val) + ';');
      return;
    }
    if (Array.isArray(val)) {
      lines.push(path + ' = [];');
      for (let i = 0; i < val.length; i++) v(val[i], path + '[' + i + ']');
      return;
    }
    if (typeof val === 'object') {
      lines.push(path + ' = {};');
      for (const [k, cv] of Object.entries(val as Record<string, unknown>)) v(cv, path + '.' + k);
      return;
    }
  }
  
  v(data, 'json');
  return lines.join('\n') + '\n';
}