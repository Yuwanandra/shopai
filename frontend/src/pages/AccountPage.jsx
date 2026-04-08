import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Gift, Heart, Package, Camera } from 'lucide-react';
import { useAuthStore } from '../store';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { StarRating } from '../components/products/ProductCard';

const TABS = [
  { id: 'profile',  label: 'Profile',   icon: User },
  { id: 'password', label: 'Password',  icon: Lock },
  { id: 'coupons',  label: 'Coupons',   icon: Gift },
  { id: 'wishlist', label: 'Wishlist',  icon: Heart },
];

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('profile');

  // Profile form
  const [profile, setProfile] = useState({
    full_name:  user?.full_name || '',
    phone:      user?.phone     || '',
    address:    user?.address   || '',
    avatar_url: user?.avatar_url || '',
  });

  // Password form
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' });

  const profileMut = useMutation({
    mutationFn: () => api.put('/users/profile', profile),
    onSuccess: (r) => { updateUser(r.data.user); toast.success('Profile updated!'); },
    onError: () => toast.error('Update failed'),
  });

  const pwdMut = useMutation({
    mutationFn: () => api.put('/users/password', { current_password: pwd.current_password, new_password: pwd.new_password }),
    onSuccess: () => { toast.success('Password changed!'); setPwd({ current_password:'', new_password:'', confirm:'' }); },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  });

  const { data: couponData } = useQuery({
    queryKey: ['my-coupons'],
    queryFn:  () => api.get('/coupons/my').then(r => r.data),
    enabled: tab === 'coupons',
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn:  () => api.get('/wishlists').then(r => r.data),
    enabled: tab === 'wishlist',
  });

  return (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="bg-ink rounded-3xl p-8 mb-8 flex items-center gap-6 relative overflow-hidden">
          <div className="blob" style={{ background:'#FF6B6B', width:300, height:300, top:'-50%', right:'-5%', opacity:0.15 }} />
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-coral/20 flex items-center justify-center text-3xl font-bold text-coral border-2 border-coral/30 overflow-hidden">
              {user?.avatar_url
                ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                : user?.username?.[0]?.toUpperCase()
              }
            </div>
          </div>
          <div className="relative">
            <p className="text-white font-display font-bold text-2xl">{user?.full_name || user?.username}</p>
            <p className="text-white/50 text-sm">{user?.email}</p>
            <div className="flex gap-4 mt-3">
              <div><p className="text-white font-bold">{user?.total_orders || 0}</p><p className="text-white/40 text-xs">Orders</p></div>
              <div><p className="text-white font-bold">Rp {Number(user?.total_spent || 0).toLocaleString('id-ID')}</p><p className="text-white/40 text-xs">Spent</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar tabs */}
          <div className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  tab === id ? 'bg-coral text-white shadow-md shadow-coral/25' : 'text-ink hover:bg-white'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
            <Link to="/orders"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-ink hover:bg-white transition-all"
            >
              <Package size={16} /> Orders
            </Link>
          </div>

          {/* Tab content */}
          <motion.div key={tab} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} className="md:col-span-3">

            {/* Profile */}
            {tab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-semibold text-base mb-5">Edit Profile</h2>
                <div className="space-y-4">
                  {[
                    { key: 'full_name',  label: 'Full Name' },
                    { key: 'phone',      label: 'Phone' },
                    { key: 'address',    label: 'Address' },
                    { key: 'avatar_url', label: 'Avatar URL' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
                      <input
                        value={profile[key]}
                        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                        className="input-field"
                        placeholder={label}
                      />
                    </div>
                  ))}
                  <div className="pt-1">
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Username</label>
                    <input value={user?.username} disabled className="input-field opacity-50 cursor-not-allowed" />
                    <p className="text-xs text-gray-400 mt-1">Username cannot be changed.</p>
                  </div>
                  <button onClick={() => profileMut.mutate()} disabled={profileMut.isPending}
                    className="btn-primary mt-2">
                    {profileMut.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            {tab === 'password' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-semibold text-base mb-5">Change Password</h2>
                <div className="space-y-4">
                  {[
                    { key: 'current_password', label: 'Current Password' },
                    { key: 'new_password',     label: 'New Password' },
                    { key: 'confirm',          label: 'Confirm New Password' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
                      <input type="password" value={pwd[key]}
                        onChange={e => setPwd(p => ({ ...p, [key]: e.target.value }))}
                        className="input-field" placeholder="••••••••"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      if (pwd.new_password !== pwd.confirm) { toast.error("Passwords don't match"); return; }
                      pwdMut.mutate();
                    }}
                    disabled={pwdMut.isPending}
                    className="btn-primary"
                  >
                    {pwdMut.isPending ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}

            {/* Coupons */}
            {tab === 'coupons' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-semibold text-base mb-5">My Coupons</h2>
                {!couponData?.coupons?.length ? (
                  <div className="text-center py-10 text-gray-400">
                    <Gift size={32} className="mx-auto mb-3 text-gray-300" />
                    <p>No coupons yet. Keep shopping to earn rewards!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {couponData.coupons.map(c => (
                      <div key={c.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 ${c.is_used ? 'border-gray-100 opacity-50' : 'border-dashed border-coral/30 bg-coral/5'}`}
                      >
                        <div>
                          <p className="font-mono font-bold text-coral tracking-widest">{c.code}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                          {c.expires_at && <p className="text-xs text-gray-300 mt-0.5">Expires {new Date(c.expires_at).toLocaleDateString()}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-xl text-coral">
                            {c.type === 'percentage' ? `${c.value}%` : `Rp ${Number(c.value).toLocaleString('id-ID')}`}
                          </p>
                          <p className="text-xs font-medium">{c.is_used ? '✓ Used' : 'Available'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist */}
            {tab === 'wishlist' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-semibold text-base mb-5">Wishlist</h2>
                {!wishlistData?.items?.length ? (
                  <div className="text-center py-10 text-gray-400">
                    <Heart size={32} className="mx-auto mb-3 text-gray-300" />
                    <p>Your wishlist is empty. Save items you love!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wishlistData.items.map(item => (
                      <Link key={item.id} to={`/product/${item.slug}`}
                        className="group rounded-2xl overflow-hidden border border-gray-100 hover:border-coral/30 hover:shadow-md transition-all"
                      >
                        <img src={item.image_url} alt={item.name}
                          className="w-full h-32 object-cover bg-cream-dark group-hover:scale-105 transition-transform duration-300" />
                        <div className="p-3">
                          <p className="text-xs font-medium line-clamp-2">{item.name}</p>
                          <p className="text-coral font-bold text-sm mt-1">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
