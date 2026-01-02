
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { storageService } from '../services/storageService';
import { Category } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({ isOpen: false, id: null, name: '' });

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_visible: true,
  });

  const fetchData = async () => {
    try {
      const data = await dbService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await dbService.updateCategory(editingId, formData);
        showToast("Category updated successfully!");
      } else {
        await dbService.addCategory({
          ...formData,
          image_url: formData.image_url || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400'
        });
        showToast("Category created successfully!");
      }

      cancelEdit();
      await fetchData();
    } catch (err) {
      showToast("Action failed. Please try again.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      is_visible: category.is_visible,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_visible: true,
    });
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteModal({ isOpen: true, id: category.id, name: category.name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await dbService.deleteCategory(deleteModal.id);
      if (editingId === deleteModal.id) cancelEdit();
      showToast("Category deleted successfully");
      fetchData();
    } catch (err) {
      showToast("Failed to delete category.", 'error');
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await storageService.uploadImage(file);
      setFormData({ ...formData, image_url: url });
    } catch (error) {
      showToast("Failed to upload image. Please check Supabase setup.", 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Category Management</h2>
        <p className="text-text-muted-light font-medium">Group your products for a better shopping experience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-2">
        {/* Category List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {loading ? (
            <div className="animate-pulse flex flex-col gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl"></div>)}
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-border-light text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">category</span>
              <p className="text-slate-400 font-bold">No categories found in database.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className={`group p-4 rounded-3xl border shadow-lg hover:shadow-2xl transition-all flex items-center gap-4 relative overflow-hidden bg-surface-light ${editingId === cat.id ? 'border-primary ring-1 ring-primary/20' : 'border-border-light hover:border-primary/20'}`}>
                  <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                    <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-900 truncate">{cat.name}</h3>
                    </div>
                    <p className="text-xs text-text-muted-light line-clamp-1 mb-2 font-medium">{cat.description || 'No description provided.'}</p>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${cat.is_visible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {cat.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                      <span className="text-[11px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">{cat.product_count || 0} Products</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(cat)} className="h-8 w-8 rounded-full bg-slate-50 hover:bg-primary/5 text-slate-300 hover:text-primary flex items-center justify-center transition-all shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onClick={() => handleDeleteClick(cat)} className="h-8 w-8 rounded-full bg-slate-50 hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Category Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface-light rounded-[2rem] border border-border-light shadow-2xl sticky top-24 overflow-hidden">
            <div className="p-8 border-b border-border-light bg-primary/5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{editingId ? 'Edit Category' : 'Add Category'}</h3>
                <p className="text-sm text-text-muted-light mt-1 font-medium">{editingId ? 'Update this collection.' : 'Create a new collection.'}</p>
              </div>
              {editingId && (
                <button onClick={cancelEdit} className="text-slate-400 hover:text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-text-muted-light mb-2">Category Name</label>
                <input
                  required
                  className="w-full rounded-2xl bg-background-light border-2 border-transparent focus:border-primary focus:bg-white px-5 py-4 text-sm font-bold shadow-sm transition-all"
                  placeholder="e.g. Skin Essentials"
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-text-muted-light mb-2">URL Slug (Auto-generated)</label>
                <input
                  required
                  readOnly
                  className="w-full rounded-2xl bg-slate-100 border-2 border-transparent px-5 py-4 text-sm font-mono text-slate-500 cursor-not-allowed"
                  value={formData.slug}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-text-muted-light mb-2">Image URL</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-2xl bg-background-light border-2 border-transparent focus:border-primary focus:bg-white px-5 py-4 text-sm font-bold shadow-sm transition-all"
                    placeholder="Unsplash direct link"
                    type="url"
                    value={formData.image_url}
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  />
                  <label className={`flex items-center justify-center px-5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <span className="material-symbols-outlined">{uploading ? 'hourglass_top' : 'cloud_upload'}</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-text-muted-light mb-2">Description</label>
                <textarea
                  className="w-full rounded-2xl bg-background-light border-2 border-transparent focus:border-primary focus:bg-white px-5 py-4 text-sm font-bold shadow-sm resize-none transition-all"
                  placeholder="Brief summary..."
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-background-light border border-slate-100">
                <span className="text-sm font-black text-slate-700">Display on Store</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_visible}
                    onChange={e => setFormData({ ...formData, is_visible: e.target.checked })}
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6 shadow-inner"></div>
                </label>
              </div>
              <button
                disabled={submitting}
                className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black shadow-2xl shadow-primary/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                type="submit"
              >
                <span className="material-symbols-outlined">{editingId ? 'save' : 'add_task'}</span>
                {submitting ? 'Processing...' : editingId ? 'Update Category' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteModal.name}"? Products in this category will become uncategorized.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        isDestructive
        confirmText="Delete Category"
      />
    </div>
  );
};

export default AdminCategories;
