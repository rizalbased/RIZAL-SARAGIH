import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, BookOpen, School, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserType } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { 
    login, 
    register, 
    authNeedsVerification, 
    authIsSuspended,
    resendVerification, 
    verifyEmailStatus, 
    sendResetPasswordEmail
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify' | 'suspended'>('login');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('Siswa');
  
  // Specific fields
  const [kelas, setKelas] = useState('XI RPL 1');
  const [jurusan, setJurusan] = useState('Rekayasa Perangkat Lunak');
  const [mataPelajaran, setMataPelajaran] = useState('Pemrograman Web');
  const [divisi, setDivisi] = useState('Sarana & Prasarana');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');

  // Cooldown & loading for resend email
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (authNeedsVerification) {
      setMode('verify');
    } else if (authIsSuspended) {
      setMode('suspended');
    }
  }, [authNeedsVerification, authIsSuspended]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Password Strength calculation
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

  const strength = getPasswordStrength(regPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await login(loginEmail, loginPassword, rememberMe);
      setIsLoading(false);

      if (res.success) {
        onClose();
        if ((res.user?.role === 'ADMIN' || res.user?.role === 'SUPER_ADMIN') && onNavigate) {
          onNavigate('admin');
        }
      } else if (res.needsVerification) {
        setMode('verify');
      } else if (res.isSuspended) {
        setMode('suspended');
      } else {
        setErrorMessage(res.message || 'Email/username atau password tidak terdaftar.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Terjadi kesalahan saat masuk.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (regPassword.length < 8) {
      setErrorMessage('Password minimal 8 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Konfirmasi password tidak sama. Pastikan kedua kolom kata sandi cocok.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await register({
        name: regName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        userType,
        kelas: userType === 'Siswa' ? kelas : undefined,
        jurusan: userType === 'Siswa' ? jurusan : undefined,
        mataPelajaran: userType === 'Guru/Staf' ? mataPelajaran : undefined,
        divisi: userType === 'Karyawan' ? divisi : undefined
      });

      setIsLoading(false);

      if (res.success) {
        if (res.needsVerification) {
          setSuccessMessage(res.message || 'Pendaftaran berhasil! Link verifikasi telah dikirim ke email Anda.');
          setMode('verify');
        } else {
          setSuccessMessage('Pendaftaran berhasil! Selamat datang di MKVERSE.');
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else {
        setErrorMessage(res.message || 'Gagal mendaftar. Silakan periksa kembali data Anda.');
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error("Registration error encountered:", err?.message || err);
      setErrorMessage(err?.message ? `Registrasi gagal: ${err.message}` : 'Terjadi kesalahan sistem saat mendaftar.');
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await resendVerification();
    setIsResending(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Email verifikasi berhasil dikirim.');
      setResendCooldown(60);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleCheckVerification = async () => {
    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');

    const verified = await verifyEmailStatus();
    setIsVerifying(false);

    if (verified) {
      setSuccessMessage('Email berhasil diverifikasi! Selamat datang di MKVERSE.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMessage('Email belum diverifikasi. Silakan cek email Anda dan klik link verifikasi terlebih dahulu.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await sendResetPasswordEmail(forgotEmail);
    setIsLoading(false);
    if (res.success) {
      setSuccessMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white text-[#0B0B0B] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border-2 border-black overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-black hover:bg-gray-100 rounded-full transition-colors border border-black"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0B0B0B] text-[#B8FF00] font-display font-extrabold text-2xl flex items-center justify-center mx-auto mb-2 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            MK
          </div>
          <h2 className="font-heading font-black text-2xl text-black">
            {mode === 'login' && 'Masuk ke MKVERSE'}
            {mode === 'register' && 'Daftar Akun Baru'}
            {mode === 'forgot' && 'Lupa Password'}
            {mode === 'verify' && 'Verifikasi Email'}
            {mode === 'suspended' && 'Akun Ditangguhkan'}
          </h2>
          <p className="text-xs text-gray-700 font-bold mt-1">
            Social Media Internal Warga SMK Multi Karya Medan
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-2xl mb-4 border-2 border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 text-green-800 text-xs font-bold p-3 rounded-2xl mb-4 border-2 border-green-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ---------------- LOGIN FORM ---------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-black mb-1">Username / Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-600 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="rizalapp / email@smkmultikarya.sch.id"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-600 absolute left-3 top-3.5" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-black cursor-pointer p-0.5"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-gray-700 font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#B8FF00] accent-black cursor-pointer" 
                />
                <span>Ingat Saya</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setMode('forgot');
                }}
                className="text-[#35B9FF] font-black hover:underline cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full neo-btn bg-[#B8FF00] text-black font-heading font-black py-3 px-4 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-sm cursor-pointer border-2 border-black flex items-center justify-center gap-2"
            >
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Masuk ke Aplikasi</span>
            </button>

            <p className="text-center text-xs text-gray-700 font-bold pt-2">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setMode('register');
                }}
                className="text-[#FF4F8B] font-black hover:underline cursor-pointer"
              >
                Daftar Sekarang
              </button>
            </p>
          </form>
        )}

        {/* ---------------- REGISTER FORM ---------------- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-black text-black mb-1">Status Keanggotaan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUserType('Siswa')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-colors border-2 border-black cursor-pointer ${
                    userType === 'Siswa' ? 'bg-[#35B9FF] text-black shadow-[2px_2px_0px_0px_#000]' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <School className="w-4 h-4" />
                  Siswa
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('Guru/Staf')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-colors border-2 border-black cursor-pointer ${
                    userType === 'Guru/Staf' || userType === 'Guru' || userType === 'Karyawan' ? 'bg-[#FF4F8B] text-black shadow-[2px_2px_0px_0px_#000]' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Guru / Staf
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-black text-black mb-0.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Rizal App"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-black mb-0.5">Username</label>
                <input
                  type="text"
                  required
                  placeholder="rizalapp"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-black mb-0.5">Email</label>
              <input
                type="email"
                required
                placeholder="nama@smkmultikarya.sch.id"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
              />
            </div>

            {userType === 'Siswa' && (
              <div className="grid grid-cols-2 gap-2 bg-[#F5F5F0] p-2 rounded-xl border-2 border-black">
                <div>
                  <label className="block text-[10px] font-black text-black mb-0.5">Kelas</label>
                  <select 
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-black rounded-lg text-xs font-bold"
                  >
                    <option value="X RPL 1">X RPL 1</option>
                    <option value="XI RPL 1">XI RPL 1</option>
                    <option value="XII RPL 1">XII RPL 1</option>
                    <option value="X TKJ 1">X TKJ 1</option>
                    <option value="XI DKV 1">XI DKV 1</option>
                    <option value="XII TKR 2">XII TKR 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black mb-0.5">Jurusan</label>
                  <select 
                    value={jurusan}
                    onChange={(e) => setJurusan(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-black rounded-lg text-xs font-bold"
                  >
                    <option value="Rekayasa Perangkat Lunak">RPL</option>
                    <option value="Teknik Komputer & Jaringan">TKJ</option>
                    <option value="Desain Komunikasi Visual">DKV</option>
                    <option value="Teknik Kendaraan Ringan">TKR</option>
                    <option value="Manajemen Perkantoran">MP</option>
                  </select>
                </div>
              </div>
            )}

            {(userType === 'Guru/Staf' || userType === 'Guru' || userType === 'Karyawan') && (
              <div className="bg-[#F5F5F0] p-2 rounded-xl border-2 border-black">
                <label className="block text-[10px] font-black text-black mb-0.5">Mata Pelajaran / Jabatan / Divisi</label>
                <input
                  type="text"
                  placeholder="Produktif RPL / Tata Usaha / Kurikulum"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-black rounded-lg text-xs font-bold"
                />
              </div>
            )}

            {/* PASSWORD INPUTS WITH EYE ICON */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-black text-black mb-0.5">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 8 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2 top-2.5 text-gray-600 hover:text-black cursor-pointer p-0.5"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-black mb-0.5">Konfirmasi Password</label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Ulangi password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-2 top-2.5 text-gray-600 hover:text-black cursor-pointer p-0.5"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* PASSWORD STRENGTH INDICATOR */}
            {regPassword && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span>Kekuatan Password:</span>
                  <span className={strength.percent === 100 ? 'text-green-600' : strength.percent === 66 ? 'text-yellow-600' : 'text-red-600'}>
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

            {errorMessage && (
              <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border-2 border-red-200 flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full neo-btn bg-[#B8FF00] text-black font-heading font-black py-3 px-4 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-sm mt-2 border-2 border-black cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Daftar Akun MKVERSE</span>
            </button>

            <p className="text-center text-xs text-gray-700 font-bold pt-1">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setMode('login');
                }}
                className="text-[#35B9FF] font-black hover:underline cursor-pointer"
              >
                Masuk Sekarang
              </button>
            </p>
          </form>
        )}

        {/* ---------------- FORGOT PASSWORD FORM ---------------- */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-black mb-1">Email Terdaftar</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-600 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="Masukkan email kamu (misal: user@smkmultikarya.sch.id)"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                />
              </div>
              <p className="text-[11px] text-gray-600 font-bold mt-1">
                Masukkan email yang kamu gunakan untuk mendaftar di MKVERSE.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full neo-btn bg-[#35B9FF] text-black font-heading font-black py-2.5 px-4 rounded-xl text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Kirim Link Reset Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                setSuccessMessage('');
                setMode('login');
              }}
              className="w-full text-center text-xs text-black font-black hover:underline cursor-pointer"
            >
              ← Kembali ke Login
            </button>
          </form>
        )}

        {/* ---------------- EMAIL VERIFICATION SCREEN ---------------- */}
        {mode === 'verify' && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-[#FFE600] border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] space-y-2">
              <Mail className="w-8 h-8 text-black mx-auto stroke-[2.5]" />
              <p className="font-heading font-black text-sm text-black">Link verifikasi telah dikirim ke email kamu.</p>
              <p className="text-xs text-black font-bold">
                Silakan buka email dan klik link verifikasi untuk mengaktifkan akun MKVERSE.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCheckVerification}
                disabled={isVerifying}
                className="w-full neo-btn bg-[#B8FF00] text-black font-heading font-black py-3 px-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifying && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Saya Sudah Verifikasi</span>
              </button>

              <button
                onClick={handleResendEmail}
                disabled={resendCooldown > 0 || isResending}
                className="w-full neo-btn bg-white text-black font-black py-2.5 px-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_#000] text-xs cursor-pointer hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResending && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>
                  {resendCooldown > 0 
                    ? `Kirim ulang tersedia dalam ${resendCooldown} detik` 
                    : 'Kirim Ulang Email'}
                </span>
              </button>

              <button
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-black font-black hover:underline pt-2 cursor-pointer"
              >
                ← Kembali ke Login
              </button>
            </div>
          </div>
        )}

        {/* ---------------- SUSPENDED ACCOUNT SCREEN ---------------- */}
        {mode === 'suspended' && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-red-100 border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] space-y-2">
              <AlertCircle className="w-10 h-10 text-red-600 mx-auto stroke-[2.5]" />
              <p className="font-heading font-black text-base text-red-700">Untuk sementara akun MKVERSE kamu tidak dapat digunakan.</p>
              <p className="text-xs text-gray-800 font-bold">
                Silakan hubungi administrator sekolah jika merasa ini adalah kesalahan.
              </p>
            </div>

            <button
              onClick={() => setMode('login')}
              className="w-full neo-btn bg-white text-black font-black py-2.5 px-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_#000] text-xs cursor-pointer"
            >
              ← Kembali ke Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
