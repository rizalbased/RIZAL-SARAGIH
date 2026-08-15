import React, { useState } from 'react';
import { 
  Shield, 
  Flag, 
  Users, 
  Newspaper, 
  Radio, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UnauthorizedView } from './UnauthorizedView';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';
import { 
  exportUsersToGoogleSheets, 
  downloadUsersCSV, 
  fetchFreshUsersFromApi 
} from '../services/googleSheetsService';
import { UserProfile } from '../types';

interface AdminDashboardViewProps {
  onNavigateHome: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigateHome }) => {
  const { 
    currentUser, 
    moderationReports, 
    resolveReport, 
    users, 
    updateUserRole, 
    deleteUser,
    posts, 
    deletePost, 
    news, 
    deleteNews,
    radioRequests, 
    approveRadioRequest 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'news' | 'radio' | 'drive'>('reports');

  // Modal deletion states
  const [itemToDelete, setItemToDelete] = useState<{ type: 'user' | 'news'; id: string; title: string } | null>(null);

  // User Management Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Suspended'>('ALL');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');

  // Export States
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<{ message: string; spreadsheetUrl?: string } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Strict Security Gate
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
    return <UnauthorizedView onNavigateHome={onNavigateHome} />;
  }

  // Filter Users Logic
  const filterUsersList = (userList: UserProfile[]) => {
    return userList.filter((u) => {
      // 1. Search term match (Name, Username, Email)
      if (userSearch.trim()) {
        const query = userSearch.toLowerCase().trim();
        const nameMatch = (u.name || '').toLowerCase().includes(query);
        const usernameMatch = (u.username || '').toLowerCase().includes(query);
        const emailMatch = (u.email || '').toLowerCase().includes(query);
        if (!nameMatch && !usernameMatch && !emailMatch) return false;
      }

      // 2. Role filter
      if (roleFilter !== 'ALL') {
        const isAdminRole = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
        if (roleFilter === 'ADMIN' && !isAdminRole) return false;
        if (roleFilter === 'USER' && isAdminRole) return false;
      }

      // 3. Status filter
      if (statusFilter !== 'ALL') {
        if (u.status !== statusFilter) return false;
      }

      // 4. Email Verified filter
      if (emailVerifiedFilter !== 'ALL') {
        if (emailVerifiedFilter === 'VERIFIED' && !u.emailVerified) return false;
        if (emailVerifiedFilter === 'UNVERIFIED' && u.emailVerified) return false;
      }

      return true;
    });
  };

  const filteredUsers = filterUsersList(users);

  // Export to Google Sheets Handler
  const handleExportToSheets = async (exportAll = false) => {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      // 1. Always fetch FRESH user data directly from Firestore
      let freshUsers = await fetchFreshUsersFromApi();
      if (!freshUsers || freshUsers.length === 0) {
        freshUsers = [...users]; // fallback to context
      }

      // 2. Apply filters if not exporting all
      const targetUsers = exportAll ? freshUsers : filterUsersList(freshUsers);

      if (targetUsers.length === 0) {
        setExportError('Tidak ada data user yang sesuai untuk diekspor.');
        setIsExporting(false);
        return;
      }

      // Build filter description string
      const filterDescParts = [];
      if (exportAll) {
        filterDescParts.push('Export Semua User');
      } else {
        if (userSearch) filterDescParts.push(`Cari: "${userSearch}"`);
        if (roleFilter !== 'ALL') filterDescParts.push(`Role: ${roleFilter}`);
        if (statusFilter !== 'ALL') filterDescParts.push(`Status: ${statusFilter}`);
        if (emailVerifiedFilter !== 'ALL') filterDescParts.push(`Email: ${emailVerifiedFilter}`);
      }
      const filterLabel = filterDescParts.length > 0 ? filterDescParts.join(' | ') : 'Hasil Filter';

      // 3. Call Export Service
      const result = await exportUsersToGoogleSheets(
        targetUsers,
        { id: currentUser.id, name: currentUser.name },
        filterLabel
      );

      if (result.success) {
        setExportSuccess({
          message: result.message || 'Data user berhasil diekspor ke Google Sheets.',
          spreadsheetUrl: result.spreadsheetUrl
        });
      } else {
        setExportError(result.message || 'Gagal mengekspor data. Silakan coba lagi.');
      }
    } catch (err) {
      console.error('Export Error:', err);
      setExportError('Gagal mengekspor data. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  // Download CSV Handler (Fallback Option)
  const handleDownloadCSV = async (exportAll = false) => {
    try {
      let freshUsers = await fetchFreshUsersFromApi();
      if (!freshUsers || freshUsers.length === 0) {
        freshUsers = [...users];
      }
      const targetUsers = exportAll ? freshUsers : filterUsersList(freshUsers);
      downloadUsersCSV(targetUsers, exportAll ? 'MKVERSE_Semua_Warga_Sekolah.csv' : 'MKVERSE_Data_Warga_Filtered.csv');
    } catch (err) {
      console.error('Download CSV error:', err);
      downloadUsersCSV(exportAll ? users : filteredUsers);
    }
  };

  const pendingReports = moderationReports.filter(r => r.status === 'Pending');

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* ADMIN HERO HEADER */}
      <section className="bg-[#0B0B0B] text-white rounded-3xl p-6 border border-gray-800 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-[#B8FF00]" />
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
              ADMINISTRATOR DASHBOARD
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Pusat Pengelolaan Komunitas, Moderasi Konten, Warga Sekolah, & Google Drive MKVERSE
          </p>
        </div>

        <span className="bg-[#B8FF00] text-black font-heading font-extrabold text-xs px-3.5 py-1.5 rounded-2xl shadow">
          ROLE: {currentUser.role}
        </span>
      </section>

      {/* KPI METRICS OVERVIEW */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Laporan Moderasi</p>
          <p className="font-heading font-extrabold text-2xl text-red-600 mt-1">{pendingReports.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Membutuhkan tindakan</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Warga Terdaftar</p>
          <p className="font-heading font-extrabold text-2xl text-gray-900 mt-1">{users.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Siswa, Guru, Staff</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Feed Post</p>
          <p className="font-heading font-extrabold text-2xl text-[#35B9FF] mt-1">{posts.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Post & Confession</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Radio Requests</p>
          <p className="font-heading font-extrabold text-2xl text-[#FF4F8B] mt-1">{radioRequests.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Antrean On Air</p>
        </div>
      </section>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-2xl font-heading font-bold text-xs transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports' ? 'bg-[#0B0B0B] text-[#B8FF00]' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Flag className="w-4 h-4 text-red-500" />
          <span>Moderasi Laporan ({pendingReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-2xl font-heading font-bold text-xs transition-colors flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-[#0B0B0B] text-[#B8FF00]' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4 text-[#35B9FF]" />
          <span>Kelola Pengguna ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 rounded-2xl font-heading font-bold text-xs transition-colors flex items-center gap-1.5 ${
            activeTab === 'news' ? 'bg-[#0B0B0B] text-[#B8FF00]' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Newspaper className="w-4 h-4 text-[#FF4F8B]" />
          <span>Berita Sekolah ({news.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('radio')}
          className={`px-4 py-2 rounded-2xl font-heading font-bold text-xs transition-colors flex items-center gap-1.5 ${
            activeTab === 'radio' ? 'bg-[#0B0B0B] text-[#B8FF00]' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Radio className="w-4 h-4 text-[#FFF000]" />
          <span>EMKA Radio Queue</span>
        </button>
      </div>

      {/* TAB CONTENT: MODERATION REPORTS */}
      {activeTab === 'reports' && (
        <section className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-heading font-extrabold text-base text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Antrean Moderasi Konten Laporan Warga</span>
          </h2>

          {pendingReports.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-700">Tidak ada laporan pelanggaran aktif saat ini.</p>
              <p className="text-[11px] text-gray-400">Komunitas MKVERSE aman dan kondusif!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReports.map((report) => (
                <div key={report.id} className="p-4 bg-red-50/50 rounded-2xl border border-red-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-700">Alasan: {report.reason}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{report.createdAt}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 italic text-gray-700">
                    "{report.previewText}"
                  </div>

                  <p className="text-[10px] text-gray-500">Dilaporkan oleh: {report.reportedBy}</p>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        deletePost(report.targetId);
                        resolveReport(report.id, 'Resolved');
                      }}
                      className="bg-red-600 text-white font-bold py-1.5 px-3 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Post & Beri Peringatan</span>
                    </button>

                    <button
                      onClick={() => resolveReport(report.id, 'Dismissed')}
                      className="bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      Abaikan Laporan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <section className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-5">
          {/* HEADER & TOP COUNTER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="font-heading font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#35B9FF]" />
                <span>DATA WARGA SEKOLAH</span>
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Kelola hak akses, status keanggotaan, dan ekspor data warga sekolah ke Google Sheets
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-gray-100 text-gray-700 font-heading font-extrabold text-xs px-3 py-1.5 rounded-xl border border-gray-200">
                {filteredUsers.length} Warga Terdaftar
              </span>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama / username / email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#35B9FF] transition-all font-medium"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#35B9FF]"
                >
                  <option value="ALL">Semua Role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="USER">User</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#35B9FF]"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>

                {/* Email Verified Filter */}
                <select
                  value={emailVerifiedFilter}
                  onChange={(e) => setEmailVerifiedFilter(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#35B9FF]"
                >
                  <option value="ALL">Semua Email</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="UNVERIFIED">Belum Verified</option>
                </select>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* Export Google Sheets (Filtered / Search) */}
                <button
                  onClick={() => handleExportToSheets(false)}
                  disabled={isExporting}
                  className="bg-[#107C41] text-white hover:bg-[#0e6b37] font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Ekspor hasil filter saat ini ke Google Sheets"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  <span>{isExporting ? 'Mengekspor...' : 'Export ke Google Sheets'}</span>
                </button>

                {/* Export Semua User */}
                <button
                  onClick={() => handleExportToSheets(true)}
                  disabled={isExporting}
                  className="bg-[#0B0B0B] text-white hover:bg-gray-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Ekspor seluruh user terdaftar ke Google Sheets"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#B8FF00]" />
                  <span>Export Semua User</span>
                </button>

                {/* Download CSV Backup Option */}
                <button
                  onClick={() => handleDownloadCSV(false)}
                  className="bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Unduh backup data dalam format CSV"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Download CSV</span>
                </button>
              </div>

              {(userSearch || roleFilter !== 'ALL' || statusFilter !== 'ALL' || emailVerifiedFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setUserSearch('');
                    setRoleFilter('ALL');
                    setStatusFilter('ALL');
                    setEmailVerifiedFilter('ALL');
                  }}
                  className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* EXPORT FEEDBACK NOTIFICATION BANNERS */}
          {exportSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">{exportSuccess.message}</span>
              </div>
              {exportSuccess.spreadsheetUrl && (
                <a
                  href={exportSuccess.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#107C41] text-white hover:bg-[#0e6b37] font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Google Sheets</span>
                </a>
              )}
            </div>
          )}

          {exportError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-800 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="font-bold">{exportError}</span>
            </div>
          )}

          {/* SECURITY & PRIVACY NOTICE */}
          <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Keamanan & Kebijakan Privasi Password:</span> Password user dikelola dengan enkripsi aman oleh Supabase Auth & PostgreSQL Database. Password plaintext <span className="font-bold underline">tidak pernah disimpan, ditampilkan, atau diekspor</span> ke Google Sheets demi menjaga keamanan privasi warga sekolah. Jika siswa/guru lupa kata sandi, gunakan fitur reset password via email.
            </p>
          </div>

          {/* USERS DATA TABLE */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Warga Sekolah</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Email Verified</th>
                  <th className="p-3">Aktivitas</th>
                  <th className="p-3">Tanggal Daftar</th>
                  <th className="p-3">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">
                      Tidak ada user ditemukan sesuai dengan filter / kata kunci pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, index) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 font-semibold text-gray-400 text-[11px]">{index + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-xl object-cover border border-gray-200 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{u.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-gray-600">{u.email || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'bg-[#B8FF00] text-black' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          u.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          u.emailVerified ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.emailVerified ? 'Ya' : 'Belum'}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-gray-500 space-x-1.5">
                        <span>👥 {u.followersCount || 0}</span>
                        <span>•</span>
                        <span>📝 {u.postsCount || 0} post</span>
                      </td>
                      <td className="p-3 text-[11px] text-gray-500 font-mono">{u.createdAt}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {u.role === 'ADMIN' ? (
                            <button
                              onClick={() => updateUserRole(u.id, 'USER')}
                              className="text-[11px] font-bold text-gray-600 hover:underline"
                            >
                              Ubah ke USER
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserRole(u.id, 'ADMIN')}
                              className="text-[11px] font-bold text-[#35B9FF] hover:underline"
                            >
                              Jadikan ADMIN
                            </button>
                          )}

                          {u.id !== currentUser.id && u.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => setItemToDelete({ type: 'user', id: u.id, title: `${u.name} (@${u.username})` })}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto cursor-pointer"
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB CONTENT: NEWS MANAGEMENT */}
      {activeTab === 'news' && (
        <section className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-base text-gray-900 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#FF4F8B]" />
              <span>Kelola & Hapus Berita Sekolah</span>
            </h2>
            <span className="text-xs font-bold text-gray-400">Total: {news.length} Artikel</span>
          </div>

          {news.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500">
              Belum ada berita diterbitkan.
            </div>
          ) : (
            <div className="space-y-3">
              {news.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.coverImage} alt={item.title} className="w-16 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold bg-[#FF4F8B] text-white px-2 py-0.5 rounded-full uppercase">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-xs text-gray-900 truncate mt-0.5">{item.title}</h4>
                      <p className="text-[10px] text-gray-400">Diterbitkan: {item.publishedAt} oleh {item.authorName}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setItemToDelete({ type: 'news', id: item.id, title: item.title })}
                    className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-red-200 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Berita</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT: EMKA RADIO REQUESTS */}
      {activeTab === 'radio' && (
        <section className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-heading font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#FF4F8B]" />
            <span>Persetujuan Request Lagu Radio On-Air</span>
          </h2>

          <div className="space-y-2">
            {radioRequests.map((req) => (
              <div key={req.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{req.songTitle} — {req.artist}</p>
                  <p className="text-gray-500 italic text-[11px]">"{req.message}"</p>
                  <p className="text-[10px] text-gray-400">Dari: {req.senderName}</p>
                </div>

                {req.status === 'Pending' ? (
                  <button
                    onClick={() => approveRadioRequest(req.id)}
                    className="bg-[#B8FF00] text-black font-extrabold px-3 py-1.5 rounded-xl text-xs hover:bg-[#a2e600]"
                  >
                    Setujui Putar
                  </button>
                ) : (
                  <span className="text-green-600 font-bold text-[10px]">Disetujui ✓</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CONFIRMATION DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            if (itemToDelete.type === 'user') {
              deleteUser(itemToDelete.id);
            } else if (itemToDelete.type === 'news') {
              deleteNews(itemToDelete.id);
            }
            setItemToDelete(null);
          }
        }}
        title={itemToDelete?.type === 'user' ? 'Hapus Akun Pengguna?' : 'Hapus Berita Sekolah?'}
        message={
          itemToDelete?.type === 'user'
            ? `Apakah Anda yakin ingin menghapus akun ${itemToDelete?.title} secara permanen dari MKVERSE?`
            : `Apakah Anda yakin ingin menghapus berita "${itemToDelete?.title}" dari portal sekolah?`
        }
        confirmText={itemToDelete?.type === 'user' ? 'Ya, Hapus Akun' : 'Ya, Hapus Berita'}
      />

    </div>
  );
};
