import React, { useState } from 'react';
import { Compass, Users, Search, UserPlus, Trash2, ShieldCheck, UserCheck, MessageSquare, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';

interface ExploreViewProps {
  onNavigate: (view: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onNavigate }) => {
  const { 
    users, 
    currentUser, 
    deleteUser, 
    toggleFollowUser, 
    viewProfile, 
    startChatWithUser 
  } = useApp();

  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom delete modal state
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; username: string } | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.kelas && u.kelas.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'Siswa') return matchesSearch && u.userType === 'Siswa';
    if (filterType === 'Guru') return matchesSearch && (u.userType === 'Guru' || u.userType === 'Guru/Staf');
    if (filterType === 'Karyawan') return matchesSearch && (u.userType === 'Karyawan' || u.userType === 'Karyawan/Staf' || u.userType === 'Guru/Staf');
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* HEADER BANNER */}
      <section className="bg-white rounded-3xl p-6 border-2.5 border-black shadow-[4px_4px_0px_0px_#000] space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-black stroke-[2.5]" />
          <h1 className="font-heading font-black text-xl sm:text-2xl text-black">
            EXPLORE KOMUNITAS MULTI KARYA
          </h1>
        </div>
        <p className="text-xs text-gray-800 font-bold">
          Temukan teman sekelas, guru, dan admin di ekosistem digital MKVERSE
        </p>

        {/* Search Input */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-black stroke-[2.5] absolute left-3.5 top-5" />
          <input
            type="text"
            placeholder="Cari nama siswa, username, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neo-input w-full pl-10 pr-4 py-2.5 text-xs"
          />
        </div>
      </section>

      {/* COMMUNITY DIRECTORY TABS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {['all', 'Siswa', 'Guru', 'Karyawan'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`neo-btn px-4 py-2 text-xs ${
              filterType === type
                ? 'bg-[#0B0B0B] text-[#B8FF00]'
                : 'bg-white text-black'
            }`}
          >
            {type === 'all' ? 'Semua Warga Sekolah' : type}
          </button>
        ))}
      </div>

      {/* USER CARDS GRID */}
      {filteredUsers.length === 0 ? (
        <div className="neo-card p-10 text-center bg-white space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFE600] text-black flex items-center justify-center mx-auto border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <Users className="w-7 h-7 text-black stroke-[2.5]" />
          </div>
          <h3 className="font-heading font-black text-lg text-black">
            Warga Tidak Ditemukan
          </h3>
          <p className="text-xs text-black max-w-sm mx-auto font-bold">
            Coba gunakan kata kunci nama atau username lain di pencarian.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isFollowing = currentUser?.followingIds?.includes(user.id) || false;
            const isSelf = currentUser?.id === user.id;
            const isUserAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

            return (
              <div 
                key={user.id}
                className="neo-card p-4 bg-white flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      onClick={() => viewProfile(user.id, onNavigate)}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <div 
                        onClick={() => viewProfile(user.id, onNavigate)}
                        className="flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <h3 className="font-heading font-black text-xs text-black truncate">{user.name}</h3>
                        {isUserAdmin && (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#B8FF00] shrink-0 fill-black stroke-[2.5]" title="Admin Resmi" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-700 font-bold truncate">@{user.username}</p>
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md border border-black mt-1 ${
                        user.role === 'ADMIN' ? 'bg-[#FFE600] text-black' :
                        user.userType === 'Siswa' ? 'bg-[#35B9FF] text-black' :
                        'bg-[#FF4F8B] text-white'
                      }`}>
                        {user.role === 'ADMIN' ? 'ADMIN SEKOLAH' : (user.kelas || user.mataPelajaran || user.divisi || user.userType)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-black font-body font-medium line-clamp-2 mb-3 bg-[#F7F7F0] p-2 rounded-xl border border-black">
                    {user.bio || 'Warga SMK Multi Karya Medan.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t-2 border-black">
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewProfile(user.id, onNavigate)}
                      className="neo-btn flex-1 py-1.5 px-2 text-[11px] bg-gray-100 text-black flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Profil</span>
                    </button>

                    {!isSelf && (
                      <button
                        onClick={() => startChatWithUser(user.id, onNavigate)}
                        className="neo-btn py-1.5 px-3 text-[11px] bg-[#FFE600] text-black flex items-center justify-center gap-1"
                        title="Kirim Pesan Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>

                  {!isSelf && (
                    <button 
                      onClick={() => toggleFollowUser(user.id)}
                      className={`neo-btn w-full text-xs py-2 px-3 flex items-center justify-center gap-1.5 ${
                        isFollowing 
                          ? 'bg-[#35B9FF] text-black' 
                          : 'bg-[#B8FF00] text-black'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Mengikuti</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>+ Ikuti</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* ADMIN CONTROL: DELETE USER ACCOUNT */}
                  {isAdmin && !isSelf && !isUserAdmin && (
                    <button
                      onClick={() => setUserToDelete({ id: user.id, name: user.name, username: user.username })}
                      className="neo-btn w-full bg-[#FF4F8B] text-white text-xs py-1.5 px-3 flex items-center justify-center gap-1.5"
                      title="Hapus Akun Warga"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Hapus Akun</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* CONFIRMATION DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
        title="Hapus Akun Warga?"
        message={`Apakah Anda yakin ingin menghapus akun ${userToDelete?.name} (@${userToDelete?.username})? Tindakan ini akan menghapus akun dan seluruh postingannya dari MKVERSE untuk mengatasi pelanggaran.`}
        confirmText="Ya, Hapus Akun"
      />

    </div>
  );
};

