const eurFmt = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurCentsFmt = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const eur = (n) => eurFmt.format(Math.round(n || 0));
export const eurCents = (n) => eurCentsFmt.format(n || 0);
export const signed = (n) => (n >= 0 ? '+' : '−') + eur(Math.abs(n || 0));
export const pct = (n) => (n >= 0 ? '+' : '−') + Math.abs((n || 0) * 100).toFixed(1) + '%';
export const colorClass = (n) => (n > 0 ? 'green' : n < 0 ? 'red' : 'muted');
export const colorHex = (n) => (n > 0 ? '#15803d' : n < 0 ? '#b91c1c' : '#4b5563');

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(isoDate) {
  const [y, m] = isoDate.split('-').map(Number);
  return `${monthNames[m - 1]} ${y}`;
}

export function shortMonth(isoDate) {
  const [, m] = isoDate.split('-').map(Number);
  return monthNames[m - 1];
}

export function longDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${monthNames[m - 1]} ${y}`;
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
