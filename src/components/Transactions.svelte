<script>
  import { eurCents, longDate } from '../lib/format.js';
  let { transactions, cash, onEdit, onDelete, onEditCash, onDeleteCash, busy } = $props();

  function confirmDelete(t) {
    if (confirm(`Delete the ${t.shares < 0 ? 'sale' : 'purchase'} from ${longDate(t.date)} (${Math.abs(t.shares)} × ${t.ticker})?`)) onDelete(t);
  }
  function confirmDeleteCash(c) {
    if (confirm(`Delete the cash movement from ${longDate(c.date)} (${eurCents(c.amount)})?`)) onDeleteCash(c);
  }
</script>

{#if transactions.length === 0}
  <div class="notice">No purchases yet. Use "Add transaction" after your first buy.</div>
{:else}
  <div class="scroll-x">
    <table class="stack">
      <thead>
        <tr>
          <th>Date</th>
          <th>What</th>
          <th class="num">Shares</th>
          <th class="num">Price</th>
          <th class="num">EUR spent</th>
          <th class="num">Fee</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each transactions as t (t.row)}
          <tr>
            <td data-label="Date">{longDate(t.date)}</td>
            <td data-label="What">{t.ticker}{#if t.eur === 0 && t.shares > 0}<span class="help"> · gift</span>{/if}</td>
            <td class="num" data-label="Shares">{Number(t.shares).toFixed(4).replace(/\.?0+$/, '')}</td>
            <td class="num" data-label="Price">{Number(t.price).toFixed(2)}</td>
            <td class="num" data-label="EUR spent">{eurCents(t.eur)}</td>
            <td class="num" data-label="Fee">{eurCents(t.fee)}</td>
            <td class="muted" data-label="Note">{t.note}</td>
            <td class="num actions" style="white-space: nowrap">
              <button class="link" disabled={busy} onclick={() => onEdit(t)}>Edit</button>
              <button class="link danger" disabled={busy} onclick={() => confirmDelete(t)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<h2 style="margin-top: 8px">Money sent to the broker</h2>
{#if cash.length === 0}
  <div class="notice">No cash movements yet. Use "Add cash" when you transfer money to IBKR.</div>
{:else}
  <div class="scroll-x">
    <table class="stack">
      <thead>
        <tr><th>Date</th><th class="num">Amount</th><th>Note</th><th></th></tr>
      </thead>
      <tbody>
        {#each cash as c (c.row)}
          <tr>
            <td data-label="Date">{longDate(c.date)}</td>
            <td class="num" data-label="Amount">{eurCents(c.amount)}</td>
            <td class="muted" data-label="Note">{c.note}</td>
            <td class="num actions" style="white-space: nowrap">
              <button class="link" disabled={busy} onclick={() => onEditCash(c)}>Edit</button>
              <button class="link danger" disabled={busy} onclick={() => confirmDeleteCash(c)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
