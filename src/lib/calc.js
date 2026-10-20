/**
 * All the maths, from the raw sheet tabs (transactions, prices, fx, cash).
 *
 *   putIn(D)   = EUR spent + fees for all buys on or before D (sells subtract)
 *   worth(D)   = Σ over tickers  shares(D) × close(D) × usdEur(D)      (last known price/rate on or before D)
 *   diff(D)    = worth(D) − putIn(D)
 *   cash(D)    = deposits on or before D − putIn(D)                    (money sent to the broker, not yet invested)
 */

/** Forward-fill lookup: value on the last date ≤ wanted. */
function makeLookup(rows, keyFn, valFn) {
  const sorted = rows.slice().sort((a, b) => keyFn(a).localeCompare(keyFn(b)));
  return (date) => {
    let lo = 0, hi = sorted.length - 1, best = null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (keyFn(sorted[mid]) <= date) { best = sorted[mid]; lo = mid + 1; } else hi = mid - 1;
    }
    return best ? valFn(best) : null;
  };
}

/**
 * One row per trading day from the first transaction on:
 * { date, putIn, worth, diff, cash, change, byTicker: { T: { shares, worth, putIn, price } } }
 */
export function buildSummary(data, tickerFilter = null) {
  const tx = (data.transactions || []).filter((t) => !tickerFilter || t.ticker === tickerFilter).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (!tx.length) return [];
  const tickers = [...new Set(tx.map((t) => t.ticker))];
  const fxAt = makeLookup(data.fx || [], (f) => f.date, (f) => f.usdEur);
  const priceAt = {};
  for (const T of tickers) priceAt[T] = makeLookup((data.prices || []).filter((p) => p.ticker === T), (p) => p.date, (p) => p.close);

  const deposits = (data.cash || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  // The story starts when money first went to the broker (first deposit), else the day before the first purchase,
  // so the chart begins at zero rather than at the first purchase.
  const dayBefore = (iso) => new Date(Date.parse(iso) - 86400000).toISOString().slice(0, 10);
  const firstDate = deposits.length && deposits[0].date < tx[0].date ? deposits[0].date : dayBefore(tx[0].date);
  const priceDates = [...new Set((data.prices || []).filter((p) => tickers.includes(p.ticker) && p.date >= firstDate).map((p) => p.date))];
  if (!priceDates.includes(firstDate)) priceDates.push(firstDate);
  // A purchase or deposit newer than the last price (e.g. made today, before tonight's price fetch)
  // still gets a row, valued at the last known price, so the cards move as soon as it is entered.
  const lastEvent = [...tx.map((t) => t.date), ...deposits.map((d) => d.date)].sort().at(-1);
  if (lastEvent && !priceDates.includes(lastEvent) && lastEvent > priceDates.sort().at(-1)) priceDates.push(lastEvent);
  const dates = priceDates.sort();

  const rows = [];
  let ti = 0, di = 0, putIn = 0, dep = 0, prevWorth = null, prevPutIn = 0;
  const shares = Object.fromEntries(tickers.map((T) => [T, 0]));
  for (const date of dates) {
    while (ti < tx.length && tx[ti].date <= date) { shares[tx[ti].ticker] += tx[ti].shares; putIn += tx[ti].eur + (tx[ti].fee || 0); ti++; }
    while (di < deposits.length && deposits[di].date <= date) { dep += deposits[di].amount; di++; }
    const fx = fxAt(date);
    // A day where something we hold cannot be valued (no price or no rate yet) is skipped, never shown as €0.
    const unpriced = tickers.some((T) => shares[T] && (priceAt[T](date) === null || !fx));
    if (unpriced) continue;
    let worth = 0;
    const byTicker = {};
    for (const T of tickers) {
      const p = priceAt[T](date);
      if (p === null || !fx) continue;
      const w = shares[T] * p * fx;
      worth += w;
      byTicker[T] = { shares: shares[T], price: p, priceEur: p * fx, worth: w };
    }
    const change = prevWorth === null || prevWorth === 0 ? 0 : worth - prevWorth - (putIn - prevPutIn);
    rows.push({ date, fx: fx ?? 0, putIn, worth, diff: worth - putIn, cash: dep - putIn, change, byTicker });
    prevWorth = worth; prevPutIn = putIn;
  }
  return rows;
}

/** Latest row = today's numbers, plus the date of the first purchase. */
export function headline(summary, transactions = []) {
  const last = summary[summary.length - 1];
  if (!last) return null;
  const first = transactions.map((t) => t.date).sort()[0] || null;
  return { ...last, pctGain: last.putIn > 0 ? last.diff / last.putIn : 0, since: first };
}

/** Per-ticker view for the holdings table. */
export function holdings(data, summary) {
  const last = summary[summary.length - 1];
  if (!last) return [];
  const names = Object.fromEntries((data.tickers || []).map((t) => [t.ticker, t]));
  return Object.entries(last.byTicker)
    .filter(([, h]) => Math.abs(h.shares) > 1e-9)
    .map(([T, h]) => {
      const tx = data.transactions.filter((t) => t.ticker === T);
      const putIn = tx.reduce((s, t) => s + t.eur + (t.fee || 0), 0);
      const gifted = tx.filter((t) => t.shares > 0 && t.eur === 0).reduce((s, t) => s + t.shares, 0);
      const paidTx = tx.filter((t) => t.shares > 0 && t.eur !== 0);
      const bought = paidTx.reduce((s, t) => s + t.shares, 0);
      const paidForBought = paidTx.reduce((s, t) => s + t.eur + (t.fee || 0), 0);
      return {
        ticker: T,
        name: names[T]?.name || '',
        currency: names[T]?.currency || 'USD',
        shares: h.shares,
        gifted,
        bought,
        avgPaidEur: bought > 0 ? paidForBought / bought : 0,
        priceEur: h.priceEur,
        price: h.price,
        putIn,
        worth: h.worth,
        diff: h.worth - putIn,
        gift: putIn === 0,
      };
    })
    .sort((a, b) => b.worth - a.worth);
}

export function monthEnds(summary) {
  const m = new Map();
  for (const r of summary) m.set(r.date.slice(0, 7), r);
  return [...m.values()];
}
export function yearEnds(summary) {
  const m = new Map();
  for (const r of summary) m.set(r.date.slice(0, 4), r);
  return [...m.values()];
}
export function pickBuckets(summary) {
  const months = monthEnds(summary);
  return months.length <= 18 ? { rows: months, unit: 'month' } : { rows: yearEnds(summary), unit: 'year' };
}
export function withPeriodChange(rows) {
  return rows.map((r, i) => (i === 0 ? { ...r, periodChange: null } : { ...r, periodChange: r.worth - rows[i - 1].worth - (r.putIn - rows[i - 1].putIn) }));
}

export function statistics(allRows, transactions) {
  const summary = allRows.filter((r) => r.putIn > 0 || r.worth > 0); // only days with something invested
  if (summary.length < 2) return null;
  let behind = 0, peak = -Infinity, maxDd = 0, ddFrom = null, ddTo = null, peakDate = null, ddHigh = 0, ddLow = 0;
  let trough = Infinity, troughDate = null, maxRun = 0, runFrom = null, runTo = null, runLow = 0, runHigh = 0;
  let best = { change: -Infinity }, worst = { change: Infinity };
  for (const r of summary) {
    if (r.diff < 0) behind++;
    if (r.diff > peak) { peak = r.diff; peakDate = r.date; }
    const dd = peak - r.diff;
    if (dd > maxDd) { maxDd = dd; ddFrom = peakDate; ddTo = r.date; ddHigh = peak; ddLow = r.diff; }
    if (r.diff < trough) { trough = r.diff; troughDate = r.date; }
    const run = r.diff - trough;
    if (run > maxRun) { maxRun = run; runFrom = troughDate; runTo = r.date; runLow = trough; runHigh = r.diff; }
    if (r.change > best.change) best = r;
    if (r.change < worst.change) worst = r;
  }
  return { behind, total: summary.length, maxDd, ddFrom, ddTo, ddHigh, ddLow, maxRun, runFrom, runTo, runLow, runHigh, best, worst, annual: annualisedReturn(summary, transactions) };
}

/** Money-weighted yearly return (IRR) from dated cash flows. Null when the history is under 3 months. */
export function annualisedReturn(summary, transactions) {
  const last = summary[summary.length - 1];
  const paid = transactions.filter((t) => t.eur + (t.fee || 0) !== 0);
  if (!last || !paid.length) return null;
  const t0 = Date.parse(paid[0].date);
  const years = (Date.parse(last.date) - t0) / (365.25 * 86400000);
  if (years < 0.25) return null;
  const flows = paid.map((t) => ({ t: (Date.parse(t.date) - t0) / (365.25 * 86400000), v: -(t.eur + (t.fee || 0)) }));
  flows.push({ t: years, v: last.worth });
  const npv = (r) => flows.reduce((s, f) => s + f.v / Math.pow(1 + r, f.t), 0);
  let lo = -0.9, hi = 5;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (npv(mid) > 0) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
