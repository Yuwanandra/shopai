import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/products/ProductCard';

const SORTS = [
  { value: 'created_at', label: 'Newest' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="skeleton h-52 w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-5 w-1/3 rounded mt-2" />
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { category: catParam } = useParams();

  const [filterOpen, setFilterOpen] = useState(false);

  // Query params
  const q         = searchParams.get('q')        || '';
  const category  = catParam || searchParams.get('category') || '';
  const sortRaw   = searchParams.get('sort')     || 'created_at';
  const minPrice  = searchParams.get('min_price') || '';
  const maxPrice  = searchParams.get('max_price') || '';
  const page      = parseInt(searchParams.get('page') || '1');
  const featured  = searchParams.get('featured') || '';

  const [sort, order] = sortRaw.includes('_asc')
    ? [sortRaw.replace('_asc',''), 'asc']
    : sortRaw.includes('_desc')
      ? [sortRaw.replace('_desc',''), 'desc']
      : [sortRaw, 'desc'];

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => api.get('/categories').then(r => r.data),
    staleTime: Infinity,
  });

  const { data, isFetching } = useQuery({
    queryKey: ['products', { q, category, sort, order, minPrice, maxPrice, page, featured }],
    queryFn: () => api.get('/products', {
      params: {
        q, category, sort, order,
        min_price: minPrice, max_price: maxPrice,
        page, limit: 24,
        featured: featured || undefined,
      },
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const update = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams(catParam ? {} : {});

  const hasFilters = q || category || minPrice || maxPrice || featured;

  return (
    <div className="pt-20 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="section-title">
                {catParam
                  ? catData?.categories?.find(c => c.slug === catParam)?.name || catParam
                  : q ? `Results for "${q}"` : 'All Products'}
              </h1>
              {data && (
                <p className="text-sm text-gray-400 mt-1">
                  {data.total.toLocaleString()} products found
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortRaw}
                  onChange={e => update('sort', e.target.value)}
                  className="input-field py-2 pl-3 pr-8 text-sm h-10 appearance-none cursor-pointer"
                >
                  {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setFilterOpen(o => !o)}
                className="btn-outline py-2 px-4 text-sm flex items-center gap-2 h-10"
              >
                <SlidersHorizontal size={15} />
                Filters
                {hasFilters && <span className="w-2 h-2 rounded-full bg-coral" />}
              </button>
            </div>
          </div>

          {/* Inline filter chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* Category chips */}
            {!catParam && (catData?.categories || []).map(cat => (
              <button
                key={cat.id}
                onClick={() => update('category', category === cat.slug ? '' : cat.slug)}
                className={`chip ${category === cat.slug ? 'active' : ''}`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}

            {/* Active filter badges */}
            {hasFilters && (
              <button onClick={clearAll} className="chip flex items-center gap-1 border-red-200 text-red-400 hover:bg-red-50">
                <X size={11} /> Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar filters */}
        <AnimatePresence>
          {filterOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 overflow-hidden"
            >
              <div className="w-64 bg-white rounded-2xl p-5 shadow-sm sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-sm">Filters</h3>
                  <button onClick={() => setFilterOpen(false)}>
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>

                {/* Price range */}
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Price Range</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={e => update('min_price', e.target.value)}
                        className="input-field pl-8 py-2 text-sm h-9"
                      />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={e => update('max_price', e.target.value)}
                        className="input-field pl-8 py-2 text-sm h-9"
                      />
                    </div>
                  </div>
                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: '<50K',   max: 50000 },
                      { label: '<200K',  max: 200000 },
                      { label: '<500K',  max: 500000 },
                      { label: '<1M',    max: 1000000 },
                    ].map(p => (
                      <button
                        key={p.label}
                        onClick={() => { update('min_price',''); update('max_price', p.max); }}
                        className="chip text-[11px] py-0.5"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                {!catParam && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Category</p>
                    <div className="space-y-1">
                      {(catData?.categories || []).map(cat => (
                        <label key={cat.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-cream-dark cursor-pointer text-sm">
                          <input
                            type="radio"
                            name="category"
                            checked={category === cat.slug}
                            onChange={() => update('category', cat.slug)}
                            className="accent-coral"
                          />
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isFetching && !data ? (
            <div className="products-grid">
              {Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : data?.products?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="font-display font-bold text-2xl mb-2">No products found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
              <button onClick={clearAll} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <div className="relative">
              {isFetching && (
                <div className="absolute inset-0 bg-cream/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-coral border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="products-grid">
                {(data?.products || []).map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {data?.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(pg => (
                    <button
                      key={pg}
                      onClick={() => { const n = new URLSearchParams(searchParams); n.set('page', pg); setSearchParams(n); }}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                        pg === page ? 'bg-coral text-white shadow-md shadow-coral/30' : 'bg-white hover:bg-cream-dark text-ink'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
