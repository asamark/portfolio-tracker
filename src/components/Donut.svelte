<script>
  import { onMount } from 'svelte';
  import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
  import { eur } from '../lib/format.js';

  Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

  let { head } = $props();
  let canvas;
  let chart;

  // Slices: cash waiting (grey, light) · my money in shares (grey) · earned (green)  — or lost (red) eating into my money.
  const cash = $derived(Math.max(0, head.cash));
  const earned = $derived(Math.max(0, head.diff));
  const lost = $derived(Math.max(0, -head.diff));
  const ownInShares = $derived(Math.max(0, head.putIn - lost));
  const total = $derived(cash + Math.max(0, head.worth));
  const pc = $derived((v) => (total ? ((v / total) * 100).toFixed(1) : '0.0') + '%');

  $effect(() => {
    const data = [cash, ownInShares, head.diff >= 0 ? earned : lost];
    const colors = ['#f3f4f6', '#d1d5db', head.diff >= 0 ? '#15803d' : '#b91c1c'];
    const labels = ['Cash waiting', 'My money in shares', head.diff >= 0 ? 'Earned' : 'Lost'];
    if (!chart) {
      chart = new Chart(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 1, borderColor: '#ffffff' }] },
        options: { cutout: '64%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.label}: ${eur(c.raw)}` } } } },
      });
    } else {
      chart.data.labels = labels; chart.data.datasets[0].data = data; chart.data.datasets[0].backgroundColor = colors; chart.update();
    }
  });
  onMount(() => () => chart?.destroy());
</script>

<div class="row" style="gap: 40px; align-items: center">
  <div class="donut-box" style="flex: 0 0 200px">
    <canvas bind:this={canvas}></canvas>
    <div class="donut-center">
      <div style="font-size: 22px; font-weight: 600">{eur(total)}</div>
      <div class="faint">at the broker</div>
    </div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 14px; flex: 1 1 320px; min-width: 0">
    {#if cash > 0}
      <span class="row"><span class="swatch" style="background: #f3f4f6; border: 1px solid #e5e7eb"></span><strong>{eur(cash)}</strong> cash, waiting to be invested <span class="faint">({pc(cash)})</span></span>
    {/if}
    <span class="row"><span class="swatch" style="background: #d1d5db"></span><strong>{eur(ownInShares)}</strong> my own money in shares <span class="faint">({pc(ownInShares)})</span></span>
    {#if head.diff >= 0}
      <span class="row"><span class="swatch" style="background: #15803d"></span><strong class="green">{eur(earned)}</strong> earned <span class="faint">({pc(earned)})</span></span>
    {:else}
      <span class="row"><span class="swatch" style="background: #b91c1c"></span><strong class="red">{eur(lost)}</strong> lost so far <span class="help">(not real unless I sell)</span></span>
    {/if}
  </div>
</div>
