import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { Product, Category, Banner, CartItem } from '../types';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

const Storefront: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // UI State
  const { cart, addToBag: addToCart, removeFromCart, updateQuantity, cartCount, cartTotal, clearCart } = useCart();
  const { bannerDuration } = useSettings();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'category' | 'best-sellers' | 'checkout' | 'success'>('home');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Banner Carousel State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Scroll to Top effect
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-slide effect
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      if (!bannerRef.current) return;

      const nextIndex = (currentBannerIndex + 1) % banners.length;
      setCurrentBannerIndex(nextIndex);

      const width = bannerRef.current.offsetWidth;
      bannerRef.current.scrollTo({
        left: width * nextIndex,
        behavior: 'smooth'
      });
    }, bannerDuration); // Use dynamic duration from settings

    return () => clearInterval(interval);
  }, [banners.length, currentBannerIndex, bannerDuration]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, c, b] = await Promise.all([
          dbService.getProducts(),
          dbService.getCategories(),
          dbService.getBanners()
        ]);
        setProducts(p);
        setCategories(c.filter(cat => cat.is_visible));
        setBanners(b.filter(banner => banner.is_active));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view === 'checkout') {
      setActiveView('checkout');
      // Clean up URL without refreshing
      window.history.replaceState({}, '', '/');
    }
  }, [location]);

  const changeView = (view: 'home' | 'category' | 'best-sellers' | 'checkout' | 'success', categoryId: string | null = null) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveView(view);
      setActiveCategoryId(categoryId);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setIsTransitioning(false);
    }, 250);
  };

  const handleCategoryIconClick = (slug: string) => {
    if (activeView !== 'home') {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveView('home');
        setActiveCategoryId(null);
        setIsTransitioning(false);
        setTimeout(() => scrollToSection(slug), 100);
      }, 250);
    } else {
      scrollToSection(slug);
    }
  };

  const scrollToSection = (slug: string) => {
    const element = document.getElementById(`section-${slug}`);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const addToBag = (product: Product) => {
    // If the product has options (variants), we MUST go to details to choose
    if (product.variants && product.variants.length > 0) {
      navigate(`/product/${product.id}`);
    } else {
      addToCart(product);
    }
  };

  // removeFromCart and updateQuantity are now provided by useCart

  const featuredProducts = products.filter(p => p.is_featured);
  // cartCount and cartTotal are now provided by useCart

  const handleCheckout = () => {
    setIsCartOpen(false);
    changeView('checkout');
  };

  const handlePlaceOrder = async (details: { name: string; email: string; phone: string; address: string; city: string }) => {
    try {
      await dbService.createOrder({
        customer_name: details.name,
        phone_number: details.phone,
        address: details.address,
        city: details.city,
        total_price: cartTotal,
        status: 'pending',
        items: cart
      });
      clearCart();
      changeView('success');
    } catch (err) {
      alert("Failed to place order. Please try again.");
    }
  };

  // Determine what products to display in non-home views
  let filteredProducts = products;
  let viewTitle = "";
  if (activeView === 'best-sellers') {
    filteredProducts = featuredProducts;
    viewTitle = "Best Sellers";
  } else if (activeView === 'category' && activeCategoryId) {
    filteredProducts = products.filter(p => p.category_id === activeCategoryId);
    viewTitle = categories.find(c => c.id === activeCategoryId)?.name || "Collection";
  } else if (activeView === 'checkout') {
    viewTitle = "Checkout";
  } else if (activeView === 'success') {
    viewTitle = "Order Confirmed";
  }

  return (
    <div className="relative flex flex-col min-h-screen w-full font-store bg-white scroll-smooth overflow-x-hidden">

      {/* Drawer Components (Cart & Menu) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={(id, vIds) => removeFromCart(id, vIds)}
        onUpdate={(id, d, vIds) => updateQuantity(id, d, vIds)}
        total={cartTotal}
        onCheckout={handleCheckout}
      />

      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        categories={categories}
        onNavigateHome={() => changeView('home')}
        onNavigateCategory={(id) => changeView('category', id)}
      />

      {/* Header */}
      <header className="sticky top-0 z-[60] w-full backdrop-blur-lg bg-white/90 border-b border-slate-100">
        <div className="px-4 py-3 md:px-8 max-w-[1280px] mx-auto flex items-center justify-between">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-full hover:bg-slate-50 text-slate-900 transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => changeView('home')}>
            <div className="w-6 h-6 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clip-rule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill-rule="evenodd"></path>
              </svg>
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">LUXE</h1>
          </div>

          <button onClick={() => setIsCartOpen(true)} className="p-2 rounded-full hover:bg-slate-50 text-slate-900 relative">
            <span className="material-symbols-outlined">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-4 bg-primary text-white text-[9px] flex items-center justify-center font-black rounded-full ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-grow flex flex-col items-center w-full transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

        {activeView === 'home' ? (
          /* Homepage Layout */
          <div className="w-full">
            {/* Hero Slider */}
            <section className="px-4 py-4 md:px-8 max-w-[1400px] mx-auto">
              <div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl h-[35vh] md:h-[45vh] min-h-[250px] group shadow-sm">
                <div
                  ref={bannerRef}
                  className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-full scroll-smooth"
                  onScroll={(e) => {
                    const scrollLeft = e.currentTarget.scrollLeft;
                    const width = e.currentTarget.offsetWidth;
                    const index = Math.round(scrollLeft / width);
                    if (index !== currentBannerIndex) {
                      // Handled by state
                    }
                  }}
                >
                  {banners.length > 0 ? banners.map((banner, idx) => (
                    <div key={banner.id} className="snap-center shrink-0 w-full h-full relative">
                      <picture className="absolute inset-0 w-full h-full">
                        {banner.mobile_image_url && <source media="(max-width: 768px)" srcSet={banner.mobile_image_url} />}
                        <img src={banner.image_url} className="w-full h-full object-cover" alt={banner.title} />
                      </picture>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full text-white">
                        <div className="max-w-xl flex flex-col gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 backdrop-blur-md px-3 py-1 w-fit rounded-full">Seasonal Drop</span>
                          <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase leading-[1.1]">{banner.title}</h2>
                          <p className="text-sm md:text-lg opacity-90 font-medium">{banner.subtitle}</p>
                          <button
                            onClick={() => changeView('best-sellers')}
                            className="mt-4 px-8 py-3 bg-white text-slate-900 text-xs font-black uppercase rounded-full shadow-lg hover:bg-primary hover:text-white transition-all w-fit"
                          >
                            {banner.button_text || 'Shop Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
                      <span className="text-slate-300 font-black uppercase">Luxe Beauty</span>
                    </div>
                  )}
                </div>
                {/* Carousel Indicators */}
                {banners.length > 1 && (
                  <div className="absolute bottom-6 right-6 flex gap-2 z-10">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentBannerIndex(idx);
                          if (bannerRef.current) {
                            bannerRef.current.scrollTo({
                              left: bannerRef.current.offsetWidth * idx,
                              behavior: 'smooth'
                            });
                          }
                        }}
                        className={`h-1.5 rounded-full transition-all ${idx === currentBannerIndex
                          ? 'w-8 bg-white'
                          : 'w-2 bg-white/40 hover:bg-white/60'
                          }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Category Icons Bar - SMOOTH SCROLLS */}
            <section className="px-4 py-6 md:px-8 max-w-[1280px] mx-auto">
              <div className="flex overflow-x-auto gap-8 md:gap-12 pb-4 no-scrollbar items-center">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryIconClick(cat.slug)}
                    className="flex-none flex flex-col items-center gap-2 group"
                  >
                    <div className="size-16 md:size-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all p-0.5 shadow-sm">
                      <img src={cat.image_url} className="w-full h-full object-cover rounded-full" alt={cat.name} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Best Sellers Section */}
            <section className="px-4 py-8 md:px-8 max-w-[1280px] mx-auto border-t border-slate-50">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Best Sellers</h3>
                  <p className="text-slate-400 text-xs md:text-sm font-medium mt-1">Our community favorites.</p>
                </div>
                <button
                  onClick={() => changeView('best-sellers')}
                  className="text-[11px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                >
                  See All <span className="material-symbols-outlined text-[16px]">east</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {featuredProducts.slice(0, 4).map(p => (
                  <ProductCard key={p.id} product={p} onAdd={() => addToBag(p)} onClick={() => navigate(`/product/${p.id}`)} />
                ))}
              </div>
            </section>

            {/* Category-wise Sections */}
            {categories.map(cat => {
              const catProducts = products.filter(p => p.category_id === cat.id);
              if (catProducts.length === 0) return null;
              return (
                <section key={cat.id} id={`section-${cat.slug}`} className="px-4 py-10 md:px-8 max-w-[1280px] mx-auto border-t border-slate-50">
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">{cat.name}</h3>
                      <p className="text-slate-400 text-xs md:text-sm font-medium mt-1">{cat.description || `Discover the ${cat.name} collection.`}</p>
                    </div>
                    <button
                      onClick={() => changeView('category', cat.id)}
                      className="text-[11px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                    >
                      Explore <span className="material-symbols-outlined text-[16px]">east</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {catProducts.slice(0, 4).map(p => (
                      <ProductCard key={p.id} product={p} onAdd={() => addToBag(p)} onClick={() => navigate(`/product/${p.id}`)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : activeView === 'checkout' ? (
          /* Checkout View */
          <div className="w-full max-w-4xl px-4 md:px-8 py-12 animate-fade-in">
            <div className="mb-10">
              <button
                onClick={() => changeView('home')}
                className="group flex items-center gap-3 text-slate-400 hover:text-primary transition-all w-fit"
              >
                <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">keyboard_backspace</span>
                </div>
                <div className="flex flex-col items-start translate-y-0.5">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Return to</span>
                  <span className="text-[11px] font-black text-slate-900 group-hover:text-primary uppercase tracking-wider leading-none">Home</span>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="flex flex-col gap-8">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Secure Checkout</h2>
                <CheckoutForm onSubmit={handlePlaceOrder} total={cartTotal} />
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col gap-6 sticky top-24">
                <h3 className="text-xl font-black uppercase tracking-tight">Order Summary</h3>
                <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  {cart.map((item, idx) => (
                    <div key={`${item.product.id}-${item.selectedVariants?.map(v => v.id).join('-') || idx}`} className="flex gap-4">
                      <div className="h-16 w-16 bg-white rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.product.image_url} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900">{item.product.name}</p>
                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <p className="text-[10px] font-black uppercase text-primary tracking-wider">
                            {item.selectedVariants.map(v => v.name).join(' • ')}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-sm text-slate-900">
                        ${((item.product.price + (item.selectedVariants || []).reduce((s, v) => s + (v.price_override || 0), 0)) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Shipping</span>
                    <span className="text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between text-xl font-black text-slate-900 mt-2 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeView === 'success' ? (
          /* Success View */
          <div className="w-full h-[60vh] flex flex-col items-center justify-center px-4 animate-fade-in text-center">
            <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2">Order Confirmed!</h2>
            <p className="text-slate-500 font-medium mb-8 max-w-md">Thank you for your purchase. We've received your order and will begin processing it right away.</p>
            <button onClick={() => changeView('home')} className="px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-colors">
              Continue Shopping
            </button>
          </div>
        ) : (
          /* Filtered Category / Best Sellers View */
          <div className="w-full max-w-[1280px] px-4 md:px-8 py-12 animate-fade-in">
            {/* Premium Back Navigation */}
            <div className="mb-4">
              <button
                onClick={() => changeView('home')} // Changed from navigate(-1) to changeView('home') for Storefront.tsx context
                className="group flex items-center gap-3 text-slate-400 hover:text-primary transition-all w-fit"
              >
                <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">keyboard_backspace</span>
                </div>
                <div className="flex flex-col items-start translate-y-0.5">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Return to</span>
                  <span className="text-[11px] font-black text-slate-900 group-hover:text-primary uppercase tracking-wider leading-none">Home</span> {/* Changed from {product.category_name} to Home */}
                </div>
              </button>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase mb-12">{viewTitle}</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {filteredProducts.length > 0 ? filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} onAdd={() => addToBag(p)} onClick={() => navigate(`/product/${p.id}`)} />
              )) : (
                <div className="col-span-full py-24 text-center text-slate-400 bg-slate-50 rounded-3xl">
                  <span className="material-symbols-outlined text-4xl mb-2">sentiment_neutral</span>
                  <p className="font-bold">No products found.</p>
                </div>
              )}
            </div>

            {/* Recommendations Bar at the Bottom */}
            <div className="mt-12 pt-10 border-t border-slate-100">
              <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase mb-8">Recommended For You</h4>
              <div className="flex overflow-x-auto gap-4 no-scrollbar">
                {categories.filter(c => c.id !== activeCategoryId).map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => changeView('category', cat.id)}
                    className="flex-none w-[160px] md:w-[220px] group cursor-pointer"
                  >
                    <div className="aspect-[4/5] rounded-3xl overflow-hidden mb-3 shadow-sm group-hover:shadow-xl transition-all relative">
                      <img src={cat.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.name} />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-primary transition-colors">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Area */}
        <footer className="w-full mt-0 py-12 bg-slate-950 text-white flex flex-col items-center">
          <div className="w-full max-w-[1280px] px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="size-6 text-primary">
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path clip-rule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill-rule="evenodd"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-black tracking-tighter uppercase">LUXE</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">Premium beauty solutions for the modern minimalist. Curated with love, powered by science.</p>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-black uppercase tracking-widest text-xs">Customer Care</h5>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Shipping & Returns</a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Track Order</a>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-black uppercase tracking-widest text-xs">Stay Connected</h5>
              <p className="text-sm text-slate-400">Join our newsletter for exclusive drops and beauty tips.</p>
              <div className="flex gap-2">
                <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs w-full focus:outline-none focus:border-primary transition-colors" placeholder="Email Address" />
                <button className="p-2 bg-primary rounded-xl text-white">
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          </div>
          <div className="w-full max-w-[1280px] px-8 pt-12 mt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <span>&copy; 2024 LUXE COSMETICS INC.</span>
            <div className="flex gap-6">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Accessibility</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Floating Bag Button */}
      {!isCartOpen && (
        <div className="fixed bottom-8 right-6 z-[100]">
          <button
            onClick={() => setIsCartOpen(true)}
            className="size-14 bg-white border-2 border-primary text-primary items-center justify-center rounded-full flex shadow-[0_10px_40px_rgba(236,72,153,0.15)] hover:scale-110 active:scale-95 transition-all duration-300 relative group"
          >
            <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
            {cartCount > 0 && (
              <span key={cartCount} className="absolute -top-1 -right-1 size-6 bg-primary text-white text-[11px] flex items-center justify-center font-black rounded-full ring-2 ring-white shadow-sm animate-bounce-short">
                {cartCount}
              </span>
            )}
            {/* Tooltip */}
            <span className="absolute right-full mr-4 px-3 py-1 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              View Bag
            </span>
          </button>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        @keyframes productFade {
          from { opacity: 0; transform: scale(1.08); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-product-fade {
          animation: productFade 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes bounceShort {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-short { animation: bounceShort 0.5s ease-in-out 1; }
      `}</style>
    </div>
  );
};

/* Internal Component: ProductCard */
/* Internal Component: ProductCard */
const ProductCard: React.FC<{ product: Product; onAdd: () => void; onClick: () => void }> = ({ product, onAdd, onClick }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];

  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % allImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allImages.length]);

  return (
    <div onClick={onClick} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer">
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-slate-50 border border-slate-100/50">
        <img
          src={allImages[(currentIdx + allImages.length - 1) % allImages.length]}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />
        <img
          src={allImages[currentIdx]}
          className="absolute inset-0 w-full h-full object-cover animate-product-fade"
          alt={product.name}
          key={allImages[currentIdx]}
        />
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-4">
            <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Out of Stock</span>
          </div>
        )}

        {/* Variant Type Badges */}
        {product.in_stock && product.variants && product.variants.length > 0 && (
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 pointer-events-none">
            {Array.from(new Set(product.variants.map(v => v.type))).map(type => (
              <div key={type} className="px-2.5 py-1.5 bg-white shadow-xl shadow-slate-200/50 rounded-xl flex items-center gap-2 border border-slate-50 transform hover:scale-105 transition-transform duration-300">
                <div className={`size-1.5 rounded-full ${type === 'color' ? 'bg-primary shadow-[0_0_8px_rgba(236,72,153,0.4)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'}`}></div>
                <span className="text-[8px] font-black text-slate-900 uppercase tracking-[0.05em]">
                  {type === 'color' ? 'Multiple Color' : type === 'size' ? 'Multiple ML' : `Multiple ${type}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Premium Desktop Hover Overlay */}
        <div className="hidden md:flex absolute inset-0 bg-black/5 backdrop-blur-0 group-hover:backdrop-blur-[2px] group-hover:bg-black/20 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            disabled={!product.in_stock}
            className="px-6 py-3 bg-primary text-white font-black text-[11px] uppercase rounded-full shadow-[0_10px_30px_rgba(236,72,153,0.3)] hover:scale-110 active:scale-95 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 tracking-widest flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">shopping_bag</span>
            {product.in_stock ? 'Add to Bag' : 'Out of Stock'}
          </button>
        </div>

        {/* Indicators for multiple images */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
            {allImages.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === currentIdx ? 'w-4 bg-primary' : 'w-1 bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col flex-grow px-1">
        <div className="flex flex-col mb-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{product.category_name || 'Beauty'}</span>
          <h4 className="font-bold text-slate-900 text-sm md:text-base leading-tight group-hover:text-primary transition-colors truncate">{product.name}</h4>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-black text-base md:text-lg text-slate-900 tracking-tighter">${product.price.toFixed(2)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            disabled={!product.in_stock}
            className="md:hidden size-9 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const CheckoutForm: React.FC<{ onSubmit: (data: any) => void; total: number }> = ({ onSubmit, total }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate delay
    await new Promise(r => setTimeout(r, 1000));
    onSubmit(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</label>
          <input required className="px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-xl font-bold text-slate-900 transition-all outline-none"
            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
          <input required type="email" className="px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-xl font-bold text-slate-900 transition-all outline-none"
            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Phone Number</label>
        <input required type="tel" className="px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-xl font-bold text-slate-900 transition-all outline-none"
          value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+964 770 000 0000" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Address</label>
        <input required className="px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-xl font-bold text-slate-900 transition-all outline-none"
          value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Street Address, Area" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">City / Governorate</label>
        <input required className="px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-xl font-bold text-slate-900 transition-all outline-none"
          value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Baghdad" />
      </div>

      <button disabled={loading} type="submit" className="mt-4 w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? 'Processing...' : `Pay $${total.toFixed(2)} & Place Order`}
        {!loading && <span className="material-symbols-outlined text-sm">lock</span>}
      </button>
      <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-[14px]">verified_user</span> Secure SSL Key Encryption
      </p>
    </form>
  );
};

/* Internal Component: CartDrawer */
const CartDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemove: (id: string, vIds?: string) => void;
  onUpdate: (id: string, d: number, vIds?: string) => void;
  total: number;
  onCheckout: () => void
}> = ({ isOpen, onClose, cart, onRemove, onUpdate, total, onCheckout }) => (
  <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isOpen ? 'visible' : 'invisible'}`}>
    <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
    <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Bag</h2>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{cart.length} Products</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
            <span className="material-symbols-outlined text-6xl mb-4">shopping_bag</span>
            <p className="font-black text-sm uppercase tracking-widest">Bag is empty</p>
          </div>
        ) : cart.map((item, idx) => {
          const variantIds = item.selectedVariants?.map(v => v.id).sort().join(',') || '';
          return (
            <div key={`${item.product.id}-${variantIds || idx}`} className="flex gap-4">
              <div className="size-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={item.product.image_url} className="w-full h-full object-cover" alt={item.product.name} />
              </div>
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.product.name}</h4>
                    {item.selectedVariants && item.selectedVariants.length > 0 && (
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">
                        {item.selectedVariants.map(v => v.name).join(' • ')}
                      </span>
                    )}
                  </div>
                  <button onClick={() => onRemove(item.product.id, variantIds)} className="text-red-500 hover:text-red-600 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-1">
                    <button onClick={() => onUpdate(item.product.id, -1, variantIds)} className="size-6 flex items-center justify-center text-slate-500 hover:bg-white rounded shadow-sm"><span className="material-symbols-outlined text-[14px]">remove</span></button>
                    <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                    <button onClick={() => onUpdate(item.product.id, 1, variantIds)} className="size-6 flex items-center justify-center text-slate-500 hover:bg-white rounded shadow-sm"><span className="material-symbols-outlined text-[14px]">add</span></button>
                  </div>
                  <span className="font-black text-slate-900 text-sm">
                    ${((item.product.price + (item.selectedVariants || []).reduce((s, v) => s + (v.price_override || 0), 0)) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
            <span className="text-xl font-black text-slate-900">${total.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Taxes and shipping calculated at checkout. Enjoy free global shipping on all orders this month.</p>
          <button onClick={onCheckout} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98]">Checkout Now</button>
        </div>
      )}
    </div>
  </div>
);

/* Internal Component: MenuDrawer */
const MenuDrawer: React.FC<{ isOpen: boolean; onClose: () => void; categories: Category[]; onNavigateHome: () => void; onNavigateCategory: (id: string) => void }> = ({ isOpen, onClose, categories, onNavigateHome, onNavigateCategory }) => (
  <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isOpen ? 'visible' : 'invisible'}`}>
    <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
    <div className={`absolute left-0 top-0 bottom-0 w-full max-w-[300px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Luxe</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="flex-1 p-6 flex flex-col gap-2">
        <button onClick={() => { onNavigateHome(); onClose(); }} className="flex items-center gap-4 py-3 text-lg font-bold text-slate-900 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">home</span> Home
        </button>
        <div className="h-px bg-slate-50 my-4"></div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Collections</span>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { onNavigateCategory(cat.id); onClose(); }}
            className="flex items-center justify-between py-3 text-sm font-bold text-slate-700 hover:text-primary transition-all"
          >
            {cat.name}
            <span className="material-symbols-outlined text-[16px] opacity-20">arrow_forward_ios</span>
          </button>
        ))}
        {/* Management Section Commented Out
        <div className="h-px bg-slate-50 my-4"></div>
        <Link to="/admin" className="flex items-center gap-4 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-all">
          <span className="material-symbols-outlined text-slate-300">settings</span> Management
        </Link>
        */}
      </div>
    </div>
  </div>
);

export default Storefront;
