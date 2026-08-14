/**
 * Google Identity Services (GIS) Client Integration for MKVERSE
 * Authorized JavaScript Origin: https://app.mkverse.my.id
 * Target Backend: POST https://api.mkverse.my.id/api/auth/google.php
 */

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '';

export interface GoogleAuthResult {
  credential?: string;
  accessToken?: string;
  authType: 'id_token' | 'access_token';
}

/**
 * Safe logger for development / debugging Google OAuth without leaking secrets
 */
function logDebug(step: string, data?: any) {
  if (import.meta.env.DEV || (typeof window !== 'undefined' && window.localStorage?.getItem('DEBUG_AUTH') === '1')) {
    console.log(`%c[Google Auth Debug] ${step}`, 'color: #3b82f6; font-weight: bold;', data || '');
  }
}

/**
 * Ensures Google Identity Services (GIS) script is fully loaded in window.
 */
function ensureGoogleSdkLoaded(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window context tidak tersedia.'));
    }

    const g = (window as any).google;
    if (g && g.accounts) {
      return resolve(g);
    }

    // If script is already in DOM, wait for it
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds
    const interval = setInterval(() => {
      attempts++;
      const googleObj = (window as any).google;
      if (googleObj && googleObj.accounts) {
        clearInterval(interval);
        return resolve(googleObj);
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        // Inject script if missing
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            const loadedGoogle = (window as any).google;
            if (loadedGoogle && loadedGoogle.accounts) {
              resolve(loadedGoogle);
            } else {
              reject(new Error('Google Identity Services gagal dimuat setelah script diinjeksi.'));
            }
          };
          script.onerror = () => {
            reject(new Error('Gagal memuat Google Identity Services SDK dari Google CDN. Periksa koneksi internet Anda.'));
          };
          document.head.appendChild(script);
        } else {
          reject(new Error('Google Identity Services SDK membutuhkan waktu terlalu lama untuk dimuat. Silakan muat ulang halaman.'));
        }
      }
    }, 100);
  });
}

/**
 * Main function to request Google Credential via Google Identity Services
 * Distinguishes every failure cause clearly.
 */
