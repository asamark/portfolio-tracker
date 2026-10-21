<script>
  /** Donut: what the portfolio value is made of — money put in vs. money earned (or lost). */
  import { onMount } from 'svelte';
  import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
  import { eur } from '../lib/format.js';

  Chart.register(DoughnutController, ArcElement, Tooltip);

  let { putIn, worth } = $props();
  let canvas;
  let chart;

  const diff = $derived(worth - putIn);
  const slices = $derived.by(() => {
    if (diff >= 0) {
      return [
        { label: 'Money I put in', value: putIn, color: '#d1d5db' },
        { label: 'Earned', value: diff, color: '#15803d' },
      ];
    }
    return [
      { label: 'My money still there', value: worth, color: '#d1d5db' },
      { label: 'Lost so far', value: -diff, color: '#b91c1c' },
    ];
  });
  const base = $derived(diff >= 0 ? worth : putIn);
  const pc = (v) => (base ? ((v / base) * 100).toFixed(1) : '0.0') + '%';

  $effect(() => {
    const data = { labels: slices.map((s) => s.label), datasets: [{ data: slices.map((s) => s.value), backgroundColor: slices.map((s) => s.color), borderWidth: 2, borderColor: '#ffffff' }] };
    if (!chart) {
      chart = new Chart(canvas, {
        type: 'doughnut',
        data,
        options: { cutout: '66%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.label}: ${eur(c.raw)} (${pc(c.raw)})` } } } },
      });
    } else { chart.data = data; chart.update(); }
  });
  onMount(() => () => chart?.destroy());
</script>

<div class="breakdown">
  <div class="donut-box">
    <canvas bind:this={canvas}></canvas>
    <div class="donut-center">
      <div class="donut-total">{eur(worth)}</div>
      <div class="help">{diff >= 0 ? 'worth today' : 'worth today'}</div>
    </div>
  </div>
  <div class="key">
    {#each slices as s (s.label)}
      <div class="key-item">
        <span class="swatch" style="background: {s.color}"></span>
        <div class="key-text">
          <div><strong class={s.color === '#15803d' ? 'green' : s.color === '#b91c1c' ? 'red' : ''}>{eur(s.value)}</strong> {s.label.toLowerCase()}</div>
          <div class="help">{pc(s.value)}{#if s.label === 'Money I put in'} of today's value{:else if s.label === 'Earned'} of today's value{:else} of what I put in{/if}</div>
        </div>
      </div>
    {/each}
  </div>
</div>
<div class="help">
  {#if diff >= 0}Out of every €100 in shares today, about €{Math.round(base ? (putIn / base) * 100 : 100)} is my own money and €{Math.round(base ? (diff / base) * 100 : 0)} is what the investment earned.
  {:else}The shares are worth less than I paid. Nothing is lost for real unless I sell.{/if}
</div>
