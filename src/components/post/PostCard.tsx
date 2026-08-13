import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Music, MoreHorizontal, Flag, Send, Trash2 } from 'lucide-react';
import { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import { ShareModal } from '../modals/ShareModal';

interface PostCardProps {
  post: Post;
  onOpenReport: (postId: string, preview: string) => void;
  onSelectNews?: (newsId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onOpenReport, onSelectNews }) => {
  const { toggleLikePost, toggleSavePost, addComment, playSong, songs, currentUser, deletePost } = useApp();
  
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [localComments, setLocalComments] = useState([
    { id: 'c1', author: 'Siswa MK', text: 'Keren banget! Salam Multi Karya Universe!', time: '10m lalu' }
  ]);
  const [showMenu, setShowMenu] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const canDeletePost = currentUser && (
    post.authorId === currentUser.id ||
    post.authorUsername === currentUser.username ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'SUPER_ADMIN'
  );

  const handleDeletePost = () => {
    setShowMenu(false);
    if (window.confirm('Apakah Anda yakin ingin menghapus postingan ini?')) {
      deletePost(post.id);
    }
  };

  const handleLike = () => {
    toggleLikePost(post.id);
  };

  const handleSave = () => {
    toggleSavePost(post.id);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(post.id, commentInput);
    setLocalComments(prev => [
      ...prev,
      { id: `lc_${Date.now()}`, author: 'Saya', text: commentInput, time: 'Baru saja' }
    ]);
    setCommentInput('');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayMenfessSong = () => {
    if (post.songData) {
      const found = songs.find(s => s.title.toLowerCase() === post.songData?.title.toLowerCase());
      if (found) {
        playSong(found);
      } else {
        playSong(songs[0]);
      }
    }
  };

  return (
    <article className={`neo-card p-4 sm:p-5 transition-all ${
      post.type === 'confession' ? 'bg-[#FFEFF5]' :
      post.type === 'menfess_lagu' ? 'bg-[#E6F7FF]' :
      'bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img 
            src={post.authorAvatar} 
            alt={post.authorName} 
            className="w-10 h-10 rounded-xl object-cover border-2 border-black"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-xs text-black">
                {post.authorName}
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border border-black uppercase ${
                post.authorType === 'Siswa' ? 'bg-[#35B9FF] text-black' :
                post.authorType === 'Guru' ? 'bg-[#FF4F8B] text-white' :
                'bg-[#FFE600] text-black'
              }`}>
                {post.authorType}
              </span>
            </div>
            <p className="text-[10px] text-gray-700 font-bold">
              @{post.authorUsername} • {post.createdAt}
            </p>
          </div>
        </div>

        {/* Options Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="p-1.5 text-black hover:bg-gray-100 rounded-lg border-2 border-transparent hover:border-black transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 stroke-[2.5]" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] p-1.5 z-20 w-44 animate-fade-in space-y-1">
              {canDeletePost && (
                <button
                  onClick={handleDeletePost}
                  className="w-full text-left px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600 stroke-[2.5]" />
                  Hapus Postingan
                </button>
              )}
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenReport(post.id, post.content);
                }}
                className="w-full text-left px-3 py-2 text-xs font-black text-black hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Flag className="w-4 h-4 text-black stroke-[2.5]" />
                Laporkan Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONFESSION BADGE & MOOD TAG */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {post.type === 'confession' && (
          <div className="inline-flex items-center gap-1.5 bg-[#FF4F8B] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
            <span>🔒 CONFESSION ANONYMOUS</span>
          </div>
        )}
        {post.moodTag && (
          <div className="inline-flex items-center gap-1 bg-[#0B0B0B] text-[#B8FF00] text-[10px] font-black px-2.5 py-0.5 rounded-md border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
            <span>{post.moodTag}</span>
          </div>
        )}
      </div>

      {/* Post Text Content */}
      <p className="text-xs sm:text-sm text-black font-body font-medium leading-relaxed whitespace-pre-line mb-3">
        {post.content}
      </p>

      {/* MENFESS LAGU CARD ATTACHMENT */}
      {post.type === 'menfess_lagu' && post.songData && (
        <div 
          onClick={handlePlayMenfessSong}
          className="bg-[#0B0B0B] text-white p-3.5 rounded-xl my-3 flex items-center justify-between gap-3 border-2 border-black shadow-[3px_3px_0px_0px_#000] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={post.songData.cover} 
              alt={post.songData.title} 
              className="w-12 h-12 rounded-lg object-cover border-2 border-white"
            />
            <div className="min-w-0">
              <span className="text-[9px] bg-[#35B9FF] text-black font-black px-1.5 py-0.5 rounded uppercase border border-black">
                MENFESS LAGU
              </span>
              <h4 className="text-xs font-black text-white truncate mt-0.5 group-hover:text-[#35B9FF] transition-colors">
                {post.songData.title}
              </h4>
              <p className="text-[11px] text-gray-300 font-bold truncate">{post.songData.artist}</p>
              {post.songData.dedicatedTo && (
                <p className="text-[10px] text-[#B8FF00] font-black mt-0.5">
                  Untuk: {post.songData.dedicatedTo}
                </p>
              )}
            </div>
          </div>
          <button className="w-9 h-9 rounded-lg bg-[#35B9FF] text-black font-black flex items-center justify-center border-2 border-black shadow-[1.5px_1.5px_0px_0px_#fff] group-hover:scale-105 transition-transform">
            <Music className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* NEWS SHARE ATTACHMENT */}
      {post.type === 'news_share' && post.newsId && (
        <button
          onClick={() => onSelectNews ? onSelectNews(post.newsId!) : null}
          className="w-full bg-[#FFE600] p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] text-left hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all my-2 flex items-center gap-3 cursor-pointer"
        >
          {post.mediaUrl && (
            <img src={post.mediaUrl} alt="News Cover" className="w-16 h-16 rounded-lg object-cover border border-black" />
          )}
          <div>
            <span className="text-[9px] bg-[#FF4F8B] text-white font-black px-2 py-0.5 rounded-md border border-black uppercase">
              BERITA RESMI SEKOLAH
            </span>
            <p className="text-xs font-black text-black mt-1 line-clamp-1">
              {post.content.split('\n')[0]}
            </p>
            <span className="text-[10px] text-black font-black underline">
              Baca Selengkapnya →
            </span>
          </div>
        </button>
      )}

      {/* Regular Media Image / Video Attachment */}
      {post.mediaUrl && post.type !== 'news_share' && (
        <div className="rounded-xl overflow-hidden my-3 border-2 border-black shadow-[3px_3px_0px_0px_#000] max-h-96">
          {post.mediaType === 'video' || post.mediaUrl.endsWith('.mp4') || post.mediaUrl.includes('gtv-videos-bucket') ? (
            <video 
              src={post.mediaUrl} 
              controls 
              className="w-full h-full max-h-96 object-contain bg-black"
            />
          ) : (
            <img 
              src={post.mediaUrl} 
              alt="Post Attachment" 
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Action Footer Controls */}
      <div className="flex items-center justify-between border-t-2 border-black pt-3 mt-3 text-xs font-black text-black">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-all px-2 py-1 rounded-lg border-2 ${
              post.isLiked ? 'bg-[#FF4F8B] text-white border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent hover:border-black hover:bg-gray-100'
            }`}
          >
            <Heart className={`w-4 h-4 stroke-[2.5] ${post.isLiked ? 'fill-white' : ''}`} />
            <span>{post.likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border-2 border-transparent hover:border-black hover:bg-gray-100 transition-all"
          >
            <MessageCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{post.commentsCount + localComments.length - 1}</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border-2 border-transparent hover:border-black hover:bg-gray-100 transition-all"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Bagikan</span>
          </button>
        </div>

        <button
          onClick={handleSave}
          className={`p-1.5 rounded-lg border-2 transition-all ${
            post.isSaved ? 'bg-[#35B9FF] text-black border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent hover:border-black hover:bg-gray-100'
          }`}
          title="Simpan"
        >
          <Bookmark className={`w-4 h-4 stroke-[2.5] ${post.isSaved ? 'fill-black' : ''}`} />
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        post={post}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Comment Section Drawer */}
      {showComments && (
        <div className="mt-3 pt-3 border-t-2 border-black space-y-3 animate-fade-in">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Tulis komentar kamu..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="neo-input flex-1 px-3 py-1.5 text-xs"
            />
            <button
              type="submit"
              className="neo-btn p-2 text-xs flex items-center justify-center"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {localComments.map((comment) => (
              <div key={comment.id} className="bg-white p-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-black text-black text-[11px]">{comment.author}</span>
                  <span className="text-[9px] text-gray-700 font-bold">{comment.time}</span>
                </div>
                <p className="text-gray-900 font-medium text-[11px]">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </article>
  );
};
