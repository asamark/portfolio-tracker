<script>
  import { eurCents, colorClass, monthLabel } from '../lib/format.js';
  let { rows, unit } = $props();
  const signedCents = (n) => (n >= 0 ? '+' : '−') + eurCents(Math.abs(n));
</script>

<div class="scroll-x">
  <table class="stack">
    <thead>
      <tr>
        <th>{unit === 'month' ? 'Month' : 'Year'}</th>
        <th class="num divider">Market move</th>
        <th class="num">Put in (total)</th>
        <th class="num">Worth then</th>
        <th class="num">Difference</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr>
          <td data-label={unit === 'month' ? 'Month' : 'Year'}>{unit === 'month' ? monthLabel(r.date) : r.date.slice(0, 4)}</td>
          <td class="num divider {r.periodChange === null ? 'muted' : colorClass(r.periodChange)}" data-label="Market move">{r.periodChange === null ? '—' : signedCents(r.periodChange)}</td>
          <td class="num" data-label="Put in (total)">{eurCents(r.putIn)}</td>
          <td class="num" data-label="Worth then">{eurCents(r.worth)}</td>
          <td class="num strong {colorClass(r.diff)}" data-label="Difference">{signedCents(r.diff)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<div class="help">Last trading day of each {unit}. Market move = change in what I already owned, before new money. Difference = worth − put in.</div>
