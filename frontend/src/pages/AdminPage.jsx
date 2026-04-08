import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, Users, ShoppingBag, TrendingUp, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useQuery as useQ } from '@tanstack/react-query';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'products',  label: 'Products',  icon: Package },
  { id: 'orders',    label: 'Orders',    icon: ShoppingBag },
  { id: 'users',     label: 'Users',     icon: Users },
];

function StatCard({ label, value, icon: Icon, color, prefix='' }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: color+'20' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="font-display font-bold text-2xl">{prefix}{value}</p>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, categories }) {
  const qc = useQueryClient();
  const isNew = !product?.id;
  const [form, setForm] = useState({
    name:           product?.name           || '',
    description:    product?.description    || '',
    price:          product?.price          || '',
    original_price: product?.original_price || '',
    stock:          product?.stock          || '',
    category_id:    product?.category_id    || '',
    image_url:      product?.image_url      || '',
    sku:            product?.sku            || '',
    is_active:      product?.is_active      ?? true,
    is_featured:    product?.is_featured    ?? false,
    tags:           (product?.tags || []).join(', '),
  });

  const mut = useMutation({
    mutationFn: () => isNew
      ? api.post('/admin/products', { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) })
      : api.put(`/admin/products/${product.id}`, { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) }),
    onSuccess: () => {
      toast.success(isNew ? 'Product created!' : 'Product updated!');
      qc.invalidateQueries(['admin-products']);
      onClose();
    },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl">{isNew ? 'Add Product' : 'Edit Product'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-cream-dark"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key:'name',           label:'Product Name',    span:2 },
            { key:'price',          label:'Price (Rp)',      type:'number' },
            { key:'original_price', label:'Original Price',  type:'number' },
            { key:'stock',          label:'Stock',           type:'number' },
            { key:'sku',            label:'SKU' },
            { key:'image_url',      label:'Image URL',       span:2 },
            { key:'tags',           label:'Tags (comma sep)',span:2 },
          ].map(({ key, label, type='text', span }) => (
            <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)}
                className="input-field" placeholder={label} />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Category</label>
            <select value={form.category_id} onChange={e=>set('category_id',e.target.value)} className="input-field">
              <option value="">Select category</option>
              {(categories||[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-3 justify-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e=>set('is_active',e.target.checked)} className="accent-coral w-4 h-4" />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e=>set('is_featured',e.target.checked)} className="accent-amber w-4 h-4" />
              <span className="text-sm">Featured</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)}
              className="input-field resize-none" rows={3} placeholder="Product description…" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending} className="btn-primary flex-1 justify-center">
            {mut.isPending ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard');
  const [modalProduct, setModalProduct] = useState(undefined); // undefined=closed, null=new, obj=edit
  const qc = useQueryClient();

  const { data: stats }    = useQuery({ queryKey:['admin-stats'],    queryFn: () => api.get('/admin/stats').then(r=>r.data),    enabled: tab==='dashboard' });
  const { data: products } = useQuery({ queryKey:['admin-products'], queryFn: () => api.get('/admin/products').then(r=>r.data), enabled: tab==='products'  });
  const { data: orders }   = useQuery({ queryKey:['admin-orders'],   queryFn: () => api.get('/admin/orders').then(r=>r.data),   enabled: tab==='orders'    });
  const { data: users }    = useQuery({ queryKey:['admin-users'],    queryFn: () => api.get('/admin/users').then(r=>r.data),    enabled: tab==='users'     });
  const { data: catData }  = useQuery({ queryKey:['categories'],     queryFn: () => api.get('/categories').then(r=>r.data),     staleTime: Infinity        });

  const deleteProd = useMutation({
    mutationFn: (id) => api.delete(`/admin/products/${id}`),
    onSuccess: () => { toast.success('Product hidden'); qc.invalidateQueries(['admin-products']); },
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries(['admin-orders']); },
  });

  return (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-amber text-sm font-semibold uppercase tracking-wider mb-1">Admin Panel</p>
            <h1 className="section-title">Dashboard</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm mb-8 max-w-max">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === id ? 'bg-ink text-white shadow-md' : 'text-gray-500 hover:text-ink'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Total Users"    value={stats.users.toLocaleString()}    icon={Users}        color="#4ECDC4" />
            <StatCard label="Total Products" value={stats.products.toLocaleString()} icon={Package}      color="#FF6B6B" />
            <StatCard label="Total Orders"   value={stats.orders.toLocaleString()}   icon={ShoppingBag}  color="#FFB347" />
            <StatCard label="Revenue"        value={`Rp ${Number(stats.revenue).toLocaleString('id-ID')}`} icon={TrendingUp} color="#FF6B6B" />
          </div>
        )}

        {/* Products */}
        {tab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <p className="text-sm text-gray-400">{products?.products?.length || 0} products</p>
              <button onClick={() => setModalProduct(null)} className="btn-primary text-sm px-5 py-2.5">
                <Plus size={16} /> Add Product
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream-dark text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <tr>{['Image','Name','Price','Stock','Category','Status','Actions'].map(h=>(<th key={h} className="px-4 py-3 text-left">{h}</th>))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(products?.products||[]).map(p => (
                      <tr key={p.id} className="hover:bg-cream/50 transition-colors">
                        <td className="px-4 py-3">
                          <img src={p.image_url} alt="" className="w-10 h-10 rounded-xl object-cover bg-cream-dark" />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm text-ink line-clamp-1 max-w-[200px]">{p.name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-sm">{p.stock}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{p.category_name||'-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.is_active ? 'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                            {p.is_active ? 'Active':'Hidden'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={()=>setModalProduct(p)} className="p-1.5 rounded-lg hover:bg-cream-dark text-gray-400 hover:text-coral transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={()=> window.confirm('Hide this product?') && deleteProd.mutate(p.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-dark text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <tr>{['Order ID','Customer','Total','Payment','Status','Update Status'].map(h=><th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(orders?.orders||[]).map(o => (
                    <tr key={o.id} className="hover:bg-cream/50 text-sm">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{(o.midtrans_order_id||o.id).slice(0,18)}</td>
                      <td className="px-4 py-3">{o.username||o.email||'Guest'}</td>
                      <td className="px-4 py-3 font-semibold">Rp {Number(o.total).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${o.payment_status==='paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{o.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={e => updateOrderStatus.mutate({ id: o.id, status: e.target.value })}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-coral"
                        >
                          {['pending','awaiting_payment','paid','processing','shipped','delivered','cancelled','refunded'].map(s=>
                            <option key={s} value={s}>{s}</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-dark text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <tr>{['User','Email','Role','Orders','Spent','Joined'].map(h=><th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {(users?.users||[]).map(u => (
                    <tr key={u.id} className="hover:bg-cream/50">
                      <td className="px-4 py-3 font-medium">{u.full_name||u.username}</td>
                      <td className="px-4 py-3 text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role==='admin'?'bg-amber/20 text-amber':'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">{u.total_orders}</td>
                      <td className="px-4 py-3">Rp {Number(u.total_spent||0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {modalProduct !== undefined && (
        <ProductModal
          product={modalProduct}
          categories={catData?.categories}
          onClose={() => setModalProduct(undefined)}
        />
      )}
    </div>
  );
}
