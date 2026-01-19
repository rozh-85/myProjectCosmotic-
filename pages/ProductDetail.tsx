
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { Product, ProductVariant, CartItem } from '../types';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImg, setActiveImg] = useState('');
    const { cart, addToBag: addToCart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
    const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});
    const [errorMsg, setErrorMsg] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { showToast } = useToast();
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            setLoading(true);
            const data = await dbService.getProductById(id);
            if (data) {
                setProduct(data);
                setActiveImg(data.image_url || '');
            }
            setLoading(false);
        };
        fetchProduct();
    }, [id]);

    const addToBag = (p: Product) => {
        const types = Array.from(new Set(p.variants?.map(v => v.type) || []));
        const selectedList = Object.values(selectedVariants) as ProductVariant[];

        if (types.length > 0 && selectedList.length < types.length) {
            setErrorMsg('Please select all options');
            return;
        }

        setErrorMsg('');
        addToCart(p, selectedList);
        showToast("Added to Bag!");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Luxury...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Product Not Found</h2>
                <button onClick={() => navigate('/')} className="px-8 py-3 bg-primary text-white font-black uppercase rounded-xl">Go Back Home</button>
            </div>
        );
    }

    const allImages = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];

    return (
        <div className="min-h-screen bg-white">
            {/* Header Navigation */}
            <nav className="sticky top-0 z-[60] w-full bg-white/90 backdrop-blur-lg border-b border-slate-100 px-4 py-4 md:px-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-900 group">
                            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">west</span>
                            <span className="text-xs font-black uppercase tracking-widest">Back</span>
                        </button>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <h1 className="text-xl font-black tracking-tighter uppercase">LUXE</h1>
                        </div>
                    </div>
                    <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-slate-50 rounded-full transition-colors group">
                        <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 size-4 bg-primary text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-fade-in">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onRemove={(id, vIds) => removeFromCart(id, vIds)}
                onUpdate={(id, d, vIds) => updateQuantity(id, d, vIds)}
                total={cartTotal}
                onCheckout={() => navigate('/?view=checkout')}
            />

            <main className="max-w-6xl mx-auto px-4 py-8 md:py-12 md:px-8 flex flex-col md:flex-row gap-8 lg:gap-16 animate-fade-in">

                {/* Gallery Section - Updated to Carousel */}
                <div className="w-full md:w-[55%] flex flex-col gap-4">


                    {/* Main Image Carousel */}
                    <div className="relative group">
                        <div className="aspect-square md:aspect-[4/4.5] rounded-[2.5rem] overflow-hidden bg-slate-50 shadow-sm border border-slate-100 relative">
                            <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth" id="product-carousel">
                                {allImages.map((img, i) => (
                                    <div key={i} className="min-w-full h-full snap-center">
                                        <img src={img} className="w-full h-full object-cover" alt={`${product.name} view ${i + 1}`} />
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Carousel Indicators */}
                            {allImages.length > 1 && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                    {allImages.map((_, i) => (
                                        <div key={i} className="size-1.5 rounded-full bg-slate-900/10 transition-all" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail Selector */}
                    {allImages.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
                            {allImages.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        const el = document.getElementById('product-carousel');
                                        if (el) el.scrollLeft = el.offsetWidth * i;
                                        setActiveImg(img);
                                    }}
                                    className={`size-20 md:size-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImg === img ? 'border-primary scale-105 shadow-md' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Section - Optimized for Desktop */}
                <div className="w-full md:w-[45%] flex flex-col pt-2 py-4">
                    <div className="mb-6 flex flex-col gap-3">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{product.category_name}</span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">{product.name}</h1>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex flex-col">
                            <div className="px-5 py-3 bg-primary rounded-[1.5rem] shadow-xl shadow-primary/20 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="text-3xl font-black text-white flex items-center gap-1">
                                    <span className="text-sm font-bold opacity-60 self-start mt-1">$</span>
                                    {(product.price + (Object.values(selectedVariants) as ProductVariant[]).reduce((sum, v) => sum + (v.price_override || 0), 0)).toFixed(2)}
                                </span>
                            </div>
                            {Object.values(selectedVariants).some(v => ((v as ProductVariant).price_override || 0) !== 0) && (
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-2 ml-1 animate-fade-in">
                                    + ${(Object.values(selectedVariants) as ProductVariant[]).reduce((sum, v) => sum + (v.price_override || 0), 0).toFixed(2)} selected options
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${product.in_stock ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {product.in_stock ? 'In Stock' : 'Out of Stock'}
                            </span>
                            {product.in_stock && <span className="text-[10px] font-bold text-slate-400">Ready to ship</span>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mb-10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Expert Description</h4>
                        <div className="h-px w-12 bg-primary/20"></div>
                        <p className="text-slate-500 font-medium leading-relaxed max-w-lg text-sm md:text-base">
                            {product.description || 'Our commitment to excellence shines through in every detail of this product. Formulated with premium ingredients and designed for the modern individual who seeks both performance and style.'}
                        </p>
                    </div>

                    {/* Multi-Dimensional Variant Selection */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="mb-10 flex flex-col gap-8">
                            {(Array.from(new Set(product.variants.map(v => v.type))) as string[]).map(type => {
                                const typeVariants = product.variants!.filter(v => v.type === type);
                                return (
                                    <div key={type} className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex flex-col gap-1">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none">
                                                    {type === 'color' ? 'Available Shades' : type === 'size' ? 'Select Volume' : `Select ${type}`}
                                                </h4>
                                                <div className="h-0.5 w-4 bg-primary rounded-full"></div>
                                            </div>
                                            {selectedVariants[type] && (
                                                <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full animate-fade-in">
                                                    {selectedVariants[type].name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 no-scrollbar -mx-1 px-1 snap-x">
                                            {typeVariants.map((v) => (
                                                <button
                                                    key={v.id}
                                                    onClick={() => {
                                                        setSelectedVariants(prev => ({ ...prev, [type as string]: v }));
                                                        setErrorMsg('');
                                                        if (v.image_url) setActiveImg(v.image_url);
                                                    }}
                                                    className={`group relative flex-shrink-0 snap-start px-6 py-4 rounded-[2rem] border-2 transition-all duration-300 flex items-center gap-3 ${selectedVariants[type]?.id === v.id
                                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                        : 'border-slate-100 bg-white hover:border-primary/30 hover:shadow-md'}`}
                                                >
                                                    <div className={`size-2 rounded-full transition-transform duration-500 ${selectedVariants[type]?.id === v.id ? 'bg-primary scale-125' : 'bg-slate-200 group-hover:bg-primary/40'}`}></div>

                                                    <div className="flex flex-col items-start leading-none">
                                                        <span className={`text-[11px] font-black uppercase tracking-tight transition-colors ${selectedVariants[type]?.id === v.id ? 'text-primary' : 'text-slate-900'}`}>
                                                            {v.name}
                                                        </span>
                                                        {v.price_override !== undefined && v.price_override !== 0 && (
                                                            <div className={`mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${v.price_override > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                                                {v.price_override > 0 ? '+' : ''}${Math.abs(v.price_override).toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {selectedVariants[type]?.id === v.id && (
                                                        <span className="material-symbols-outlined text-[14px] text-primary animate-scale-in">check</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {errorMsg && <div className="px-4 py-2 bg-red-50 text-red-500 text-[10px] font-bold uppercase rounded-xl animate-bounce text-center">{errorMsg}</div>}
                        </div>
                    )}

                    <div className="mt-auto flex flex-col gap-4 pt-10 border-t border-slate-50">
                        <button
                            onClick={() => addToBag(product)}
                            disabled={!product.in_stock}
                            className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_20px_40px_rgba(236,72,153,0.15)] hover:bg-primary-dark transition-all transform active:scale-[0.98] hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">shopping_bag</span>
                            {product.in_stock ? 'Add to Bag' : 'Out of Stock'}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">verified</span>
                                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500">Authentic</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">local_shipping</span>
                                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500">Global</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ProductDetail;

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
                    <p className="text-[10px] text-slate-400 font-medium">Taxes and shipping calculated at checkout.</p>
                    <button onClick={onCheckout} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98]">Checkout Now</button>
                </div>
            )}
        </div>
    </div>
);
