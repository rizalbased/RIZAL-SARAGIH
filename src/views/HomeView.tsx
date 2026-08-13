import React, { useState } from 'react';
import { Newspaper, FolderGit2, MessageSquare, HeartHandshake, ChevronRight, Sparkles, PlusCircle, MessageCircleHeart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StoriesBar } from '../components/story/StoriesBar';
import { PostCard } from '../components/post/PostCard';

interface HomeViewProps {
  onNavigate: (view: string) => void;
  onOpenCreate: () => void;
  onOpenReport: (postId: string, preview: string) => void;
  onSelectNews: (newsId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  onNavigate, 
  onOpenCreate,
  onOpenReport,
  onSelectNews 
}) => {
  const { posts, news, currentUser } = useApp();
  const [filterType, setFilterType] = useState<string>('all');

  const latestNews = news.length > 0 ? news[0] : null;

  const filteredPosts = posts.filter(post => {
    if (filterType === 'all') return true;
    if (filterType === 'post') return post.type === 'post';
    if (filterType === 'confession') return post.type === 'confession';
    if (filterType === 'menfess') return post.type === 'menfess_lagu';
    if (filterType === 'news') return post.type === 'news_share';
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* QUICK ACCESS GRID */}
      <section className="neo-card p-4 bg-white">
        <h2 className="text-xs font-heading font-black text-black uppercase tracking-wider mb-3">
          Akses Cepat Ecosystem
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#FF4F8B] text-white border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-black text-[#FF4F8B] flex items-center justify-center font-bold border border-black shadow-[1px_1px_0px_0px_#fff]">
              <HeartHandshake className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-heading font-black text-xs text-white">Curhat / Confession</p>
              <p className="text-[10px] text-pink-100 font-bold">Ungkapkan Isi Hati</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('news')}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#FFE600] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-black text-[#FFE600] flex items-center justify-center font-bold border border-black shadow-[1px_1px_0px_0px_#000]">
              <Newspaper className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-heading font-black text-xs text-black">Berita</p>
              <p className="text-[10px] text-gray-800 font-bold">Info Sekolah</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('documentation')}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#35B9FF] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-black text-[#35B9FF] flex items-center justify-center font-bold border border-black shadow-[1px_1px_0px_0px_#000]">
              <FolderGit2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-heading font-black text-xs text-black">Dokumentasi</p>
              <p className="text-[10px] text-blue-900 font-bold">Google Drive</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('messages')}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#B8FF00] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-black text-[#B8FF00] flex items-center justify-center font-bold border border-black shadow-[1px_1px_0px_0px_#000]">
              <MessageSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-heading font-black text-xs text-black">Pesan Chat</p>
              <p className="text-[10px] text-gray-800 font-bold">Komunikasi Instant</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('explore')}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#D8B4FE] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-black text-[#D8B4FE] flex items-center justify-center font-bold border border-black shadow-[1px_1px_0px_0px_#000]">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-heading font-black text-xs text-black">Explore</p>
              <p className="text-[10px] text-purple-900 font-bold">Direktori Warga</p>
            </div>
          </button>

        </div>
      </section>

      {/* BERITA TERBARU CARD SECTION */}
      {latestNews && (
        <section className="bg-[#0B0B0B] text-white rounded-3xl p-5 border-2.5 border-black shadow-[4px_4px_0px_0px_#000] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#B8FF00] border border-black" />
              <h3 className="font-heading font-black text-xs uppercase tracking-wider text-[#B8FF00]">
                BERITA TERBARU SEKOLAH
              </h3>
            </div>
            <span className="text-[10px] bg-[#B8FF00] text-black font-black px-2.5 py-0.5 rounded-md border border-black">
              Official
            </span>
          </div>

          <div 
            onClick={() => onSelectNews(latestNews.id)}
            className="group cursor-pointer space-y-3"
          >
            <div className="relative rounded-xl overflow-hidden aspect-video border-2 border-white shadow-[2px_2px_0px_0px_#fff]">
              <img 
                src={latestNews.coverImage} 
                alt={latestNews.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 bg-[#FF4F8B] text-white text-[10px] font-black px-3 py-1 rounded-md border-2 border-black shadow uppercase">
                {latestNews.category}
              </span>
            </div>

            <div>
              <h4 className="font-heading font-black text-base sm:text-lg text-white group-hover:text-[#B8FF00] transition-colors leading-snug">
                {latestNews.title}
              </h4>
              <p className="text-xs text-gray-300 mt-1 font-bold">
                {latestNews.publishedAt} • Oleh {latestNews.authorName}
              </p>
              <p className="text-xs text-gray-200 line-clamp-2 mt-2 font-body font-medium">
                {latestNews.summary}
              </p>
            </div>

            <button 
              className="inline-flex items-center gap-1.5 text-xs font-heading font-black text-[#B8FF00] hover:underline"
            >
              <span>Lihat berita selengkapnya</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </section>
      )}

      {/* STORIES BAR */}
      <StoriesBar onOpenCreateStory={onOpenCreate} />

      {/* FEED FILTER TABS */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 bg-white p-2 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000]">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-heading font-black text-xs transition-all border-2 ${
              filterType === 'all' ? 'bg-[#0B0B0B] text-[#B8FF00] border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent text-black hover:bg-gray-100'
            }`}
          >
            Semua Feed
          </button>
          <button
            onClick={() => setFilterType('post')}
            className={`px-3 py-1.5 rounded-xl font-heading font-black text-xs transition-all border-2 ${
              filterType === 'post' ? 'bg-[#B8FF00] text-black border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent text-black hover:bg-gray-100'
            }`}
          >
            Postings
          </button>
          <button
            onClick={() => setFilterType('confession')}
            className={`px-3 py-1.5 rounded-xl font-heading font-black text-xs transition-all border-2 ${
              filterType === 'confession' ? 'bg-[#FF4F8B] text-white border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent text-black hover:bg-gray-100'
            }`}
          >
            Confession
          </button>
          <button
            onClick={() => setFilterType('menfess')}
            className={`px-3 py-1.5 rounded-xl font-heading font-black text-xs transition-all border-2 ${
              filterType === 'menfess' ? 'bg-[#35B9FF] text-black border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent text-black hover:bg-gray-100'
            }`}
          >
            Menfess Lagu
          </button>
        </div>

        <button
          onClick={onOpenCreate}
          className="hidden sm:flex items-center gap-1.5 neo-btn px-4 py-2 text-xs"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>Buat Post</span>
        </button>
      </div>

      {/* POSTS LIST FEED */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="neo-card p-10 text-center space-y-3 bg-white">
            <div className="w-14 h-14 rounded-2xl bg-[#B8FF00] text-black flex items-center justify-center mx-auto border-2 border-black shadow-[3px_3px_0px_0px_#000]">
              <Sparkles className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="font-heading font-black text-lg text-black">
              Belum Ada Postingan di MKVERSE
            </h3>
            <p className="text-xs text-gray-700 max-w-sm mx-auto font-bold">
              Jadilah warga SMK Multi Karya pertama yang membagikan cerita, karya, confession, atau menfess lagu!
            </p>
            <button
              onClick={onOpenCreate}
              className="neo-btn inline-flex items-center gap-2 px-5 py-2.5 text-xs"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Buat Post Pertama</span>
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onOpenReport={onOpenReport}
              onSelectNews={onSelectNews}
            />
          ))
        )}
      </div>

    </div>
  );
};
