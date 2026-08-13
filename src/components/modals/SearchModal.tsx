import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Newspaper, FileText, Sparkles, FolderGit2, ArrowRight, MessageSquare, Eye, ShieldCheck, UserPlus, Check, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onSelectNews?: (newsId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectNews
}) => {
  const { users, news, posts, files, viewProfile, startChatWithUser, currentUser, toggleFollowUser } = useApp();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'users' | 'news' | 'posts' | 'files'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchedUsers = users.filter(u => {
    const nameLower = (u.name || '').toLowerCase();
    const usernameLower = (u.username || '').toLowerCase();
    const userTypeLower = (u.userType || '').toLowerCase();
    const kelasLower = (u.kelas || '').toLowerCase();
    return (
      nameLower.includes(cleanQuery) || 
      usernameLower.includes(cleanQuery) ||
      kelasLower.includes(cleanQuery) ||
      userTypeLower.includes(cleanQuery)
    );
  });

  const matchedNews = news.filter(n =>
    n.title.toLowerCase().includes(cleanQuery) ||
    n.summary.toLowerCase().includes(cleanQuery) ||
    n.category.toLowerCase().includes(cleanQuery)
  );

  const matchedPosts = posts.filter(p =>
    p.content.toLowerCase().includes(cleanQuery) ||
    p.authorName.toLowerCase().includes(cleanQuery) ||
    p.authorUsername.toLowerCase().includes(cleanQuery)
  );

  const matchedFiles = files.filter(f =>
    f.filename.toLowerCase().includes(cleanQuery) ||
    f.category.toLowerCase().includes(cleanQuery)
  );

  const hasResults = cleanQuery && (matchedUsers.length > 0 || matchedNews.length > 0 || matchedPosts.length > 0 || matchedFiles.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-20 px-4 animate-fade-in">
      <div 
        className="bg-white text-black w-full max-w-2xl rounded-3xl shadow-[6px_6px_0px_0px_#000] overflow-hidden border-2 border-black flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Input Top Bar */}
        <div className="p-4 border-b-2 border-black flex items-center gap-3 bg-[#F7F7F0]">
          <Search className="w-5 h-5 text-black stroke-[2.5] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari warga sekolah, username (@rizalapp), berita, atau postingan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-black focus:outline-none text-black placeholder-gray-500"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="neo-btn text-xs bg-[#FF4F8B] text-black px-2.5 py-1 font-black cursor-pointer border border-black"
            >
              Hapus
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1.5 text-black hover:bg-gray-200 rounded-full border border-black flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-black bg-white overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Semua Hasil' },
            { id: 'users', label: `Warga (${matchedUsers.length})` },
            { id: 'news', label: `Berita (${matchedNews.length})` },
            { id: 'posts', label: `Post (${matchedPosts.length})` },
            { id: 'files', label: `Berkas (${matchedFiles.length})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`neo-btn px-3 py-1 text-xs whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#0B0B0B] text-[#B8FF00]'
                  : 'bg-white text-black'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 no-scrollbar bg-[#F7F7F0]">
          {!cleanQuery ? (
            <div className="py-6 text-center space-y-4 bg-white p-6 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000]">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE600] text-black flex items-center justify-center mx-auto border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="font-heading font-black text-sm text-black">Cari Warga Sekolah & Konten di MKVERSE</p>
                <p className="text-xs text-gray-700 font-bold mt-0.5">Ketik nama, @username, kelas, berita, atau postingan</p>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {['rizalapp', 'Siswa RPL', 'Guru', 'Pengumuman', 'MPLS'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="neo-btn text-xs bg-white hover:bg-[#B8FF00] text-black font-bold px-3 py-1.5 cursor-pointer border border-black"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          ) : !hasResults ? (
            <div className="py-12 text-center text-black space-y-2 bg-white p-6 rounded-2xl border-2 border-black">
              <Search className="w-10 h-10 text-black mx-auto stroke-[2]" />
              <p className="text-xs font-black text-black">Tidak ada hasil ditemukan untuk "{query}"</p>
              <p className="text-[11px] text-gray-700 font-bold">Coba periksa ejaan atau gunakan kata kunci lain.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* USERS RESULTS */}
              {(activeCategory === 'all' || activeCategory === 'users') && matchedUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-heading font-black text-black uppercase tracking-wider">
                    <Users className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>Warga Sekolah ({matchedUsers.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {matchedUsers.map((u) => {
                      const isSelf = currentUser?.id === u.id;
                      const isFollowing = currentUser?.followingIds?.includes(u.id);
                      const isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';

                      return (
                        <div
                          key={u.id}
                          className="p-3.5 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div 
                            onClick={() => {
                              viewProfile(u.id, onNavigate);
                              onClose();
                            }}
                            className="flex items-start gap-3 min-w-0 cursor-pointer hover:opacity-80"
                          >
                            <img src={u.avatar} alt={u.name} className="w-11 h-11 rounded-xl object-cover border-2 border-black shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-black text-black">{u.name}</p>
                                {isAdmin && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.2 rounded bg-[#FFE600] text-black border border-black">
                                    <ShieldCheck className="w-3 h-3" />
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-700 font-bold">@{u.username}</p>
                              {u.bio && (
                                <p className="text-[10px] text-gray-600 font-medium truncate max-w-sm mt-0.5">{u.bio}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 justify-end">
                            <button
                              onClick={() => {
                                viewProfile(u.id, onNavigate);
                                onClose();
                              }}
                              className="neo-btn px-2.5 py-1.5 bg-[#B8FF00] text-black text-xs font-black border border-black flex items-center gap-1 cursor-pointer"
                              title="Lihat Profil"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Profil</span>
                            </button>

                            {!isSelf && (
                              <>
                                <button
                                  onClick={() => {
                                    startChatWithUser(u.id, onNavigate);
                                    onClose();
                                  }}
                                  className="neo-btn p-1.5 bg-[#FFE600] text-black border border-black cursor-pointer"
                                  title="Kirim Chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => toggleFollowUser(u.id)}
                                  className={`neo-btn px-3 py-1.5 text-xs font-black border border-black flex items-center gap-1 cursor-pointer ${
                                    isFollowing ? 'bg-[#35B9FF] text-black' : 'bg-[#FF4F8B] text-black'
                                  }`}
                                >
                                  {isFollowing ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Following</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span>Follow</span>
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NEWS RESULTS */}
              {(activeCategory === 'all' || activeCategory === 'news') && matchedNews.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-heading font-black text-black uppercase tracking-wider">
                    <Newspaper className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>Berita Sekolah ({matchedNews.length})</span>
                  </div>
                  <div className="space-y-2">
                    {matchedNews.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onClose();
                          if (onSelectNews) {
                            onSelectNews(n.id);
                          } else {
                            onNavigate('news');
                          }
                        }}
                        className="p-3 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-between cursor-pointer hover:bg-[#FFE600] transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-black truncate">{n.title}</p>
                          <p className="text-[10px] text-gray-800 font-bold truncate">{n.summary}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-black stroke-[2.5] ml-2 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* POSTS RESULTS */}
              {(activeCategory === 'all' || activeCategory === 'posts') && matchedPosts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-heading font-black text-black uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>Postingan Feed ({matchedPosts.length})</span>
                  </div>
                  <div className="space-y-2">
                    {matchedPosts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onClose();
                          onNavigate('home');
                        }}
                        className="p-3 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:bg-[#35B9FF]/20 transition-colors"
                      >
                        <p className="text-xs font-black text-black line-clamp-2">"{p.content}"</p>
                        <p className="text-[10px] text-gray-800 font-bold mt-1">— {p.authorName} (@{p.authorUsername})</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FILES RESULTS */}
              {(activeCategory === 'all' || activeCategory === 'files') && matchedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-heading font-black text-black uppercase tracking-wider">
                    <FolderGit2 className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>Berkas Dokumentasi ({matchedFiles.length})</span>
                  </div>
                  <div className="space-y-2">
                    {matchedFiles.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          onClose();
                          onNavigate('documentation');
                        }}
                        className="p-3 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-between cursor-pointer hover:bg-[#B8FF00] transition-colors"
                      >
                        <div>
                          <p className="text-xs font-black text-black">{f.filename}</p>
                          <p className="text-[10px] text-gray-800 font-bold">{f.category}</p>
                        </div>
                        <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-md font-black border border-black">Drive</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#F7F7F0] border-t-2 border-black text-center text-[11px] text-black font-bold flex items-center justify-between px-4">
          <span>Tekan <kbd className="bg-white px-1.5 py-0.5 rounded border border-black font-mono text-[10px]">ESC</kbd> untuk menutup</span>
          <button 
            onClick={() => {
              onClose();
              onNavigate('explore');
            }}
            className="neo-btn px-3 py-1 bg-[#B8FF00] text-black font-black text-xs cursor-pointer border border-black"
          >
            Buka Direktori Lengkap →
          </button>
        </div>

      </div>
    </div>
  );
};
