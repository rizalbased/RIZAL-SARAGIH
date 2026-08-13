import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CompleteProfileModal: React.FC = () => {
  const { currentUser, submitGoogleUsername } = useApp();
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const handleCleanInput = (val: string) => {
    // lowercase and remove spaces and non-allowed characters
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setUsername(clean);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || username.trim().length < 3) {
      setErrorMsg('Username minimal 3 karakter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await submitGoogleUsername(username);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Gagal menyimpan username.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-2 border-black p-6 sm:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_#000] relative overflow-hidden">
        
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 border-2 border-black mb-3 shadow-[2px_2px_0px_0px_#000]">
            <Sparkles className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-black tracking-tight">
            Lengkapi Profile MKVERSE
          </h2>
          <p className="text-sm font-medium text-gray-600 mt-1">
            Selamat datang di komuini digital SMK Multi Karya! Pilih username unik kamu untuk melanjutkan.
          </p>
        </div>

        {/* Google User Profile Card */}
        <div className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-2xl border-2 border-black/10 mb-6">
          <img 
            src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`} 
            alt={currentUser.name}
            className="w-12 h-12 rounded-xl border-2 border-black object-cover bg-white"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-black text-sm truncate">{currentUser.name}</h4>
            <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              ✓ Terhubung dengan Google
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Username MKVERSE <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleCleanInput(e.target.value)}
                placeholder="username_kamu"
                maxLength={30}
                required
                className="w-full pl-8 pr-4 py-3 bg-gray-50 rounded-2xl border-2 border-black font-semibold text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_0px_#000] transition-all text-sm"
              />
            </div>
            <p className="text-[11px] font-medium text-gray-500 mt-1.5 leading-tight">
              Username bersifat unik, tidak dapat sama dengan user lain, dan digunakan untuk dicari oleh warga sekolah.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border-2 border-red-500 text-red-700 rounded-xl text-xs font-medium animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Menyimpan Username...</span>
              </>
            ) : (
              <>
                <span>Lanjutkan ke MKVERSE</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
