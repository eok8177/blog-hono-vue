/* global process, console */
import { readFileSync } from 'node:fs';

const production = process.argv.includes('--production');

function parseJsonc(source) {
  let output = '';
  let inString = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === '\n') {
        lineComment = false;
        output += char;
      }
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (!inString && char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (!inString && char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' && !escaped) inString = !inString;
    output += char;
    escaped = char === '\\' && !escaped;
    if (char !== '\\') escaped = false;
  }

  return JSON.parse(output.replace(/,\s*([}\]])/g, '$1'));
}

const wrangler = parseJsonc(
  readFileSync(new globalThis.URL('../wrangler.jsonc', import.meta.url), 'utf8'),
);
const productionVars = wrangler.env?.production?.vars ?? {};
const value = (key) => process.env[key] ?? productionVars[key] ?? '';
const environment = process.env.ENVIRONMENT ?? (production ? 'production' : 'development');
const bypass = value('DEV_AUTH_BYPASS') === 'true';
const siteUrl = value('SITE_URL');

if (environment === 'production' && bypass)
  throw new Error('DEV_AUTH_BYPASS must never be enabled for production verification/deploy.');
if (production) {
  if (!siteUrl || !siteUrl.startsWith('https://') || siteUrl.includes('.invalid'))
    throw new Error('Production validation requires SITE_URL=https://...');
  if (!value('ACCESS_TEAM_DOMAIN') || !value('ACCESS_AUD'))
    throw new Error('Production validation requires ACCESS_TEAM_DOMAIN and ACCESS_AUD.');
}
console.log(`Configuration validation passed for ${environment}.`);
