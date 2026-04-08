// Currency store - live rates relative to IDR base
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const CURRENCIES = {
  IDR: { code: 'IDR', symbol: 'Rp',  name: 'Indonesian Rupiah', flag: '🇮🇩', rate: 1,          locale: 'id-ID', decimals: 0 },
  USD: { code: 'USD', symbol: '$',   name: 'US Dollar',         flag: '🇺🇸', rate: 0.000063,   locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€',   name: 'Euro',              flag: '🇪🇺', rate: 0.000058,   locale: 'de-DE', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',      flag: '🇯🇵', rate: 0.0095,     locale: 'ja-JP', decimals: 0 },
  CNY: { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',      flag: '🇨🇳', rate: 0.00046,    locale: 'zh-CN', decimals: 2 },
  MYR: { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit', flag: '🇲🇾', rate: 0.00030,    locale: 'ms-MY', decimals: 2 },
  RUB: { code: 'RUB', symbol: '₽',   name: 'Russian Ruble',     flag: '🇷🇺', rate: 0.0058,     locale: 'ru-RU', decimals: 0 },
};

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      currency: 'IDR',

      setCurrency: (code) => set({ currency: code }),

      // Convert IDR amount to selected currency
      convert: (amountIDR) => {
        const { currency } = get();
        const cur = CURRENCIES[currency];
        return amountIDR * cur.rate;
      },

      // Format a converted amount with symbol
      format: (amountIDR) => {
        const { currency } = get();
        const cur     = CURRENCIES[currency];
        const amount  = amountIDR * cur.rate;

        if (currency === 'IDR') {
          return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
        }

        return new Intl.NumberFormat(cur.locale, {
          style:                 'currency',
          currency:              cur.code,
          minimumFractionDigits: cur.decimals,
          maximumFractionDigits: cur.decimals,
        }).format(amount);
      },
    }),
    { name: 'shopai_currency' }
  )
);