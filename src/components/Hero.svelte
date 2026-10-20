<script>
  import { eurCents, eur, signed, pct, colorClass, longDate, todayIso } from '../lib/format.js';
  let { head, lastSeen } = $props();

  const isToday = $derived(head.date === todayIso());
  const sinceLast = $derived(
    lastSeen && head && lastSeen.date !== head.date ? head.worth - lastSeen.worth - (head.putIn - lastSeen.putIn) : null
  );
  const signedCents = (n) => (n >= 0 ? '+' : '−') + eurCents(Math.abs(n));
  const pillClass = $derived(head.diff > 0 ? 'pill-up' : head.diff < 0 ? 'pill-down' : 'pill-flat');
</script>

<div class="summary">
  <div class="label">Total portfolio value</div>
  <div class="summary-row">
    <div class="summary-value">{eurCents(head.worth)}</div>
    <div class="pill-return {pillClass}">
      {signedCents(head.diff)}{#if head.putIn > 0}&nbsp;({pct(head.pctGain)}){/if}
    </div>
  </div>
  <div class="help">
    Total return{#if head.since}&nbsp;since {longDate(head.since)}{/if}{#if head.putIn === 0}, all from gifted shares{/if}.
    {#if sinceLast !== null}<span class={colorClass(sinceLast)}>{signed(sinceLast)}</span> since you last looked.{/if}
    {#if !isToday} Prices from {longDate(head.date)}.{/if}
  </div>
  <div class="summary-facts">
    <div><div class="label">Invested</div><div class="fact">{eur(head.putIn)}</div></div>
    <div><div class="label">Uninvested cash</div><div class="fact">{eur(Math.max(0, head.cash))}</div></div>
    <div><div class="label">Total at broker</div><div class="fact">{eur(Math.max(0, head.cash) + head.worth)}</div></div>
  </div>
</div>
