/**
 * Google Identity Services (GIS) Client Integration for MKVERSE
 * Frontend: https://app.mkverse.my.id
 * Backend API: https://api.mkverse.my.id/api/auth/google.php
 * NO Firebase Authentication used.
 */

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://api.mkverse.my.id';

/**
 * Ensures Google Identity Services (GIS) script is loaded from Google CDN.
 */
export function loadGoogleScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window context tidak tersedia.'));
    }

    const g = (window as any).google;
    if (g && g.accounts) {
      return resolve(g);
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        const googleObj = (window as any).google;
        if (googleObj && googleObj.accounts) {
          clearInterval(interval);
          resolve(googleObj);
        } else if (checks > 40) {
          clearInterval(interval);
          reject(new Error('Google Identity Services SDK gagal diinisialisasi dalam waktu yang ditentukan.'));
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const loadedGoogle = (window as any).google;
      if (loadedGoogle && loadedGoogle.accounts) {
        resolve(loadedGoogle);
      } else {
        reject(new Error('Google Identity Services script dimuat tetapi objek google.accounts tidak ditemukan.'));
      }
    };
    script.onerror = () => {
      reject(new Error('Gagal memuat Google Identity Services dari CDN Google. Periksa koneksi internet Anda.'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Request Google Credential or Token using official Google Identity Services.
 * Accurately reports error root causes without false "user cancelled" messages.
 */
export async function requestGoogleCredential(): Promise<string> {
  console.log('Google Client ID configured:', !!GOOGLE_CLIENT_ID);
  console.log('Google API URL:', API_URL);

  const google = await loadGoogleScript();

  if (!GOOGLE_CLIENT_ID) {
    if (import.meta.env.DEV) {
      console.warn('[Google Auth DEV] VITE_GOOGLE_CLIENT_ID belum diset di .env. Menggunakan kredensial simulasi dev.');
      return generateSimulatedGoogleCredential();
    }
    throw new Error('Google Client ID belum dikonfigurasi. Harap tentukan VITE_GOOGLE_CLIENT_ID di file .env.');
  }

  return new Promise<string>((resolve, reject) => {
    let resolved = false;

    const handleSuccess = (token: string) => {
      if (!resolved) {
        resolved = true;
        console.log('Google credential received:', !!token);
        resolve(token);
      }
    };

    const handleFailure = (err: Error) => {
      if (!resolved) {
        resolved = true;
        console.error('[Google Auth Error]:', err.message);
        reject(err);
      }
    };

    try {
      // 1. Initialize Google Identity Services ID token client
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          console.log('Google credential received:', !!response?.credential);
          if (response && response.credential) {
            handleSuccess(response.credential);
          } else {
            handleFailure(new Error('Google credential tidak diterima dari respon server Google.'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
        itp_support: true,
      });

      // 2. Open Google OAuth2 Popup for user-initiated clicks
      // This is the officially recommended user gesture flow for custom buttons in Google Identity Services
      if (google.accounts.oauth2 && typeof google.accounts.oauth2.initTokenClient === 'function') {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              handleSuccess(tokenResponse.access_token);
            } else if (tokenResponse && tokenResponse.error) {
              const errCode = tokenResponse.error;
              if (errCode === 'access_denied') {
                handleFailure(new Error('User membatalkan Google Login.'));
              } else if (errCode === 'popup_closed_by_user') {
                handleFailure(new Error('User membatalkan Google Login (jendela popup ditutup).'));
              } else if (errCode === 'popup_blocked_by_browser') {
                handleFailure(new Error('Jendela popup Google diblokir oleh browser. Harap izinkan popup untuk https://app.mkverse.my.id.'));
              } else {
                handleFailure(new Error(`Google OAuth error: ${tokenResponse.error_description || errCode}`));
              }
            } else {
              handleFailure(new Error('Token akses Google tidak diterima.'));
            }
          },
          error_callback: (err: any) => {
            if (err?.type === 'popup_closed') {
              handleFailure(new Error('User membatalkan Google Login.'));
            } else if (err?.type === 'popup_blocked') {
              handleFailure(new Error('Jendela popup Google diblokir oleh browser. Harap izinkan popup untuk situs ini.'));
            } else {
              handleFailure(new Error(err?.message || 'Terjadi gangguan saat membuka popup Google.'));
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } else {
        // Fallback to prompt if oauth2 is not available
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed && notification.isNotDisplayed()) {
            const reason = typeof notification.getNotDisplayedReason === 'function' ? notification.getNotDisplayedReason() : 'unknown';
            if (reason === 'unregistered_origin') {
              handleFailure(new Error(`Origin website (${window.location.origin}) belum didaftarkan di Authorized JavaScript Origins pada Google Cloud Console.`));
            } else if (reason === 'invalid_client') {
              handleFailure(new Error('Google Client ID tidak valid.'));
            } else {
              handleFailure(new Error(`Google One Tap tidak dapat ditampilkan (${reason}).`));
            }
          } else if (notification.isSkippedMoment && notification.isSkippedMoment()) {
            const reason = typeof notification.getSkippedReason === 'function' ? notification.getSkippedReason() : 'unknown';
            if (reason === 'user_cancel') {
              handleFailure(new Error('User membatalkan Google Login.'));
            }
          } else if (notification.isDismissedMoment && notification.isDismissedMoment()) {
            const reason = typeof notification.getDismissedReason === 'function' ? notification.getDismissedReason() : 'unknown';
            if (reason === 'cancel') {
              handleFailure(new Error('User membatalkan Google Login.'));
            }
          }
        });
      }
    } catch (e: any) {
      handleFailure(new Error(e?.message || 'Gagal menginisialisasi Google Identity Services.'));
    }
  });
}

/**
 * Development simulated token generator
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
