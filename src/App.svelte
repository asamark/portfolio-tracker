<script>
  import { onMount } from 'svelte';
  import {
    loadSettings, saveSettings, loadCache, loadLastSeen, saveLastSeen, fetchAll,
    addTransaction, editTransaction, deleteTransaction, addCash, editCash, deleteCash,
  } from './lib/api.js';
  import { buildSummary, headline, holdings, pickBuckets, withPeriodChange, statistics } from './lib/calc.js';
  import { longDate, eur } from './lib/format.js';
  import Cards from './components/Cards.svelte';
  import Donut from './components/Donut.svelte';
  import Holdings from './components/Holdings.svelte';
  import GrowthChart from './components/GrowthChart.svelte';
  import PeriodTable from './components/PeriodTable.svelte';
  import Transactions from './components/Transactions.svelte';
  import CashList from './components/CashList.svelte';
  import TransactionForm from './components/TransactionForm.svelte';
  import CashForm from './components/CashForm.svelte';
  import Settings from './components/Settings.svelte';
  import Statistics from './components/Statistics.svelte';
  import Collapsible from './components/Collapsible.svelte';

  let settings = $state(loadSettings());
  let data = $state(loadCache());
  let lastSeen = $state(loadLastSeen());
  let loading = $state(false);
  let error = $state('');
  let showSettings = $state(!settings.url || !settings.secret);
  let form = $state(null);          // null | { kind: 'tx' | 'cash', editing: object | null }
  let busy = $state(false);
  let formError = $state('');
  let chartTicker = $state('');     // '' = everything

  const valid = $derived(data && Array.isArray(data.prices));
  const tickers = $derived(valid ? data.tickers : []);
  const transactions = $derived(valid ? data.transactions.slice().sort((a, b) => a.date.localeCompare(b.date)) : []);
  const cash = $derived(valid ? data.cash.slice().sort((a, b) => a.date.localeCompare(b.date)) : []);
  const summary = $derived(valid ? buildSummary(data) : []);
  const chartSummary = $derived(chartTicker ? buildSummary(data, chartTicker) : summary);
  const head = $derived(headline(summary));
  const held = $derived(valid ? holdings(data, summary) : []);
  const buckets = $derived(pickBuckets(chartSummary));
  const periodRows = $derived(withPeriodChange(buckets.rows));
  const stats = $derived(statistics(summary, transactions));
  const lastPriceDate = $derived(valid && data.prices.length ? data.prices.map((p) => p.date).sort().at(-1) : null);

  async function refresh() {
    loading = true; error = '';
    try { data = await fetchAll(settings); } catch (e) { error = e.message; } finally { loading = false; }
  }
  onMount(async () => { if (settings.url && settings.secret) await refresh(); });
  // Re-fetch when the tab comes back to the front after 10+ minutes away (e.g. left open overnight).
  onMount(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !settings.url || loading) return;
      const age = data?.fetchedAt ? Date.now() - Date.parse(data.fetchedAt) : Infinity;
      if (age > 10 * 60 * 1000) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });
  onMount(() => {
    const save = () => { if (head) saveLastSeen({ date: head.date, worth: head.worth, putIn: head.putIn }); };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  });

  function onSaveSettings(s) { settings = s; saveSettings(s); showSettings = false; refresh(); }

  /** Write to the sheet, apply the change locally right away, then re-sync from the sheet in the background. */
  async function run(fn, applyLocally) {
    busy = true; formError = ''; error = '';
    try {
      const res = await fn();
      if (applyLocally) data = applyLocally(data, res);
      form = null;
      refresh(); // not awaited: the page already shows the change
    } catch (e) { if (form) formError = e.message; else error = e.message; }
    finally { busy = false; }
  }
  const replaceRow = (list, row, item) => list.map((x) => (x.row === row ? { ...item, row } : x));
  const saveTx = (t) => form.editing
    ? run(() => editTransaction(settings, form.editing.row, t), (d) => ({ ...d, transactions: replaceRow(d.transactions, form.editing.row, t) }))
    : run(() => addTransaction(settings, t), (d, res) => ({ ...d, transactions: [...d.transactions, { ...t, row: res.row }] }));
  const saveCash = (c) => form.editing
    ? run(() => editCash(settings, form.editing.row, c), (d) => ({ ...d, cash: replaceRow(d.cash, form.editing.row, c) }))
    : run(() => addCash(settings, c), (d, res) => ({ ...d, cash: [...d.cash, { ...c, row: res.row }] }));
  const removeTx = (t) => run(() => deleteTransaction(settings, t.row), (d) => ({ ...d, transactions: d.transactions.filter((x) => x.row !== t.row) }));
  const removeCash = (c) => run(() => deleteCash(settings, c.row), (d) => ({ ...d, cash: d.cash.filter((x) => x.row !== c.row) }));
