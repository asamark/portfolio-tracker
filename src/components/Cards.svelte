<script>
  import { eur, signed, pct, colorClass, longDate, todayIso } from '../lib/format.js';
  let { head, lastSeen } = $props();

  const isToday = $derived(head.date === todayIso());
  const sinceLast = $derived(
    lastSeen && head && lastSeen.date !== head.date ? head.worth - lastSeen.worth - (head.putIn - lastSeen.putIn) : null
  );
</script>

<div class="cards">
  <div class="card">
    <div class="label">Money I put in</div>
    <div class="value">{eur(head.putIn)}</div>
    <div class="help">Purchases + fees. What the bank would show.</div>
  </div>
  <div class="card">
    <div class="label">{isToday ? 'Worth today' : 'Latest value'}</div>
    <div class="value">{eur(head.worth)}</div>
    <div class="help">{isToday ? 'At the latest close.' : 'Prices from ' + longDate(head.date) + '.'}</div>
  </div>
  <div class="card">
    <div class="label">Difference</div>
    <div class="value {colorClass(head.diff)}">{signed(head.diff)}</div>
    <div class="help">
      {#if head.putIn > 0}{pct(head.pctGain)} vs. the bank.{:else}All from gifted shares.{/if}
      {#if sinceLast !== null}
        <span class={colorClass(sinceLast)}>{signed(sinceLast)}</span> since {longDate(lastSeen.date)}.
      {/if}
    </div>
  </div>
  <div class="card">
    <div class="label">Cash at the broker</div>
    <div class="value">{eur(head.cash)}</div>
    <div class="help">Not yet invested. Total at IBKR {eur(head.cash + head.worth)}.</div>
  </div>
</div>
