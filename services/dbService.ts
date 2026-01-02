
import { supabase } from '../lib/supabase';
import { Category, Product, Banner, Order } from '../types';

const formatError = (error: any): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  return error.message || error.details || error.hint || JSON.stringify(error);
};

export const dbService = {
  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products(count)')
        .order('name');
      
      if (error) {
        if (error.code === '42P01') return [];
        console.error("Error fetching categories:", formatError(error));
        throw new Error(formatError(error));
      }
      
      return (data || []).map(cat => {
        let pCount = 0;
        const productsField = cat.products;
        if (productsField) {
          if (Array.isArray(productsField)) {
            pCount = productsField[0]?.count ?? 0;
          } else if (typeof productsField === 'object') {
            pCount = (productsField as any).count ?? 0;
          }
        }
        
        return {
          id: String(cat.id ?? ''),
          name: String(cat.name ?? ''),
          slug: String(cat.slug ?? ''),
          description: String(cat.description ?? ''),
          image_url: String(cat.image_url ?? ''),
          is_visible: Boolean(cat.is_visible),
          product_count: Number(pCount)
        };
      });
    } catch (e) {
      return [];
    }
  },

  async addCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
    
    if (error) {
      const msg = formatError(error);
      console.error("Error adding category:", msg);
      throw new Error(msg);
    }
    return data;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id);
    if (error) {
      const msg = formatError(error);
      console.error("Error updating category:", msg);
      throw new Error(msg);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) {
      const msg = formatError(error);
      console.error("Error deleting category:", msg);
      throw new Error(msg);
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === '42P01') return [];
        console.error("Error fetching products:", formatError(error));
        throw new Error(formatError(error));
      }
      
      return (data || []).map(prod => {
        let catName = '';
        const categoryField = prod.categories;
        if (categoryField) {
          if (Array.isArray(categoryField)) {
            catName = categoryField[0]?.name ?? '';
          } else if (typeof categoryField === 'object') {
            catName = (categoryField as any).name ?? '';
          }
        }

        return {
          id: String(prod.id ?? ''),
          name: String(prod.name ?? ''),
          category_id: String(prod.category_id ?? ''),
          category_name: String(catName),
          price: Number(prod.price ?? 0),
          description: String(prod.description ?? ''),
          image_url: String(prod.image_url ?? ''),
          in_stock: Boolean(prod.in_stock),
          is_featured: Boolean(prod.is_featured),
          created_at: String(prod.created_at ?? '')
        };
      });
    } catch (e) {
      return [];
    }
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) {
      const msg = formatError(error);
      console.error("Error adding product:", msg);
      throw new Error(msg);
    }
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);
    if (error) {
      const msg = formatError(error);
      console.error("Error updating product:", msg);
      throw new Error(msg);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) {
      const msg = formatError(error);
      console.error("Error deleting product:", msg);
      throw new Error(msg);
    }
  },

  // Orders
  async createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();
    if (error) throw new Error(formatError(error));
    return data;
  },

  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01') return [];
      throw new Error(formatError(error));
    }
    return data || [];
  },

  // Banners
  async getBanners(): Promise<Banner[]> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === '42P01') return [];
        console.error("Error fetching banners:", formatError(error));
        throw new Error(formatError(error));
      }
      
      return (data || []).map(b => ({
        id: String(b.id),
        title: String(b.title || ''),
        subtitle: String(b.subtitle || ''),
        image_url: String(b.image_url || ''),
        button_text: String(b.button_text || ''),
        is_active: Boolean(b.is_active),
        created_at: String(b.created_at || '')
      }));
    } catch (e) {
      return [];
    }
  },

  async addBanner(banner: Omit<Banner, 'id' | 'created_at'>): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .insert([banner])
      .select()
      .single();
    
    if (error) {
      const msg = formatError(error);
      console.error("Error adding banner:", msg);
      throw new Error(msg);
    }
    return data;
  },

  async updateBanner(id: string, updates: Partial<Banner>): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id);
    if (error) {
      const msg = formatError(error);
      console.error("Error updating banner:", msg);
      throw new Error(msg);
    }
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);
    if (error) {
      const msg = formatError(error);
      console.error("Error deleting banner:", msg);
      throw new Error(msg);
    }
  }
};
