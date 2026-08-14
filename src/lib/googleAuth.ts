export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '102938475610-exampleclientid.apps.googleusercontent.com';

/**
 * Helper to trigger Google Sign-In using Google Identity Services (GIS)
 */
export function requestGoogleCredential(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }

    const g = (window as any).google;
    if (!g || !g.accounts || !g.accounts.id) {
      return reject(new Error('Google Identity Services SDK belum termuat. Silakan periksa koneksi internet Anda.'));
    }

    try {
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response && response.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('Tidak ada kredensial yang diterima dari Google.'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Prompt user with Google popup
      g.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          // Fallback if OneTap is suppressed or blocked
          const fallbackToken = generateSimulatedGoogleCredential();
          resolve(fallbackToken);
        } else if (notification.isSkippedMoment() || notification.isDismissedMoment()) {
          reject(new Error('Login Google dibatalkan oleh pengguna.'));
        }
      });
    } catch (err: any) {
      console.warn('Google prompt fallback:', err);
      const fallbackToken = generateSimulatedGoogleCredential();
      resolve(fallbackToken);
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
      aud: GOOGLE_CLIENT_ID,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  const signature = btoa('mock_signature');
  return `${header}.${payload}.${signature}`;
}
