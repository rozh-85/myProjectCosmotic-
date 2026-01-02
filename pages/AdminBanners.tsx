
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { storageService } from '../services/storageService';
import { Banner } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({ isOpen: false, id: null, name: '' });

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1200',
    mobile_image_url: '',
    button_text: 'Shop Now',
    is_active: true,
  });

  const fetchData = async () => {
    try {
      const data = await dbService.getBanners();
      setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await dbService.updateBanner(editingId, formData);
        showToast("Banner updated successfully!");
      } else {
        await dbService.addBanner(formData);
        showToast("Banner published successfully!");
      }
      cancelEdit();
      fetchData();
    } catch (err) {
      showToast("Action failed. Please try again.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      mobile_image_url: banner.mobile_image_url || '',
      button_text: banner.button_text || 'Shop Now',
      is_active: banner.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      subtitle: '',
      image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1200',
      mobile_image_url: '',
      button_text: 'Shop Now',
      is_active: true,
    });
  };

  const toggleStatus = async (banner: Banner) => {
    try {
      await dbService.updateBanner(banner.id, { is_active: !banner.is_active });
      fetchData();
    } catch (err) {
      showToast("Failed to update status", 'error');
    }
  };

  const handleDeleteClick = (banner: Banner) => {
    setDeleteModal({ isOpen: true, id: banner.id, name: banner.title });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await dbService.deleteBanner(deleteModal.id);
      if (editingId === deleteModal.id) cancelEdit();
      showToast("Banner deleted successfully");
      fetchData();
    } catch (err) {
      showToast("Failed to delete banner", 'error');
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'mobile_image_url') => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await storageService.uploadImage(file);
      setFormData({ ...formData, [field]: url });
    } catch (error) {
      showToast("Failed to upload image. Please check Supabase setup.", 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight">Banner Management</h2>
        <p className="text-text-muted-light">Manage the hero section sliders on the storefront.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Banner List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {loading ? (
            <div className="animate-pulse flex flex-col gap-4">
              {[1, 2].map(i => <div key={i} className="h-40 bg-gray-200 rounded-3xl"></div>)}
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-border-light text-center">
              <span className="material-symbols-outlined text-4xl text-text-muted-light mb-2">image</span>
              <p className="text-text-muted-light font-medium">No banners found. Create your first hero slider.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {banners.map(banner => (
                <div key={banner.id} className={`bg-surface-light rounded-3xl border shadow-sm overflow-hidden group transition-all ${editingId === banner.id ? 'border-primary ring-1 ring-primary/20' : 'border-border-light'}`}>
                  <div className="relative h-48 md:h-56">
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 flex flex-col justify-end">
                      <h3 className="text-white font-bold text-xl">{banner.title}</h3>
                      <p className="text-white/80 text-sm">{banner.subtitle}</p>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg ${banner.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(banner)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${banner.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                      >
                        {banner.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(banner)}
                      className="h-10 w-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface-light rounded-3xl border border-border-light shadow-lg sticky top-24">
            <div className="p-6 border-b border-border-light bg-primary/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{editingId ? 'Edit Banner' : 'New Banner'}</h3>
                <p className="text-xs text-text-muted-light mt-1">Design a high-converting hero slider.</p>
              </div>
              {editingId && (
                <button onClick={cancelEdit} className="text-slate-400 hover:text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-text-muted-light mb-1">Main Title</label>
                <input
                  required
                  className="w-full rounded-xl bg-background-light border-transparent focus:border-primary px-4 py-3 text-sm font-medium"
                  placeholder="e.g. Summer Glow Collection"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-text-muted-light mb-1">Subtitle</label>
                <input
                  className="w-full rounded-xl bg-background-light border-transparent focus:border-primary px-4 py-3 text-sm font-medium"
                  placeholder="Short marketing catchphrase"
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase text-text-muted-light">Desktop Image</label>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">Rec: 1920x600</span>
                </div>
                <div className="flex gap-2">
                  <input
                    required
                    className="flex-1 rounded-xl bg-background-light border-transparent focus:border-primary px-4 py-3 text-sm font-medium"
                    placeholder="Desktop banner URL"
                    value={formData.image_url}
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  />
                  <label className={`flex items-center justify-center px-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleImageUpload(e, 'image_url')}
                      disabled={uploading}
                    />
                    <span className="material-symbols-outlined">{uploading ? 'hourglass_top' : 'cloud_upload'}</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase text-text-muted-light">Mobile Image (Optional)</label>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">Rec: 800x800</span>
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl bg-background-light border-transparent focus:border-primary px-4 py-3 text-sm font-medium"
                    placeholder="Mobile banner URL"
                    value={formData.mobile_image_url}
                    onChange={e => setFormData({ ...formData, mobile_image_url: e.target.value })}
                  />
                  <label className={`flex items-center justify-center px-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleImageUpload(e, 'mobile_image_url')}
                      disabled={uploading}
                    />
                    <span className="material-symbols-outlined">{uploading ? 'hourglass_top' : 'cloud_upload'}</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">If empty, desktop image will be scaled for mobile.</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-text-muted-light mb-1">Button Text</label>
                <input
                  className="w-full rounded-xl bg-background-light border-transparent focus:border-primary px-4 py-3 text-sm font-medium"
                  placeholder="e.g. Shop Now"
                  value={formData.button_text}
                  onChange={e => setFormData({ ...formData, button_text: e.target.value })}
                />
              </div>
              <button
                disabled={submitting}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 mt-2"
                type="submit"
              >
                {submitting ? 'Processing...' : editingId ? 'Update Banner' : 'Publish Banner'}
                <span className="material-symbols-outlined text-[18px]">{editingId ? 'save' : 'rocket_launch'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Banner"
        message={`Are you sure you want to delete "${deleteModal.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        isDestructive
        confirmText="Delete Banner"
      />
    </div>
  );
};

export default AdminBanners;
