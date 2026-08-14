import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { fetchApi } from '../../lib/api';

interface ResetPasswordModalProps {
  token: string;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  token,
  onClose,
  onOpenLogin,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-gray-200', percent: 0 };
    if (pass.length < 8) return { label: 'Lemah', color: 'bg-red-500', percent: 33 };
    const hasNumbers = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(pass);
    if (pass.length >= 10 && hasNumbers && hasSpecial) {
      return { label: 'Kuat', color: 'bg-[#B8FF00]', percent: 100 };
    }
    if (pass.length >= 8 && (hasNumbers || hasSpecial)) {
      return { label: 'Sedang', color: 'bg-yellow-500', percent: 66 };
    }
    return { label: 'Lemah', color: 'bg-red-500', percent: 33 };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password.length < 8) {
      setErrorMessage('Password baru minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi('/api/auth/reset-password.php', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      setLoading(false);

      if (res.success) {
        setSuccessMessage(
          res.message || 'Kata sandi berhasil diperbarui! Silakan login dengan password baru Anda.'
        );
      } else {
        setErrorMessage(
          res.message || 'Token reset password tidak valid atau telah kedaluwarsa.'
        );
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat mereset password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200 font-body">
      <div className="bg-white rounded-3xl border-2 border-black p-6 sm:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_#000] relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFE600] text-black border-2 border-black mb-3 shadow-[3px_3px_0px_0px_#000]">
            <KeyRound className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="font-heading font-black text-2xl text-black">
            Reset Password
          </h2>
          <p className="text-xs text-gray-700 font-bold mt-1">
            Buat kata sandi baru yang aman untuk akun MKVERSE Anda.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-2xl mb-4 border-2 border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 text-green-800 text-xs font-bold p-4 rounded-2xl border-2 border-green-300 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 stroke-[2.5]" />
              <span>{successMessage}</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full neo-btn bg-[#B8FF00] hover:bg-[#a6e600] text-black font-heading font-black py-3.5 px-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>Masuk dengan Password Baru</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black text-black mb-1">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span>Kekuatan Password:</span>
                  <span
                    className={
                      strength.percent === 100
                        ? 'text-green-600'
                        : strength.percent === 66
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden border border-black">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.percent}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-black mb-1">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-black"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full neo-btn bg-[#FFE600] text-black font-heading font-black py-3 px-4 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-xs mt-2 border-2 border-black cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Simpan Kata Sandi Baru</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-xs font-black text-gray-600 hover:underline pt-1"
            >
              Batal
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
