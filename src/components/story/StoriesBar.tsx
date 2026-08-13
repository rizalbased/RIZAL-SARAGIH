import React, { useState } from 'react';
import { Plus, X, Eye, Send, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Story } from '../../types';

interface StoriesBarProps {
  onOpenCreateStory: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ onOpenCreateStory }) => {
  const { stories, currentUser, deleteStory } = useApp();
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [replyText, setReplyText] = useState('');

  const canDeleteActiveStory = activeStory && currentUser && (
    activeStory.authorId === currentUser.id ||
    activeStory.authorName === currentUser.name ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'SUPER_ADMIN'
  );

  const handleDeleteStory = () => {
    if (!activeStory) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus story ini?')) {
      deleteStory(activeStory.id);
      setActiveStory(null);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    alert(`Balasan dikirim ke ${activeStory?.authorName}: "${replyText}"`);
    setReplyText('');
  };

  return (
    <>
      {/* Horizontal Story Scroll Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-3 border border-white/60 shadow-sm mb-4">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          
          {/* Add Story Button */}
          <div 
            onClick={onOpenCreateStory} 
            className="flex flex-col items-center gap-1 cursor-pointer group flex-shrink-0"
          >
            <div className="relative w-14 h-14 rounded-2xl bg-gray-100 border-2 border-dashed border-[#B8FF00] flex items-center justify-center group-hover:bg-[#B8FF00]/10 transition-colors">
              {currentUser ? (
                <img 
                  src={currentUser.avatar} 
                  alt="My Avatar" 
                  className="w-full h-full rounded-2xl object-cover opacity-80"
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#0B0B0B] text-[#B8FF00] flex items-center justify-center shadow-md">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-700 truncate max-w-[60px]">
              Buat Story
            </span>
          </div>

          {/* Stories List */}
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => setActiveStory(story)}
              className="flex flex-col items-center gap-1 cursor-pointer group flex-shrink-0"
            >
              <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-[#B8FF00] via-[#FF4F8B] to-[#35B9FF] group-hover:scale-105 transition-transform shadow-sm">
                <img 
                  src={story.authorAvatar} 
                  alt={story.authorName} 
                  className="w-full h-full rounded-2xl object-cover border-2 border-white"
                />
              </div>
              <span className="text-[10px] font-semibold text-gray-800 truncate max-w-[64px]">
                {story.authorName.split(' ')[0]}
              </span>
            </div>
          ))}

        </div>
      </div>

      {/* STORY VIEWER MODAL */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className={`relative w-full max-w-sm h-[80vh] rounded-3xl p-5 flex flex-col justify-between shadow-2xl overflow-hidden border border-white/20 bg-gradient-to-br ${activeStory.bgGradient || 'from-purple-600 to-pink-500'} text-white`}>
            
            {/* Background Image if available */}
            {activeStory.mediaUrl && (
              <img 
                src={activeStory.mediaUrl} 
                alt="Story Media" 
                className="absolute inset-0 w-full h-full object-cover -z-10 opacity-90"
              />
            )}

            {/* Top Bar: Progress + User Info + Close */}
            <div className="space-y-3 z-10">
              <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                <div className="bg-white h-full w-full animate-progress" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={activeStory.authorAvatar} 
                    alt={activeStory.authorName} 
                    className="w-9 h-9 rounded-xl object-cover border border-white/40 shadow"
                  />
                  <div>
                    <h4 className="font-heading font-extrabold text-xs text-white drop-shadow">
                      {activeStory.authorName}
                    </h4>
                    <p className="text-[10px] text-white/80 font-medium">
                      {activeStory.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canDeleteActiveStory && (
                    <button
                      onClick={handleDeleteStory}
                      className="p-2 text-red-300 hover:text-red-100 bg-red-600/40 hover:bg-red-600/70 rounded-full transition-colors flex items-center justify-center"
                      title="Hapus Story Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setActiveStory(null)}
                    className="p-2 text-white/80 hover:text-white bg-black/30 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Center Story Content */}
            <div className="my-auto text-center px-4 z-10">
              {activeStory.text && (
                <p className="font-heading font-extrabold text-xl text-white drop-shadow-lg leading-relaxed">
                  "{activeStory.text}"
                </p>
              )}
            </div>

            {/* Bottom Bar: Views & Reply Input */}
            <div className="space-y-3 z-10">
              <div className="flex items-center gap-1.5 text-[11px] text-white/80 font-medium justify-center">
                <Eye className="w-3.5 h-3.5" />
                <span>Dilihat oleh {activeStory.viewsCount} warga sekolah</span>
              </div>

              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kirim balasan story..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/30 rounded-2xl px-3.5 py-2 text-xs font-medium text-white placeholder-white/60 focus:outline-none focus:border-white"
                />
                <button
                  type="submit"
                  className="bg-white text-black font-bold p-2.5 rounded-2xl shadow hover:bg-gray-100 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
