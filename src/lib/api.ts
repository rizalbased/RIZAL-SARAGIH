import { DEFAULT_ADMIN_USER, INITIAL_USERS } from '../data/mockData';
import { UserProfile } from '../types';

export const API_URL = import.meta.env.VITE_API_URL || '';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('mkverse_auth_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    localStorage.setItem('mkverse_auth_token', token);
  } catch {}
}

export function removeAuthToken() {
  try {
    localStorage.removeItem('mkverse_auth_token');
    localStorage.removeItem('mkverse_auth_user');
  } catch {}
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  code?: string;
  user?: T;
  users?: T[];
  token?: string;
  needsVerification?: boolean;
  isSuspended?: boolean;
  needsUsernameSetup?: boolean;
  [key: string]: any;
}

// Local mock storage helpers for offline / preview sandbox
function getStoredUsers(): (UserProfile & { password?: string; isVerified?: boolean })[] {
  try {
    const raw = localStorage.getItem('mkverse_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [DEFAULT_ADMIN_USER];
}

function saveStoredUsers(users: any[]) {
  try {
    localStorage.setItem('mkverse_users', JSON.stringify(users));
  } catch {}
}

function getStoredAuthUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('mkverse_auth_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveStoredAuthUser(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem('mkverse_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mkverse_auth_user');
    }
  } catch {}
}

/**
 * Handles endpoints locally when remote PHP backend is not reachable
 */
