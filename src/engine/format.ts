import { getCountry } from './data/countries';

const cache = new Map<string, Intl.NumberFormat>();
function nf(locale: string, currency: string, compact: boolean) {
  const key = `${locale}|${currency}|${compact}`;
  let f = cache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard' });
    } catch {
      f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard' });
    }
    cache.set(key, f);
  }
  return f;
}

/** Format an internal USD amount in the currency of the given country. */
export function fmtMoney(usd: number, countryId: string, compact = false): string {
  const c = getCountry(countryId);
  const v = Math.round(usd * c.fx);
  if (!isFinite(v)) return '—';
  const useCompact = compact || Math.abs(v) >= 100_000_000;
  const s = nf(c.locale, c.currency, useCompact).format(v);
  return s;
}

export const fmtPct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
export const fmtNum = (v: number) => Math.round(v).toLocaleString('en-US');
export const toUSD = (local: number, countryId: string) => local / getCountry(countryId).fx;
export const toLocal = (usd: number, countryId: string) => usd * getCountry(countryId).fx;
export const currencySymbol = (countryId: string) => {
  const c = getCountry(countryId);
  try { return new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? c.currency; } catch { return c.currency; }
};
