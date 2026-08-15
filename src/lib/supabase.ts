import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserRole, UserType, Post, Story, Comment, ChatMessage, Conversation, NotificationItem, ReportItem } from '../types';

// Helper to sanitize and normalize Supabase URL
export function normalizeSupabaseUrl(inputUrl?: string): string {
  if (!inputUrl) return '';
  let url = inputUrl.trim().replace(/^["']|["']$/g, '');
  
  // Convert dashboard URL format if accidentally pasted: https://supabase.com/dashboard/project/<project_id>
  const dashboardMatch = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Remove any trailing subpaths like /rest/v1, /auth/v1, /storage/v1, etc.
  url = url.replace(/\/+(rest|auth|storage)(\/v\d+)?\/?$/i, '');
  
  // Strip all trailing slashes to prevent double-slash in API routes (e.g. //auth/v1)
  url = url.replace(/\/+$/, '');

  // Ensure protocol is present
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
}

export function normalizeSupabaseAnonKey(inputKey?: string): string {
  if (!inputKey) return '';
  return inputKey.trim().replace(/^["']|["']$/g, '');
}

/**
 * Returns dynamic redirect URL for email verification and password recovery.
 * Reads VITE_SUPABASE_REDIRECT_URL if configured, otherwise falls back to window.location.origin.
 */
export function getAuthRedirectUrl(subpath = ''): string {
  const customRedirectUrl = (import.meta.env.VITE_SUPABASE_REDIRECT_URL || '').trim();
  let base = customRedirectUrl;
  if (!base && typeof window !== 'undefined' && window.location?.origin) {
    base = window.location.origin;
  }
  if (!base) {
    base = 'http://localhost:3000';
  }
  const cleanBase = base.replace(/\/+$/, '');
  const cleanSubpath = subpath ? (subpath.startsWith('/') || subpath.startsWith('#') ? subpath : `/${subpath}`) : '';
  return `${cleanBase}${cleanSubpath}`;
}

// Environment variables for Supabase
const rawSupabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const rawSupabaseAnonKey = normalizeSupabaseAnonKey(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl && 
  rawSupabaseAnonKey &&
  !rawSupabaseUrl.includes('xyzcompany') &&
  !rawSupabaseAnonKey.includes('dummy_anon_key')
);

const supabaseUrl = isSupabaseConfigured ? rawSupabaseUrl : 'https://xyzcompany.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawSupabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

// Single Supabase Client instance for the entire application
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Maps Supabase 'profiles' row to frontend UserProfile
 */
export function mapProfileRow(row: any): UserProfile {
  return {
    id: row.id,
    name: row.full_name || row.display_name || row.username || 'Warga MKVERSE',
    username: row.username || 'user',
    email: row.email || '',
    avatar: row.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
    coverImage: row.cover_image,
    bio: row.bio || 'Warga SMK Multi Karya Medan',
    userType: (row.user_type as UserType) || 'Siswa',
    role: (row.role as UserRole) || 'USER',
    kelas: row.class_name || row.kelas,
    jurusan: row.major || row.jurusan,
    mataPelajaran: row.mata_pelajaran,
    divisi: row.divisi,
    socialLinks: row.social_links || {},
    status: row.status || 'Active',
    createdAt: row.created_at || new Date().toISOString(),
    isVerified: Boolean(row.is_verified),
    emailVerified: Boolean(row.email_verified),
    followersCount: row.followers_count || 0,
    followingCount: row.following_count || 0,
    postsCount: row.posts_count || 0,
    storiesCount: row.stories_count || 0,
    musicRequestsCount: row.music_requests_count || 0,
  };
}

/**
 * Maps Supabase 'posts' row to frontend Post
 */
export function mapPostRow(row: any, currentUserId?: string): Post {
  const author = row.profiles || {};
  const isLiked = Array.isArray(row.likes) 
    ? row.likes.some((l: any) => l.user_id === currentUserId)
    : false;

  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.is_anonymous ? 'Warga Multi Karya (Anonim)' : (author.full_name || 'Warga MKVERSE'),
    authorUsername: row.is_anonymous ? 'anonymous' : (author.username || 'user'),
    authorAvatar: row.is_anonymous 
      ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'
      : (author.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'),
    authorType: (author.user_type as UserType) || 'Siswa',
    type: row.type || 'post',
    content: row.content || '',
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    moodTag: row.mood_tag,
    songData: row.song_data,
    isAnonymous: Boolean(row.is_anonymous),
    likesCount: row.likes_count ?? (row.likes ? row.likes.length : 0),
    commentsCount: row.comments_count ?? (row.comments ? row.comments.length : 0),
    isLiked,
    isSaved: false,
    createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja',
    newsId: row.news_id,
  };
}

// -------------------------------------------------------------
// AUTHENTICATION HELPER METHODS
// -------------------------------------------------------------

/**
 * 1. Register new user with Supabase Auth
 */
export async function signUpWithSupabase(data: {
  email: string;
  password?: string;
  username: string;
  fullName: string;
  userType: UserType;
  className?: string;
  major?: string;
  mataPelajaran?: string;
  divisi?: string;
  avatarUrl?: string;
}) {
  const { email, password, username, fullName, userType, className, major, mataPelajaran, divisi, avatarUrl } = data;

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanFullName = (fullName || '').trim();
  const defaultAvatar = avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Format email tidak valid. Masukkan email yang benar.' };
  }

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, message: 'Username minimal terdiri dari 3 karakter.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return { success: false, message: 'Username hanya boleh mengandung huruf, angka, dan underscore (_).' };
  }

  if (!cleanFullName) {
    return { success: false, message: 'Nama lengkap wajib diisi.' };
  }

  if (!password || password.length < 8) {
    return { success: false, message: 'Password minimal terdiri dari 8 karakter.' };
  }

  try {
    // Check if username is already taken in profiles table
    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        return { 
          success: false, 
          message: `Username "${cleanUsername}" sudah digunakan oleh warga sekolah lain. Silakan pilih username lain.` 
        };
      }
    } catch {
      // If table query fails due to network/RLS, proceed to auth signUp
    }

    // Determine dynamic email redirect URL
    const redirectUrl = getAuthRedirectUrl();

    // Call Supabase Auth signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: cleanUsername,
          full_name: cleanFullName,
          user_type: userType || 'Siswa',
          class_name: className || null,
          major: major || null,
          mata_pelajaran: mataPelajaran || null,
          divisi: divisi || null,
          avatar_url: defaultAvatar,
        },
      },
    });

    if (authError) {
      console.error('Registration error from Supabase Auth:', authError);
      let errorMsg = authError.message;
      if (authError.message.includes('User already registered') || authError.message.includes('already registered')) {
        errorMsg = 'Email sudah terdaftar. Silakan login atau gunakan menu Lupa Password jika lupa kata sandi.';
      } else if (authError.message.includes('Password should be') || authError.message.includes('password')) {
        errorMsg = `Kata sandi tidak memenuhi syarat: ${authError.message}`;
      } else if (authError.message.includes('Database error saving new user')) {
        errorMsg = 'Gagal menyimpan data profil ke database. Pastikan username dan email belum terdaftar.';
      } else if (authError.message.includes('rate limit')) {
        errorMsg = 'Terlalu banyak percobaan registrasi. Silakan coba kembali dalam beberapa menit.';
      } else if (authError.message.includes('invalid format')) {
        errorMsg = 'Format email tidak valid.';
      }
      return { success: false, error: authError, message: errorMsg };
    }

    if (!authData.user) {
      return { 
        success: false, 
        message: 'Gagal membuat pengguna. Periksa koneksi Supabase Anda.' 
      };
    }

    // Supabase Email Enumeration Protection:
    // If user already exists and confirm email is enabled, identities array is empty
    if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      return {
        success: false,
        message: 'Email ini sudah terdaftar sebelumnya. Silakan masuk menggunakan akun Anda atau klik Lupa Password.',
      };
    }

    const needsEmailVerification = !authData.session;

    return { 
      success: true, 
      user: authData.user, 
      session: authData.session,
      needsVerification: needsEmailVerification,
      message: needsEmailVerification
        ? 'Pendaftaran berhasil! Link verifikasi telah dikirim ke email Anda. Silakan cek kotak masuk atau spam.' 
        : 'Pendaftaran berhasil! Selamat datang di MKVERSE.' 
    };
  } catch (err: any) {
    console.error('Registration unexpected exception:', err);
    return {
      success: false,
      message: err?.message ? `Terjadi kendala jaringan/koneksi: ${err.message}` : 'Terjadi kesalahan saat memproses registrasi.',
    };
  }
}

