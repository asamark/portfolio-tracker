<script>
  let { settings, onSave, onCancel, error } = $props();
  let url = $state(settings.url ?? '');
  let secret = $state(settings.secret ?? '');

  function submit(e) {
    e.preventDefault();
    onSave({ url: url.trim(), secret: secret.trim() });
  }
</script>

<div class="modal-backdrop" role="presentation" onclick={(e) => { if (e.target === e.currentTarget && onCancel) onCancel(); }}>
  <form class="modal" onsubmit={submit}>
    <h2>Connect to your Google Sheet</h2>
    <div class="help">
      Both values come from the Apps Script inside your Google Sheet. They are stored only in this browser.
      New here? <a href="./setup-guide.txt" download="portfolio-tracker-setup-guide.txt">Download the setup guide</a>
      — a text file you can read or paste into an AI assistant; it contains every step and the script.
    </div>
    <label>
      Web app URL (Apps Script → Deploy → Web app)
      <input type="url" bind:value={url} required placeholder="https://script.google.com/macros/s/…/exec" />
    </label>
    <label>
      Secret word (Settings tab, cell B2)
      <input type="password" bind:value={secret} required />
    </label>
    {#if error}<div class="notice error">{error}</div>{/if}
    <div class="row between">
      {#if onCancel}<button type="button" onclick={onCancel}>Cancel</button>{:else}<span></span>{/if}
      <button type="submit" class="primary" disabled={!url || !secret}>Save and load</button>
    </div>
  </form>
</div>
