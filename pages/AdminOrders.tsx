
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Order, ProductVariant } from '../types';
import { useToast } from '../context/ToastContext';

const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    const fetchOrders = async () => {
        try {
            const data = await dbService.getOrders();
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'completed') => {
        try {
            await dbService.updateOrderStatus(id, newStatus);
            showToast(newStatus === 'completed' ? "Order marked as completed" : "Order marked as pending");
            fetchOrders();
        } catch (err) {
            showToast("Failed to update status", 'error');
        }
    };

    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        return o.status === filter;
    });

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Order Management</h1>
                    <p className="text-text-muted-light font-medium">Track and fulfill customer orders.</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm gap-1">
                    {(['all', 'pending', 'completed'] as const).map(f => {
                        const count = f === 'all' ? orders.length : orders.filter(o => o.status === f).length;
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all flex items-center gap-2 ${filter === f
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <span>{f}</span>
                                {count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${filter === f
                                            ? 'bg-white text-primary'
                                            : f === 'pending'
                                                ? 'bg-primary text-white animate-pulse'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {loading ? (
                    <div className="animate-pulse flex flex-col gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-3xl"></div>)}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-border-light text-center flex flex-col items-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">shopping_basket</span>
                        <p className="text-slate-400 font-bold">No {filter !== 'all' ? filter : ''} orders found.</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-6 pb-6 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl shadow-inner ${order.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-amber-100 text-amber-600'
                                        }`}>
                                        <span className="material-symbols-outlined">
                                            {order.status === 'completed' ? 'check_circle' : 'pending'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900">Order #{order.id?.slice(0, 8)}</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                            {new Date(order.created_at || '').toLocaleDateString()} • {new Date(order.created_at || '').toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${order.status === 'completed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                        {order.status}
                                    </span>
                                    {order.status === 'pending' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id!, 'completed')}
                                            className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-primary transition-colors flex items-center gap-2"
                                        >
                                            <span>Mark Complete</span>
                                            <span className="material-symbols-outlined text-[16px]">check</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Customer Info */}
                                <div className="flex flex-col gap-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Customer Details</h4>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-sm">person</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{order.customer_name}</p>
                                                <p className="text-xs text-slate-400">Customer</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-sm">call</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{order.phone_number || 'N/A'}</p>
                                                <p className="text-xs text-slate-400">Phone</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{order.address || 'N/A'}</p>
                                                <p className="text-xs text-slate-400">{order.city || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="lg:col-span-2 flex flex-col gap-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Order Items</h4>
                                    <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3 border border-slate-100">
                                        {order.items && order.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-white rounded-lg overflow-hidden border border-slate-100">
                                                        <img src={item.product?.image_url} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900">{item.product?.name || 'Unknown Product'}</span>
                                                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {item.selectedVariants.map((v: ProductVariant) => (
                                                                    <span key={v.id} className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-black uppercase rounded-full border border-primary/10">
                                                                        {v.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <span className="text-xs text-slate-500 mt-1 font-bold">Qty: {item.quantity}</span>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">${((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-slate-200 mt-2 pt-3 flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">Total Amount</span>
                                            <span className="text-lg font-black text-primary">${order.total_price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
