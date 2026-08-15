import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

interface VerifyEmailModalProps {
  token?: string;
  initialError?: string;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const VerifyEmailModal: React.FC<VerifyEmailModalProps> = ({ 
  token, 
  initialError, 
  onClose, 
  onOpenLogin 
}) => {
  const { resendVerification } = useApp();
  const [loading, setLoading] = useState(!initialError);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState(initialError || '');
  const [emailInput, setEmailInput] = useState('');
  const [showResendForm, setShowResendForm] = useState(Boolean(initialError));
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success?: boolean; text?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (initialError) {
      setLoading(false);
      setSuccess(false);
      setMessage(initialError);
      setShowResendForm(true);
      return;
    }

    const verifyToken = async () => {
      // If token provided or Supabase magic link / hash exchange
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (userData?.user?.email_confirmed_at) {
          // Update profile in DB if needed
          try {
            await supabase
              .from('profiles')
              .update({ email_verified: true, updated_at: new Date().toISOString() })
              .eq('id', userData.user.id);
          } catch {
            // Ignore if RLS or offline
          }

          setLoading(false);
          setSuccess(true);
          setMessage('Email berhasil diverifikasi! Akun Anda kini aktif di MKVERSE.');
          return;
        }

        if (token && token !== 'verified' && token !== 'error') {
          // Attempt OTP verification if token provided
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email',
          });

          if (!verifyError && verifyData?.user) {
            try {
              await supabase
                .from('profiles')
                .update({ email_verified: true, updated_at: new Date().toISOString() })
                .eq('id', verifyData.user.id);
            } catch {
              // Ignore
            }

            setLoading(false);
            setSuccess(true);
            setMessage('Email berhasil diverifikasi! Akun Anda kini aktif di MKVERSE.');
          } else {
            setLoading(false);
            setSuccess(false);
            setMessage(verifyError?.message || 'Token verifikasi tidak valid atau telah kedaluwarsa.');
            setShowResendForm(true);
          }
        } else if (token === 'verified') {
          setLoading(false);
          setSuccess(true);
          setMessage('Email berhasil diverifikasi! Akun Anda kini aktif di MKVERSE.');
        } else {
          setLoading(false);
          setSuccess(false);
          setMessage('Silakan klik tautan verifikasi yang telah dikirimkan ke email Anda.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setLoading(false);
        setSuccess(false);
        setMessage(err?.message || 'Terjadi kesalahan saat memverifikasi email.');
        setShowResendForm(true);
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [token, initialError]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setResending(true);
    setResendStatus(null);

    const res = await resendVerification(emailInput);
    setResending(false);
    setResendStatus({
      success: res.success,
      text: res.message,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200 font-body">
      <div className="bg-white rounded-3xl border-2 border-black p-6 sm:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_#000] relative overflow-hidden text-center">
        
        {/* Header Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0B0B0B] text-[#B8FF00] font-display font-extrabold text-2xl mb-4 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
          MK
        </div>

        <h2 className="font-heading font-black text-2xl text-black mb-2">
          Verifikasi Email Akun
        </h2>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 text-black animate-spin" />
            <p className="text-sm font-bold text-gray-700">
              Memverifikasi status email Anda...
            </p>
          </div>
        ) : success ? (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-900 rounded-2xl flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 stroke-[2.5]" />
              <p className="font-heading font-black text-base text-emerald-900">
                Verifikasi Berhasil!
              </p>
              <p className="text-xs font-semibold text-emerald-800">
                {message}
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full neo-btn bg-[#B8FF00] hover:bg-[#a6e600] text-black font-heading font-black py-3.5 px-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>Lanjut Masuk ke MKVERSE</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 bg-red-50 border-2 border-red-500 text-red-900 rounded-2xl flex flex-col items-center gap-2">
              <AlertCircle className="w-10 h-10 text-red-600 stroke-[2.5]" />
              <p className="font-heading font-black text-base text-red-900">
                Verifikasi Email
              </p>
              <p className="text-xs font-semibold text-red-800">
                {message}
              </p>
            </div>

            {!showResendForm ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowResendForm(true)}
                  className="w-full neo-btn bg-[#FFE600] hover:bg-[#ebd300] text-black font-heading font-black py-3 px-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] text-xs cursor-pointer"
                >
                  Kirim Ulang Link Verifikasi
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-black text-gray-700 hover:text-black"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Email Terdaftar Kamu
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@smkmultikarya.sch.id"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                {resendStatus && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-bold ${
                      resendStatus.success
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : 'bg-red-50 border-red-500 text-red-800'
                    }`}
                  >
                    {resendStatus.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resending}
                  className="w-full neo-btn bg-[#35B9FF] text-black font-black py-2.5 px-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {resending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kirim Link Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowResendForm(false)}
                  className="w-full text-center text-xs font-black text-gray-600 hover:underline pt-1"
                >
                  Batal
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
