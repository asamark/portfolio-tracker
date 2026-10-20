<script>
  import { eur, signed, pct, longDate } from '../lib/format.js';
  let { stats } = $props();
</script>

<div class="stats">
  {#if stats.annual !== null}
    <div class="stat">
      <div class="label">Yearly return on my money</div>
      <div class="stat-value {stats.annual >= 0 ? 'green' : 'red'}">{pct(stats.annual)}</div>
      <div class="help">Accounts for when each euro went in. Savings pay ~0–3%.</div>
    </div>
  {/if}
  {#if stats.maxRun > 0}
    <div class="stat">
      <div class="label">Best run</div>
      <div class="stat-value green">+{eur(stats.maxRun)}</div>
      <div class="help">My gain rose from {signed(stats.runLow)} ({longDate(stats.runFrom)}) to {signed(stats.runHigh)} ({longDate(stats.runTo)}). The biggest climb so far.</div>
    </div>
  {/if}
  {#if stats.maxDd > 0}
    <div class="stat">
      <div class="label">Worst dip</div>
      <div class="stat-value red">−{eur(stats.maxDd)}</div>
      <div class="help">My gain fell from {signed(stats.ddHigh)} ({longDate(stats.ddFrom)}) to {signed(stats.ddLow)} ({longDate(stats.ddTo)}). The biggest drop so far.</div>
    </div>
  {/if}
  {#if stats.best.change > 0}
    <div class="stat">
      <div class="label">Best day</div>
      <div class="stat-value green">{signed(stats.best.change)}</div>
      <div class="help">{longDate(stats.best.date)}</div>
    </div>
  {/if}
  {#if stats.worst.change < 0}
    <div class="stat">
      <div class="label">Worst day</div>
      <div class="stat-value red">{signed(stats.worst.change)}</div>
      <div class="help">{longDate(stats.worst.date)}</div>
    </div>
  {/if}
</div>
