
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminBanners from './pages/AdminBanners';
import Storefront from './pages/Storefront';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Storefront Routes */}
        <Route path="/" element={<Storefront />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
        <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
        <Route path="/admin/banners" element={<AdminLayout><AdminBanners /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><div className="p-10">Admin Settings (TBD)</div></AdminLayout>} />
      </Routes>
    </Router>
  );
};

export default App;
