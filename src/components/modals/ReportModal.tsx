import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  previewText: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  targetId, 
  previewText 
}) => {
  const { reportContent } = useApp();
  const [reason, setReason] = useState('Spam / Hoax');
  const [customDetail, setCustomDetail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportContent('post', targetId, previewText, `${reason}: ${customDetail}`);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white text-[#0B0B0B] w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-gray-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto animate-bounce" />
            <h3 className="font-heading font-extrabold text-lg text-gray-900">
              Laporan Berhasil Diteruskan
            </h3>
            <p className="text-xs text-gray-500">
              Tim Moderasi Pengurus MKVERSE akan segera meninjau laporan Anda demi kenyamanan bersama.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <Flag className="w-5 h-5" />
              <h3 className="font-heading font-extrabold text-base text-gray-900">
                Laporkan Konten
              </h3>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs text-gray-600">
              <p className="font-bold text-gray-800 mb-0.5">Pratinjau Konten:</p>
              <p className="italic line-clamp-2">"{previewText}"</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Alasan Pelaporan
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="Spam / Hoax">Spam / Informasi Palsu (Hoax)</option>
                <option value="Ujaran Kebencian / SARA">Ujaran Kebencian / SARA</option>
                <option value="Bullying / Pelecehan">Bullying / Pelecehan / Perundungan</option>
                <option value="Konten Tidak Pantas">Konten Tidak Pantas / Pornoaksi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Detail Tambahan (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan secara singkat letak pelanggaran..."
                value={customDetail}
                onChange={(e) => setCustomDetail(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white font-heading font-extrabold py-3 px-4 rounded-2xl shadow-md hover:bg-red-700 transition-colors text-xs"
            >
              Kirim Laporan ke Moderasi Admin
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
