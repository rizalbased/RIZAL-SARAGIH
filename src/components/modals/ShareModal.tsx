import React, { useState } from 'react';
import { X, Send, Radio, Copy, Check, Search, UserCheck } from 'lucide-react';
import { Post } from '../../types';
import { useApp } from '../../context/AppContext';

interface ShareModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, isOpen, onClose }) => {
  const { currentUser, users, addStory, sendDirectShareMessage } = useApp();
  
  const [selectedTab, setSelectedTab] = useState<'story' | 'dm' | 'copy'>('story');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dmNote, setDmNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 1500);
  };

  const handleShareToStory = () => {
    // Generate story text & image (~1MB JPG styled preview format)
    const storyText = `📌 Post dari @${post.authorUsername}:\n"${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}"`;
    const storyBg = 'from-purple-600 via-pink-600 to-amber-500';
    addStory(storyText, post.mediaUrl || undefined, storyBg);
    showToast('✨ Berhasil dipublikasikan ke Story Anda!');
  };

  const handleShareToDM = () => {
    if (!selectedUser) {
      alert('Pilih teman terlebih dahulu');
      return;
    }
    const message = `🔗 [Berbagi Postingan dari @${post.authorUsername}]\n"${post.content.slice(0, 120)}"\n${dmNote ? `\nCatatan: ${dmNote}` : ''}`;
    sendDirectShareMessage(selectedUser, message);
    showToast('📩 Berhasil dikirim ke Direct Message!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white text-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-heading font-extrabold text-base text-gray-900">Bagikan Postingan</h3>
            <p className="text-[11px] text-gray-500">Pilih opsi bagikan ke Story atau Direct Messenger</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="mb-4 p-3 bg-[#0B0B0B] text-[#B8FF00] rounded-2xl text-xs font-bold text-center animate-bounce shadow-md">
            {toastMsg}
          </div>
        )}

        {/* Post Preview Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 mb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <img 
              src={post.authorAvatar} 
              alt={post.authorName} 
              className="w-8 h-8 rounded-xl object-cover border border-gray-200"
            />
            <div>
              <p className="font-bold text-xs text-gray-900">{post.authorName}</p>
              <p className="text-[10px] text-gray-400">@{post.authorUsername}</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 line-clamp-2 font-body">{post.content}</p>
          {post.mediaUrl && (
            <div className="mt-2 h-24 rounded-xl overflow-hidden border border-gray-200">
              <img src={post.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-4 text-xs font-bold">
          <button
            onClick={() => setSelectedTab('story')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedTab === 'story' ? 'bg-[#FF4F8B] text-white shadow-sm' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Ke Story</span>
          </button>

          <button
            onClick={() => setSelectedTab('dm')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedTab === 'dm' ? 'bg-[#35B9FF] text-white shadow-sm' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Ke DM</span>
          </button>

          <button
            onClick={() => setSelectedTab('copy')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedTab === 'copy' ? 'bg-[#0B0B0B] text-white shadow-sm' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Salin Link</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        {selectedTab === 'story' && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-2xl text-center space-y-1 shadow">
              <p className="text-xs font-bold uppercase tracking-wider">Format Story ~ 1 MB High Res</p>
              <p className="text-xs opacity-90">Postingan ini akan langsung ditampilkan di Story kamu selama 24 jam</p>
            </div>
            <button
              onClick={handleShareToStory}
              className="w-full bg-[#0B0B0B] text-[#B8FF00] font-heading font-extrabold py-3 rounded-2xl shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Radio className="w-4 h-4 text-[#B8FF00]" />
              <span>Publikasikan Langsung ke Story Saya</span>
            </button>
          </div>
        )}

        {selectedTab === 'dm' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari teman untuk dikirimi pesan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-3">Teman tidak ditemukan</p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user.id)}
                    className={`p-2 rounded-xl flex items-center justify-between cursor-pointer border text-xs transition-all ${
                      selectedUser === user.id
                        ? 'bg-[#35B9FF]/10 border-[#35B9FF] text-[#0088CC] font-bold'
                        : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-[10px] text-gray-400">@{user.username}</p>
                      </div>
                    </div>
                    {selectedUser === user.id && <UserCheck className="w-4 h-4 text-[#35B9FF]" />}
                  </div>
                ))
              )}
            </div>

            <input
              type="text"
              placeholder="Tambahkan pesan khusus (opsional)..."
              value={dmNote}
              onChange={(e) => setDmNote(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
            />

            <button
              onClick={handleShareToDM}
              className="w-full bg-[#0B0B0B] text-[#B8FF00] font-heading font-extrabold py-2.5 rounded-2xl shadow hover:bg-black transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <Send className="w-4 h-4 text-[#B8FF00]" />
              <span>Kirim Direct Message</span>
            </button>
          </div>
        )}

        {selectedTab === 'copy' && (
          <div className="space-y-4 text-center py-2">
            <p className="text-xs text-gray-600 font-medium">Salin tautan untuk membagikan ke media sosial lain</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/#post-${post.id}`}
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700"
              />
              <button
                onClick={handleCopyLink}
                className="bg-[#0B0B0B] text-[#B8FF00] p-2.5 rounded-xl text-xs font-bold flex items-center justify-center"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <p className="text-[11px] font-bold text-green-600">Tautan berhasil disalin!</p>}
          </div>
        )}

      </div>
    </div>
  );
};
