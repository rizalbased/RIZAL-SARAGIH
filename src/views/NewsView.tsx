import React, { useState } from 'react';
import { Newspaper, Calendar, User, Plus, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NewsCategory } from '../types';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';

interface NewsViewProps {
  onSelectNews: (newsId: string) => void;
  onNavigate: (view: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onSelectNews, onNavigate }) => {
  const { news, currentUser, addNews, deleteNews } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState<NewsCategory>('NEWS');

  // News deletion modal state
  const [newsToDelete, setNewsToDelete] = useState<{ id: string; title: string } | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const filteredNews = news.filter(item => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const handleCreateNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addNews({
      title,
      summary,
      content,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
      category,
      authorName: currentUser?.name || 'Humas SMK Multi Karya',
      isPublished: true
    });

    setTitle('');
    setSummary('');
    setContent('');
    setCoverImage('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* HEADER BANNER */}
      <section className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="w-5 h-5 text-[#FF4F8B]" />
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
              BERITA & INFORMASI RESMI SEKOLAH
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Pengumuman, prestasi, kegiatan, dan agenda akademik SMK Multi Karya Medan
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0B0B0B] text-[#B8FF00] hover:bg-black font-heading font-extrabold py-3 px-5 rounded-2xl shadow-md flex items-center gap-2 text-xs transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4 text-[#B8FF00]" />
            <span>Buat Berita Baru (Admin)</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-[#FF4F8B]/10 text-[#D01855] px-3.5 py-2 rounded-2xl border border-[#FF4F8B]/30 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-[#FF4F8B]" />
            <span>Kanal Resmi Humas Sekolah</span>
          </div>
        )}
      </section>

      {/* CATEGORY FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {['ALL', 'NEWS', 'EVENT', 'ACADEMIC', 'ACHIEVEMENT', 'ANNOUNCEMENT', 'ACTIVITY'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 rounded-2xl font-heading font-bold text-xs transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-[#0B0B0B] text-[#B8FF00] shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat === 'ALL' ? 'Semua Berita' : cat}
          </button>
        ))}
      </div>

      {/* NEWS GRID */}
      {filteredNews.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 text-center border border-gray-200/80 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FF4F8B]/20 text-[#FF4F8B] flex items-center justify-center mx-auto border border-[#FF4F8B]">
            <Newspaper className="w-7 h-7 text-[#FF4F8B]" />
          </div>
          <h3 className="font-heading font-extrabold text-lg text-gray-900">
            Belum Ada Berita Resmi Sekolah
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
            Pengumuman dan berita resmi sekolah akan diterbitkan langsung oleh Humas dan Pengurus SMK Multi Karya Medan.
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-2 bg-[#0B0B0B] text-[#B8FF00] font-heading font-extrabold px-5 py-2.5 rounded-2xl text-xs hover:bg-black transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Terbitkan Berita Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNews.map((article) => (
            <article 
              key={article.id}
              className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div 
                  onClick={() => onSelectNews(article.id)}
                  className="relative rounded-2xl overflow-hidden aspect-video border border-gray-100 cursor-pointer"
                >
                  <img 
                    src={article.coverImage} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-[#FF4F8B] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shadow">
                    {article.category}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#35B9FF]" />
                      {article.publishedAt}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#B8FF00]" />
                      {article.authorName}
                    </span>
                  </div>

                  <h3 
                    onClick={() => onSelectNews(article.id)}
                    className="font-heading font-extrabold text-base text-gray-900 group-hover:text-[#35B9FF] transition-colors cursor-pointer leading-snug"
                  >
                    {article.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-3 mt-2 font-body leading-relaxed">
                    {article.summary}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4">
                <button
                  onClick={() => onSelectNews(article.id)}
                  className="text-xs font-heading font-bold text-[#35B9FF] hover:underline"
                >
                  Baca Artikel Selengkapnya →
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewsToDelete({ id: article.id, title: article.title });
                    }}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-red-200/60"
                    title="Hapus Berita"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {/* ADMIN CREATE NEWS MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-[#0B0B0B] w-full max-w-xl rounded-3xl p-6 shadow-2xl relative border border-gray-200">
            <h3 className="font-heading font-extrabold text-lg mb-4">Buat Berita Resmi Sekolah Baru</h3>

            <form onSubmit={handleCreateNewsSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Berita</label>
                <input
                  type="text"
                  required
                  placeholder="Judul Berita Resmi..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NewsCategory)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="NEWS">NEWS</option>
                    <option value="EVENT">EVENT</option>
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="ACHIEVEMENT">ACHIEVEMENT</option>
                    <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                    <option value="ACTIVITY">ACTIVITY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">URL Cover Foto</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ringkasan Singkat</label>
                <input
                  type="text"
                  required
                  placeholder="Ringkasan 1-2 kalimat..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Isi Berita Lengkap</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tuliskan berita secara lengkap..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B0B0B] text-[#B8FF00] rounded-xl text-xs font-bold"
                >
                  Terbitkan Berita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE NEWS MODAL */}
      <ConfirmDeleteModal
        isOpen={!!newsToDelete}
        onClose={() => setNewsToDelete(null)}
        onConfirm={() => {
          if (newsToDelete) {
            deleteNews(newsToDelete.id);
            setNewsToDelete(null);
          }
        }}
        title="Hapus Artikel Berita?"
        message={`Apakah Anda yakin ingin menghapus artikel berita "${newsToDelete?.title}" secara permanen dari portal sekolah?`}
        confirmText="Ya, Hapus Berita"
      />

    </div>
  );
};
