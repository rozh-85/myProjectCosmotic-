
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { storageService } from '../services/storageService';
import { Product, Category, ProductVariant } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({ isOpen: false, id: null, name: '' });

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: 0,
    description: '',
    image_url: '',
    images: [] as string[],
    variants: [] as ProductVariant[],
    in_stock: true,
    is_featured: false,
  });

  const [newVariant, setNewVariant] = useState({ name: '', type: 'color' as 'color' | 'size' | 'other', price_override: '', image_url: '' });

  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([
        dbService.getProducts(),
        dbService.getCategories(),
      ]);
      setProducts(p);
      setCategories(c);
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
    if (!formData.category_id) {
      showToast("Please select a category", 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=400'
      };

      if (editingId) {
        await dbService.updateProduct(editingId, payload);
        showToast("Product updated successfully!");
      } else {
        await dbService.addProduct(payload);
        showToast("Product published successfully!");
      }

      setFormData({
        name: '',
        category_id: '',
        price: 0,
        description: '',
        image_url: '',
        images: [],
        variants: [],
        in_stock: true,
        is_featured: false,
      });
      setEditingId(null);
      await fetchData();
    } catch (err) {
      showToast("Action failed. Please try again.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category_id: product.category_id || '',
      price: product.price,
      description: product.description || '',
      image_url: product.image_url || '',
      images: product.images || [],
      variants: product.variants || [],
      in_stock: product.in_stock,
      is_featured: product.is_featured,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category_id: '',
      price: 0,
      description: '',
      image_url: '',
      images: [],
      variants: [],
      in_stock: true,
      is_featured: false,
    });
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteModal({ isOpen: true, id: product.id, name: product.name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await dbService.deleteProduct(deleteModal.id);
      if (editingId === deleteModal.id) cancelEdit();
      showToast("Product deleted successfully");
      fetchData();
    } catch (err) {
      showToast("Failed to delete product.", 'error');
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await storageService.uploadImage(file);
      if (isGallery) {
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      } else {
        setFormData(prev => ({ ...prev, image_url: url }));
      }
    } catch (error) {
      showToast("Failed to upload image. Please check Supabase setup.", 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addVariant = () => {
    if (!newVariant.name) return;
    const variant: ProductVariant = {
      id: Math.random().toString(36).substring(2, 9),
      name: newVariant.name,
      type: newVariant.type,
      price_override: newVariant.price_override ? parseFloat(newVariant.price_override) : undefined,
      image_url: newVariant.image_url || undefined
    };
    setFormData(prev => ({ ...prev, variants: [...prev.variants, variant] }));
    setNewVariant({ name: '', type: 'color', price_override: '', image_url: '' });
  };

  const removeVariant = (id: string) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== id) }));
  };

  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, ...updates } : v)
    }));
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Products Management</h1>
        <p className="text-text-muted-light font-medium">Add and manage your beauty inventory items.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-2">
        {/* Product Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-surface-light p-6 md:p-8 rounded-3xl border border-border-light shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border-light pb-4 mb-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{editingId ? 'edit_square' : 'add_circle'}</span>
              <h3 className="text-lg font-bold">{editingId ? 'Edit Product Details' : 'New Product Details'}</h3>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Cancel Edit
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted-light">Product Name</label>
            <input
              required
              className="w-full rounded-xl bg-background-light border-2 border-transparent focus:border-primary focus:bg-white focus:ring-0 px-4 py-3 shadow-sm transition-all"
              placeholder="e.g. Velvet Night Recovery Cream"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              type="text"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted-light">Category</label>
              <select
                required
                className="w-full rounded-xl bg-background-light border-2 border-transparent focus:border-primary focus:bg-white focus:ring-0 px-4 py-3 shadow-sm transition-all appearance-none"
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted-light">Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted-light font-bold">$</span>
                <input
                  required
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-background-light border-2 border-transparent focus:border-primary focus:bg-white focus:ring-0 shadow-sm transition-all"
                  placeholder="0.00"
                  type="number"
                  value={formData.price || ''}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted-light">Main Product Image (URL or Upload)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl bg-background-light border-2 border-transparent focus:border-primary focus:bg-white focus:ring-0 px-4 py-3 shadow-sm transition-all"
                placeholder="Unsplash or direct image link"
                value={formData.image_url}
                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                type="url"
              />
              <label className={`flex items-center justify-center px-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageUpload(e, false)}
                  disabled={uploading}
                />
                <span className="material-symbols-outlined">{uploading ? 'hourglass_top' : 'cloud_upload'}</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted-light">Product Gallery / Variants (e.g. Colors, Shades)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {formData.images.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border border-border-light bg-white">
                  <img src={url} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    className="absolute top-1 right-1 size-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
              <label className={`aspect-square rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-primary cursor-pointer transition-all ${uploading ? 'opacity-50' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageUpload(e, true)}
                  disabled={uploading}
                />
                <span className="material-symbols-outlined text-xl">{uploading ? 'sync' : 'add_photo_alternate'}</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Add More</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted-light">Product Options (Colors, ml, Sizes)</label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                className="flex-1 rounded-xl bg-white border-2 border-transparent focus:border-primary px-4 py-2.5 text-sm shadow-sm transition-all"
                placeholder="Variant Name (e.g. Red, 50ml)"
                value={newVariant.name}
                onChange={e => setNewVariant({ ...newVariant, name: e.target.value })}
              />
              <select
                className="rounded-xl bg-white border-2 border-transparent focus:border-primary px-4 py-2.5 text-sm shadow-sm transition-all"
                value={newVariant.type}
                onChange={e => setNewVariant({ ...newVariant, type: e.target.value as any })}
              >
                <option value="color">Color</option>
                <option value="size">Size / ml</option>
                <option value="other">Other</option>
              </select>
              <input
                className="flex-1 rounded-xl bg-white border-2 border-transparent focus:border-primary px-4 py-2.5 text-sm shadow-sm transition-all"
                placeholder="Variant Image URL (optional)"
                value={newVariant.image_url}
                onChange={e => setNewVariant({ ...newVariant, image_url: e.target.value })}
              />
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <input
                  className="flex-1 rounded-xl bg-white border-2 border-transparent focus:border-primary px-4 py-2.5 text-sm shadow-sm transition-all"
                  placeholder="Price (+/-)"
                  type="number"
                  value={newVariant.price_override}
                  onChange={e => setNewVariant({ ...newVariant, price_override: e.target.value })}
                />
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-6 bg-slate-900 text-white rounded-xl hover:bg-primary transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  <span className="text-xs font-bold uppercase">Add Option</span>
                </button>
              </div>
            </div>

            {formData.variants.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {formData.variants.map(v => (
                  <div key={v.id} className="flex items-center gap-3 pl-3 pr-2 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-primary/30 transition-all group">
                    <span className={`size-2 rounded-full flex-shrink-0 ${v.type === 'color' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : v.type === 'size' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-slate-400'}`}></span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">{v.type}</span>
                      <span className="text-xs font-bold text-slate-700 leading-none">{v.name}</span>
                    </div>

                    <div className="flex items-center bg-slate-50 rounded-lg px-2 py-1 border border-slate-100 group-hover:border-primary/20 transition-all">
                      <span className="text-[10px] font-black text-slate-400 mr-1">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-14 bg-transparent border-none p-0 text-[11px] font-black text-primary focus:ring-0 placeholder:text-slate-300"
                        value={v.price_override === undefined ? '' : v.price_override}
                        onChange={(e) => updateVariant(v.id, { price_override: e.target.value ? parseFloat(e.target.value) : undefined })}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeVariant(v.id)}
                      className="size-6 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted-light">Description</label>
            <textarea
              className="w-full rounded-xl bg-background-light border-2 border-transparent focus:border-primary focus:bg-white focus:ring-0 px-4 py-3 shadow-sm resize-none transition-all"
              placeholder="Tell customers about the ingredients and benefits..."
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 py-4 bg-background-light/50 p-4 rounded-2xl">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={formData.in_stock}
                onChange={e => setFormData({ ...formData, in_stock: e.target.checked })}
              />
              <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6 relative shadow-inner"></div>
              <span className="font-bold text-sm text-slate-700 group-hover:text-primary transition-colors">In Stock</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={formData.is_featured}
                onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
              />
              <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6 relative shadow-inner"></div>
              <span className="font-bold text-sm text-slate-700 group-hover:text-primary transition-colors">Best Seller Selection</span>
            </label>
          </div>

          <button
            disabled={submitting}
            className="px-8 py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            type="submit"
          >
            {submitting ? 'Processing...' : editingId ? 'Update Product' : 'Publish Product'}
            <span className="material-symbols-outlined">{editingId ? 'save' : 'rocket_launch'}</span>
          </button>
        </form>

        {/* Sidebar / List */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl border border-border-light shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
              Recent Inventory
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{products.length} Items</span>
            </h3>
            <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
              {loading ? (
                <p className="text-center py-10 animate-pulse text-text-muted-light">Syncing with database...</p>
              ) : products.length === 0 ? (
                <div className="text-center py-10 opacity-60">
                  <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                  <p className="text-sm font-medium">No products yet.</p>
                </div>
              ) : products.map(p => (
                <div key={p.id} className={`group p-3 rounded-2xl border transition-all flex items-center gap-4 bg-background-light/30 ${editingId === p.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/30 hover:bg-primary/5'}`}>
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] font-bold text-primary">${p.price.toFixed(2)} • <span className="text-slate-500 uppercase">{p.category_name || 'Uncategorized'}</span></p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => handleDeleteClick(p)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-800">
              <span className="material-symbols-outlined filled">info</span>
              <p className="text-sm font-bold">Admin Pro Tip</p>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">Best Seller products appear in the "Best Sellers" grid on the storefront. Use high-quality Unsplash images for better conversions!</p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        isDestructive
        confirmText="Delete Product"
      />
    </div>
  );
};

export default AdminProducts;
