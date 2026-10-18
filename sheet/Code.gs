/**
 * Portfolio tracker – Apps Script backend (v4: several tickers + cash).
 * Lives inside the Google Sheet (Extensions → Apps Script).
 *
 *  setup()       – run ONCE by hand: adds the Cash tab and the tickers table in Settings if missing.
 *  fetchDaily()  – run by a daily time trigger: adds missing closing prices (Yahoo Finance) for every
 *                  ticker in Settings, and USD→EUR rates (ECB). Backfills (1 year for a new ticker).
 *  doPost(e)     – web app endpoint: add / edit / delete a transaction or a cash movement.
 *  doGet(e)      – returns the raw tabs as JSON; the web page does all the maths.
 *
 * Sheet tabs: Settings, Transactions, Prices, FX, Cash. (Summary is no longer used.)
 */

const SHEET = SpreadsheetApp.getActiveSpreadsheet();

/* ----------------------------------------------------------------- helpers */

function ymd(d) {
  return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
}

/** Turn whatever is in a date cell (Date, ISO string, text, serial number) into "yyyy-MM-dd", or null. */
function toYmd(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v > 20000 ? ymd(new Date(Math.round((v - 25569) * 86400000))) : null;
  const str = (v instanceof Date) ? v.toISOString() : String(v);
  const m = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : ymd(d);
}

function num(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

function settings() {
  const ws = SHEET.getSheetByName('Settings');
  const kv = ws.getRange('A1:B5').getValues();
  const out = {};
  kv.forEach(r => { if (r[0]) out[String(r[0]).trim()] = String(r[1]).trim(); });
  // Tickers table: header in row 7 (Ticker | Yahoo symbol | Currency | Name), rows below.
  const last = ws.getLastRow();
  const tickers = [];
  if (last >= 8) {
    ws.getRange(8, 1, last - 7, 4).getValues().forEach(r => {
      if (r[0]) tickers.push({ ticker: String(r[0]).trim().toUpperCase(), yahoo: String(r[1] || r[0]).trim(), currency: String(r[2] || 'USD').trim().toUpperCase(), name: String(r[3] || '').trim() });
    });
  }
  if (!tickers.length) tickers.push({ ticker: out['Ticker'] || 'VUAA', yahoo: out['Yahoo symbol'] || 'VUAA.L', currency: 'USD', name: '' });
  return { secret: out['Secret word'] || '', tickers };
}

/* ------------------------------------------------------------------- setup */

/** Run once by hand after pasting this version. Safe to run again. */
function setup() {
  const ws = SHEET.getSheetByName('Settings');
  if (!String(ws.getRange('A7').getValue()).trim()) {
    ws.getRange('A7:D10').setValues([
      ['Ticker', 'Yahoo symbol', 'Currency', 'Name'],
      ['VUAA', 'VUAA.L', 'USD', 'Vanguard S&P 500 ETF'],
      ['IBKR', 'IBKR', 'USD', 'Interactive Brokers'],
      ['', '', '', ''],
    ]);
    ws.getRange('A7:D7').setFontWeight('bold');
    ws.getRange('F7').setValue('One row per thing you own. The script fetches prices for every row. Add a row to track a new stock.');
  }
  if (!SHEET.getSheetByName('Cash')) {
    const c = SHEET.insertSheet('Cash');
    c.getRange('A1:C1').setValues([['Date', 'Amount (EUR)', 'Note']]).setFontWeight('bold');
    c.getRange('A2:C3').setValues([
      [new Date('2026-09-01T00:00:00Z'), 200, 'opening balance – adjust the date'],
      [new Date('2026-10-15T00:00:00Z'), 14000, 'Electronic Fund Transfer'],
    ]);
    c.getRange('A2:A200').setNumberFormat('yyyy-mm-dd');
    c.getRange('E1').setValue('Money you sent to the broker (positive) or took out (negative). The page works out how much is still waiting as cash.');
    c.setFrozenRows(1);
  }
}

/* ------------------------------------------------------------------ prices */

function fetchDaily() {
  const cfg = settings();
  const sheet = SHEET.getSheetByName('Prices');
  removeDuplicates(sheet, 2);
  removeDuplicates(SHEET.getSheetByName('FX'), 1);
  const have = existingKeys(sheet);
  cfg.tickers.forEach(t => addMissingPrices(sheet, have, t));
  addMissingFx();
}

/** Keep one row per key (date, or date+ticker when keyCols = 2). Rewrites the tab only if duplicates exist. */
function removeDuplicates(sheet, keyCols) {
  const last = sheet.getLastRow();
  if (!sheet || last < 3) return;
  const nCols = sheet.getLastColumn();
  const rows = sheet.getRange(2, 1, last - 1, nCols).getValues();
  const seen = new Set();
  const keep = [];
  rows.forEach(r => {
    const d = toYmd(r[0]);
    if (!d) return;
    const key = keyCols === 2 ? d + '|' + String(r[1]).trim().toUpperCase() : d;
    if (seen.has(key)) return;
    seen.add(key);
    keep.push(r);
  });
  if (keep.length === rows.length) return;
  sheet.getRange(2, 1, rows.length, nCols).clearContent();
  sheet.getRange(2, 1, keep.length, nCols).setValues(keep);
}

/** Set of "yyyy-mm-dd|TICKER" already in Prices. */
function existingKeys(sheet) {
  const last = sheet.getLastRow();
  const set = new Set();
  if (last < 2) return set;
  sheet.getRange(2, 1, last - 1, 2).getValues().forEach(r => {
    const k = toYmd(r[0]);
    if (k) set.add(k + '|' + String(r[1]).trim().toUpperCase());
  });
  return set;
}

function addMissingPrices(sheet, have, t) {
  const hasAny = [...have].some(k => k.endsWith('|' + t.ticker));
  const range = hasAny ? '1mo' : '1y';
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(t.yahoo) + '?range=' + range + '&interval=1d';
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (res.getResponseCode() !== 200) throw new Error('Yahoo returned ' + res.getResponseCode() + ' for ' + t.yahoo);
  const data = JSON.parse(res.getContentText()).chart.result[0];
  const stamps = data.timestamp || [];
  const closes = data.indicators.quote[0].close || [];
  const rows = [];
  for (let i = 0; i < stamps.length; i++) {
    if (closes[i] == null) continue;
    const key = ymd(new Date(stamps[i] * 1000));
    if (have.has(key + '|' + t.ticker)) continue;
    rows.push([new Date(key + 'T00:00:00Z'), t.ticker, Math.round(closes[i] * 100) / 100]);
    have.add(key + '|' + t.ticker);
  }
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 3).setValues(rows);
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).sort([{ column: 1, ascending: true }, { column: 2, ascending: true }]);
  }
}

