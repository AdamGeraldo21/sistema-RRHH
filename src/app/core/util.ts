/** Cédula dominicana: 11 dígitos, el último es verificador (algoritmo de Luhn con pesos 1-2). */
export function cedulaValida(value: string): boolean {
  const d = (value ?? '').replace(/\D/g, '');
  if (d.length !== 11) return false;
  return checkDigit(d.slice(0, 10)) === Number(d[10]);
}

export function checkDigit(base10: string): number {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let n = Number(base10[i]) * (i % 2 === 0 ? 1 : 2);
    if (n > 9) n -= 9;
    sum += n;
  }
  return (10 - (sum % 10)) % 10;
}

export function formatCedula(value: string): string {
  const d = (value ?? '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`;
}

/** Construye una cédula válida a partir de 10 dígitos base (para datos de demo). */
export function makeCedula(base10: string): string {
  return formatCedula(base10 + checkDigit(base10));
}

const moneyFmt = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 0 });
export function money(n: number | null | undefined): string {
  return `RD$ ${moneyFmt.format(n ?? 0)}`;
}

export function moneyShort(n: number): string {
  if (n >= 1_000_000) return `RD$ ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `RD$ ${Math.round(n / 1_000)}K`;
  return money(n);
}

const dateFmt = new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
export function fecha(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateFmt.format(new Date(iso + 'T00:00:00Z')).replace('.', '');
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function initials(name: string): string {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function normalize(s: string): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function matches(q: string, ...fields: (string | number | undefined)[]): boolean {
  const n = normalize(q.trim());
  if (!n) return true;
  return fields.some((f) => normalize(String(f ?? '')).includes(n));
}

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function etapaTone(etapa: string): string {
  switch (etapa) {
    case 'Contratado':
      return 'ok';
    case 'Descartado':
      return 'bad';
    case 'Evaluación':
      return 'warn';
    case 'Postulado':
      return 'info';
    default:
      return 'brand';
  }
}
