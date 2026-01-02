
import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={!isLoading ? onCancel : undefined}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                <div className={`p-6 flex flex-col items-center text-center gap-4 ${isDestructive ? 'bg-red-50/50' : ''}`}>
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-2 ${isDestructive ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'
                        }`}>
                        <span className="material-symbols-outlined text-3xl">
                            {isDestructive ? 'warning' : 'info'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-black text-slate-900">{title}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                : 'bg-primary hover:bg-primary-dark shadow-primary/20'
                            }`}
                    >
                        {isLoading && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                        {confirmText}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default ConfirmModal;
