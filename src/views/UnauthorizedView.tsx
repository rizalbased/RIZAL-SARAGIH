import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface UnauthorizedViewProps {
  onNavigateHome: () => void;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({ onNavigateHome }) => {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-red-200 shadow-xl max-w-lg mx-auto my-12 animate-fade-in space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
        <Lock className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
          AKSES DITOLAK (403)
        </h1>
        <p className="text-xs text-gray-600 font-medium leading-relaxed">
          Halaman Admin Dashboard MKVERSE hanya dapat diakses oleh Pengurus Resmi dan Administrator SMK Multi Karya Medan.
        </p>
      </div>

      <div className="bg-red-50 p-3 rounded-2xl border border-red-100 text-[11px] text-red-700 font-semibold">
        Sistem keamanan MKVERSE secara otomatis mencatat setiap percobaan akses tanpa hak demi menjaga privasi warga sekolah.
      </div>

      <button
        onClick={onNavigateHome}
        className="w-full bg-[#0B0B0B] text-[#B8FF00] font-heading font-extrabold py-3 px-4 rounded-2xl shadow-md hover:bg-black transition-colors flex items-center justify-center gap-2 text-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda Publik</span>
      </button>
    </div>
  );
};
