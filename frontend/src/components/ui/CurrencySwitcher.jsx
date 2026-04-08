import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useCurrencyStore, CURRENCIES } from '../../store/currency';

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = CURRENCIES[currency];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-coral hover:text-coral transition-all text-sm font-medium"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:block">{current.code}</span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="px-3 py-2 border-b border-gray-50">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select Currency</p>
            </div>
            <div className="py-1 max-h-72 overflow-y-auto">
              {Object.values(CURRENCIES).map((cur) => (
                <button
                  key={cur.code}
                  onClick={() => { setCurrency(cur.code); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-cream-dark ${
                    currency === cur.code ? 'bg-coral/5 text-coral font-semibold' : 'text-ink'
                  }`}
                >
                  <span className="text-lg leading-none w-6">{cur.flag}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{cur.code}</p>
                    <p className="text-[11px] text-gray-400 leading-tight">{cur.name}</p>
                  </div>
                  <span className="text-xs font-mono text-gray-400">{cur.symbol}</span>
                  {currency === cur.code && (
                    <span className="w-1.5 h-1.5 rounded-full bg-coral shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-gray-50 bg-cream/50">
              <p className="text-[10px] text-gray-400 leading-tight">
                Rates are approximate. All transactions are processed in IDR.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}