export async function requestGoogleCredential(): Promise<string> {
  logDebug('Step 1: Inisialisasi Google Sign-In flow');

  const google = await ensureGoogleSdkLoaded();
  const clientId = GOOGLE_CLIENT_ID;

  logDebug('Step 2: Menggunakan Client ID', {
    hasClientId: !!clientId,
    clientIdPreview: clientId ? clientId.substring(0, 15) + '...' : 'TIDAK DIATUR',
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : ''
  });

  if (!clientId) {
    logDebug('Warning: VITE_GOOGLE_CLIENT_ID belum diatur di .env. Memeriksa mode fallback.');
    if (import.meta.env.DEV) {
      logDebug('Dev mode active: menggunakan simulated credential untuk pengujian lokal.');
      return generateSimulatedGoogleCredential();
    }
    throw new Error('VITE_GOOGLE_CLIENT_ID belum dikonfigurasi. Silakan tambahkan Client ID dari Google Cloud Console ke file .env.');
  }

  return new Promise<string>((resolve, reject) => {
    let isSettled = false;

    const safeResolve = (token: string) => {
      if (!isSettled) {
        isSettled = true;
        logDebug('Step 3: Kredensial Google berhasil diperoleh (panjang: ' + token.length + ')');
        resolve(token);
      }
    };

    const safeReject = (error: Error) => {
      if (!isSettled) {
        isSettled = true;
        logDebug('Step 3: Gagal memperoleh kredensial Google', error.message);
        reject(error);
      }
    };

    try {
      // 1. Initialize Google One Tap / ID Token Client
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          logDebug('Google GIS callback terpanggil', { hasCredential: !!response?.credential });
          if (response && response.credential) {
            safeResolve(response.credential);
          } else {
            safeReject(new Error('Kredensial tidak diterima dari respon Google.'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
        context: 'signin',
        ux_mode: 'popup',
        itp_support: true,
      });

      // 2. Trigger Google Prompt and thoroughly inspect notification moments
      google.accounts.id.prompt((notification: any) => {
        logDebug('Google GIS prompt notification event diterima', {
          isDisplayed: typeof notification.isDisplayed === 'function' ? notification.isDisplayed() : undefined,
          isNotDisplayed: typeof notification.isNotDisplayed === 'function' ? notification.isNotDisplayed() : undefined,
          isSkippedMoment: typeof notification.isSkippedMoment === 'function' ? notification.isSkippedMoment() : undefined,
          isDismissedMoment: typeof notification.isDismissedMoment === 'function' ? notification.isDismissedMoment() : undefined,
        });

        // Case A: Prompt NOT DISPLAYED (e.g. origin issue, client id issue, cooldown, blocked)
        if (notification.isNotDisplayed && notification.isNotDisplayed()) {
          const reason = typeof notification.getNotDisplayedReason === 'function' ? notification.getNotDisplayedReason() : 'unknown';
          logDebug('Google Prompt Not Displayed reason:', reason);

          switch (reason) {
            case 'unregistered_origin':
              safeReject(new Error(`Origin website (${window.location.origin}) belum didaftarkan di "Authorized JavaScript Origins" pada Google Cloud Console.`));
              break;
            case 'invalid_client':
              safeReject(new Error('Google Client ID tidak valid. Pastikan VITE_GOOGLE_CLIENT_ID sesuai dengan kredensial di Google Cloud Console.'));
            break;
            case 'missing_client_id':
              safeReject(new Error('Google Client ID belum diatur di aplikasi.'));
              break;
            case 'suppressed_by_user':
            case 'cool_down':
              // One tap is in cooldown or suppressed by Chrome; fallback to OAuth2 Popup client
              logDebug('One Tap in cooldown/suppressed. Mencoba OAuth2 Token Client popup...');
              triggerOAuth2PopupFallback(google, clientId)
                .then(safeResolve)
                .catch(safeReject);
              break;
            case 'opt_out_or_no_session':
              logDebug('Tidak ada sesi akun Google aktif. Mencoba OAuth2 Token Client popup...');
              triggerOAuth2PopupFallback(google, clientId)
                .then(safeResolve)
                .catch(safeReject);
              break;
            case 'browser_not_supported':
              safeReject(new Error('Browser ini tidak mendukung Google Identity Services. Silakan gunakan browser Chrome/Firefox/Safari terbaru.'));
              break;
            case 'secure_http_required':
              safeReject(new Error('Google Sign-In memerlukan koneksi HTTPS yang aman (https://app.mkverse.my.id).'));
              break;
            default:
              // Try popup fallback
              triggerOAuth2PopupFallback(google, clientId)
                .then(safeResolve)
                .catch(() => safeReject(new Error(`Google One Tap tidak dapat ditampilkan (${reason}). Silakan izinkan popup dan coba lagi.`)));
              break;
          }
          return;
        }

        // Case B: Prompt SKIPPED MOMENT
        if (notification.isSkippedMoment && notification.isSkippedMoment()) {
          const reason = typeof notification.getSkippedReason === 'function' ? notification.getSkippedReason() : 'unknown';
          logDebug('Google Prompt Skipped reason:', reason);

          if (reason === 'user_cancel') {
            safeReject(new Error('Login Google dibatalkan oleh pengguna.'));
          } else if (reason === 'tap_outside') {
            // User tapped outside OneTap banner
            safeReject(new Error('Jendela Google ditutup karena Anda mengklik di luar area prompt.'));
          } else if (reason === 'auto_cancel') {
            safeReject(new Error('Prompt Google otomatis ditutup oleh sistem browser.'));
          } else {
            // Attempt OAuth2 popup fallback
            triggerOAuth2PopupFallback(google, clientId)
              .then(safeResolve)
              .catch(safeReject);
          }
          return;
        }

        // Case C: Prompt DISMISSED MOMENT
        if (notification.isDismissedMoment && notification.isDismissedMoment()) {
          const reason = typeof notification.getDismissedReason === 'function' ? notification.getDismissedReason() : 'unknown';
          logDebug('Google Prompt Dismissed reason:', reason);

          // CRITICAL: If credential_returned, DO NOT REJECT! The callback is currently receiving the JWT!
          if (reason === 'credential_returned') {
            logDebug('Prompt dismissed dengan status: credential_returned. Menunggu callback...');
            return;
          }

          if (reason === 'cancel') {
            safeReject(new Error('Login Google dibatalkan oleh pengguna.'));
          } else if (reason === 'tap_outside') {
            safeReject(new Error('Prompt Google ditutup karena mengklik di luar jendela.'));
          } else {
            safeReject(new Error(`Prompt Google ditutup (${reason}).`));
          }
          return;
        }
      });

    } catch (err: any) {
      logDebug('Exception caught during Google prompt:', err);
      // Try OAuth2 popup fallback on exception
      triggerOAuth2PopupFallback(google, clientId)
        .then(safeResolve)
        .catch((fallbackErr) => {
          safeReject(new Error(err?.message || fallbackErr?.message || 'Gagal memulai proses login Google.'));
        });
    }
  });
}

/**
 * Fallback to Google OAuth2 Token Client Popup when One Tap prompt is suppressed, in cool-down, or skipped.
 */
function triggerOAuth2PopupFallback(google: any, clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    logDebug('Membuka Google OAuth2 Popup Token Client...');
    if (!google?.accounts?.oauth2?.initTokenClient) {
      return reject(new Error('Google OAuth2 popup client tidak didukung di lingkungan ini.'));
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: (tokenResponse: any) => {
          logDebug('OAuth2 popup token callback diterima', tokenResponse);
          if (tokenResponse && tokenResponse.access_token) {
            resolve(tokenResponse.access_token);
          } else if (tokenResponse && tokenResponse.error) {
            if (tokenResponse.error === 'access_denied' || tokenResponse.error === 'popup_closed_by_user') {
              reject(new Error('Login Google dibatalkan oleh pengguna.'));
            } else if (tokenResponse.error === 'popup_blocked_by_browser') {
              reject(new Error('Jendela popup Google diblokir oleh browser. Izinkan popup untuk situs ini lalu coba lagi.'));
            } else {
              reject(new Error(`Google OAuth error: ${tokenResponse.error_description || tokenResponse.error}`));
            }
          } else {
            reject(new Error('Tidak ada token akses yang diterima dari popup Google.'));
          }
        },
        error_callback: (err: any) => {
          logDebug('OAuth2 popup error callback:', err);
          if (err?.type === 'popup_closed') {
            reject(new Error('Login Google dibatalkan oleh pengguna (popup ditutup).'));
          } else if (err?.type === 'popup_blocked') {
            reject(new Error('Popup Google Sign-In diblokir oleh browser Anda.'));
          } else {
            reject(new Error(err?.message || 'Terjadi kesalahan pada popup Google Sign-In.'));
          }
        }
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (e: any) {
      logDebug('Gagal menginisialisasi OAuth2 Token Client:', e);
      reject(new Error(e?.message || 'Gagal membuka popup Google Sign-In.'));
    }
  });
}

/**
 * Development fallback helper to simulate Google JWT token payload when in dev mode
 */
function generateSimulatedGoogleCredential(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: 'google_user_' + Date.now(),
      email: 'siswa.multikarya@gmail.com',
      email_verified: true,
      name: 'Siswa SMK Multi Karya',
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      iss: 'https://accounts.google.com',
      aud: GOOGLE_CLIENT_ID || '102938475610-mkverse.apps.googleusercontent.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  const signature = btoa('mock_signature');
  return `${header}.${payload}.${signature}`;
}
