/* global process, console */
const production = process.argv.includes('--production');
const environment = process.env.ENVIRONMENT ?? (production ? 'production' : 'development');
const bypass = process.env.DEV_AUTH_BYPASS === 'true';
const siteUrl = process.env.SITE_URL ?? '';

if (environment === 'production' && bypass)
  throw new Error('DEV_AUTH_BYPASS must never be enabled for production verification/deploy.');
if (production) {
  if (!siteUrl || !siteUrl.startsWith('https://'))
    throw new Error('Production validation requires SITE_URL=https://...');
  if (!process.env.ACCESS_TEAM_DOMAIN || !process.env.ACCESS_AUD)
    throw new Error('Production validation requires ACCESS_TEAM_DOMAIN and ACCESS_AUD.');
}
console.log(`Configuration validation passed for ${environment}.`);
