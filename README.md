# Portfolio tracker

A one-person web page that shows what you put into an ETF vs. what it is worth, with the
Google Sheet as database and an Apps Script inside the sheet as the only "backend".

```
Google Sheet (data) ──► Apps Script web app (GET/POST, nightly prices) ──► this page (Svelte + Chart.js)
```

- `sheet/portfolio-tracker.xlsx` — the sheet to import into Google Sheets (tabs: README, Settings, Transactions, Prices, FX, Summary).
- `sheet/Code.gs` — the Apps Script to paste into that sheet.
- `src/` — the page. No UI kit, plain CSS in `src/app.css`.

## Things YOU need to do (once)

### A. The sheet (10 minutes)
1. Google Drive → New → File upload → `sheet/portfolio-tracker.xlsx`. Open it → File → **Save as Google Sheets**. Delete the uploaded .xlsx from Drive.
2. Tab **Settings**, cell B2: type your own long secret word.
3. Extensions → **Apps Script**. Delete the sample code, paste all of `sheet/Code.gs`, Save.
4. In the function dropdown choose **fetchDaily** → Run → allow the permissions Google asks for. Check that **Prices** and **FX** now contain the last month of rows. Delete the grey example rows in Prices, FX and Transactions.
5. Triggers (clock icon) → Add trigger → `fetchDaily`, Time-driven, Day timer, 7–8 pm → Save.
6. Deploy → New deployment → type **Web app** → Execute as **Me**, Who has access **Anyone** → Deploy → copy the **Web app URL**.
   Every time you change `Code.gs` later: Deploy → Manage deployments → edit → New version.

### B. The page (5 minutes)
Needs Node.js 18+ (`node -v`).

```bash
cd portfolio-tracker
npm install
npm run dev        # opens http://localhost:5173
```

First open shows the Settings dialog: paste the Web app URL and the secret word. They are stored only in that browser's localStorage.

### C. Put it online (optional, free)
Any static host works; the page is just files.

- **Cloudflare Pages / Netlify / Vercel:** connect the git repo, build command `npm run build`, output `dist`.
- **GitHub Pages:** set `base: '/<repo-name>/'` in `vite.config.js`, run `npm run build`, publish `dist`.

Then on your phone open the URL → "Add to Home Screen". It installs as an app (there is a manifest).

### D. Enter your real purchases
Add transaction → copy date, shares, price (USD), EUR spent and fee from the IBKR trade confirmation.
Your current VUAA position: 1 share, price 152.82 USD; take the EUR amount and fee from Performance & Reports → Statements → Activity.

## How the numbers are computed
Done in the sheet (`Summary` tab), one row per trading day:

- money put in = EUR spent + fees of all buys on or before that day (sells subtract)
- worth = shares × close (USD) × USD→EUR of that day
- difference = worth − money put in
- change since previous day = worth − previous worth − money added that day

The page only groups these by month (≤ 18 months of data) or by year (more), draws them, and
computes the statistics (behind-the-bank days, biggest fall, best/worst day, money-weighted yearly return).

## Adding a second ticker later
Prices/Transactions already carry a ticker column. To track more than one, add a Summary tab per
ticker (copy the formulas, change `Settings!$B$1` to the ticker) and make the page sum them — or ask for that step.

## Known limits
- Price source is Yahoo Finance's unofficial chart endpoint (`VUAA.L`). If it stops working, change `addMissingPrices` in `Code.gs` to Stooq (`https://stooq.com/q/d/l/?s=vuaa.uk&i=d`) — same row format.
- Apps Script time triggers occasionally skip a run; `fetchDaily` backfills the last 30 days, so a missed evening fixes itself the next day.
- The Summary tab has formulas prepared for 1,500 price rows (~6 years). When you get near the end, copy the last row downwards.
