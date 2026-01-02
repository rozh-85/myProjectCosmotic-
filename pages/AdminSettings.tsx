import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { dbService } from '../services/dbService';
import { storageService } from '../services/storageService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const AdminSettings: React.FC = () => {
    const { user, signOut } = useAuth();
    const { showToast } = useToast();

    const [password, setPassword] = useState('');
    const [loadingPass, setLoadingPass] = useState(false);

    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPass, setNewUserPass] = useState('');
    const [loadingCreate, setLoadingCreate] = useState(false);

    // Schema Settings (Logo)
    const { logoUrl, refreshSettings } = useSettings();
    const [logoUrlStr, setLogoUrlStr] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [savingLogo, setSavingLogo] = useState(false);

    useEffect(() => {
        setLogoUrlStr(logoUrl);
    }, [logoUrl]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const url = await storageService.uploadImage(file);
            setLogoUrlStr(url);
            showToast("Image uploaded! Don't forget to save.", 'success');
        } catch (error) {
            alert("Upload failed. Make sure you ran the Database Setup Guide!");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSaveLogo = async () => {
        setSavingLogo(true);
        try {
            await dbService.updateSetting('logo_url', logoUrlStr);
            await refreshSettings();
            showToast("Store logo updated successfully", 'success');
        } catch (err: any) {
            showToast("Failed to save logo", 'error');
        } finally {
            setSavingLogo(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            showToast("Password must be at least 6 characters", 'error');
            return;
        }
        setLoadingPass(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;
            showToast("Password updated successfully", 'success');
            setPassword('');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setLoadingPass(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserPass.length < 6) {
            showToast("Password must be at least 6 characters", 'error');
            return;
        }
        // Warning confirmation
        if (!confirm("Creating a new user will sign you out of the current session immediately. Continue?")) {
            return;
        }

        setLoadingCreate(true);
        try {
            // This will sign up the new user and likely sign in as them
            const { error } = await supabase.auth.signUp({
                email: newUserEmail,
                password: newUserPass
            });

            if (error) throw error;

            showToast("User created! Please sign in with new credentials.", 'success');
            // The session likely changed automatically, but let's ensure we are clean
            // Actually, if signUp is successful, we are now that user.
            // We can just reload or redirect.
            window.location.href = '/#/admin';
            window.location.reload();

        } catch (err: any) {
            showToast(err.message, 'error');
            setLoadingCreate(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto w-full flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-black tracking-tight mb-2 text-slate-900">Admin Settings</h1>
                <p className="text-text-muted-light font-medium">Manage your account and security.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Current Session</h3>
                        <p className="text-sm text-slate-500 font-mono">{user?.email}</p>
                    </div>
                    <button onClick={() => signOut()} className="ml-auto px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-colors">
                        Sign Out
                    </button>
                </div>

                {/* Change Password */}
                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 max-w-md">
                    <h3 className="font-bold text-lg text-slate-900">Update Password</h3>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">New Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-primary transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loadingPass}
                        className="px-6 py-3 bg-slate-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all disabled:opacity-50 w-fit"
                    >
                        {loadingPass ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            {/* Store Identity (Logo) */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Store Identity</h3>
                    <p className="text-sm text-slate-400 mt-1">Upload your store logo to be used across the site and login page.</p>
                </div>

                <div className="flex flex-col gap-4 max-w-md">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Logo URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={logoUrlStr}
                                onChange={e => setLogoUrlStr(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-primary transition-all"
                                placeholder="https://..."
                            />
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={uploadingLogo}
                                />
                                <button type="button" className="h-full px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined">upload</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {logoUrlStr && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center">
                            <img src={logoUrlStr} alt="Logo Preview" className="h-12 object-contain" />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSaveLogo}
                        disabled={savingLogo}
                        className="px-6 py-3 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 w-fit"
                    >
                        {savingLogo ? 'Saving...' : 'Save Logo'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Create New Admin</h3>
                    <p className="text-sm text-slate-400 mt-1">Add another user who can access this panel. <span className="text-amber-600 font-bold">Warning: This will sign you out.</span></p>
                </div>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                        <input
                            type="email"
                            required
                            value={newUserEmail}
                            onChange={e => setNewUserEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-primary transition-all"
                            placeholder="new.admin@luxe.com"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                        <input
                            type="password"
                            required
                            value={newUserPass}
                            onChange={e => setNewUserPass(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-primary transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={loadingCreate}
                            className="px-6 py-3 bg-slate-50 text-slate-900 border border-slate-200 font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50 w-fit"
                        >
                            {loadingCreate ? 'Creating...' : 'Create Admin User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSettings;
