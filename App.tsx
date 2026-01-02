
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminBanners from './pages/AdminBanners';
import AdminOrders from './pages/AdminOrders';
import Storefront from './pages/Storefront';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import Login from './pages/Login';
import AdminSettings from './pages/AdminSettings';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Storefront />} />
              <Route path="/login" element={<Login />} />

              {/* Admin Routes (Protected) */}
              <Route path="/admin" element={
                <RequireAuth>
                  <AdminLayout><AdminDashboard /></AdminLayout>
                </RequireAuth>
              } />
              <Route path="/admin/products" element={
                <RequireAuth>
                  <AdminLayout><AdminProducts /></AdminLayout>
                </RequireAuth>
              } />
              <Route path="/admin/categories" element={
                <RequireAuth>
                  <AdminLayout><AdminCategories /></AdminLayout>
                </RequireAuth>
              } />
              <Route path="/admin/banners" element={
                <RequireAuth>
                  <AdminLayout><AdminBanners /></AdminLayout>
                </RequireAuth>
              } />
              <Route path="/admin/orders" element={
                <RequireAuth>
                  <AdminLayout><AdminOrders /></AdminLayout>
                </RequireAuth>
              } />
              <Route path="/admin/settings" element={
                <RequireAuth>
                  <AdminLayout><AdminSettings /></AdminLayout>
                </RequireAuth>
              } />
            </Routes>
          </Router>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