/**
 * 2. Sign In with Email and Password
 */
export async function signInWithSupabase(emailOrUsername: string, password: string) {
  let targetEmail = emailOrUsername.trim();

  // If user entered username instead of email, lookup email from profiles
  if (!targetEmail.includes('@')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', targetEmail.toLowerCase())
      .single();

    if (profile?.email) {
      targetEmail = profile.email;
    } else {
      return { success: false, message: 'Username tidak ditemukan.' };
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password,
  });

  if (error) {
    let msg = error.message;
    if (error.message.includes('Invalid login credentials')) {
      msg = 'Email/Username atau password salah.';
    } else if (error.message.includes('Email not confirmed')) {
      return { 
        success: false, 
        needsVerification: true, 
        message: 'Email Anda belum diverifikasi. Silakan cek link aktivasi di email Anda.' 
      };
    }
    return { success: false, error, message: msg };
  }

  // Fetch full user profile
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile?.status === 'Suspended') {
      await supabase.auth.signOut();
      return { success: false, isSuspended: true, message: 'Akun Anda telah ditangguhkan oleh Administrator.' };
    }

    return { 
      success: true, 
      user: profile ? mapProfileRow(profile) : null,
      session: data.session 
    };
  }

  return { success: true, session: data.session };
}

/**
 * 3. Sign Out
 */
export async function signOutSupabase() {
  const { error } = await supabase.auth.signOut();
  return { success: !error, error };
}

/**
 * 5. Reset Password Request
 */
export async function resetPasswordSupabase(email: string) {
  const redirectUrl = getAuthRedirectUrl('#reset-password');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    return { success: false, error, message: error.message };
  }

  return { 
    success: true, 
    message: 'Link reset password telah dikirim ke email Anda. Silakan periksa kotak masuk/spam.' 
  };
}

/**
 * 6. Update Password (User session required or after reset link)
 */
export async function updatePasswordSupabase(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error, message: error.message };
  }

  return { success: true, message: 'Kata sandi berhasil diperbarui!' };
}

/**
 * 7. Upload Avatar to Supabase Storage
 */
export async function uploadAvatarSupabase(userId: string, file: File): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { success: false, message: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal mengunggah foto profil' };
  }
}
