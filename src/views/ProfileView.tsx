import React, { useState } from 'react';
import { User, Edit3, LogOut, Bookmark, Grid, Camera, Upload, Link as LinkIcon, MessageSquare, UserPlus, UserCheck, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostCard } from '../components/post/PostCard';
import { SocialLinksBar } from '../components/profile/SocialLinksBar';

interface ProfileViewProps {
  onOpenReport: (postId: string, preview: string) => void;
  onNavigate: (view: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenReport, onNavigate }) => {
  const { 
    currentUser, 
    users, 
    posts, 
    stories, 
    radioRequests, 
    logout, 
    updateProfile,
    selectedProfileId,
    viewProfile,
    toggleFollowUser,
    startChatWithUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [isEditing, setIsEditing] = useState(false);

  // Check if viewing someone else's profile (friend or admin)
  const isViewingOther = Boolean(selectedProfileId && selectedProfileId !== currentUser?.id);
  const targetUser = isViewingOther 
    ? users.find(u => u.id === selectedProfileId || u.username === selectedProfileId) || null 
    : currentUser;

  const displayUser = targetUser || currentUser;

  // Edit form state
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editUsername, setEditUsername] = useState(currentUser?.username || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');
  const [editCoverImage, setEditCoverImage] = useState(currentUser?.coverImage || '');
  const [editKelas, setEditKelas] = useState(currentUser?.kelas || '');
  const [editMataPelajaran, setEditMataPelajaran] = useState(currentUser?.mataPelajaran || '');
  const [editDivisi, setEditDivisi] = useState(currentUser?.divisi || '');

  // Social Links state
  const [editInstagram, setEditInstagram] = useState(currentUser?.socialLinks?.instagram || '');
  const [editTiktok, setEditTiktok] = useState(currentUser?.socialLinks?.tiktok || '');
  const [editFacebook, setEditFacebook] = useState(currentUser?.socialLinks?.facebook || '');
  const [editWhatsapp, setEditWhatsapp] = useState(currentUser?.socialLinks?.whatsapp || '');
  const [editThreads, setEditThreads] = useState(currentUser?.socialLinks?.threads || '');
  const [editTwitter, setEditTwitter] = useState(currentUser?.socialLinks?.twitter || '');
  const [editDiscord, setEditDiscord] = useState(currentUser?.socialLinks?.discord || '');
  const [editYoutube, setEditYoutube] = useState(currentUser?.socialLinks?.youtube || '');
  const [editWebsite, setEditWebsite] = useState(currentUser?.socialLinks?.website || '');

  if (!displayUser) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-sm space-y-3 my-6">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-500">
          <User className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-extrabold text-lg text-gray-900">Profil Tidak Ditemukan</h3>
        <p className="text-xs text-gray-500">Pengguna yang Anda cari mungkin telah dihapus atau tidak ditemukan.</p>
        <button
          onClick={() => {
            viewProfile(null);
            onNavigate('home');
          }}
          className="neo-btn px-5 py-2.5 text-xs inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>
    );
  }

  const isFollowing = currentUser?.followingIds?.includes(displayUser.id) || false;
  const userPosts = (posts || []).filter(p => p.authorId === displayUser.id || p.authorUsername === displayUser.username);
  const savedPosts = (posts || []).filter(p => p.isSaved);
  const userStoriesCount = (stories || []).filter(s => s.authorId === displayUser.id || s.authorName === displayUser.name).length;
  const userRadioRequestsCount = (radioRequests || []).filter(r => r.senderUsername === displayUser.username || (r.senderName && r.senderName.includes(displayUser.name))).length;

  const handleDirectAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewingOther) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto profil maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setEditAvatar(dataUrl);
        updateProfile({ avatar: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDirectCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewingOther) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file foto sampul maksimal 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setEditCoverImage(dataUrl);
        updateProfile({ coverImage: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      username: editUsername,
      bio: editBio,
      avatar: editAvatar,
      coverImage: editCoverImage,
      kelas: editKelas,
      mataPelajaran: editMataPelajaran,
      divisi: editDivisi,
      socialLinks: {
        instagram: editInstagram,
        tiktok: editTiktok,
        facebook: editFacebook,
        whatsapp: editWhatsapp,
        threads: editThreads,
        twitter: editTwitter,
        discord: editDiscord,
        youtube: editYoutube,
        website: editWebsite
      }
    });
    setIsEditing(false);
  };

  const openEditModal = () => {
    if (!currentUser) return;
    setEditName(currentUser.name);
    setEditUsername(currentUser.username);
    setEditBio(currentUser.bio);
    setEditAvatar(currentUser.avatar);
    setEditCoverImage(currentUser.coverImage || '');
    setEditKelas(currentUser.kelas || '');
    setEditMataPelajaran(currentUser.mataPelajaran || '');
    setEditDivisi(currentUser.divisi || '');

    setEditInstagram(currentUser.socialLinks?.instagram || '');
    setEditTiktok(currentUser.socialLinks?.tiktok || '');
    setEditFacebook(currentUser.socialLinks?.facebook || '');
    setEditWhatsapp(currentUser.socialLinks?.whatsapp || '');
    setEditThreads(currentUser.socialLinks?.threads || '');
    setEditTwitter(currentUser.socialLinks?.twitter || '');
    setEditDiscord(currentUser.socialLinks?.discord || '');
    setEditYoutube(currentUser.socialLinks?.youtube || '');
    setEditWebsite(currentUser.socialLinks?.website || '');

    setIsEditing(true);
  };

  const isAdmin = displayUser.role === 'ADMIN' || displayUser.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* USER PROFILE CARD */}
      <section className="bg-white rounded-3xl p-6 border-2.5 border-black shadow-[4px_4px_0px_0px_#000] relative overflow-hidden">
        
        {/* Cover Background (16:9 Banner ratio) */}
        <div 
          className="h-36 sm:h-52 -mx-6 -mt-6 rounded-t-3xl relative bg-cover bg-center group overflow-hidden border-b-2.5 border-black"
          style={{
            backgroundImage: displayUser.coverImage 
              ? `url(${displayUser.coverImage})` 
              : 'linear-gradient(to right, #0B0B0B, #743CFF, #35B9FF)'
          }}
        >
          <div className="absolute inset-0 bg-black/20" />
          
          {isAdmin && (
            <span className="absolute top-3 right-3 bg-[#FFE600] text-black text-[10px] font-black px-3 py-1 rounded-lg uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] z-10">
              ADMINISTRATOR
            </span>
          )}

          {/* Direct Cover Upload Button (Only for own profile) */}
          {!isViewingOther && (
            <label 
              className="absolute bottom-3 right-3 bg-black text-[#B8FF00] font-heading font-black text-[11px] py-1.5 px-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#fff] hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer z-10 transition-transform"
              title="Ganti Foto Sampul Header (Ukuran 16:9)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Ganti Sampul (16:9)</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleDirectCoverUpload} 
                className="hidden" 
              />
            </label>
          )}

          {/* Back button when viewing someone else */}
          {isViewingOther && (
            <button
              onClick={() => viewProfile(null)}
              className="absolute top-3 left-3 bg-white text-black font-black text-xs px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-gray-100 flex items-center gap-1.5 z-10"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Profil Saya</span>
            </button>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 mb-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 text-center sm:text-left">
            
            {/* Avatar Profile Picture (1:1 Ratio with Direct Camera Upload Button) */}
            <div className="relative group shrink-0">
              <img 
                src={displayUser.avatar} 
                alt={displayUser.name} 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-3 border-black shadow-[3px_3px_0px_0px_#000] bg-white aspect-square"
              />
              {!isViewingOther && (
                <label 
                  className="absolute -bottom-1 -right-1 p-2 bg-[#0B0B0B] text-[#B8FF00] rounded-2xl shadow-[2px_2px_0px_0px_#000] border-2 border-black hover:bg-black transition-transform hover:scale-110 cursor-pointer"
                  title="Ganti Foto Profil (Ukuran 1:1)"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleDirectAvatarUpload} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h1 className="font-heading font-black text-xl text-black">{displayUser.name}</h1>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border border-black uppercase ${
                  displayUser.userType === 'Siswa' ? 'bg-[#35B9FF] text-black' :
                  displayUser.userType === 'Guru' ? 'bg-[#FF4F8B] text-white' :
                  'bg-[#FFE600] text-black'
                }`}>
                  {displayUser.userType}
                </span>
              </div>
              <p className="text-xs text-gray-800 font-bold mt-0.5">
                @{displayUser.username} • {displayUser.kelas || displayUser.mataPelajaran || displayUser.divisi || 'SMK Multi Karya'}
              </p>
            </div>
          </div>

          {/* Action Buttons for own vs other user */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {isViewingOther ? (
              <>
                <button
                  onClick={() => toggleFollowUser(displayUser.id)}
                  className={`neo-btn py-2 px-4 text-xs flex items-center gap-1.5 ${
                    isFollowing ? 'bg-[#35B9FF] text-black' : 'bg-[#B8FF00] text-black'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Mengikuti</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Ikuti</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => startChatWithUser(displayUser.id, onNavigate)}
                  className="neo-btn py-2 px-4 text-xs bg-[#FFE600] text-black flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                  <span>Kirim Pesan</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openEditModal}
                  className="neo-btn py-2 px-4 text-xs bg-gray-100 text-black flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4 stroke-[2.5]" />
                  <span>Edit Profil</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    onNavigate('home');
                  }}
                  className="neo-btn py-2 px-3 text-xs bg-[#FF4F8B] text-white flex items-center gap-1"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bio & Social Media Links */}
        <div className="bg-[#F7F7F0] p-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_#000] space-y-2 mb-4">
          <p className="text-xs text-black font-body font-medium leading-relaxed">
            {displayUser.bio || 'Belum ada bio singkat.'}
          </p>

          {/* Render Active Social Links */}
          <SocialLinksBar socialLinks={displayUser.socialLinks} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t-2 border-black text-center">
          <div>
            <p className="font-heading font-black text-base text-black">{displayUser.followersCount || 0}</p>
            <p className="text-[10px] text-gray-700 font-bold uppercase">Pengikut</p>
          </div>
          <div>
            <p className="font-heading font-black text-base text-black">{userPosts.length}</p>
            <p className="text-[10px] text-gray-700 font-bold uppercase">Postings</p>
          </div>
          <div>
            <p className="font-heading font-black text-base text-black">{userStoriesCount}</p>
            <p className="text-[10px] text-gray-700 font-bold uppercase">Story</p>
          </div>
          <div>
            <p className="font-heading font-black text-base text-black">{userRadioRequestsCount}</p>
            <p className="text-[10px] text-gray-700 font-bold uppercase">Req Radio</p>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`neo-btn py-2 px-4 text-xs flex items-center gap-1.5 ${
            activeTab === 'posts' ? 'bg-[#0B0B0B] text-[#B8FF00]' : 'bg-white text-black'
          }`}
        >
          <Grid className="w-4 h-4 stroke-[2.5]" />
          <span>Postings ({userPosts.length})</span>
        </button>

        {!isViewingOther && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`neo-btn py-2 px-4 text-xs flex items-center gap-1.5 ${
              activeTab === 'saved' ? 'bg-[#35B9FF] text-black' : 'bg-white text-black'
            }`}
          >
            <Bookmark className="w-4 h-4 stroke-[2.5]" />
            <span>Tersimpan ({savedPosts.length})</span>
          </button>
        )}
      </div>

      {/* POSTS LIST */}
      <section className="space-y-4">
        {activeTab === 'posts' ? (
          userPosts.length === 0 ? (
            <div className="neo-card p-8 text-center bg-white">
              <p className="text-black font-bold text-xs">Belum ada postingan dari pengguna ini.</p>
            </div>
          ) : (
            userPosts.map(post => <PostCard key={post.id} post={post} onOpenReport={onOpenReport} />)
          )
        ) : (
          savedPosts.length === 0 ? (
            <div className="neo-card p-8 text-center bg-white">
              <p className="text-black font-bold text-xs">Belum ada postingan yang disimpan.</p>
            </div>
          ) : (
            savedPosts.map(post => <PostCard key={post.id} post={post} onOpenReport={onOpenReport} />)
          )
        )}
      </section>

      {/* EDIT PROFILE MODAL (Only for own profile) */}
      {isEditing && !isViewingOther && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-[#0B0B0B] w-full max-w-lg rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000] border-2.5 border-black max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading font-black text-lg mb-4 text-black">Edit Profil MKVERSE</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="neo-input w-full px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-gray-500 font-black">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="neo-input w-full pl-7 pr-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Foto Profil Avatar (1:1) */}
              <div>
                <label className="block text-xs font-black text-black mb-1">Foto Profil Avatar (Ukuran 1:1)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="URL Gambar atau Unggah..."
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="neo-input flex-1 px-3.5 py-2 text-xs"
                  />
                  <label className="neo-btn px-3.5 py-2 text-xs bg-[#0B0B0B] text-[#B8FF00] cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => ev.target?.result && setEditAvatar(ev.target.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Foto Header Sampul (16:9) */}
              <div>
                <label className="block text-xs font-black text-black mb-1">Foto Header Sampul (Ukuran 16:9)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="URL Gambar atau Unggah..."
                    value={editCoverImage}
                    onChange={(e) => setEditCoverImage(e.target.value)}
                    className="neo-input flex-1 px-3.5 py-2 text-xs"
                  />
                  <label className="neo-btn px-3.5 py-2 text-xs bg-[#0B0B0B] text-[#B8FF00] cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => ev.target?.result && setEditCoverImage(ev.target.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {currentUser?.userType === 'Siswa' && (
                <div>
                  <label className="block text-xs font-black text-black mb-1">Kelas & Jurusan</label>
                  <input
                    type="text"
                    placeholder="Contoh: XII RPL 1"
                    value={editKelas}
                    onChange={(e) => setEditKelas(e.target.value)}
                    className="neo-input w-full px-3.5 py-2 text-xs"
                  />
                </div>
              )}

              {currentUser?.userType === 'Guru' && (
                <div>
                  <label className="block text-xs font-black text-black mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pemrograman Web & Perangkat Bergerak"
                    value={editMataPelajaran}
                    onChange={(e) => setEditMataPelajaran(e.target.value)}
                    className="neo-input w-full px-3.5 py-2 text-xs"
                  />
                </div>
              )}

              {currentUser?.userType === 'Karyawan' && (
                <div>
                  <label className="block text-xs font-black text-black mb-1">Divisi / Unit Kerja</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tata Usaha / IT Support"
                    value={editDivisi}
                    onChange={(e) => setEditDivisi(e.target.value)}
                    className="neo-input w-full px-3.5 py-2 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-black mb-1">Bio Profil</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="neo-input w-full p-3 text-xs"
                />
              </div>

              {/* SOCIAL MEDIA LINKS FORM SECTION */}
              <div className="pt-2 border-t-2 border-black space-y-2">
                <h4 className="font-heading font-black text-xs text-black flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-[#35B9FF] stroke-[2.5]" />
                  <span>Tautan Media Sosial & Kontak</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-black text-black mb-0.5">Instagram</label>
                    <input
                      type="text"
                      placeholder="username atau link..."
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      className="neo-input w-full px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-black mb-0.5">TikTok</label>
                    <input
                      type="text"
                      placeholder="@username atau link..."
                      value={editTiktok}
                      onChange={(e) => setEditTiktok(e.target.value)}
                      className="neo-input w-full px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-black mb-0.5">Facebook</label>
                    <input
                      type="text"
                      placeholder="username atau link..."
                      value={editFacebook}
                      onChange={(e) => setEditFacebook(e.target.value)}
                      className="neo-input w-full px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-black mb-0.5">WhatsApp</label>
                    <input
                      type="text"
                      placeholder="0812... atau wa.me/..."
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      className="neo-input w-full px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-black mb-0.5">Threads</label>
                    <input
                      type="text"
                      placeholder="@username..."
                      value={editThreads}
                      onChange={(e) => setEditThreads(e.target.value)}
                      className="neo-input w-full px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-black mb-0.5">X (Twitter)</label>
                    <input
                      type="text"
                      placeholder="username..."
                      value={editTwitter}
                      onChange={(e) => setEditTwitter(e.target.value)}
                      className="neo-input w-full px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-black mb-0.5">Discord</label>
                    <input
                      type="text"
                      placeholder="username / invite link..."
                      value={editDiscord}
                      onChange={(e) => setEditDiscord(e.target.value)}
                      className="neo-input w-full px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-black mb-0.5">YouTube</label>
                    <input
                      type="text"
                      placeholder="@channel..."
                      value={editYoutube}
                      onChange={(e) => setEditYoutube(e.target.value)}
                      className="neo-input w-full px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-black mb-0.5">Website / Portofolio</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="neo-input w-full px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="neo-btn px-4 py-2 text-xs bg-gray-200 text-black"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="neo-btn px-5 py-2 text-xs bg-[#B8FF00] text-black font-black"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

