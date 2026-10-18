<script>
  import { todayIso } from '../lib/format.js';
  /** editing: null for a new transaction, or the existing transaction object. tickers: from Settings. */
  let { editing = null, tickers = [], onSave, onCancel, busy, error } = $props();

  let date = $state(editing?.date ?? todayIso());
  let tick = $state(editing?.ticker ?? (tickers[0]?.ticker ?? 'VUAA'));
  let shares = $state(editing ? Math.abs(editing.shares) : '');
  let price = $state(editing?.price ?? '');
  let eur = $state(editing ? Math.abs(editing.eur) : '');
  let fee = $state(editing?.fee ?? '');
  let note = $state(editing?.note ?? '');
  let kind = $state(editing ? (editing.shares < 0 ? 'sell' : editing.eur === 0 ? 'gift' : 'buy') : 'buy');

  const currency = $derived(tickers.find((t) => t.ticker === tick)?.currency ?? 'USD');

  function submit(e) {
    e.preventDefault();
    const sign = kind === 'sell' ? -1 : 1;
    onSave({
      date,
      ticker: tick.trim().toUpperCase(),
      shares: sign * Math.abs(Number(shares)),
      price: Number(price),
      eur: kind === 'gift' ? 0 : sign * Math.abs(Number(eur)),
      fee: kind === 'gift' ? 0 : Number(fee) || 0,
      note: note.trim(),
    });
  }

  const valid = $derived(date && tick && Number(shares) > 0 && Number(price) > 0 && (kind === 'gift' || Number(eur) > 0));
</script>

<div class="modal-backdrop" role="presentation" onclick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
  <form class="modal" onsubmit={submit}>
    <h2>{editing ? 'Edit transaction' : 'Add transaction'}</h2>

    <div class="row">
      {#each [['buy', 'Buy'], ['sell', 'Sell'], ['gift', 'Gift / free shares']] as [v, label]}
        <label style="flex-direction: row; align-items: center; gap: 8px; color: var(--text)">
          <input type="radio" name="kind" value={v} checked={kind === v} onchange={() => (kind = v)} /> {label}
        </label>
      {/each}
    </div>

    <div class="form-grid">
      <label>Date <input type="date" bind:value={date} required /></label>
      <label>What
        <select bind:value={tick}>
          {#each tickers as t}<option value={t.ticker}>{t.ticker}{t.name ? ' – ' + t.name : ''}</option>{/each}
        </select>
      </label>
      <label>Shares <input type="number" step="any" min="0" bind:value={shares} required placeholder="e.g. 38.74" /></label>
      <label>Price per share ({currency}) <input type="number" step="0.01" min="0" bind:value={price} required placeholder="e.g. 149.38" /></label>
      {#if kind !== 'gift'}
        <label>EUR {kind === 'sell' ? 'received' : 'spent'} (without fee) <input type="number" step="0.01" min="0" bind:value={eur} required placeholder="e.g. 5000.00" /></label>
        <label>Fee (EUR) <input type="number" step="0.01" min="0" bind:value={fee} placeholder="e.g. 1.25" /></label>
      {/if}
    </div>
    <label>Note (optional) <input type="text" bind:value={note} placeholder="e.g. monthly buy" /></label>

    <div class="faint">
      {#if kind === 'gift'}
        Shares you received without paying (e.g. IBKR's stock award for a deposit). They count as €0 put in, so their whole value is earning.
      {:else}
        Copy these from the IBKR trade confirmation (Performance &amp; Reports → Statements → Activity → Trades). "EUR spent" is the Proceeds line in EUR; the fee is Comm/Fee in EUR.
      {/if}
    </div>

    {#if busy}<div class="notice">Saving to the Google Sheet… this takes 5–10 seconds.</div>{/if}
    {#if error}<div class="notice error">{error}</div>{/if}

    <div class="row between">
      <button type="button" onclick={onCancel} disabled={busy}>Cancel</button>
      <button type="submit" class="primary" disabled={busy || !valid}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add'}</button>
    </div>
  </form>
</div>
