<script>
  /**
   * Columns per period: grey = money put in, green cap = gain (red = loss cut into the grey).
   * Blue line = portfolio value every day. One euro scale for everything.
   */
  import { onMount } from 'svelte';
  import {
    Chart, BarController, LineController, BarElement, LineElement, PointElement,
    CategoryScale, LinearScale, TimeScale, Tooltip, Legend,
  } from 'chart.js';
  import { eur, signed, colorHex, shortMonth, monthLabel, longDate } from '../lib/format.js';

  Chart.register(BarController, LineController, BarElement, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend);

  let { summary, buckets, unit } = $props();
  let canvas;
  let chart;

  function build() {
    // x positions: one slot per bucket; the daily line is placed by date fraction between bucket dates.
    const labels = buckets.map((b) => (unit === 'month' ? shortMonth(b.date) : b.date.slice(0, 4)));
    const grey = buckets.map((b) => Math.min(b.putIn, b.worth));
    const cap = buckets.map((b) => Math.abs(b.worth - b.putIn));
    const capColor = buckets.map((b) => colorHex(b.worth - b.putIn));

    // Daily line: map each day's date to a fractional x between buckets.
    const times = buckets.map((b) => Date.parse(b.date));
    const first = Date.parse(summary[0].date);
    const line = summary.map((r) => {
      const t = Date.parse(r.date);
      let x;
      if (t <= times[0]) x = times[0] === first ? 0 : -0.5 + 0.5 * ((t - first) / (times[0] - first));
      else {
        let i = 0;
        while (i < times.length - 1 && t > times[i + 1]) i++;
        const span = times[i + 1] - times[i] || 1;
        x = i + Math.min(1, (t - times[i]) / span);
      }
      return { x, y: r.worth, date: r.date };
    });

    return {
      data: {
        labels,
        datasets: [
          { type: 'bar', label: 'Money put in', data: grey, backgroundColor: '#d1d5db', stack: 's', order: 2, barPercentage: 0.5 },
          { type: 'bar', label: 'Gain / loss', data: cap, backgroundColor: capColor, stack: 's', order: 2, barPercentage: 0.5 },
          { type: 'line', label: 'Total portfolio value', data: line, borderColor: '#2563eb', borderWidth: 2.5, pointRadius: 0, pointHitRadius: 8, tension: 0.15, order: 1, parsing: false, xAxisID: 'xLine' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#4b5563' } },
          xLine: { type: 'linear', display: false, min: -0.5, max: buckets.length - 0.5 },
          y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280', callback: (v) => eur(v) } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                const it = items[0];
                if (it.dataset.type === 'line') return longDate(it.raw.date);
                const b = buckets[it.dataIndex];
                return unit === 'month' ? monthLabel(b.date) : 'End of ' + b.date.slice(0, 4);
              },
              label: (it) => {
                if (it.dataset.type === 'line') return 'Worth: ' + eur(it.raw.y);
                const b = buckets[it.dataIndex];
                if (it.datasetIndex === 0) return 'Money put in: ' + eur(b.putIn);
                return 'Difference: ' + signed(b.worth - b.putIn);
              },
            },
          },
        },
      },
    };
  }

  $effect(() => {
    if (!summary.length || !buckets.length) return;
    const cfg = build();
    if (!chart) chart = new Chart(canvas, cfg);
    else { chart.data = cfg.data; chart.options = cfg.options; chart.update(); }
  });

  onMount(() => () => chart?.destroy());
</script>

<div class="legend">
  <span><span class="swatch" style="background: #d1d5db"></span>Money put in (= bank account)</span>
  <span><span class="swatch" style="background: #15803d"></span>Gain on top</span>
  <span><span class="swatch" style="background: #b91c1c"></span>Loss</span>
  <span><span class="swatch line" style="background: #2563eb"></span>Total portfolio value, every day</span>
</div>
<div class="chart-box"><canvas bind:this={canvas}></canvas></div>
<div class="help">Columns: money put in by the end of each {unit}, with gain (green) on top or loss (red) cut in. Line: value every trading day.</div>