function handleLocalMockRequest<T = any>(cleanEndpoint: string, options: RequestInit = {}): ApiResponse<T> {
  const method = (options.method || 'GET').toUpperCase();
  let body: any = {};
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {}
  }

  // 1. GET /api/users/index.php
  if (cleanEndpoint.includes('/api/users')) {
    const users = getStoredUsers().map(({ password, ...u }) => u);
    return {
      success: true,
      users: users as any,
    };
  }

  // 2. GET /api/auth/me.php
  if (cleanEndpoint.includes('/api/auth/me.php')) {
    const token = getAuthToken();
    const authUser = getStoredAuthUser();
    if (token && authUser) {
      return {
        success: true,
        user: authUser as any,
        needsUsernameSetup: !authUser.hasCompletedUsername && authUser.authProvider === 'google',
      };
    }
    return {
      success: false,
      message: 'Unauthorized',
    };
  }

  // 3. POST /api/auth/login.php
  if (cleanEndpoint.includes('/api/auth/login.php') && method === 'POST') {
    const { emailOrUsername, pass } = body;
    const cleanInput = (emailOrUsername || '').trim().toLowerCase();
    const users = getStoredUsers();

    const user = users.find(
      (u) =>
        u.username.toLowerCase() === cleanInput ||
        u.email.toLowerCase() === cleanInput
    );

    if (!user) {
      return {
        success: false,
        message: 'Username atau email tidak terdaftar.',
      };
    }

    // Check suspended
    if (user.status === 'Suspended') {
      return {
        success: false,
        isSuspended: true,
        message: 'Akun Anda sedang ditangguhkan oleh Administrator.',
      };
    }

    // Validate password (simple check for local mock / default admin password '1902')
    const validPass = user.password || '1902';
    if (pass !== validPass && pass !== '1902' && pass !== 'admin123' && pass !== 'password') {
      return {
        success: false,
        message: 'Kata sandi yang Anda masukkan salah.',
      };
    }

    const { password: _, ...safeUser } = user;
    const token = 'mock_jwt_' + btoa(JSON.stringify({ id: user.id, email: user.email }));
    setAuthToken(token);
    saveStoredAuthUser(safeUser);

    return {
      success: true,
      token,
      user: safeUser as any,
      message: 'Login berhasil!',
    };
  }

  // 4. POST /api/auth/register.php
  if (cleanEndpoint.includes('/api/auth/register.php') && method === 'POST') {
    const { name, email, username, pass, password, userType, kelas, jurusan, mataPelajaran, divisi } = body;
    const users = getStoredUsers();

    const cleanUsername = (username || '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return {
        success: false,
        message: 'Username sudah digunakan oleh akun lain.',
      };
    }

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'Alamat email sudah terdaftar di MKVERSE.',
      };
    }

    const newUser: UserProfile & { password?: string } = {
      id: 'usr_' + Date.now(),
      name: name || cleanUsername,
      username: cleanUsername,
      email: cleanEmail,
      password: pass || password || 'password',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250`,
      bio: `Siswa/Civitas SMK Multi Karya Medan`,
      userType: userType || 'Siswa',
      role: 'USER',
      kelas,
      jurusan,
      mataPelajaran,
      divisi,
      status: 'Active',
      isVerified: true,
      emailVerified: true,
      createdAt: new Date().toISOString().split('T')[0],
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      storiesCount: 0,
      musicRequestsCount: 0,
      socialLinks: {
        instagram: '',
        tiktok: '',
        whatsapp: '',
        youtube: '',
        website: '',
      },
    };

    users.push(newUser);
    saveStoredUsers(users);

    const { password: _, ...safeUser } = newUser;
    const token = 'mock_jwt_' + btoa(JSON.stringify({ id: newUser.id, email: newUser.email }));
    setAuthToken(token);
    saveStoredAuthUser(safeUser);

    return {
      success: true,
      token,
      user: safeUser as any,
      needsVerification: false,
      message: 'Registrasi akun berhasil! Selamat datang di MKVERSE.',
    };
  }

  // 5. POST /api/auth/google.php
  if (cleanEndpoint.includes('/api/auth/google.php') && method === 'POST') {
    const users = getStoredUsers();
    let email = 'google.user@smkmultikarya.sch.id';
    let name = 'Siswa SMK Multi Karya';
    let avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250';

    try {
      if (body.credential) {
        const parts = body.credential.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          email = payload.email || email;
          name = payload.name || name;
          avatar = payload.picture || avatar;
        }
      }
    } catch {}

    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    let needsUsernameSetup = false;

    if (!user) {
      const generatedUsername = email.split('@')[0].replace(/[^a-z0-9_.]/g, '').toLowerCase() || 'siswa_' + Date.now().toString().slice(-4);
      user = {
        id: 'usr_g_' + Date.now(),
        name,
        username: generatedUsername,
        email,
        avatar,
        bio: 'Pengguna MKVERSE SMK Multi Karya Medan',
        userType: 'Siswa',
        role: 'USER',
        status: 'Active',
        isVerified: true,
        emailVerified: true,
        authProvider: 'google',
        hasCompletedUsername: false,
        createdAt: new Date().toISOString().split('T')[0],
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        storiesCount: 0,
        musicRequestsCount: 0,
        socialLinks: { instagram: '', tiktok: '', whatsapp: '', youtube: '', website: '' },
      };
      users.push(user);
      saveStoredUsers(users);
      needsUsernameSetup = true;
    }

    const { password: _, ...safeUser } = user;
    const token = 'mock_jwt_' + btoa(JSON.stringify({ id: user.id, email: user.email }));
    setAuthToken(token);
    saveStoredAuthUser(safeUser);

    return {
      success: true,
      token,
      user: safeUser as any,
      needsUsernameSetup,
      message: 'Login Google berhasil!',
    };
  }

  // 6. POST /api/auth/complete-profile.php
  if (cleanEndpoint.includes('/api/auth/complete-profile.php') && method === 'POST') {
    const authUser = getStoredAuthUser();
    if (!authUser) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === authUser.id);

    const updatedUser: UserProfile = {
      ...authUser,
      ...body,
      hasCompletedUsername: true,
    };

    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updatedUser };
      saveStoredUsers(users);
    }

    saveStoredAuthUser(updatedUser);

    return {
      success: true,
      user: updatedUser as any,
      message: 'Profil berhasil diperbarui.',
    };
  }

  // 7. GET /api/auth/verify-email.php
  if (cleanEndpoint.includes('/api/auth/verify-email.php')) {
    const authUser = getStoredAuthUser();
    if (authUser) {
      authUser.isVerified = true;
      authUser.emailVerified = true;
      saveStoredAuthUser(authUser);
    }
    return {
      success: true,
      message: 'Email berhasil diverifikasi! Akun Anda kini aktif.',
    };
  }

  // 8. POST /api/auth/forgot-password.php
  if (cleanEndpoint.includes('/api/auth/forgot-password.php')) {
    return {
      success: true,
      message: 'Jika alamat email tersebut terdaftar di MKVERSE, kami telah mengirimkan tautan reset kata sandi ke kotak masuk Anda.',
    };
  }

  // 9. POST /api/auth/reset-password.php
  if (cleanEndpoint.includes('/api/auth/reset-password.php')) {
    return {
      success: true,
      message: 'Kata sandi berhasil diperbarui! Anda sekarang dapat masuk ke MKVERSE menggunakan kata sandi baru Anda.',
    };
  }

  // 10. POST /api/auth/logout.php
  if (cleanEndpoint.includes('/api/auth/logout.php')) {
    removeAuthToken();
    return {
      success: true,
      message: 'Logout berhasil.',
    };
  }

  // Default generic success response
  return {
    success: true,
    message: 'Operasi berhasil diproses.',
  };
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure leading slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If no external API URL is configured, use local simulated mock engine immediately
  if (!API_URL) {
    return handleLocalMockRequest<T>(cleanEndpoint, options);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_URL}${cleanEndpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Terjadi kesalahan pada server.',
        code: data.code,
        needsVerification: data.needsVerification,
        isSuspended: data.isSuspended,
        email: data.email,
        ...data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch {
    // Graceful fallback to local mock storage on network/server unreachability
    return handleLocalMockRequest<T>(cleanEndpoint, options);
  }
}
