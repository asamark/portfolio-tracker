<script>
  /** A section that folds under its title. Open/closed state is remembered per `id` in this browser. */
  let { id, title, open = false, children } = $props();

  const key = 'pt.open.' + id;
  let isOpen = $state(open);
  try { const saved = localStorage.getItem(key); if (saved !== null) isOpen = saved === '1'; } catch { /* ignore */ }

  function toggle(e) {
    isOpen = e.currentTarget.open;
    try { localStorage.setItem(key, isOpen ? '1' : '0'); } catch { /* ignore */ }
  }
</script>

<details class="fold" open={isOpen} ontoggle={toggle}>
  <summary><h2>{title}</h2><span class="fold-icon" aria-hidden="true"></span></summary>
  <div class="fold-body">{@render children()}</div>
</details>
