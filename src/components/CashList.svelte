<script>
  import { eurCents, longDate } from '../lib/format.js';
  let { cash, onEdit, onDelete, busy } = $props();

  function confirmDelete(c) {
    if (confirm(`Delete the cash movement from ${longDate(c.date)} (${eurCents(c.amount)})?`)) onDelete(c);
  }
</script>

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
              <button class="link" disabled={busy} onclick={() => onEdit(c)}>Edit</button>
              <button class="link danger" disabled={busy} onclick={() => confirmDelete(c)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
