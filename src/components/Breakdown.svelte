<script>
  /** Donut: where the money is right now — one slice per holding, plus uninvested cash. */
  import { onMount } from 'svelte';
  import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
  import { eur } from '../lib/format.js';

  Chart.register(DoughnutController, ArcElement, Tooltip);

  let { holdings, cash } = $props();
  let canvas;
  let chart;

  const palette = ['#2563eb', '#7c3aed', '#0891b2', '#1e40af', '#9333ea', '#0e7490', '#60a5fa', '#a78bfa', '#67e8f9'];
  const slices = $derived.by(() => {
    const items = holdings.map((h, i) => ({ label: h.ticker, name: h.name, value: h.worth, color: palette[i % palette.length] }));
    if (cash > 0.5) items.push({ label: 'Cash', name: 'not yet invested', value: cash, color: '#d1d5db' });
    const total = items.reduce((s, x) => s + x.value, 0);
    return items.map((x) => ({ ...x, pct: total ? (x.value / total) * 100 : 0 })).sort((a, b) => b.value - a.value);
  });
  const total = $derived(slices.reduce((s, x) => s + x.value, 0));

  $effect(() => {
    const data = { labels: slices.map((s) => s.label), datasets: [{ data: slices.map((s) => s.value), backgroundColor: slices.map((s) => s.color), borderWidth: 2, borderColor: '#ffffff' }] };
    if (!chart) {
      chart = new Chart(canvas, {
        type: 'doughnut',
        data,
        options: { cutout: '66%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.label}: ${eur(c.raw)} (${slices[c.dataIndex].pct.toFixed(1)}%)` } } } },
      });
    } else { chart.data = data; chart.update(); }
  });
  onMount(() => () => chart?.destroy());
</script>

<div class="breakdown">
  <div class="donut-box">
    <canvas bind:this={canvas}></canvas>
    <div class="donut-center">
      <div class="donut-total">{eur(total)}</div>
      <div class="help">at the broker</div>
    </div>
  </div>
  <div class="key">
    {#each slices as s (s.label)}
      <div class="key-item">
        <span class="swatch" style="background: {s.color}"></span>
        <div class="key-text">
          <div><strong>{s.label}</strong>{#if s.name}<span class="help">&nbsp;· {s.name}</span>{/if}</div>
          <div class="help">{eur(s.value)} · {s.pct.toFixed(1)}%</div>
        </div>
      </div>
    {/each}
  </div>
</div>
<div class="help">How the money at the broker is split between holdings and uninvested cash, at the latest prices.</div>
