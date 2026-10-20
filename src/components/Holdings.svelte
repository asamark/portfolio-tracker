<script>
  import { eur, eurCents } from '../lib/format.js';
  let { rows } = $props();
  const signedCents = (n) => (n >= 0 ? '+' : '−') + eurCents(Math.abs(n));
  const qty = (n) => n.toFixed(4).replace(/\.?0+$/, '');
  const money = (n) => (Math.abs(n) >= 1000 ? eur(n) : eurCents(n));
  const pill = (n) => (n > 0 ? 'pill-up' : n < 0 ? 'pill-down' : 'pill-flat');
</script>

<div class="holdings">
  {#each rows as h (h.ticker)}
    <div class="holding">
      <div class="holding-head">
        <div>
          <div class="holding-ticker">{h.ticker}</div>
          {#if h.name}<div class="help">{h.name}</div>{/if}
        </div>
        <div class="pill-return {pill(h.diff)}">{signedCents(h.diff)}</div>
      </div>
      <div class="holding-values">
        <div><div class="label">Current value</div><div class="holding-main">{money(h.worth)}</div></div>
        <div class="right"><div class="label">Invested</div><div class="fact">{money(h.putIn)}</div></div>
      </div>
      <div class="holding-foot">
        <span>{qty(h.shares)} {Math.abs(h.shares - 1) < 1e-9 ? 'share' : 'shares'}{#if h.gifted > 0} · {qty(h.gifted)} gifted{/if}</span>
        <span>{#if h.bought > 0}Avg. €{h.avgPaidEur.toFixed(2)} / share · {/if}now €{h.priceEur.toFixed(2)}</span>
      </div>
      {#if h.gifted > 0}
        <div class="help holding-note">
          {#if h.bought > 0}{qty(h.gifted)} of these shares were a gift (€0 invested), so most of this return is the gift's value, not investment performance.
          {:else}These shares were a gift (€0 invested), so the whole value shows as return — it is not investment performance.{/if}
        </div>
      {/if}
    </div>
  {/each}
</div>