</script>

<div class="page">
  <div class="header">
    <div>
      <h1>My Simple Portfolio</h1>
      <div class="help">
        {#if lastPriceDate}Prices up to {longDate(lastPriceDate)}{:else}No data yet{/if}
        {#if loading} · updating…{/if}
      </div>
    </div>
    <div class="actions-bar">
      <button onclick={() => (showSettings = true)}>Settings</button>
      <button onclick={() => { formError = ''; form = { kind: 'cash', editing: null }; }} disabled={!settings.url}>Add cash</button>
      <button class="primary" onclick={() => { formError = ''; form = { kind: 'tx', editing: null }; }} disabled={!settings.url}>Add transaction</button>
    </div>
  </div>

  {#if error}<div class="notice error">{error}</div>{/if}

  {#if head}
    <Cards {head} {lastSeen} />

    <section class="section">
      <h2>What I own</h2>
      <Holdings rows={held} />
    </section>

    <section class="section">
      <h2>Where my money is</h2>
      <Donut {head} />
    </section>

    <section class="section">
      <div class="row between">
        <h2>{buckets.unit === 'month' ? 'Month by month' : 'Year by year'}: money put in vs. what it was worth</h2>
        {#if tickers.length > 1}
          <label style="flex-direction: row; align-items: center; gap: 8px">Show
            <select bind:value={chartTicker}>
              <option value="">everything</option>
              {#each tickers as t}<option value={t.ticker}>{t.ticker}</option>{/each}
            </select>
          </label>
        {/if}
      </div>
      <GrowthChart summary={chartSummary} buckets={buckets.rows} unit={buckets.unit} />
    </section>

  {:else if valid && !loading}
    <div class="notice">
      {#if !data.prices.length}The sheet has no price rows yet. Run <code>fetchDaily</code> once in Apps Script, then press Refresh.
      {:else}No purchases yet. Use "Add transaction" after your first buy.{/if}
    </div>
  {/if}

  <div class="folds">
    {#if head && stats}
      <Collapsible id="stats" title="Statistics">
        <Statistics {stats} />
      </Collapsible>
    {/if}
    {#if head}
      <Collapsible id="period" title={(buckets.unit === 'month' ? 'Month by month' : 'Year by year') + (chartTicker ? ' – ' + chartTicker : '')}>
        <PeriodTable rows={periodRows} unit={buckets.unit} />
      </Collapsible>
    {/if}
    <Collapsible id="purchases" title="All my purchases">
      <Transactions {transactions} {busy} onEdit={(t) => { formError = ''; form = { kind: 'tx', editing: t }; }} onDelete={removeTx} />
    </Collapsible>
    <Collapsible id="cash" title="Money sent to the broker">
      <CashList {cash} {busy} onEdit={(c) => { formError = ''; form = { kind: 'cash', editing: c }; }} onDelete={removeCash} />
    </Collapsible>
  </div>

  <footer class="faint">
    <div>Prices are daily closes converted to euros at that day's ECB rate, so numbers can differ slightly from IBKR's live screen. Earnings are not real until shares are sold.</div>
  </footer>
</div>

{#if showSettings}
  <Settings {settings} onSave={onSaveSettings} onCancel={settings.url && settings.secret ? () => (showSettings = false) : null} {error} />
{/if}
{#if form?.kind === 'tx'}
  <TransactionForm editing={form.editing} {tickers} onSave={saveTx} onCancel={() => (form = null)} {busy} error={formError} />
{/if}
{#if form?.kind === 'cash'}
  <CashForm editing={form.editing} onSave={saveCash} onCancel={() => (form = null)} {busy} error={formError} />
{/if}
