import React, { useState } from 'react';
import { HeartHandshake, EyeOff, Send, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostCard } from '../components/post/PostCard';

interface ConfessionViewProps {
  onOpenCreate: () => void;
  onOpenReport: (postId: string, preview: string) => void;
}

export const ConfessionView: React.FC<ConfessionViewProps> = ({ onOpenCreate, onOpenReport }) => {
  const { posts, addConfession } = useApp();
  const [filter, setFilter] = useState<'all' | 'confession' | 'menfess'>('all');

  const [confessionText, setConfessionText] = useState('');
  const [isAnon, setIsAnon] = useState(true);

  const confessions = posts.filter(p => {
    if (filter === 'all') return p.type === 'confession' || p.type === 'menfess_lagu';
    if (filter === 'confession') return p.type === 'confession';
    if (filter === 'menfess') return p.type === 'menfess_lagu';
    return false;
  });

  const handleSubmitInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confessionText.trim()) return;
    addConfession(confessionText, isAnon);
    setConfessionText('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* HEADER HERO */}
      <section className="bg-gradient-to-br from-[#FF4F8B] to-rose-600 text-white rounded-3xl p-6 shadow-xl border border-rose-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-2">
          <HeartHandshake className="w-8 h-8 text-[#FFF000]" />
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            CONFESSION & MENFESS LAGU
          </h1>
        </div>

        <p className="text-xs text-rose-100 font-body max-w-lg leading-relaxed">
          Ungkapkan isi hati, kekaguman, atau pesan khususmu tanpa rasa takut dihakimi. Kirim pesan anonim atau sertakan lagu favorit untuk teman sekelasmu di SMK Multi Karya!
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-2xl font-heading font-extrabold text-xs transition-colors ${
              filter === 'all' ? 'bg-white text-[#FF4F8B] shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Semua Pesan
          </button>
          <button
            onClick={() => setFilter('confession')}
            className={`px-4 py-2 rounded-2xl font-heading font-extrabold text-xs transition-colors ${
              filter === 'confession' ? 'bg-white text-[#FF4F8B] shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🔒 Confession
          </button>
          <button
            onClick={() => setFilter('menfess')}
            className={`px-4 py-2 rounded-2xl font-heading font-extrabold text-xs transition-colors ${
              filter === 'menfess' ? 'bg-white text-[#FF4F8B] shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🎵 Menfess Lagu
          </button>
        </div>
      </section>

      {/* QUICK INLINE CONFESSION INPUT */}
      <section className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm space-y-3">
        <h2 className="font-heading font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#FF4F8B]" />
          <span>Kirim Confession Baru Instant</span>
        </h2>

        <form onSubmit={handleSubmitInline} className="space-y-3">
          <textarea
            required
            rows={3}
            placeholder="Tuliskan pesan rahasia atau ungkapan hatimu di sini..."
            value={confessionText}
            onChange={(e) => setConfessionText(e.target.value)}
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-[#FF4F8B]"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
              <input
                type="checkbox"
                checked={isAnon}
                onChange={(e) => setIsAnon(e.target.checked)}
                className="rounded text-[#FF4F8B]"
              />
              <EyeOff className="w-4 h-4 text-[#FF4F8B]" />
              <span>Sembunyikan Nama (Anonim)</span>
            </label>

            <button
              type="submit"
              className="bg-[#FF4F8B] text-white font-heading font-extrabold py-2.5 px-5 rounded-2xl shadow-md hover:bg-rose-600 transition-colors text-xs flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Confession</span>
            </button>
          </div>
        </form>
      </section>

      {/* CONFESSION FEED LIST */}
      <section className="space-y-4">
        {confessions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 text-center border border-gray-200/80 shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FF4F8B]/20 text-[#FF4F8B] flex items-center justify-center mx-auto border border-[#FF4F8B]">
              <HeartHandshake className="w-7 h-7 text-[#FF4F8B]" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-gray-900">
              Belum Ada Confession / Menfess
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
              Jadilah yang pertama mengirimkan ungkapan rahasia atau menfess lagu favoritmu lewat formulir di atas!
            </p>
          </div>
        ) : (
          confessions.map((post) => (
            <PostCard key={post.id} post={post} onOpenReport={onOpenReport} />
          ))
        )}
      </section>

    </div>
  );
};
