
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ products: 0, categories: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prods, cats] = await Promise.all([
          dbService.getProducts(),
          dbService.getCategories()
        ]);
        setStats({ products: prods.length, categories: cats.length });
        setError(null);
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.error("Dashboard stats error:", msg);
        setError("Database connection check failed. Ensure tables are created.");
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Good Morning, Admin</h2>
          <p className="text-text-muted-light text-lg">Here's what's happening with your store today.</p>
        </div>
        {error && (
          <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-pulse">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard icon="inventory_2" label="Total Products" value={String(stats.products)} change="+2.4%" />
            <StatCard icon="category" label="Active Categories" value={String(stats.categories)} change="0%" />
            <StatCard icon="visibility" label="Total Views" value="12.5K" change="+12%" />
            <StatCard icon="shopping_bag" label="Pending Orders" value="5" change="New" />
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/admin/products" className="bg-surface-light p-6 rounded-2xl border border-border-light flex items-center justify-between shadow-sm group cursor-pointer hover:border-primary/50 transition-all">
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-lg">Manage Products</p>
                  <p className="text-sm text-text-muted-light">Add, edit, or remove inventory.</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">add</span>
                </div>
              </Link>
              <Link to="/admin/banners" className="bg-surface-light p-6 rounded-2xl border border-border-light flex items-center justify-between shadow-sm group cursor-pointer hover:border-primary/50 transition-all">
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-lg">Update Banners</p>
                  <p className="text-sm text-text-muted-light">Refresh homepage visuals.</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">upload</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold">Active Hero Banner</h3>
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md group">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBYmCitIBdIYB6pEcushdYweuPWCw0ovgTqZxtBU7D98s8R9PJv2s-dngsDv_mstJs2qQ5Xfae6qmykZJTrhHXuhpoV4EJewoOumkkF-E30EN0PTLYEcWMLzy5En-Tv36xYBp1jFvlG7f-4WiZnwk9vlryaXi9Les-PyLnUYqetwU5SrZY0AtOAmJxkkJVlV8rZ0k90zsRVGDe_Xyqd0-zzpCZ9ksPfxPNrFH6ObWtnL7kq4Pv-gtw4u4MGjUqHhlB6vab-LHZSv1iT")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                <span className="px-2 py-1 bg-primary text-white text-xs font-bold rounded w-fit mb-2">Live Now</span>
                <p className="text-white font-bold text-lg">Summer Glow Collection</p>
                <p className="text-white/80 text-sm">Main Landing Page</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; change: string }> = ({ icon, label, value, change }) => (
  <div className="p-6 rounded-2xl bg-surface-light border border-border-light shadow-sm hover:shadow-md transition-shadow group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className={`flex items-center px-2 py-1 rounded-lg text-xs font-bold ${change.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-text-muted-light bg-background-light'}`}>
        {change} {change.startsWith('+') && <span className="material-symbols-outlined text-[14px]">trending_up</span>}
      </span>
    </div>
    <p className="text-text-muted-light text-sm font-medium">{label}</p>
    <h3 className="text-3xl font-bold mt-1">{value}</h3>
  </div>
);

export default AdminDashboard;
