/**
 * Gentle repair of model output before strict validation.
 *
 * Structured outputs guarantee the shape of the JSON but the SDK passes enum lists to the API
 * as guidance, so an occasional label can arrive as "Strong" instead of "strong", or as a value
 * outside the fixed taxonomy. Rather than discard a whole analysis for one bad label, this walks
 * the zod schema and:
 *  - normalises case and spacing of enum values ("Not established" -> "not_established");
 *  - drops unknown values from enum arrays (for example a concept id that does not exist);
 *  - drops a list item whose required label is unknown, and records that it did;
 *  - fills missing strings and arrays with empty values.
 * Every change that removes information is reported, so the person can see it.
 */
import type * as z from 'zod/v4';

const DROP = Symbol('drop');
const SOFT_DEFAULTS = ['unclear', 'not_established', 'unknown', 'insufficient_evidence', 'no_clear_response'];

interface Def {
  type: string;
  shape?: Record<string, z.ZodType>;
  element?: z.ZodType;
  entries?: Record<string, string>;
  values?: unknown[];
  innerType?: z.ZodType;
}
const defOf = (s: z.ZodType) => (s as unknown as { _zod: { def: Def } })._zod.def;

const norm = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-/]+/g, '_');

function walk(v: unknown, s: z.ZodType, path: string, notes: string[], inArray: boolean): unknown {
  const def = defOf(s);
  switch (def.type) {
    case 'object': {
      const src = v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
      const out: Record<string, unknown> = {};
      for (const [k, sub] of Object.entries(def.shape ?? {})) {
        const r = walk(src[k], sub, path ? `${path}.${k}` : k, notes, false);
        // An object missing a required label cannot be shown faithfully: drop it.
        if (r === DROP) return DROP;
        out[k] = r;
      }
      return out;
    }
    case 'array': {
      if (!Array.isArray(v)) return [];
      const out: unknown[] = [];
      v.forEach((x, i) => {
        const r = walk(x, def.element!, `${path}[${i}]`, notes, true);
        if (r === DROP) notes.push(`Removed ${path}[${i}]: it used a label outside Subtext’s fixed list.`);
        else out.push(r);
      });
      return out;
    }
    case 'enum': {
      const values = Object.values(def.entries ?? {});
      if (typeof v === 'string' && values.includes(v)) return v;
      const n = norm(v);
      if (values.includes(n)) return n;
      if (inArray) return DROP;
      const soft = SOFT_DEFAULTS.find((d) => values.includes(d));
      if (soft) {
        notes.push(`Replaced an unrecognised label at ${path} with “${soft}”.`);
        return soft;
      }
      return DROP;
    }
    case 'literal':
      return def.values?.[0];
    case 'string':
      return typeof v === 'string' ? v : v == null ? '' : String(v);
    case 'boolean':
      return typeof v === 'boolean' ? v : v === 'true';
    case 'number':
      return typeof v === 'number' ? v : Number(v) || 0;
    case 'nullable':
      return v == null ? null : walk(v, def.innerType!, path, notes, inArray);
    case 'optional':
    case 'default':
      return v === undefined ? undefined : walk(v, def.innerType!, path, notes, inArray);
    default:
      return v;
  }
}

export function coerceToSchema<T>(value: unknown, schema: z.ZodType<T>): { value: unknown; notes: string[] } {
  const notes: string[] = [];
  const r = walk(value, schema, '', notes, false);
  return { value: r === DROP ? value : r, notes };
}
