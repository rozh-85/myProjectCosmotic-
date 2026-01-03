
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';


interface LayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await dbService.getOrders();
        setPendingCount(data.filter(o => o.status === 'pending').length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { label: 'Products', icon: 'inventory_2', path: '/admin/products' },
    { label: 'Categories', icon: 'category', path: '/admin/categories' },
    { label: 'Orders', icon: 'shopping_cart', path: '/admin/orders' },
    { label: 'Banners', icon: 'image', path: '/admin/banners' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' },
  ];

  const sqlSchema = `
-- COMPLETE LUXE COSMETICS SETUP SCRIPT
-- Copy all and run in Supabase SQL Editor

-- 1. Create Tables
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_visible boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category_id uuid references categories(id) on delete set null,
  price numeric not null default 0,
  description text,
  image_url text,
  in_stock boolean default true,
  is_featured boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  image_url text not null,
  mobile_image_url text,
  button_text text default 'Shop Now',
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  phone_number text,
  address text,
  city text,
  total_price numeric not null,
  status text default 'pending',
  items jsonb not null default '[]',
  created_at timestamp with time zone default now()
);

-- 2. Disable Security
alter table categories disable row level security;
alter table products disable row level security;
alter table banners disable row level security;
alter table orders disable row level security;

-- 3. Seed Sample Data
DO $$
DECLARE
    skincare_id UUID;
    makeup_id UUID;
BEGIN
    INSERT INTO categories (name, slug, description, image_url)
    VALUES ('Skincare', 'skincare', 'Premium skin solutions', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO skincare_id;

    INSERT INTO categories (name, slug, description, image_url)
    VALUES ('Makeup', 'makeup', 'Professional cosmetics', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO makeup_id;

    INSERT INTO products (name, category_id, price, description, image_url, is_featured)
    VALUES ('Glow Serum', skincare_id, 45.00, 'Pure radiance in a bottle.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400', true);

    INSERT INTO banners (title, subtitle, image_url, button_text)
    VALUES ('Velvet Collection', 'New shades for the season.', 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1200', 'Shop Now');
END $$;

-- 4. Create Storage Bucket (Run this to enable image uploads)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Allow public access to images bucket
create policy "Public Access" on storage.objects for all using ( bucket_id = 'images' );

-- 5. Update Orders Table (Run if you didn't have phone/address before)
alter table orders add column if not exists phone_number text;
alter table orders add column if not exists address text;
alter table orders add column if not exists city text;

-- 6. Update Banners Table
alter table banners add column if not exists mobile_image_url text;

-- 7. Create Settings Table (Run for dynamic logo)
create table if not exists settings (
  key text primary key,
  value text not null
);
alter table settings disable row level security;
insert into settings (key, value) values ('logo_url', '') on conflict do nothing;
  `.trim();

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row font-display">
      {/* Setup Help Modal */}
      {showSetupHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-surface-light w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border-light flex justify-between items-center bg-primary/5">
              <div>
                <h3 className="text-xl font-bold">Supabase Setup Guide</h3>
                <p className="text-sm text-text-muted-light">Run this to create all tables and sample data at once.</p>
              </div>
              <button onClick={() => setShowSetupHelp(false)} className="h-10 w-10 rounded-full hover:bg-black/5 flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="mb-4 text-sm leading-relaxed">Copy the SQL below and paste it into your <b>Supabase Dashboard &rarr; SQL Editor</b>, then click <b>Run</b>.</p>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed">
                  {sqlSchema}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(sqlSchema)}
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-colors flex items-center gap-1 text-[10px] uppercase font-bold"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-border-light bg-background-light">
              <button onClick={() => setShowSetupHelp(false)} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Got it!</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-surface-light border-b border-border-light sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-center bg-no-repeat bg-cover rounded-full h-8 w-8" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDWttGeLf4FUBqNMwodgZBX2YOiDfHE0RVn5F6xRbV9JLMNMCnIAhD6Gy9b2MDmMkR4REY9ip32zO4r6dM363p7-Bd8CWNomLSdrrpwNxPbp7tCqx_9vMNeUWqmAF9i5s8V5qr-mgTYwDIId_YEl8NWVvlkA9ujezXAs6B773e_2-RexWy4avUHbiquMIPmZAOoleXJhx3qXy-5KyhCyXmVHUyDIMnhKlTPoiXm2Joqq-2ryrTraVwHQ8LWCmxxn1i6DVt9AYiyRQj5")' }}></div>
          <span className="font-bold text-lg">Luxe Cosmetics</span>
        </div>
        <button className="p-2" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`fixed inset-0 z-50 transform transition-transform duration-300 bg-surface-light w-72 flex flex-col justify-between border-r border-border-light overflow-y-auto lg:relative lg:translate-x-0 lg:h-screen lg:sticky lg:top-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 ring-2 ring-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBphD-Z-PwY78yoq7FoLy5ni4Wn1ORP1Ywu-eRy6CoKPsSwe60x0Soy3pWH_lP03kYy1oVnFD4OQoGQ109K3QWUSvj0BBikjZOGvu9089jZZ6En4wXrqGuffkljZlehM0H2SAKZyuqwhPywsf4M45-GvgbIZ5R289E9sOJj3jircgqVaDUnJSYcIj2B0qb3FmRpFHbThyokSOyYffGDwRKgLj7ptxECEdhsiq3McHHwUYoF9Z6L1O6TvUzMfoV-4a5dlRlVwWCfrqBj")' }}></div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-tight">Luxe Cosmetics</h1>
              <p className="text-text-muted-light text-xs font-medium">Admin Panel</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium relative ${location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-text-muted-light hover:bg-background-light hover:text-text-main-light'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="relative">
                  <span className={`material-symbols-outlined ${location.pathname === item.path ? 'filled' : ''}`}>{item.icon}</span>
                  {item.label === 'Orders' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-2 bg-primary rounded-full animate-pulse border-2 border-white"></span>
                  )}
                </div>
                <span className="flex-1">{item.label}</span>
                {item.label === 'Orders' && pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black animate-bounce shadow-sm shadow-primary/30">
                    {pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-border-light flex flex-col gap-4">
          <button
            onClick={() => setShowSetupHelp(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">database</span>
            <span>Database Setup Guide</span>
          </button>
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              AD
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-bold">Admin</p>
              <p className="text-xs text-text-muted-light truncate">{user?.email}</p>
            </div>
            <button onClick={signOut} className="ml-auto text-text-muted-light hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-background-light">
        {/* Top bar search */}
        <div className="px-4 py-3 flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-light/50 backdrop-blur-sm sticky top-0 z-40 border-b border-border-light/50">
          <div className="w-full md:max-w-md">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted-light group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input className="w-full pl-12 pr-4 py-3 rounded-xl bg-background-light border-none focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-text-muted-light outline-none transition-all shadow-sm" placeholder="Search products, orders..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <button className="relative p-2 text-text-muted-light hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
            </button>
            <Link to="/" className="hidden sm:flex items-center justify-center gap-2 px-5 py-2.5 bg-background-light hover:bg-white hover:shadow-md border border-transparent hover:border-border-light text-text-main-light text-sm font-bold rounded-xl transition-all">
              <span>View Live Site</span>
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </Link>
          </div>
        </div>
        {children}
        <footer className="mt-auto py-6 px-10 border-t border-border-light text-center md:text-left text-xs text-text-muted-light">
          © 2024 Luxe Cosmetics Admin Panel. All rights reserved.
        </footer>
      </main>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </div>
  );
};

export default AdminLayout;
