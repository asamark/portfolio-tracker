<script>
  import { eur, signed, pct, colorClass, longDate, todayIso } from '../lib/format.js';
  let { head, lastSeen } = $props();

  const isToday = $derived(head.date === todayIso());
  const sinceLast = $derived(
    lastSeen && head && lastSeen.date !== head.date ? head.worth - lastSeen.worth - (head.putIn - lastSeen.putIn) : null
  );
</script>

<div class="hero">
  <div class="hero-main">
    <div class="label">My earning so far</div>
    <div class="hero-value {colorClass(head.diff)}">{signed(head.diff)}</div>
    <div class="hero-context">
      {#if head.putIn > 0}{pct(head.pctGain)} vs. leaving it in the bank{:else}All from gifted shares{/if}
      {#if head.since} · since {longDate(head.since)}{/if}
      {#if sinceLast !== null} · <span class={colorClass(sinceLast)}>{signed(sinceLast)}</span> since you last looked{/if}
    </div>
  </div>
  <div class="hero-side">
    <div class="hero-pair">
      <span class="label">Put in</span><strong>{eur(head.putIn)}</strong>
      <span class="arrow" aria-hidden="true">→</span>
      <span class="label">{isToday ? 'Worth today' : 'Worth'}</span><strong>{eur(head.worth)}</strong>
    </div>
    <div class="help">
      {#if head.cash > 0.5}{eur(head.cash)} cash not yet invested · {eur(head.cash + head.worth)} total at the broker{:else}Everything is invested · {eur(head.worth)} at the broker{/if}
      {#if !isToday} · prices from {longDate(head.date)}{/if}
    </div>
  </div>
</div>
