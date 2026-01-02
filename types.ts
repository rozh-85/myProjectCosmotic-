
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_visible: boolean;
  created_at?: string;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  category_id?: string;
  category_name?: string;
  price: number;
  description?: string;
  image_url?: string;
  in_stock: boolean;
  is_featured: boolean;
  created_at?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  button_text?: string;
  is_active: boolean;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id?: string;
  customer_name: string;
  phone_number: string;
  address: string;
  city: string;
  total_price: number;
  status: 'pending' | 'completed' | 'cancelled';
  items: any[];
  created_at?: string;
}

export interface AppState {
  categories: Category[];
  products: Product[];
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
}
