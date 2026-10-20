<script>
  import { eur, eurCents, colorClass } from '../lib/format.js';
  let { rows } = $props();
  const signedCents = (n) => (n >= 0 ? '+' : '−') + eurCents(Math.abs(n));
  const qty = (n) => n.toFixed(4).replace(/\.?0+$/, '');
  const money = (n) => (Math.abs(n) >= 1000 ? eur(n) : eurCents(n));
</script>

<div class="holdings">
  {#each rows as h (h.ticker)}
    <div class="holding">
      <div class="holding-head">
        <div><strong>{h.ticker}</strong>{#if h.name}<span class="help">&nbsp;· {h.name}</span>{/if}{#if h.gifted > 0}<span class="help">&nbsp;· {h.bought > 0 ? 'part gift' : 'gift'}</span>{/if}</div>
        <div class="strong {colorClass(h.diff)}">{signedCents(h.diff)}</div>
      </div>
      <div class="hero-pair">
        <span class="label">Put in</span><strong>{money(h.putIn)}</strong>
        <span class="arrow" aria-hidden="true">→</span>
        <span class="label">Worth</span><strong>{money(h.worth)}</strong>
      </div>
      <div class="help">
        {qty(h.shares)} {Math.abs(h.shares - 1) < 1e-9 ? 'share' : 'shares'}
        {#if h.gifted > 0 && h.bought > 0} · {qty(h.gifted)} gifted, {qty(h.bought)} bought at €{h.avgPaidEur.toFixed(2)}
        {:else if h.bought > 0} · paid €{h.avgPaidEur.toFixed(2)} avg{/if}
        · now €{h.priceEur.toFixed(2)} ({h.price.toFixed(2)} {h.currency})
      </div>
    </div>
  {/each}
</div>
{#if rows.some((h) => h.gifted > 0)}
  <div class="help">Gifted shares count as €0 put in, so their whole value is earning. Averages include fees.</div>
{/if}
