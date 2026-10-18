/**
 * Talks to the Apps Script web app that lives inside the Google Sheet (sheet/Code.gs).
 *
 *  GET  <url>?secret=…                               → { ok, tickers[], transactions[], prices[], fx[], cash[] }
 *  POST <url>  body: { secret, sheet, action, … }    → { ok, row? }
 *
 * POST is sent as text/plain so the browser does not send a CORS preflight (Apps Script cannot answer one).
 */

const SETTINGS_KEY = 'pt.settings';
const CACHE_KEY = 'pt.cache';
const LAST_SEEN_KEY = 'pt.lastSeen';

export function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { url: '', secret: '' }; } catch { return { url: '', secret: '' }; }
}
export function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
export function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
}
function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, fetchedAt: new Date().toISOString() })); } catch { /* ignore */ }
}
export function loadLastSeen() {
  try { return JSON.parse(localStorage.getItem(LAST_SEEN_KEY)); } catch { return null; }
}
export function saveLastSeen(entry) {
  try { localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(entry)); } catch { /* ignore */ }
}

export async function fetchAll(settings) {
  if (!settings.url || !settings.secret) throw new Error('Settings missing: web app URL and secret word.');
  const url = settings.url + (settings.url.includes('?') ? '&' : '?') + 'secret=' + encodeURIComponent(settings.secret);
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  if (!res.ok) throw new Error('Sheet returned HTTP ' + res.status);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Sheet returned an error');
  if (!data.prices) throw new Error('The sheet script is an old version. Paste the new Code.gs, run setup(), and deploy a new version.');
  saveCache(data);
  return data;
}

async function post(settings, body) {
  if (!settings.url || !settings.secret) throw new Error('Settings missing: web app URL and secret word.');
  const res = await fetch(settings.url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, secret: settings.secret }),
  });
  if (!res.ok) throw new Error('Sheet returned HTTP ' + res.status);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Sheet returned an error');
  return data;
}

export const addTransaction = (s, t) => post(s, { sheet: 'transactions', action: 'add', ...t });
export const editTransaction = (s, row, t) => post(s, { sheet: 'transactions', action: 'edit', row, ...t });
export const deleteTransaction = (s, row) => post(s, { sheet: 'transactions', action: 'delete', row });

export const addCash = (s, c) => post(s, { sheet: 'cash', action: 'add', ...c });
export const editCash = (s, row, c) => post(s, { sheet: 'cash', action: 'edit', row, ...c });
export const deleteCash = (s, row) => post(s, { sheet: 'cash', action: 'delete', row });