function addMissingFx() {
  const sheet = SHEET.getSheetByName('FX');
  const last = sheet.getLastRow();
  const have = new Set();
  if (last >= 2) sheet.getRange(2, 1, last - 1, 1).getValues().forEach(r => { const k = toYmd(r[0]); if (k) have.add(k); });
  const n = have.size ? 30 : 400;
  const url = 'https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?format=csvdata&lastNObservations=' + n;
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('ECB returned ' + res.getResponseCode());
  const lines = res.getContentText().trim().split('\n');
  const header = lines[0].split(',');
  const iDate = header.indexOf('TIME_PERIOD');
  const iVal = header.indexOf('OBS_VALUE');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const key = cols[iDate];
    const eurUsd = parseFloat(cols[iVal]);
    if (!key || !eurUsd || have.has(key)) continue;
    rows.push([new Date(key + 'T00:00:00Z'), Math.round((1 / eurUsd) * 10000) / 10000]);
    have.add(key);
  }
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 2).setValues(rows);
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).sort({ column: 1, ascending: true });
  }
}

/* ----------------------------------------------------------- web app API */

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readRows(name, cols) {
  const ws = SHEET.getSheetByName(name);
  if (!ws || ws.getLastRow() < 2) return [];
  return ws.getRange(2, 1, ws.getLastRow() - 1, cols).getValues();
}

/**
 * POST body (JSON): { secret, sheet: "transactions" | "cash", action: "add" | "edit" | "delete", row?, ...fields }
 *   transactions fields: date, ticker, eur, shares, price, fee, note
 *   cash fields:         date, amount, note
 * "row" is the sheet row number (2 = first data row), as returned by doGet.
 */
function doPost(e) {
  const cfg = settings();
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'bad json' }); }
  if (!cfg.secret || body.secret !== cfg.secret) return json({ ok: false, error: 'wrong secret' });

  const which = body.sheet === 'cash' ? 'Cash' : 'Transactions';
  const sheet = SHEET.getSheetByName(which);
  if (!sheet) return json({ ok: false, error: which + ' tab missing – run setup()' });
  const values = which === 'Cash'
    ? [new Date(body.date + 'T00:00:00Z'), num(body.amount), String(body.note || '')]
    : [new Date(body.date + 'T00:00:00Z'), String(body.ticker || '').toUpperCase(), num(body.eur), num(body.shares), num(body.price), num(body.fee), String(body.note || '')];

  if (body.action === 'add') {
    sheet.appendRow(values);
    return json({ ok: true, row: sheet.getLastRow() });
  }
  const r = Number(body.row);
  if (!(r >= 2 && r <= sheet.getLastRow())) return json({ ok: false, error: 'bad row' });
  if (body.action === 'edit') {
    sheet.getRange(r, 1, 1, values.length).setValues([values]);
    return json({ ok: true, row: r });
  }
  if (body.action === 'delete') {
    sheet.deleteRow(r);
    return json({ ok: true });
  }
  return json({ ok: false, error: 'unknown action' });
}

/** GET ?secret=… → raw data for the page. */
function doGet(e) {
  const cfg = settings();
  const secret = e && e.parameter && e.parameter.secret;
  if (!cfg.secret || secret !== cfg.secret) return json({ ok: false, error: 'wrong secret' });

  const transactions = readRows('Transactions', 7)
    .map((r, i) => ({ row: i + 2, date: toYmd(r[0]), ticker: String(r[1]).trim().toUpperCase(), eur: num(r[2]), shares: num(r[3]), price: num(r[4]), fee: num(r[5]), note: String(r[6] || '') }))
    .filter(t => t.date && t.ticker);

  const prices = readRows('Prices', 3)
    .map(r => ({ date: toYmd(r[0]), ticker: String(r[1]).trim().toUpperCase(), close: num(r[2]) }))
    .filter(p => p.date && p.ticker && p.close > 0);

  const fx = readRows('FX', 2)
    .map(r => ({ date: toYmd(r[0]), usdEur: num(r[1]) }))
    .filter(f => f.date && f.usdEur > 0);

  const cash = readRows('Cash', 3)
    .map((r, i) => ({ row: i + 2, date: toYmd(r[0]), amount: num(r[1]), note: String(r[2] || '') }))
    .filter(c => c.date);

  return json({ ok: true, tickers: cfg.tickers, transactions, prices, fx, cash });
}
