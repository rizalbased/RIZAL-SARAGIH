
import { UserProfile } from '../types';
import { fetchApi } from '../lib/api';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id?: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

let storedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Obtain Google OAuth Access Token via Google Identity Services
 */
export async function getGoogleAccessToken(): Promise<string> {
  // If token is still valid (with 2 min margin), reuse it
  if (storedAccessToken && Date.now() < tokenExpiresAt - 120000) {
    return storedAccessToken;
  }

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services client library not loaded.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error || 'Gagal mendapatkan akses token Google.'));
            return;
          }
          storedAccessToken = response.access_token;
          tokenExpiresAt = Date.now() + 3600 * 1000; // 1 hour
          resolve(response.access_token);
        },
        error_callback: (err) => {
          console.error('GIS token error:', err);
          reject(new Error('Gagal melakukan autentikasi Google.'));
        }
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error('Error initializing Token Client:', err);
      reject(err);
    }
  });
}

const SPREADSHEET_TITLE = 'MKVERSE — Data Warga Sekolah';
const SHEET_NAME = 'Users';

/**
 * Search or Create the MKVERSE Google Spreadsheet
 */
async function getOrCreateSpreadsheet(accessToken: string): Promise<string> {
  // 1. Search Google Drive for spreadsheet by title
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  )}`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // 2. Create spreadsheet if not found
  const createUrl = 'https://sheets.googleapis.com/v1/spreadsheets';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: SPREADSHEET_TITLE },
      sheets: [
        {
          properties: {
            title: SHEET_NAME,
            gridProperties: { frozenRowCount: 1 }
          }
        }
      ]
    })
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    console.error('Failed to create spreadsheet:', errorBody);
    throw new Error('Gagal membuat Google Spreadsheet MKVERSE.');
  }

  const createData = await createRes.json();
  return createData.spreadsheetId;
}

/**
 * Format date string into standard Indonesian format (e.g. DD/MM/YYYY)
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Export Users list to Google Sheets
 */
export async function exportUsersToGoogleSheets(
  usersToExport: UserProfile[],
  adminUser: { id: string; name: string },
  filterDescription = 'Semua User'
): Promise<{ success: boolean; spreadsheetUrl?: string; message?: string }> {
  try {
    // 1. Obtain Google OAuth Access Token
    const accessToken = await getGoogleAccessToken();

    // 2. Get or create spreadsheet
    const spreadsheetId = await getOrCreateSpreadsheet(accessToken);

    // 3. Prepare Header and Data rows (NO Passwords, Tokens, or Secrets)
    const headers = [
      'No',
      'Nama',
      'Username',
      'Email',
      'Role',
      'Status',
      'Email Verified',
      'Followers',
      'Following',
      'Posts',
      'Tanggal Daftar',
      'User ID'
    ];

    const dataRows = usersToExport.map((user, idx) => [
      idx + 1,
      user.name || 'Warga MKVERSE',
      user.username || '-',
      user.email || '-',
      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'Admin' : 'User',
      user.status === 'Suspended' ? 'Suspended' : 'Active',
      user.emailVerified ? 'Ya' : 'Belum',
      user.followersCount || 0,
      user.followingCount || 0,
      user.postsCount || 0,
      formatDate(user.createdAt),
      user.id // User ID (for deduplication / sync)
    ]);

    const allValues = [headers, ...dataRows];

    // 4. Update worksheet values cleanly
    const updateUrl = `https://sheets.googleapis.com/v1/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      SHEET_NAME
    )}!A1?valueInputOption=USER_ENTERED`;

    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `${SHEET_NAME}!A1`,
        majorDimension: 'ROWS',
        values: allValues
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error('Update Sheet values error:', errText);
      throw new Error('Gagal memperbarui data pada Google Sheets.');
    }

    // 5. Apply Header Styling & Freeze Row via batchUpdate
    try {
      const batchUrl = `https://sheets.googleapis.com/v1/spreadsheets/${spreadsheetId}:batchUpdate`;
      await fetch(batchUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.04, green: 0.04, blue: 0.04 }, // MKVERSE dark theme #0B0B0B
                    textFormat: {
                      bold: true,
                      foregroundColor: { red: 0.72, green: 1.0, blue: 0.0 }, // #B8FF00 lime accent
                      fontSize: 10
                    },
                    alignment: { horizontal: 'CENTER' }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,alignment)'
              }
            }
          ]
        })
      });
    } catch (styleErr) {
      console.warn('Non-blocking styling error:', styleErr);
    }

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Logs via API omitted for now

    return {
      success: true,
      spreadsheetUrl,
      message: 'Data user berhasil diekspor ke Google Sheets.'
    };
  } catch (error: any) {
    console.error('Export Google Sheets Error:', error);
    return {
      success: false,
      message: 'Gagal mengekspor data. Silakan coba lagi.'
    };
  }
}

/**
 * Backup / Fallback: Download CSV file
 */
export function downloadUsersCSV(
  usersToExport: UserProfile[],
  filename = 'MKVERSE_Data_Warga_Sekolah.csv'
): void {
  const headers = [
    'No',
    'Nama',
    'Username',
    'Email',
    'Role',
    'Status',
    'Email Verified',
    'Followers',
    'Following',
    'Posts',
    'Tanggal Daftar',
    'User ID'
  ];

  const rows = usersToExport.map((user, idx) => [
    idx + 1,
    `"${(user.name || '').replace(/"/g, '""')}"`,
    `"${(user.username || '').replace(/"/g, '""')}"`,
    `"${(user.email || '').replace(/"/g, '""')}"`,
    user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'Admin' : 'User',
    user.status === 'Suspended' ? 'Suspended' : 'Active',
    user.emailVerified ? 'Ya' : 'Belum',
    user.followersCount || 0,
    user.followingCount || 0,
    user.postsCount || 0,
    `"${formatDate(user.createdAt)}"`,
    `"${user.id}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to fetch freshest users array from Firestore for export
 */
export async function fetchFreshUsersFromApi(): Promise<UserProfile[]> {
  try {
    
    

    const results: UserProfile[] = [];

    [].forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        name: data.name || data.displayName || 'Warga MKVERSE',
        username: data.username || 'user',
        email: data.email || '',
        avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${docSnap.id}`,
        bio: data.bio || 'Warga SMK Multi Karya Medan',
        userType: data.userType || 'Siswa',
        role: (data.role?.toUpperCase() === 'ADMIN' || data.role?.toUpperCase() === 'SUPER_ADMIN') ? 'ADMIN' : 'USER',
        status: data.accountStatus === 'suspended' || data.status === 'Suspended' ? 'Suspended' : 'Active',
        createdAt: data.createdAt || new Date().toISOString().split('T')[0],
        emailVerified: !!data.emailVerified,
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        postsCount: data.postsCount || 0,
        storiesCount: data.storiesCount || 0,
        musicRequestsCount: data.musicRequestsCount || 0
      });
    });

    return results;
  } catch (err) {
    console.error('Fetch fresh users error:', err);
    return [];
  }
}
