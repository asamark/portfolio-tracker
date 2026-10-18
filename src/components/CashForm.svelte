<script>
  import { todayIso } from '../lib/format.js';
  let { editing = null, onSave, onCancel, busy, error } = $props();

  let date = $state(editing?.date ?? todayIso());
  let amount = $state(editing ? Math.abs(editing.amount) : '');
  let note = $state(editing?.note ?? '');
  let kind = $state(editing && editing.amount < 0 ? 'out' : 'in');

  function submit(e) {
    e.preventDefault();
    onSave({ date, amount: (kind === 'out' ? -1 : 1) * Math.abs(Number(amount)), note: note.trim() });
  }
  const valid = $derived(date && Number(amount) > 0);
</script>

<div class="modal-backdrop" role="presentation" onclick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
  <form class="modal" onsubmit={submit}>
    <h2>{editing ? 'Edit cash movement' : 'Add cash movement'}</h2>
    <div class="row">
      <label style="flex-direction: row; align-items: center; gap: 8px; color: var(--text)">
        <input type="radio" name="ckind" checked={kind === 'in'} onchange={() => (kind = 'in')} /> Sent money to the broker
      </label>
      <label style="flex-direction: row; align-items: center; gap: 8px; color: var(--text)">
        <input type="radio" name="ckind" checked={kind === 'out'} onchange={() => (kind = 'out')} /> Took money out
      </label>
    </div>
    <div class="form-grid">
      <label>Date <input type="date" bind:value={date} required /></label>
      <label>Amount (EUR) <input type="number" step="0.01" min="0" bind:value={amount} required placeholder="e.g. 14000" /></label>
    </div>
    <label>Note (optional) <input type="text" bind:value={note} placeholder="e.g. bank transfer" /></label>
    <div class="faint">Only money moving between your bank and the broker. Buying shares is a transaction, not a cash movement.</div>
    {#if busy}<div class="notice">Saving to the Google Sheet… this takes 5–10 seconds.</div>{/if}
    {#if error}<div class="notice error">{error}</div>{/if}
    <div class="row between">
      <button type="button" onclick={onCancel} disabled={busy}>Cancel</button>
      <button type="submit" class="primary" disabled={busy || !valid}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add'}</button>
    </div>
  </form>
</div>
