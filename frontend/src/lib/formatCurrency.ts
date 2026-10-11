const exchangeRates: Record<string, number> = {
  INR: 1,
  USD: 1 / 83,
  EUR: 1 / 90,
  GBP: 1 / 105,
  CAD: 1 / 61,
  AUD: 1 / 54,
  BRL: 1 / 16,
  MXN: 1 / 4.9,
  JPY: 1 / 0.56,
  KRW: 1 / 0.063,
  CHF: 1 / 95,
  NZD: 1 / 50,
}

export function formatCurrency(amountInr: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: ['INR', 'JPY', 'KRW'].includes(currency) ? 0 : 2,
  }).format(amountInr * (exchangeRates[currency] ?? 1))
}