
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const from = (location.state as any)?.from?.pathname || '/admin';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            showToast("Welcome back!", 'success');
            navigate(from, { replace: true });
        } catch (err: any) {
            showToast(err.message || "Failed to sign in", 'error');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white font-store">
            <div className="w-full max-w-md p-8 md:p-12 flex flex-col gap-10 animate-fade-in">

                {/* Logo & Header */}
                <div className="text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 text-primary mb-2">
                        <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path clip-rule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900">Luxe Admin</h1>
                        <p className="text-slate-400 font-medium mt-2">Sign in to manage your store.</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-2 border-slate-200 focus:border-primary rounded-lg text-slate-900 font-bold placeholder:text-slate-300 outline-none transition-all"
                            placeholder="admin@luxe.com"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-2 border-slate-200 focus:border-primary rounded-lg text-slate-900 font-bold placeholder:text-slate-300 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-lg hover:bg-primary-dark shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Verifying...' : 'Dashboard Access'}
                        {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                    </button>
                </form>

                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Secure Admin Portal
                </div>
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default Login;
