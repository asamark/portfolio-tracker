<script>
  import { eurCents, signed, colorClass } from '../lib/format.js';
  let { rows } = $props();
  const signedCents = (n) => (n >= 0 ? '+' : '−') + eurCents(Math.abs(n));
</script>

<div class="scroll-x">
  <table class="stack">
    <thead>
      <tr>
        <th>What I own</th>
        <th class="num">Shares</th>
        <th class="num">Avg. price paid</th>
        <th class="num">Price now</th>
        <th class="num divider">Put in</th>
        <th class="num">Worth</th>
        <th class="num">Difference</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as h (h.ticker)}
        <tr>
          <td data-label=""><strong>{h.ticker}</strong>{#if h.name}<span class="help"> · {h.name}</span>{/if}{#if h.gift}<span class="help"> · gift</span>{/if}</td>
          <td class="num" data-label="Shares">{h.shares.toFixed(4).replace(/\.?0+$/, '')}</td>
          <td class="num" data-label="Avg. price paid">{h.gift ? '—' : '€' + h.avgPaidEur.toFixed(2)}</td>
          <td class="num" data-label="Price now">€{h.priceEur.toFixed(2)} <span class="help">({h.price.toFixed(2)} {h.currency})</span></td>
          <td class="num divider" data-label="Put in">{eurCents(h.putIn)}</td>
          <td class="num" data-label="Worth">{eurCents(h.worth)}</td>
          <td class="num strong {colorClass(h.diff)}" data-label="Difference">{signedCents(h.diff)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<div class="help">Avg. price paid includes fees. Gifted shares: €0 put in, so all value counts as gain.</div>
